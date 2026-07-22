import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Connection } from '../models/connection.js';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import { CallHistory } from '../models/callHistory.js';

// * 1. Get Connected Friends List (Accepted Connections Only)
export const getConnectedFriends = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;
    const { role } = req.query;

    const connections = await Connection.find({
        status: 'accepted',
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    }).lean();

    const friendIds = connections.map((conn) => {
        return conn.requester.toString() === currentUserId.toString()
            ? conn.recipient
            : conn.requester;
    });

    const userQuery = { _id: { $in: friendIds }, isDeleted: false, status: 'active' };
    if (role && ['Student', 'Teacher', 'Admin'].includes(role)) {
        userQuery.role = role;
    }

    const friends = await User.find(userQuery)
        .select('name email role avatar department')
        .lean();

    // Fetch unread count & last message for each friend
    const friendsWithChatMeta = await Promise.all(
        friends.map(async (friend) => {
            const unreadCount = await Message.countDocuments({
                sender: friend._id,
                recipient: currentUserId,
                isRead: false,
            });

            const lastMessage = await Message.findOne({
                $or: [
                    { sender: currentUserId, recipient: friend._id },
                    { sender: friend._id, recipient: currentUserId },
                ],
            })
                .sort({ createdAt: -1 })
                .select('content createdAt isRead sender')
                .lean();

            return {
                ...friend,
                unreadCount,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isRead: lastMessage.isRead,
                    isMine: lastMessage.sender.toString() === currentUserId.toString(),
                } : null,
            };
        })
    );

    res.status(200).json({
        success: true,
        message: 'Connected friends list fetched successfully',
        data: { friends: friendsWithChatMeta },
    });
});

// * 2. Get Paginated Conversation Messages & Mark as Read
export const getConversationMessages = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;
    const { partnerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Verify partner exists
    const partner = await User.findById(partnerId);
    if (!partner || partner.isDeleted) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Mark unread messages as read
    await Message.updateMany(
        { sender: partnerId, recipient: currentUserId, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    const totalMessages = await Message.countDocuments({
        $or: [
            { sender: currentUserId, recipient: partnerId },
            { sender: partnerId, recipient: currentUserId },
        ],
    });

    const messages = await Message.find({
        $or: [
            { sender: currentUserId, recipient: partnerId },
            { sender: partnerId, recipient: currentUserId },
        ],
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'replyTo',
            select: 'content sender',
            populate: { path: 'sender', select: 'name' },
        })
        .populate('reactions.user', 'name')
        .lean();

    // Reverse messages array to return chronological order (oldest to newest)
    const sortedMessages = messages.reverse();

    res.status(200).json({
        success: true,
        message: 'Conversation messages fetched successfully',
        data: {
            messages: sortedMessages,
            pagination: {
                page,
                limit,
                totalMessages,
                totalPages: Math.ceil(totalMessages / limit),
                hasMore: page * limit < totalMessages,
            },
        },
    });
});

// * 3. Toggle Emoji Reaction on Message
export const reactToMessage = asyncHandler(async (req, res, next) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    if (!['👍', '❤️', '😂', '😮', '😢', '🙏'].includes(emoji)) {
        return next(new ErrorHandler('Invalid emoji specified', 400));
    }

    const message = await Message.findById(messageId);
    if (!message) {
        return next(new ErrorHandler('Message not found', 404));
    }

    const existingIndex = message.reactions.findIndex(
        (r) => r.user.toString() === currentUserId.toString()
    );

    if (existingIndex > -1) {
        if (message.reactions[existingIndex].emoji === emoji) {
            // Remove reaction if clicked same emoji
            message.reactions.splice(existingIndex, 1);
        } else {
            // Update emoji
            message.reactions[existingIndex].emoji = emoji;
        }
    } else {
        // Add new reaction
        message.reactions.push({ user: currentUserId, emoji });
    }

    await message.save();
    await message.populate('reactions.user', 'name');

    res.status(200).json({
        success: true,
        message: 'Reaction updated successfully',
        data: { reactions: message.reactions },
    });
});

// * 4. Get 1-on-1 Voice & Video Call History
export const getCallHistory = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;

    const history = await CallHistory.find({
        callType: { $in: ['one_to_one_voice', 'one_to_one_video'] },
        $or: [{ host: currentUserId }, { participants: currentUserId }],
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('host', 'name email role avatar department')
        .populate('participants', 'name email role avatar department')
        .lean();

    res.status(200).json({
        success: true,
        message: '1-on-1 call history fetched successfully',
        data: { history },
    });
});

// * 5. Delete Single Call History Record
export const deleteCallHistoryRecord = asyncHandler(async (req, res, next) => {
    const { historyId } = req.params;

    const record = await CallHistory.findById(historyId);
    if (!record) {
        return next(new ErrorHandler('Call history record not found', 404));
    }

    await CallHistory.findByIdAndDelete(historyId);

    res.status(200).json({
        success: true,
        message: 'Call history record deleted successfully',
    });
});

// * 6. Clear Entire Conversation Messages (Keep Connection Intact)
export const clearChat = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;
    const { partnerId } = req.params;

    await Message.deleteMany({
        $or: [
            { sender: currentUserId, recipient: partnerId },
            { sender: partnerId, recipient: currentUserId },
        ],
    });

    res.status(200).json({
        success: true,
        message: 'Chat history cleared successfully',
    });
});
