


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import * as userService from '../services/userService.js';
import * as projectService from '../services/projectService.js';




export const createStudent = asyncHandler(async (req, res, next) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
        return next(new ErrorHandler('Please provide all the required fields', 400));
    }

    // if user already exists, return error
    const userToBeCreated = await User.findOne({ email });
    if (userToBeCreated) {
        return next(new ErrorHandler('User already exists', 400));
    }

    const user = await userService.createUser({ name, email, password, department, role: 'Student' });
    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: { user },
    });
});





export const updateStudent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    if (user.role !== 'Student') {
        return next(new ErrorHandler('You are not authorized to update this user', 403));
    }

    // even admin could not update other user's password or id
    if (updateData.password || updateData.id) {
        return next(new ErrorHandler('You cannot update other user\'s password or id', 403));
    }

    const updatedUser = await userService.updateUser(id, updateData);
    if (!updatedUser) {
        return next(new ErrorHandler('User not updated', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: { updatedUser },
    });
});





export const deleteStudent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    if (user.role !== 'Student') {
        return next(new ErrorHandler('You are not authorized to delete this user', 403));
    }

    await userService.deleteUser(id);

    res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
    });
});



// ================================= TEACHER ================================= //



export const createTeacher = asyncHandler(async (req, res, next) => {
    const { name, email, password, department, maxStudents, expertise } = req.body;
    if (!name || !email || !password || !department || !maxStudents || !expertise) {
        return next(new ErrorHandler('Please provide all the required fields', 400));
    }

    // if user already exists, return error
    const userToBeCreated = await User.findOne({ email });
    if (userToBeCreated) {
        return next(new ErrorHandler('User already exists', 400));
    }

    const user = await userService.createUser({ 
        name, 
        email, 
        password, 
        department, 
        role: 'Teacher', 
        expertise: Array.isArray(expertise) 
            ? expertise 
            : typeof expertise === 'string' && expertise.trim() !== '' 
            ? expertise.split(',').map(item => item.trim()) 
            : [],
        maxStudents });
    res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: { user },
    });
});





export const updateTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    if (user.role !== 'Teacher') {
        return next(new ErrorHandler('You are not authorized to update this user', 403));
    }

    // even admin could not update other user's password or id
    if (updateData.password || updateData.id) {
        return next(new ErrorHandler('You cannot update other user\'s password or id', 403));
    }

    const updatedUser = await userService.updateUser(id, updateData);
    if (!updatedUser) {
        return next(new ErrorHandler('User not updated', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: { updatedUser },
    });
});




export const deleteTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    if (user.role !== 'Teacher') {
        return next(new ErrorHandler('You are not authorized to delete this user', 403));
    }

    await userService.deleteUser(id);

    res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
    });
});




export const getAllUsers = asyncHandler(async (req, res, next) => {
    const { users } = await userService.getAllUsers();

    res.status(200).json({
        success: true,
        message: 'All users fetched successfully',
        data: { users },
    });
});




export const getAllProjects = asyncHandler(async (req, res, next) => {
    const { projects } = await projectService.getAllProjects();

    res.status(200).json({
        success: true,
        message: 'All projects fetched successfully',
        data: { projects },
    });
});

