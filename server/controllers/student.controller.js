


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import * as projectService from '../services/projectService.js';
import * as requestService from '../services/requestService.js';
import * as notificationService from '../services/notificationService.js';



export const getStudentProject = asyncHandler(async (req, res, next) => {
    const studentId = req.user.id;
    const project = await projectService.getProjectByStudent(studentId);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'No projects found for this student',
            data: { project: null },
        });
    }

    res.status(200).json({
        success: true,
        message: 'Projects fetched successfully',
        data: { project },
    });
});




export const submitProposal = asyncHandler(async (req, res, next) => {
    const { title, description } = req.body;
    const studentId = req.user._id;

    if (!title || !description) {
        return next(new ErrorHandler('Please provide all the required fields', 400));
    }

    const existingProject = await projectService.getProjectByStudent(studentId);
    if (existingProject && existingProject.status !== 'rejected') {
        return next(new ErrorHandler('You already have a project', 400));
    }

    const projectData = {
        student: studentId,
        supervisor: null,
        title,
        description,
        status: 'pending',
        files: [],
        feedback: [],
        deadline: null,
    };
    const project = await projectService.createProject(projectData);

    await User.findByIdAndUpdate(studentId, { project: project._id });
    res.status(201).json({
        success: true,
        message: 'Project proposal submitted successfully',
        data: { project },
    });
});




export const uploadFiles = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const studentId = req.user._id;
    const project = await projectService.getProjectById(projectId);

    if (!project || project.student.toString() !== studentId.toString()) {
        return next(new ErrorHandler('You are not authorized to access this resource', 403));
    }

    if (!req.files || req.files.length === 0) {
        return next(new ErrorHandler('No files uploaded', 400));
    }

    const updatedProject = await projectService.addFilesToProject(projectId, req.files);
    res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: { project: updatedProject },
    });
});




export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
    
    const supervisors = await User.find({ role: 'supervisor' })
        .sort({ createdAt: -1 })
        .select('name email department expertise')
        .lean();

    if (!supervisors) {
        return res.status(404).json({
            success: false,
            message: 'No supervisors found',
            data: { supervisors: null },
        });
    }

    res.status(200).json({
        success: true,
        message: 'Supervisors fetched successfully',
        data: { supervisors },
    });

});




export const getSupervisor = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;
    const student = await User.findById(studentId).populate('supervisor', 'name email department expertise');

    if (!student.supervisor) {
        return res.status(404).json({
            success: false,
            message: 'No supervisor found',
            data: { supervisor: null },
        });
    }

    res.status(200).json({
        success: true,
        message: 'Supervisor fetched successfully',
        data: { supervisor: student.supervisor },
    });
});




export const requestSupervisor = asyncHandler(async (req, res, next) => {
    const { teacherId, message } = req.body;
    const studentId = req.user._id;
    const student = await User.findById(studentId);

    if (student.supervisor) {
        return next(new ErrorHandler('You already have a supervisor assigned', 400));
    }

    const supervisor = await User.findById(teacherId);
    if (!supervisor || !supervisor.role || supervisor.role !== 'Teacher') {
        return next(new ErrorHandler('Invalid supervisor', 400));
    }

    if (supervisor.maxStudents === supervisor.assignedStudents.length) {
        return next(new ErrorHandler('This supervisor have reached their maximum number of students', 400));
    }

    const requestData = {
        student: studentId,
        supervisor: teacherId,
        message,
    };
    const request = await requestService.createRequest(requestData);

    await notificationService.notifyUser(
        teacherId,
        `${student.name} has requested ${supervisor.name} to be their supervisor`,
        'request',
        'teacher/requests',
        'medium'
    );

    res.status(201).json({
        success: true,
        message: 'Supervisor request submitted successfully',
        data: { request },
    });
});




