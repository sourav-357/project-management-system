import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { RefreshToken } from '../models/refreshToken.js';
import { generateForgotPasswordEmailTemplate } from '../utils/emailTemplates.js';
import { generateTokenResponse } from '../utils/generateToken.js';
import { sendEmail } from '../services/emailService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// * Register User
export const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
        return next(new ErrorHandler('Please provide name, email, password, and role', 400));
    }

    if (role === 'Student' || role === 'Teacher') {
        return next(new ErrorHandler('Self-registration is disabled for Students and Teachers. Only an Administrator can create Student and Teacher accounts.', 403));
    }

    const allowedRoles = ['Admin'];

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        return next(new ErrorHandler('User with this email already exists', 400));
    }

    const user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        role,
        department: department || '',
    });

    user.password = undefined;

    await generateTokenResponse(user, 201, 'User registered successfully', req, res);
});

// * Login User
export const login = asyncHandler(async (req, res, next) => {
    console.log("LOGIN CONTROLLER ENTERED");
    console.log(req.body);
    const { password, role } = req.body;
    const email = req.body.email;

    if (!email || !password || !role) {
        return next(new ErrorHandler('Please provide email, password, and role', 400));
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || user.role !== role) {
        return next(new ErrorHandler('Invalid credentials or role', 401));
    }

    if (user.isDeleted) {
        return next(new ErrorHandler('This account has been deleted', 403));
    }

    if (user.status === 'suspended') {
        return next(new ErrorHandler('Your account has been suspended by an administrator', 403));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid credentials', 401));
    }

    user.password = undefined;
    req.user = user;

    await generateTokenResponse(user, 200, 'Logged in successfully', req, res);
});

// * Refresh Access Token (Rotation Flow)
export const refreshToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        return next(new ErrorHandler('Refresh token missing. Please login again.', 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_key_for_dev_env'
        );
    } catch (err) {
        return next(new ErrorHandler('Expired or invalid refresh token. Please login again.', 401));
    }

    const tokenHash = crypto.createHash('sha256').update(incomingRefreshToken).digest('hex');
    const existingSession = await RefreshToken.findOne({ tokenHash });

    if (!existingSession || existingSession.isRevoked) {
        if (existingSession) {
            await RefreshToken.updateMany({ user: existingSession.user }, { isRevoked: true, revokedAt: new Date() });
        }
        return next(new ErrorHandler('Security warning: Refresh token invalidated. Please re-authenticate.', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted || user.status === 'suspended') {
        return next(new ErrorHandler('User account inactive or unauthorized', 401));
    }

    // Revoke old refresh token (Rotation)
    existingSession.isRevoked = true;
    existingSession.revokedAt = new Date();
    await existingSession.save();

    req.user = user;
    await generateTokenResponse(user, 200, 'Token refreshed successfully', req, res);
});

// * Get Current Authenticated User
export const getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .populate('supervisor', 'name email department expertise')
        .populate('assignedStudents', 'name email department')
        .populate('project');

    res.status(200).json({
        success: true,
        message: 'User profile fetched successfully',
        data: { user },
    });
});

// * Logout Current Device
export const logout = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
        const tokenHash = crypto.createHash('sha256').update(incomingRefreshToken).digest('hex');
        await RefreshToken.findOneAndUpdate(
            { tokenHash },
            { isRevoked: true, revokedAt: new Date() }
        );
    }

    res.status(200)
        .clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })
        .clearCookie('accessToken')
        .clearCookie('token')
        .json({
            success: true,
            message: 'Logged out successfully',
        });
});

// * Logout All Devices
export const logoutAll = asyncHandler(async (req, res, next) => {
    await RefreshToken.updateMany(
        { user: req.user._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
    );

    res.status(200)
        .clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })
        .clearCookie('accessToken')
        .clearCookie('token')
        .json({
            success: true,
            message: 'Logged out from all active sessions successfully',
        });
});

// * Forgot Password Request
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() });
    if (!user) {
        return next(new ErrorHandler('User not found with this email', 400));
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

    try {
        await sendEmail({
            to: user.email,
            subject: "FYM Project Management System - Password Reset Request",
            message
        });

        res.status(200).json({
            success: true,
            message: `Password reset email sent successfully to ${user.email}`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message || "Error sending reset email", 500));
    }
});

// * Reset Password With Token
export const resetPassword = asyncHandler(async (req, res, next) => {
    const token = req.params.token || req.body.token || req.query.token;
    if (!token) {
        return next(new ErrorHandler("Password reset token is required", 400));
    }
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired password reset token", 400));
    }

    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
        return next(new ErrorHandler("Please provide password and confirmPassword", 400));
    }

    if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await generateTokenResponse(user, 200, "Password reset successfully", req, res);
});

// * Change Password (Authenticated User)
export const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Please provide oldPassword and newPassword', 400));
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new ErrorHandler('Current password is incorrect', 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
    });
});

// * Upload Profile Avatar (Cloudinary)
export const updateAvatar = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorHandler('Please upload an image file for profile avatar', 400));
    }

    const uploadResult = await uploadToCloudinary(req.file.path, 'academic_platform/avatars');
    const avatarUrl = uploadResult.secure_url || uploadResult.url;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: { avatar: avatarUrl, user },
    });
});
