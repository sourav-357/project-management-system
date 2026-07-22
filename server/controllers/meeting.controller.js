import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Meeting } from '../models/meeting.js';
import { CallHistory } from '../models/callHistory.js';
import { User } from '../models/user.js';
import * as notificationService from '../services/notificationService.js';

// * 0. Get All Available Invitees (All Active Users Except Current User)
export const getAvailableInvitees = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;

    const users = await User.find({
        _id: { $ne: currentUserId },
        isDeleted: false,
        status: 'active',
    })
        .select('name email role avatar department')
        .sort({ role: 1, name: 1 })
        .lean();

    res.status(200).json({
        success: true,
        message: 'Available meeting invitees fetched',
        data: { users },
    });
});

// * 1. Create & Start Group Video Meeting (Teachers & Admins Only)
export const createMeeting = asyncHandler(async (req, res, next) => {
    const { title, description, invitedUserIds } = req.body;
    const hostId = req.user._id;

    if (!title || !title.trim()) {
        return next(new ErrorHandler('Meeting title is required', 400));
    }

    const invitees = Array.isArray(invitedUserIds) ? invitedUserIds : [];

    const meeting = await Meeting.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        host: hostId,
        invitedUsers: invitees,
        status: 'active',
        startedAt: new Date(),
    });

    const callRecord = await CallHistory.create({
        callType: 'group_meeting',
        host: hostId,
        participants: [hostId, ...invitees],
        title: title.trim(),
        status: 'ongoing',
        startedAt: new Date(),
    });

    // Notify all invited users
    for (const userId of invitees) {
        await notificationService.notifyUser(
            userId,
            `${req.user.name} (${req.user.role}) invited you to a video meeting: "${title.trim()}"`,
            'meeting',
            `/meetings/${meeting._id}`,
            'high'
        );
    }

    res.status(201).json({
        success: true,
        message: 'Group video meeting created & started successfully',
        data: { meeting, callRecord },
    });
});

// * 2. Get Active & Upcoming Meetings for User
export const getMeetings = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const meetings = await Meeting.find({
        status: { $in: ['active', 'scheduled'] },
        $or: [{ host: userId }, { invitedUsers: userId }],
    })
        .sort({ createdAt: -1 })
        .populate('host', 'name email role avatar department')
        .populate('invitedUsers', 'name email role avatar department')
        .lean();

    res.status(200).json({
        success: true,
        message: 'Active & upcoming meetings fetched',
        data: { meetings },
    });
});

// * 3. Get Single Meeting Details
export const getMeetingById = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId)
        .populate('host', 'name email role avatar department')
        .populate('invitedUsers', 'name email role avatar department')
        .lean();

    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Meeting details fetched',
        data: { meeting },
    });
});

// * 4. Get Group Video Meeting Attendance History Only
export const getMeetingHistory = asyncHandler(async (req, res, next) => {
    const userId = req.user._id.toString();

    const records = await CallHistory.find({
        callType: 'group_meeting',
        $or: [{ host: req.user._id }, { participants: req.user._id }],
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('host', 'name email role avatar department')
        .populate('participants', 'name email role avatar department')
        .lean();

    const history = records.map((record) => {
        const participantIds = (record.participants || []).map((p) => p._id.toString());
        const isAttended = participantIds.includes(userId);
        return {
            ...record,
            userAttendanceStatus: isAttended ? 'attended' : 'missed',
        };
    });

    res.status(200).json({
        success: true,
        message: 'Meeting history fetched',
        data: { history },
    });
});

// * 5. Delete Meeting History Record
export const deleteMeetingHistoryRecord = asyncHandler(async (req, res, next) => {
    const { historyId } = req.params;
    const userId = req.user._id;

    const record = await CallHistory.findById(historyId);
    if (!record) {
        return next(new ErrorHandler('Meeting history record not found', 404));
    }

    await CallHistory.findByIdAndDelete(historyId);

    res.status(200).json({
        success: true,
        message: 'Meeting history record deleted successfully',
    });
});

// * 5. End Meeting (Host Only)
export const endMeeting = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    if (meeting.host.toString() !== userId.toString() && req.user.role !== 'Admin') {
        return next(new ErrorHandler('Only the meeting host or an Admin can end the meeting', 403));
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();

    // Update CallHistory record
    const durationSeconds = Math.round((new Date() - new Date(meeting.startedAt)) / 1000);
    await CallHistory.updateMany(
        { title: meeting.title, status: 'ongoing' },
        { status: 'completed', endedAt: new Date(), durationSeconds }
    );

    res.status(200).json({
        success: true,
        message: 'Meeting ended successfully',
        data: { meeting },
    });
});
