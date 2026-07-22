import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { Project } from '../models/project.js';
import { Notification } from '../models/notification.js';
import * as projectService from '../services/projectService.js';
import * as requestService from '../services/requestService.js';
import * as notificationService from '../services/notificationService.js';
import * as fileService from '../services/fileService.js';
import { PROJECT_STATUS } from '../models/project.js';

// * Get Student Project
// * Get Student Project & History
export const getStudentProject = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;

    // Fetch all project proposals for student (sorted newest first)
    const projects = await Project.find({ student: studentId, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('supervisor', 'name email avatar department');

    // Find current active project (status not completed)
    const activeProject = projects.find(p => p.status !== PROJECT_STATUS.COMPLETED) || null;

    res.status(200).json({
        success: true,
        message: 'Student projects fetched successfully',
        data: {
            project: activeProject,
            projectsHistory: projects,
        },
    });
});

// * Submit or Save Draft Proposal (State Machine & Policy Guarded)
export const submitProposal = asyncHandler(async (req, res, next) => {
    const { title, description, isDraft, milestones, projectId } = req.body;
    const studentId = req.user._id;

    if (!title || !description) {
        return next(new ErrorHandler('Please provide title and description', 400));
    }

    // Find target project if editing existing draft/rejected, or current active non-completed project
    let targetProject = null;
    if (projectId) {
        targetProject = await Project.findById(projectId);
    } else {
        targetProject = await Project.findOne({
            student: studentId,
            isDeleted: false,
            status: { $ne: PROJECT_STATUS.COMPLETED },
        }).sort({ createdAt: -1 });
    }

    if (targetProject && targetProject.status !== PROJECT_STATUS.COMPLETED) {
        if (targetProject.status !== PROJECT_STATUS.DRAFT && targetProject.status !== PROJECT_STATUS.REJECTED) {
            return next(new ErrorHandler(`Cannot edit proposal in current status: '${targetProject.status}'`, 403));
        }

        const targetStatus = isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.SUBMITTED;

        targetProject.title = title;
        targetProject.description = description;
        targetProject.isDraft = Boolean(isDraft);
        targetProject.status = targetStatus;

        if (milestones && Array.isArray(milestones)) {
            targetProject.milestones = milestones;
        }
        await targetProject.save();

        return res.status(200).json({
            success: true,
            message: isDraft ? 'Draft saved successfully' : 'Proposal updated & submitted',
            data: { project: targetProject },
        });
    }

    // Creating a NEW proposal (if previous is completed or no active project exists)
    const initialStatus = isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.SUBMITTED;

    const projectData = {
        student: studentId,
        supervisor: req.user.supervisor || null,
        title,
        description,
        status: initialStatus,
        isDraft: Boolean(isDraft),
        milestones: Array.isArray(milestones) ? milestones : [],
        files: [],
        feedback: [],
    };

    const project = await projectService.createProject(projectData);
    await User.findByIdAndUpdate(studentId, { project: project._id });

    res.status(201).json({
        success: true,
        message: isDraft ? 'Draft proposal saved successfully' : 'Project proposal submitted successfully',
        data: { project },
    });
});

// * Submit Milestone Work Deliverable
export const submitMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const { submissionUrl } = req.body;
    const studentId = req.user._id;

    const project = await Project.findOne({ student: studentId, isDeleted: false });
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (!project.supervisor && !req.user.supervisor) {
        return next(new ErrorHandler('You cannot update milestones or upload files until a supervisor is assigned to your project', 400));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
        return next(new ErrorHandler('Milestone not found', 404));
    }

    milestone.submissionUrl = submissionUrl || milestone.submissionUrl;
    milestone.status = 'submitted';
    milestone.submittedAt = new Date();

    if (project.status === PROJECT_STATUS.APPROVED || project.status === PROJECT_STATUS.ASSIGNED) {
        project.status = PROJECT_STATUS.MILESTONE_IN_PROGRESS;
    }

    await project.save();

    if (project.supervisor) {
        await notificationService.notifyUser(
            project.supervisor,
            `${req.user.name} submitted milestone "${milestone.title}"`,
            'milestone_update',
            `/teacher/milestones`,
            'medium'
        );
    }

    res.status(200).json({
        success: true,
        message: 'Milestone work submitted successfully',
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

    if (!project.supervisor && !req.user.supervisor) {
        return next(new ErrorHandler('You cannot update milestones or upload files until a supervisor is assigned to your project', 400));
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

// * Fetch Available Supervisors
export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
    const supervisors = await User.find({ role: 'Teacher', status: 'active', isDeleted: false })
        .select('name email department expertise maxStudents assignedStudents avatar')
        .lean();

    const formatted = supervisors.map(sup => ({
        ...sup,
        assignedCount: sup.assignedStudents ? sup.assignedStudents.length : 0,
        isAvailable: (sup.assignedStudents ? sup.assignedStudents.length : 0) < sup.maxStudents,
    }));

    res.status(200).json({
        success: true,
        message: 'Supervisors fetched successfully',
        data: { supervisors: formatted },
    });
});

// * Get My Supervisor Info
export const getSupervisor = asyncHandler(async (req, res, next) => {
    const studentId = req.user._id;
    const student = await User.findById(studentId).populate('supervisor', 'name email department expertise avatar');

    res.status(200).json({
        success: true,
        message: 'Supervisor fetched successfully',
        data: { supervisor: student.supervisor || null },
    });
});

// * Send Supervisor Request
export const requestSupervisor = asyncHandler(async (req, res, next) => {
    const { teacherId, message } = req.body;
    const studentId = req.user._id;
    const student = await User.findById(studentId);

    const project = await Project.findOne({ student: studentId, isDeleted: false });
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }
    if (project.status !== 'approved' && project.status !== 'accepted') {
        return next(new ErrorHandler('You can only request a supervisor for an approved project proposal', 400));
    }

    if (student.supervisor) {
        return next(new ErrorHandler('You already have a supervisor assigned', 400));
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
        message: message || 'Requesting supervisor assignment for final project',
    };
    const request = await requestService.createRequest(requestData);

    await notificationService.notifyUser(
        teacherId,
        `${student.name} requested you as their project supervisor`,
        'request',
        '/teacher/requests',
        'medium'
    );

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

    const project = await Project.findOne({ student: studentId, isDeleted: false })
        .populate('supervisor', 'name email avatar')
        .lean();

    const topNotifications = await Notification.find({ user: studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const feedbackNotifications = project?.feedback && project.feedback.length > 0
        ? [...project.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
        : [];

    res.status(200).json({
        success: true,
        message: 'Dashboard stats fetched successfully',
        data: { user, project, topNotifications, feedbackNotifications },
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
