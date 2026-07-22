import ErrorHandler from '../middlewares/error.js';

export const validateRegisterInput = (req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
        return next(new ErrorHandler('Name is required', 400));
    }
    if (!email || !email.trim()) {
        return next(new ErrorHandler('Email is required', 400));
    }
    if (!password || password.length < 8) {
        return next(new ErrorHandler('Password must be at least 8 characters long', 400));
    }
    if (!role || !['Student', 'Teacher', 'Admin'].includes(role)) {
        return next(new ErrorHandler('Valid role (Student, Teacher, Admin) is required', 400));
    }
    next();
};

export const validateLoginInput = (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !email.trim()) {
        return next(new ErrorHandler('Email is required', 400));
    }
    if (!password) {
        return next(new ErrorHandler('Password is required', 400));
    }
    if (!role) {
        return next(new ErrorHandler('Role is required', 400));
    }
    next();
};
