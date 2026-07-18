


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import * as userService from '../services/userService.js';




export const createStudent = asyncHandler(async (req, res, next) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
        return next(new ErrorHandler('Please provide all the required fields', 400));
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

    // ! must remove password and role from updateData
    delete updateData._id;
    delete updateData.password;
    delete updateData.role;

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



