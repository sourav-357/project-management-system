import { asyncHandler } from './asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import ErrorHandler from './error.js';

export const isAuthenticated = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
        token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_key_for_dev_env'
        );

        const user = await User.findById(decoded.id).select("-resetPasswordToken -resetPasswordExpire");

        if (!user) {
            return next(new ErrorHandler("User associated with this token no longer exists", 401));
        }

        if (user.isDeleted) {
            return next(new ErrorHandler("User account has been deleted", 403));
        }

        if (user.status === 'suspended') {
            return next(new ErrorHandler("Your account has been suspended. Please contact admin.", 403));
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Access token expired. Please refresh your session.", 401));
        }
        return next(new ErrorHandler("Invalid access token", 401));
    }
});

export const isAuthorized = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role (${req.user?.role || 'Guest'}) is not authorized to access this resource`, 403));
        }
        next();
    });
};
