import ErrorHandler from '../middlewares/error.js';
import { Project } from '../models/project.js';
import { uploadProjectFile } from './fileService.js';

export const getProjectByStudent = async (studentId) => {
    return await Project.findOne({ student: studentId, isDeleted: false }).sort({ createdAt: -1 });
};

export const createProject = async (projectData) => {
    try {
        const project = new Project(projectData);
        await project.save();
        return project;
    } catch (error) {
        throw new ErrorHandler('Error creating project: ' + error.message, 500);
    }
};

export const getProjectById = async (id) => {
    try {
        const project = await Project.findById(id)
            .populate('supervisor', 'name email avatar department')
            .populate('student', 'name email avatar department');
        return project;
    } catch (error) {
        throw new ErrorHandler('Error fetching project: ' + error.message, 500);
    }
};

export const addFilesToProject = async (projectId, files) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new ErrorHandler('Project not found', 404);
        }

        const uploadedFilePromises = files.map((file) =>
            uploadProjectFile(file.path, file.originalname, file.mimetype, projectId)
        );

        const fileMetadataArray = await Promise.all(uploadedFilePromises);

        project.files.push(...fileMetadataArray);
        await project.save();
        return project;
    } catch (error) {
        throw new ErrorHandler('Error adding files to project: ' + error.message, 500);
    }
};

export const getAllProjects = async () => {
    try {
        const projects = await Project.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('supervisor', 'name email avatar department')
            .populate('student', 'name email avatar department');
        return { projects };
    } catch (error) {
        throw new ErrorHandler('Error fetching projects: ' + error.message, 500);
    }
};
