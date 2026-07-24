import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { Project } from '../models/project.js';
import { SupervisorRequest } from '../models/supervisorRequest.js';
import * as projectService from '../services/projectService.js';
import * as requestService from '../services/requestService.js';
import * as fileService from '../services/fileService.js';
import { PROJECT_STATUS } from '../models/project.js';

// * Get Student Project & History
export const getStudentProject = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;

    // Fetch all project proposals for student (sorted newest first)
    const projects = await Project.find({ student: studentId, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('supervisor', 'name email avatar department');

    // Find current active project (status not completed and not rejected)
    const activeProject = projects.find(p => p.status !== PROJECT_STATUS.COMPLETED && p.status !== PROJECT_STATUS.REJECTED) || null;

    res.status(200).json({
        success: true,
        message: 'Student projects fetched successfully',
        data: {
            project: activeProject,
            projectsHistory: projects,
            user: req.user,
        },
    });
});

// * Submit or Update Project Proposal (Immutable once submitted/approved)
export const submitProposal = asyncHandler(async (req, res, next) => {
    const { title, description } = req.body;
    const studentId = req.user._id;

    if (!title || !title.trim() || !description || !description.trim()) {
        return next(new ErrorHandler('Please provide title and description', 400));
    }

    // Check for existing active project (any status other than completed or rejected)
    const existingActiveProject = await Project.findOne({
        student: studentId,
        isDeleted: false,
        status: { $nin: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED] },
    });

    if (existingActiveProject) {
        return next(
            new ErrorHandler(
                `You cannot edit or submit a proposal while your current project is active (${existingActiveProject.status}). A new proposal can only be created if your previous project was rejected or completed.`,
                400
            )
        );
    }

    // Creating a fresh NEW proposal (if previous is completed or rejected or no active project exists)
    const projectData = {
        student: studentId,
        supervisor: req.user.supervisor || null,
        title: title.trim(),
        description: description.trim(),
        status: PROJECT_STATUS.SUBMITTED,
        isDraft: false,
        files: [],
        feedback: [],
    };

    const project = await projectService.createProject(projectData);
    await User.findByIdAndUpdate(studentId, { project: project._id });

    res.status(201).json({
        success: true,
        message: 'Project proposal submitted successfully',
        data: { project },
    });
});

// * Upload Files to Project (Policy Guarded)
export const uploadFiles = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const studentId = req.user._id;
    const project = await projectService.getProjectById(projectId);

    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (project.status === PROJECT_STATUS.COMPLETED) {
        return next(new ErrorHandler('This project is completed and locked into read-only history. File uploads are disabled.', 403));
    }

    if (!project.supervisor && !req.user.supervisor) {
        return next(new ErrorHandler('You cannot upload files until a supervisor is assigned to your project', 400));
    }

    if (project.status === PROJECT_STATUS.REJECTED || project.isDraft) {
        return next(new ErrorHandler('Cannot upload files to a draft or rejected project', 400));
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

// * Get Available Supervisors (With Accurate assignedCount, maxStudents, and isAvailable Flag)
export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
    const supervisors = await User.find({ role: 'Teacher', status: 'active', isDeleted: false })
        .select('name email department maxStudents assignedStudents avatar expertise')
        .lean();

    const formatted = supervisors.map((sup) => {
        const assignedCount = sup.assignedStudents ? sup.assignedStudents.length : 0;
        const maxStudents = sup.maxStudents || 10;
        const isAvailable = assignedCount < maxStudents;

        return {
            ...sup,
            assignedCount,
            maxStudents,
            isAvailable,
            isFull: !isAvailable,
        };
    });

    res.status(200).json({
        success: true,
        message: 'Available supervisors fetched successfully',
        data: { supervisors: formatted },
    });
});

// * Get Assigned Supervisor
export const getSupervisor = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate('supervisor', 'name email department avatar maxStudents assignedStudents');

    res.status(200).json({
        success: true,
        message: 'Supervisor details fetched',
        data: { supervisor: user.supervisor || null },
    });
});

// * Get Pending & Historical Supervisor Requests for Student
export const getPendingSupervisorRequest = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;

    const allRequests = await SupervisorRequest.find({ student: studentId })
        .sort({ createdAt: -1 })
        .populate('supervisor', 'name email department avatar')
        .lean();

    const pendingRequest = allRequests.find((r) => r.status === 'pending') || null;

    res.status(200).json({
        success: true,
        message: 'Supervisor requests fetched',
        data: {
            pendingRequest,
            requestsHistory: allRequests,
        },
    });
});

// * Request Supervisor (Concurrency Safe, Proposal Approval Guarded & Pending Check)
export const requestSupervisor = asyncHandler(async (req, res, next) => {
    const { teacherId, message, notes } = req.body;
    const studentId = req.user._id;

    const freshStudent = await User.findById(studentId);
    const project = await Project.findOne({
        student: studentId,
        isDeleted: false,
        status: { $nin: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED] }
    }).sort({ createdAt: -1 });

    if (!project) {
        return next(new ErrorHandler('Active project proposal not found. You must submit a project proposal first before requesting a supervisor.', 400));
    }

    if (project.status !== PROJECT_STATUS.APPROVED && project.status !== 'assigned' && project.status !== 'milestone_in_progress') {
        return next(new ErrorHandler(`Your project proposal status is '${project.status}'. You can only request a supervisor after your project proposal is approved by faculty/admin.`, 400));
    }

    if (freshStudent?.supervisor || project?.supervisor) {
        return next(new ErrorHandler('You already have an active supervisor assigned to your project.', 400));
    }

    // Block if student already has a pending supervisor request sent to any teacher
    const existingPending = await SupervisorRequest.findOne({ student: studentId, status: 'pending' })
        .populate('supervisor', 'name email department');

    if (existingPending) {
        return next(
            new ErrorHandler(
                `You already have a pending supervisor request sent to Prof. ${existingPending.supervisor?.name || 'Faculty'}. Please wait for them to accept or decline before sending another request.`,
                400
            )
        );
    }

    const supervisor = await User.findById(teacherId);
    if (!supervisor || supervisor.role !== 'Teacher' || supervisor.isDeleted) {
        return next(new ErrorHandler('Invalid supervisor selected', 400));
    }

    if (supervisor.assignedStudents.length >= supervisor.maxStudents) {
        return next(new ErrorHandler('This supervisor has reached their maximum number of students', 400));
    }

    const requestData = {
        student: studentId,
        supervisor: teacherId,
        message: message || notes || 'Requesting supervisor assignment for project',
    };
    const request = await requestService.createRequest(requestData);

    res.status(201).json({
        success: true,
        message: 'Supervisor request submitted successfully',
        data: { request },
    });
});

// * Get Student Dashboard Stats
export const getDashboardStats = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;
    const user = await User.findById(studentId).populate('supervisor', 'name email department avatar');

    const allProjects = await Project.find({ student: studentId, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('supervisor', 'name email avatar')
        .lean();

    const activeProject = allProjects.find(p => p.status !== PROJECT_STATUS.COMPLETED && p.status !== PROJECT_STATUS.REJECTED) || null;
    const projectsHistory = allProjects;

    const feedbackNotifications = activeProject?.feedback && activeProject.feedback.length > 0
        ? [...activeProject.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
        : [];

    res.status(200).json({
        success: true,
        message: 'Dashboard stats fetched successfully',
        data: { user, project: activeProject, projectsHistory, feedbackNotifications },
    });
});

// * Get Project Feedback
export const getFeedback = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const studentId = req.user._id;

    const project = await projectService.getProjectById(projectId);
    if (!project || project.student._id.toString() !== studentId.toString()) {
        return next(new ErrorHandler('You are not authorized to access this resource', 403));
    }

    const sortedFeedback = project.feedback ? [...project.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];

    res.status(200).json({
        success: true,
        message: 'Feedback fetched successfully',
        data: { feedback: sortedFeedback },
    });
});

// * Download Project File
export const downloadFile = asyncHandler(async (req, res, next) => {
    const { projectId, fileId } = req.params;
    const studentId = req.user._id;

    const project = await projectService.getProjectById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (project.student._id.toString() !== studentId.toString() && req.user.role !== 'Admin' && req.user._id.toString() !== project.supervisor?._id.toString()) {
        return next(new ErrorHandler('You are not authorized to download this file', 403));
    }

    const file = project.files.id(fileId);
    if (!file) {
        return next(new ErrorHandler('File not found', 404));
    }

    fileService.streamDownload(file.fileUrl, res, file.originalName);
});
