import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Meeting } from '../models/meeting.js';
import { CallHistory } from '../models/callHistory.js';
import { User } from '../models/user.js';

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

// * 1. Create & Schedule Meeting (Host Only)
export const createMeeting = asyncHandler(async (req, res, next) => {
    const { title, description, scheduledAt, maxParticipants, invitees } = req.body;
    const hostId = req.user._id;

    if (!title || !scheduledAt) {
        return next(new ErrorHandler('Title and scheduled date/time are required', 400));
    }

    const meeting = await Meeting.create({
        host: hostId,
        title: title.trim(),
        description: description ? description.trim() : '',
        scheduledAt: new Date(scheduledAt),
        maxParticipants: maxParticipants || 10,
        invitees: invitees && Array.isArray(invitees) ? invitees : [],
        status: 'scheduled',
    });

    res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully',
        data: { meeting },
    });
});

// * 2. Get Upcoming & Active Meetings for Current User
export const getMyMeetings = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const meetings = await Meeting.find({
        $or: [
            { host: userId },
            { invitees: userId }
        ],
        status: { $in: ['scheduled', 'ongoing'] }
    })
        .populate('host', 'name email avatar department role')
        .populate('invitees', 'name email avatar department role')
        .sort({ scheduledAt: 1 })
        .lean();

    res.status(200).json({
        success: true,
        message: 'User meetings fetched successfully',
        data: { meetings },
    });
});

// * 3. Get Meeting Details by ID (Locked if Meeting Ended)
export const getMeetingById = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId)
        .populate('host', 'name email avatar department role')
        .populate('invitees', 'name email avatar department role')
        .populate('participants', 'name email avatar department role')
        .lean();

    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    if (meeting.status === 'ended') {
        return next(new ErrorHandler('This meeting has already ended by host and cannot be joined.', 400));
    }

    res.status(200).json({
        success: true,
        message: 'Meeting details fetched',
        data: { meeting },
    });
});

// * 4. Join Meeting (Active Check & Status Update)
export const joinMeeting = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    if (meeting.status === 'ended') {
        return next(new ErrorHandler('This meeting has already ended and is locked against joining', 400));
    }

    if (meeting.status === 'scheduled') {
        meeting.status = 'ongoing';
        meeting.startedAt = new Date();
    }

    if (!meeting.participants.includes(userId)) {
        meeting.participants.push(userId);
    }

    await meeting.save();

    res.status(200).json({
        success: true,
        message: 'Joined meeting room successfully',
        data: { meeting },
    });
});

// * 5. Leave Meeting
export const leaveMeeting = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    meeting.participants = meeting.participants.filter(p => p.toString() !== userId.toString());

    if (meeting.participants.length === 0 && meeting.status === 'ongoing') {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
    }

    await meeting.save();

    res.status(200).json({
        success: true,
        message: 'Left meeting room',
        data: { meeting },
    });
});

// * 6. End Meeting (Host Only - Forces Disconnection for All Active Participants)
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

    // Broadcast room end socket event if io is available
    const io = req.app.get('io');
    if (io) {
        io.to(`meeting_${meetingId}`).emit('meeting_ended_by_host');
    }

    res.status(200).json({
        success: true,
        message: 'Meeting ended successfully',
        data: { meeting },
    });
});

// * 7. Delete Meeting (Host Only)
export const deleteMeeting = asyncHandler(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        return next(new ErrorHandler('Meeting not found', 404));
    }

    if (meeting.host.toString() !== userId.toString() && req.user.role !== 'Admin') {
        return next(new ErrorHandler('Only the meeting host or an Admin can delete this meeting', 403));
    }

    // Broadcast room end socket event if io is available
    const io = req.app.get('io');
    if (io) {
        io.to(`meeting_${meetingId}`).emit('meeting_ended_by_host');
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.status(200).json({
        success: true,
        message: 'Meeting deleted successfully',
    });
});
