import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Notification } from '../models/notification.js';

export const getMyNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.status(200).json({
        success: true,
        message: 'Notifications fetched successfully',
        data: { notifications, unreadCount },
    });
});

export const markAsRead = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, user: req.user._id });
    if (!notification) {
        return next(new ErrorHandler('Notification not found', 404));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
    });
});

export const markAllAsRead = asyncHandler(async (req, res, next) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
    });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!notification) {
        return next(new ErrorHandler('Notification not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
    });
});

export const clearAllNotifications = asyncHandler(async (req, res, next) => {
    await Notification.deleteMany({ user: req.user._id });

    res.status(200).json({
        success: true,
        message: 'All notifications cleared successfully',
    });
});
