import ErrorHandler from '../middlewares/error.js';

export const validateProposalInput = (req, res, next) => {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
        return next(new ErrorHandler('Project title is required', 400));
    }
    if (title.trim().length > 200) {
        return next(new ErrorHandler('Project title cannot exceed 200 characters', 400));
    }
    if (!description || !description.trim()) {
        return next(new ErrorHandler('Project description is required', 400));
    }
    if (description.trim().length > 2000) {
        return next(new ErrorHandler('Project description cannot exceed 2000 characters', 400));
    }
    next();
};

export const validateSupervisorRequestInput = (req, res, next) => {
    const { teacherId } = req.body;

    if (!teacherId) {
        return next(new ErrorHandler('Teacher ID is required to request a supervisor', 400));
    }
    next();
};
