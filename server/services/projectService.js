


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
        throw new Error('Error creating project');
    }
}



export const getProjectById = async (id) => {
    try {
        const project = await Project.findById(id).sort({ createdAt: -1 }).populate('supervisor', 'name email').populate('student', 'name email');
        return project;
    } catch (error) {
        throw new Error('Error getting project by id: ' + error.message);
    }
}



export const addFilesToProject = async (projectId, files) => {


