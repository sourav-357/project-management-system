import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Project } from '../models/project.js';
import { User } from '../models/user.js';
import { SupervisorRequest } from '../models/supervisorRequest.js';
import { Connection } from '../models/connection.js';
import * as teacherService from '../services/teacherService.js';
import { PROJECT_STATUS } from '../models/project.js';

// * Get Incoming Supervisor Requests
export const getIncomingRequests = asyncHandler(async (req, res, next) => {
    const requests = await teacherService.getRequestsForTeacher(req.user._id);

    res.status(200).json({
        success: true,
        message: 'Supervisor requests fetched successfully',
        data: { requests },
    });
});

// * Respond to Supervisor Request (Accept or Reject Supervisor Request)
export const respondToRequest = asyncHandler(async (req, res, next) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
        return next(new ErrorHandler('Please specify action as "accept" or "reject"', 400));
    }

    if (action === 'accept') {
        const { request } = await teacherService.acceptSupervisorRequestAtomic(requestId, req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Supervisor request accepted successfully',
            data: { request },
        });
    } else {
        const request = await teacherService.rejectSupervisorRequest(requestId, req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Supervisor request rejected',
            data: { request },
        });
    }
});

// * Get Assigned Students
export const getAssignedStudents = asyncHandler(async (req, res, next) => {
    const students = await teacherService.getAssignedStudentsForTeacher(req.user._id);

    res.status(200).json({
        success: true,
        message: 'Assigned students fetched successfully',
        data: { students },
    });
});

// * Helper to get all student IDs related to a teacher (via requests, supervisor link, or assigned list)
const getTeacherRelatedStudentIds = async (teacherId) => {
    const teacher = await User.findById(teacherId).select('assignedStudents');
    const assignedStudentIds = teacher?.assignedStudents || [];

    const supervisorRequests = await SupervisorRequest.find({ supervisor: teacherId }).select('student');
    const requestedStudentIds = supervisorRequests.map(r => r.student);

    const supervisedStudents = await User.find({
        $or: [
            { supervisor: teacherId },
            { _id: { $in: [...assignedStudentIds, ...requestedStudentIds] } }
        ]
    }).select('_id');

    return supervisedStudents.map(s => s._id);
};

// * Get Supervised Projects (Fetch all projects where teacher is supervisor OR student requested teacher)
export const getSupervisedProjects = asyncHandler(async (req, res, next) => {
    const teacherId = req.user._id;
    const allStudentIds = await getTeacherRelatedStudentIds(teacherId);

    const projects = await Project.find({
        $or: [
            { supervisor: teacherId },
            { student: { $in: allStudentIds } }
        ],
        isDeleted: false
    })
        .populate('student', 'name email department avatar')
        .populate('supervisor', 'name email department avatar')
        .sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        message: 'Supervised projects fetched successfully',
        data: { projects },
    });
});

// * Review Proposal Status (Teachers can ONLY approve proposals, never reject)
export const reviewProposal = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { status, remarks } = req.body;

    if (status === 'rejected' && req.user.role !== 'Admin') {
        return next(new ErrorHandler('Teachers cannot reject project proposals. You can only approve proposals or drop student supervision.', 403));
    }

    if (!status || !['approved', 'under_review'].includes(status)) {
        return next(new ErrorHandler('Invalid status specified for review. Teachers can only approve proposals.', 400));
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (project.status === PROJECT_STATUS.COMPLETED || project.status === PROJECT_STATUS.REJECTED) {
        return next(new ErrorHandler('Proposals for completed or rejected projects cannot be modified', 403));
    }

    project.status = PROJECT_STATUS.APPROVED;
    if (remarks) {
        project.feedback.push({
            supervisorId: req.user._id,
            type: 'positive',
            title: 'Proposal Evaluation (APPROVED)',
            message: remarks,
        });
    }

    await project.save();

    res.status(200).json({
        success: true,
        message: 'Proposal approved successfully',
        data: { project },
    });
});

// * Complete Project (Teacher / Admin Only)
export const completeProject = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (req.user.role !== 'Admin' && (!project.supervisor || project.supervisor.toString() !== req.user._id.toString())) {
        return next(new ErrorHandler('Only the assigned supervisor or an Admin can mark this project as completed', 403));
    }

    project.status = PROJECT_STATUS.COMPLETED;
    await project.save();

    // Release student supervisor link & teacher assignedStudents list
    if (project.student) {
        await User.findByIdAndUpdate(project.student, { supervisor: null });
    }
    if (project.supervisor) {
        await User.findByIdAndUpdate(project.supervisor, {
            $pull: { assignedStudents: project.student }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Project marked as completed successfully. Supervision released.',
        data: { project },
    });
});

// * Get Teacher Dashboard Stats (Fully Populated & Bug-Free Metrics)
export const getTeacherDashboardStats = asyncHandler(async (req, res, next) => {
    const teacherId = req.user._id;

    const pendingSupervisorRequestsCount = await teacherService.getPendingRequestsCountForTeacher(teacherId);
    const pendingConnectionRequestsCount = await Connection.countDocuments({ recipient: teacherId, status: 'pending' });
    const pendingRequestsCount = pendingSupervisorRequestsCount + pendingConnectionRequestsCount;

    const allStudentIds = await getTeacherRelatedStudentIds(teacherId);

    const projects = await Project.find({
        $or: [
            { supervisor: teacherId },
            { student: { $in: allStudentIds } }
        ],
        isDeleted: false
    })
        .populate('student', 'name email department avatar')
        .sort({ updatedAt: -1 });

    const totalSupervisedProjects = projects.length;
    const pendingProposalsCount = projects.filter(
        (p) => p.status === PROJECT_STATUS.PENDING || p.status === PROJECT_STATUS.SUBMITTED || p.status === 'under_review'
    ).length;
    const approvedProjectsCount = projects.filter((p) => p.status === PROJECT_STATUS.APPROVED || p.status === 'assigned').length;

    const teacher = await User.findById(teacherId).populate(
        'assignedStudents',
        'name email department avatar'
    );
    const assignedStudents = teacher ? teacher.assignedStudents : [];
    const maxStudents = teacher?.maxStudents || 10;
    const assignedCount = assignedStudents.length;
    const availableCapacity = Math.max(0, maxStudents - assignedCount);

    res.status(200).json({
        success: true,
        message: 'Teacher dashboard stats fetched successfully',
        data: {
            pendingRequestsCount,
            pendingSupervisorRequestsCount,
            pendingConnectionRequestsCount,
            totalSupervisedProjects,
            pendingProposalsCount,
            approvedProjectsCount,
            assignedStudents,
            assignedCount,
            maxStudents,
            availableCapacity,
            projects,
        },
    });
});

// * Drop Supervision / Resign as Supervisor
export const dropSupervision = asyncHandler(async (req, res, next) => {
    const { studentId } = req.params;
    const teacherId = req.user._id;

    const student = await User.findById(studentId);
    if (!student || student.supervisor?.toString() !== teacherId.toString()) {
        return next(new ErrorHandler('Student is not under your supervision', 400));
    }

    student.supervisor = null;
    await student.save();

    await User.findByIdAndUpdate(teacherId, {
        $pull: { assignedStudents: studentId }
    });

    const project = await Project.findOne({ student: studentId, isDeleted: false });
    if (project) {
        project.supervisor = null;
        if (project.status === 'assigned' || project.status === 'milestone_in_progress') {
            project.status = 'approved';
        }
        await project.save();
    }

    res.status(200).json({
        success: true,
        message: 'Supervision dropped successfully. Student project is now unassigned.',
    });
});
