

// * import modules
import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { generateForgotPasswordEmailTemplate } from '../utils/emailTemplates.js';
import { generateToken } from '../utils/generateToken.js';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';



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
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("User not found with this email", 400));
    }

    const resetToken = user.generateResetPasswordToken();
    if (!resetToken) {
        return next(new ErrorHandler("Error generating reset token", 500));
    }
    // * save reset token and expiry date in database
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

    try {
        // * send email
        await sendEmail({
            to: user.email,
            subject: "FYM Project Management System - Password Reset Request",
            message
        });

        res.status(200).json({
            success: true,
            message: `Password reset email sent successfully to ${user.email}`
        });

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false }); // ! save the changes in database

        return next(new ErrorHandler(error.message || "Error sending email", 500));
    }
});




export const resetPassword = asyncHandler(async (req, res, next) => {
    const { token } = req.params;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ 
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired password reset token", 400));
    }

    if (!req.body.password || !req.body.confirmPassword) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    generateToken(user, 200, "Password reset successfully", res);
});



