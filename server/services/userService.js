


import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';



export const createUser = async (userData) => {
    try {
        const user = new User(userData);
        await user.save();
        return user;
    } catch (error) {
        throw new Error('Error creating user: ' + error.message);
    }
}



export const updateUser = async (id, updateData) => {
    try {
        const user = await User.findByIdAndUpdate(id, updateData, { 
            new: true,
            runValidators: true,
        }).select('-password');

        return user;

    } catch (error) {
        throw new Error('Error updating user: ' + error.message);
    }
}




export const getUserById = async (id) => {
    try {
        const user = await User.findById(id).select('-password');
        return user;
    } catch (error) {
        throw new Error('Error getting user by id: ' + error.message);
    }
}




export const deleteUser = async (id) => {
    try {
        const user = await User.findByIdAndDelete(id);
        return user;
    } catch (error) {
        throw new Error('Error deleting user: ' + error.message);
    }
}



