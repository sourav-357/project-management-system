


import { asyncHandler } from './asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import ErrorHandler from './error.js';



export const isAuthenticated = asyncHandler(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
});



