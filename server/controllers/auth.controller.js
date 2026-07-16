

// * import modules
import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';



// * register user
export const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return next(new ErrorHandler('Please provide all required fields', 400));
    }

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler('user already exists', 400));
    }

    user = await User.create({ name, email, password, role });
    user.password = undefined // ! so that the actual hashed password won't get sent
    generateToken(user, 201, "user registered successfully", res);
});




export const login = asyncHandler(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return next(new ErrorHandler("Please provide all required fields", 400))
    }
});




export const getUser = asyncHandler(async (req, res, next) => {

});




export const logout = asyncHandler(async (req, res, next) => {

});




export const forgotPassword = asyncHandler(async (req, res, next) => {

});




export const resetPassword = asyncHandler(async (req, res, next) => {

});



