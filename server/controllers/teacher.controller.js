import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Project } from '../models/project.js';
import { User } from '../models/user.js';
import * as teacherService from '../services/teacherService.js';
import * as notificationService from '../services/notificationService.js';
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

// * Respond to Supervisor Request (Atomic Capacity Check)
export const respondToRequest = asyncHandler(async (req, res, next) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
        return next(new ErrorHandler('Please specify action as "accept" or "reject"', 400));
    }

    if (action === 'accept') {
        const { request } = await teacherService.acceptSupervisorRequestAtomic(requestId, req.user._id);

        await notificationService.notifyUser(
            request.student,
            `Teacher ${req.user.name} accepted your supervisor request!`,
            'approval',
            '/student/supervisor',
            'high'
        );

        return res.status(200).json({
            success: true,
            message: 'Supervisor request accepted successfully',
            data: { request },
        });
    } else {
        const request = await teacherService.rejectSupervisorRequest(requestId, req.user._id);

        await notificationService.notifyUser(
            request.student,
            `Teacher ${req.user.name} declined your supervisor request.`,
            'rejection',
            '/student/supervisors',
            'medium'
        );

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

// * Get Supervised Projects
export const getSupervisedProjects = asyncHandler(async (req, res, next) => {
    const projects = await Project.find({ supervisor: req.user._id, isDeleted: false })
        .populate('student', 'name email department avatar')
        .sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        message: 'Supervised projects fetched successfully',
        data: { projects },
    });
});

// * Add Structured Feedback (Policy Protected)
export const addFeedback = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { title, message, type } = req.body;

    if (!title || !message) {
        return next(new ErrorHandler('Title and message are required for feedback', 400));
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    // Policy Enforcement: Assigned Supervisor or Admin Only
    if (req.user.role !== 'Admin' && (!project.supervisor || project.supervisor.toString() !== req.user._id.toString())) {
        return next(new ErrorHandler('Only the assigned supervisor or an Admin can review this project', 403));
    }

    project.feedback.push({
        supervisorId: req.user._id,
        type: type || 'general',
        title,
        message,
        createdAt: new Date(),
    });

    await project.save();

    await notificationService.notifyUser(
        project.student,
        `New feedback from ${req.user.name}: "${title}"`,
        'feedback',
        `/student/feedback/${projectId}`,
        'medium'
    );

    res.status(200).json({
        success: true,
        message: 'Feedback added successfully',
        data: { project },
    });
});

// * Review Proposal Status (Workflow State Machine & Policy Guarded)
export const reviewProposal = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { status, remarks } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected', 'under_review'].includes(status)) {
        return next(new ErrorHandler('Invalid status specified for review', 400));
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    // Policy Check
    if (req.user.role !== 'Admin' && project.supervisor && project.supervisor.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler('Only the assigned supervisor or an Admin can review this project', 403));
    }

    const targetStatus = status === 'approved' ? PROJECT_STATUS.APPROVED : PROJECT_STATUS.REJECTED;

    project.status = targetStatus;
    if (remarks) {
        project.feedback.push({
            supervisorId: req.user._id,
            type: status === 'approved' ? 'positive' : 'negative',
            title: `Proposal Evaluation (${status.toUpperCase()})`,
            message: remarks,
        });
    }

    await project.save();

    await notificationService.notifyUser(
        project.student,
        `Your project proposal was ${targetStatus} by your supervisor`,
        targetStatus === PROJECT_STATUS.APPROVED ? 'approval' : 'rejection',
        `/student/project`,
        'high'
    );

    res.status(200).json({
        success: true,
        message: `Proposal transition to ${targetStatus} successful`,
        data: { project },
    });
});

// * Update Milestone Status (Policy & State Protected)
export const updateMilestoneStatus = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;
    const { status, teacherFeedback } = req.body; // 'approved', 'rejected'

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    // Policy Check: Only assigned supervisor when project is active
    if (!project.supervisor || project.supervisor.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler('Only the assigned supervisor can evaluate milestones', 403));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
        return next(new ErrorHandler('Milestone not found', 404));
    }

    milestone.status = status || milestone.status;
    milestone.teacherFeedback = teacherFeedback || milestone.teacherFeedback;
    milestone.reviewedAt = new Date();

    // Check if all milestones are approved -> update project status to 'completed'
    const allApproved = project.milestones.every(m => m.status === 'approved');
    if (allApproved && project.milestones.length > 0) {
        project.status = PROJECT_STATUS.COMPLETED;
    } else if (project.status === PROJECT_STATUS.APPROVED || project.status === PROJECT_STATUS.ASSIGNED) {
        project.status = PROJECT_STATUS.MILESTONE_IN_PROGRESS;
    }

    await project.save();

    await notificationService.notifyUser(
        project.student,
        `Milestone "${milestone.title}" evaluated: ${milestone.status}`,
        'milestone_update',
        `/student/project`,
        'medium'
    );

    res.status(200).json({
        success: true,
        message: 'Milestone status updated successfully',
        data: { project },
    });
});

// * Get Teacher Dashboard Analytics
export const getTeacherDashboardStats = asyncHandler(async (req, res, next) => {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId);

    const pendingRequestsCount = await teacherService.getRequestsForTeacher(teacherId)
        .then(reqs => reqs.filter(r => r.status === 'pending').length);

    const assignedStudents = await teacherService.getAssignedStudentsForTeacher(teacherId);
    const projects = await Project.find({ supervisor: teacherId, isDeleted: false });

    const pendingProposalsCount = projects.filter(p => [PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW, 'pending'].includes(p.status)).length;
    const approvedProjectsCount = projects.filter(p => [PROJECT_STATUS.APPROVED, PROJECT_STATUS.ASSIGNED, PROJECT_STATUS.MILESTONE_IN_PROGRESS, PROJECT_STATUS.COMPLETED].includes(p.status)).length;

    res.status(200).json({
        success: true,
        message: 'Teacher dashboard stats fetched successfully',
        data: {
            maxStudents: teacher.maxStudents,
            assignedCount: assignedStudents.length,
            availableCapacity: teacher.maxStudents - assignedStudents.length,
            pendingRequestsCount,
            pendingProposalsCount,
            approvedProjectsCount,
            assignedStudents,
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

    await notificationService.notifyUser(
        studentId,
        `Teacher ${req.user.name} has resigned as your supervisor. Please request a new supervisor.`,
        'general',
        '/student/supervisors',
        'high'
    );

    res.status(200).json({
        success: true,
        message: 'Supervision dropped successfully. Student project is now unassigned.',
    });
});
