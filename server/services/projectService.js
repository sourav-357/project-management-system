


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Project } from '../models/project.js';



export const getProjectByStudent = async (studentId) => {
    return await Project.findOne({ student: studentId }).sort({ createdAt: -1 });
}



export const createProject = async (projectData) => {
    try {
        const project = new Project(projectData);
        await project.save();
        return project;
    } catch (error) {
        throw new ErrorHandler('Error creating project: ' + error.message, 500);
    }
}



export const getProjectById = async (id) => {
    try {
        const project = await Project.findById(id).sort({ createdAt: -1 }).populate('supervisor', 'name email').populate('student', 'name email');
        return project;
    } catch (error) {
        throw new ErrorHandler('Error fetching project: ' + error.message, 500);
    }
}



export const addFilesToProject = async (projectId, files) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new ErrorHandler('Project not found', 404);
        }

        const fileMetadata = files.map((file) => ({
            fileType: file.mimetype,
            fileUrl: file.path,
            originalName: file.originalName,
            uploadedAt: new Date(),
        }));

        project.files = fileMetadata;
        await project.save();
        return project;
        
    } catch (error) {
        throw new ErrorHandler('Error adding files to project: ' + error.message, 500);
    }
}




export const getAllProjects = async () => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 }).populate('supervisor', 'name email').populate('student', 'name email');
        return { projects };
    } catch (error) {
        throw new ErrorHandler('Error fetching projects: ' + error.message, 500);
    }
}





