


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';

import { User } from '../models/user.js';
import { Project } from '../models/project.js';
import { Deadline } from '../models/deadline.js';
import { Notification } from '../models/notification.js';

import * as projectService from '../services/projectService.js';
import * as requestService from '../services/requestService.js';
import * as notificationService from '../services/notificationService.js';
import * as fileService from '../services/fileService.js';




export const getStudentProject = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;
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

    if (project.status === 'rejected') {
        return next(new ErrorHandler('This project has been rejected. You cannot upload files', 400));
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
    
    const supervisors = await User.find({ role: 'Teacher' })
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




export const getDashboardStats = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;
    const user = await User.findById(studentId);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const project = await Project.findOne({ 
        student: studentId })
        .sort({ createdAt: -1 })
        .populate('supervisor', 'name email')
        .lean();

    const now = new Date();
    const deadlines = await Project.find({ 
        student: studentId, 
        deadline: {$gte: now } 
    }).select('title description deadline').sort({ deadline: -1 }).populate('supervisor', 'name email').limit(3).lean();

    const topNotifications = await Notification.find({ user: studentId })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

    const feedbackNotifications = project?.feedback && project?.feedback.length > 0 ? project.feedback
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2)
    : [];

    const supervisorName = project?.supervisor?.name || null;

    res.status(200).json({
        success: true,
        message: 'Dashboard stats fetched successfully',
        data: { user, project, deadlines, topNotifications, feedbackNotifications, supervisorName },
    });
});




export const getFeedback = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const studentId = req.user._id;

    const project = await projectService.getProjectById(projectId);
    if (!project || project.student._id.toString() !== studentId.toString()) {
        return next(new ErrorHandler('You are not authorized to access this resource', 403));
    }

    const sortedFeedback = project.feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
        success: true,
        message: 'Feedback fetched successfully',
        data: { feeedback: sortedFeedback },
    });
});




export const downloadFile = asyncHandler(async (req, res, next) => {
    const { projectId, fileId } = req.params;
    const studentId = req.user._id;

    const project = await projectService.getProjectById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (project.student._id.toString() !== studentId.toString()) {
        return next(new ErrorHandler('You are not authorized to access this resource', 403));
    }

    const file = project.files.id(fileId);
    if (!file) {
        return next(new ErrorHandler('File not found', 404));
    }

    fileService.streamDownload(file.fileUrl, res, file.originalName);
});

    
