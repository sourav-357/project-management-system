


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import * as userService from '../services/userService.js';
import * as projectService from '../services/projectService.js';



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

    await user.findByIdAndUpdate(studentId, { project: project._id });
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

