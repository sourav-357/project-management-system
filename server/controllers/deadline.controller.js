import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Deadline } from '../models/deadline.js';
import { User } from '../models/user.js';

// * Create a new Academic Deadline
export const createDeadline = asyncHandler(async (req, res, next) => {
    const { name, dueDate, project } = req.body;

    if (!name || !dueDate) {
        return next(new ErrorHandler('Deadline title and due date are required', 400));
    }

    const deadline = await Deadline.create({
        name,
        dueDate: new Date(dueDate),
        createdBy: req.user._id,
        project: project || null,
    });

    // Notify all active students about new global deadline
    if (!project) {
        const students = await User.find({ role: 'Student', status: 'active', isDeleted: false }).select('_id');
    }

    res.status(201).json({
        success: true,
        message: 'Academic deadline created successfully',
        data: { deadline },
    });
});

// * Get all active academic deadlines
export const getDeadlines = asyncHandler(async (req, res, next) => {
    const deadlines = await Deadline.find()
        .sort({ dueDate: 1 })
        .populate('createdBy', 'name email role')
        .lean();

    res.status(200).json({
        success: true,
        message: 'Academic deadlines fetched successfully',
        data: { deadlines },
    });
});

// * Delete an academic deadline
export const deleteDeadline = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const deadline = await Deadline.findByIdAndDelete(id);
    if (!deadline) {
        return next(new ErrorHandler('Deadline not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Deadline deleted successfully',
    });
});
