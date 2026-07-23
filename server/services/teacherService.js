import { User } from '../models/user.js';
import { Project } from '../models/project.js';
import { SupervisorRequest } from '../models/supervisorRequest.js';
import ErrorHandler from '../middlewares/error.js';

export const getRequestsForTeacher = async (teacherId) => {
    return await SupervisorRequest.find({ supervisor: teacherId })
        .populate('student', 'name email department avatar project')
        .sort({ createdAt: -1 });
};

export const getPendingRequestsCountForTeacher = async (teacherId) => {
    return await SupervisorRequest.countDocuments({ supervisor: teacherId, status: 'pending' });
};

export const acceptSupervisorRequestAtomic = async (requestId, teacherId) => {
    const request = await SupervisorRequest.findById(requestId);
    if (!request) {
        throw new ErrorHandler('Supervisor request not found', 404);
    }

    if (request.supervisor.toString() !== teacherId.toString()) {
        throw new ErrorHandler('You are not authorized to respond to this request', 403);
    }

    if (request.status !== 'pending') {
        throw new ErrorHandler(`Request has already been ${request.status}`, 400);
    }

    const studentId = request.student;

    // Atomic update preventing race condition where concurrent requests exceed maxStudents capacity
    const updatedTeacher = await User.findOneAndUpdate(
        {
            _id: teacherId,
            $expr: { $lt: [{ $size: "$assignedStudents" }, "$maxStudents"] }
        },
        { $addToSet: { assignedStudents: studentId } },
        { new: true }
    );

    if (!updatedTeacher) {
        throw new ErrorHandler('Supervision capacity reached! You cannot accept more students.', 400);
    }

    // Update request status
    request.status = 'approved';
    await request.save();

    // Assign supervisor to student
    await User.findByIdAndUpdate(studentId, { supervisor: teacherId });

    // Update project supervisor reference if project exists
    await Project.findOneAndUpdate(
        { student: studentId },
        { supervisor: teacherId }
    );

    return { request, teacher: updatedTeacher };
};

export const rejectSupervisorRequest = async (requestId, teacherId) => {
    const request = await SupervisorRequest.findById(requestId);
    if (!request) {
        throw new ErrorHandler('Supervisor request not found', 404);
    }

    if (request.supervisor.toString() !== teacherId.toString()) {
        throw new ErrorHandler('You are not authorized to respond to this request', 403);
    }

    request.status = 'rejected';
    await request.save();
    return request;
};

export const getAssignedStudentsForTeacher = async (teacherId) => {
    const teacher = await User.findById(teacherId)
        .populate({
            path: 'assignedStudents',
            select: 'name email department avatar status project',
            populate: {
                path: 'project',
                select: 'title description status milestones feedback'
            }
        });
    return teacher ? teacher.assignedStudents : [];
};
