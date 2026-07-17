

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
    const { password, role } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !password || !role) {
        return next(new ErrorHandler("Please provide all required fields", 400))
    }

    const user = await User.findOne({ email, role }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid Email or role", 401));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid Password", 401));
    }

    // * generate token and login the user
    user.password = undefined // ! so that the actual hashed password won't get sent
    generateToken(user, 200, "logged in successfully", res);
});




export const getUser = asyncHandler(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        message: "user fetched successfully",
        user
    });
});
    




export const logout = asyncHandler(async (req, res, next) => {
    res.status(200)
    .cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    })
    .json({
        success: true,
        message: "logged out successfully"
    });
});




export const forgotPassword = asyncHandler(async (req, res, next) => {

});




export const resetPassword = asyncHandler(async (req, res, next) => {

});



