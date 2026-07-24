import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { Connection } from '../models/connection.js';
import { User } from '../models/user.js';

// Auto-cleanup helper for rejected connection requests older than 10 days
const cleanupExpiredRejections = async () => {
    try {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        await Connection.deleteMany({
            status: 'rejected',
            rejectedAt: { $lte: tenDaysAgo },
        });
    } catch (e) {
        console.error('Error cleaning expired rejections:', e);
    }
};

// * 1. Explore Users for Connection
export const exploreUsers = asyncHandler(async (req, res, next) => {
    await cleanupExpiredRejections();

    const currentUserId = req.user._id;
    const { role, search } = req.query;

    const query = {
        _id: { $ne: currentUserId },
        isDeleted: { $ne: true },
    };

    if (role && role !== 'All') {
        query.role = { $regex: `^${role}$`, $options: 'i' };
    }

    if (search && search.trim()) {
        query.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
            { department: { $regex: search.trim(), $options: 'i' } },
        ];
    }

    const users = await User.find(query)
        .select('name email role avatar department')
        .lean();

    // Get all connection records involving current user
    const connections = await Connection.find({
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    }).lean();

    const connectionMap = new Map();
    connections.forEach((conn) => {
        if (conn && conn.requester && conn.recipient) {
            const otherId = conn.requester.toString() === currentUserId.toString()
                ? conn.recipient.toString()
                : conn.requester.toString();
            connectionMap.set(otherId, conn);
        }
    });

    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

    const result = users.map((u) => {
        const conn = connectionMap.get(u._id.toString());
        let connectionStatus = 'none';
        let isRequester = false;
        let cooldownDaysRemaining = 0;
        let canRequest = true;

        if (conn) {
            connectionStatus = conn.status;
            isRequester = conn.requester.toString() === currentUserId.toString();

            if (conn.status === 'rejected' && conn.rejectedAt) {
                const elapsed = Date.now() - new Date(conn.rejectedAt).getTime();
                if (elapsed < tenDaysMs) {
                    cooldownDaysRemaining = Math.ceil((tenDaysMs - elapsed) / (24 * 60 * 60 * 1000));
                    canRequest = false;
                }
            } else if (conn.status === 'pending' || conn.status === 'accepted' || conn.status === 'blocked') {
                canRequest = false;
            }
        }

        return {
            ...u,
            connectionStatus,
            isRequester,
            canRequest,
            cooldownDaysRemaining,
            connectionId: conn ? conn._id : null,
        };
    });

    res.status(200).json({
        success: true,
        message: 'Explore network users fetched successfully',
        data: { users: result },
    });
});

// * 2. Send Connection Request
export const sendConnectionRequest = asyncHandler(async (req, res, next) => {
    await cleanupExpiredRejections();

    const requesterId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
        return next(new ErrorHandler('Recipient user ID is required', 400));
    }

    if (requesterId.toString() === recipientId.toString()) {
        return next(new ErrorHandler('You cannot send a connection request to yourself', 400));
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isDeleted) {
        return next(new ErrorHandler('User not found', 404));
    }

    let conn = await Connection.findOne({
        $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId },
        ],
    });

    if (conn) {
        if (conn.status === 'blocked') {
            return next(new ErrorHandler('Cannot send connection request to this user', 400));
        }

        if (conn.status === 'accepted') {
            return next(new ErrorHandler('You are already connected with this user', 400));
        }

        if (conn.status === 'pending') {
            return next(new ErrorHandler('A connection request is already pending between you and this user', 400));
        }

        if (conn.status === 'rejected') {
            const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
            const elapsed = Date.now() - new Date(conn.rejectedAt).getTime();

            if (elapsed < tenDaysMs) {
                const daysRemaining = Math.ceil((tenDaysMs - elapsed) / (24 * 60 * 60 * 1000));
                return next(new ErrorHandler(
                    `Connection request was rejected. You can re-send a request after 10 days (${daysRemaining} day(s) remaining).`,
                    400
                ));
            }

            conn.requester = requesterId;
            conn.recipient = recipientId;
            conn.status = 'pending';
            conn.rejectedAt = null;
            conn.blockedBy = null;
            await conn.save();
        }
    } else {
        conn = await Connection.create({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
        });
    }

    res.status(200).json({
        success: true,
        message: 'Connection request sent successfully',
        data: { connection: conn },
    });
});

// * 3. Respond to Connection Request (Accept, Reject, Block)
export const respondToRequest = asyncHandler(async (req, res, next) => {
    const { connectionId } = req.params;
    const { action } = req.body;
    const currentUserId = req.user._id;

    if (!['accept', 'reject', 'block'].includes(action)) {
        return next(new ErrorHandler('Invalid action specified', 400));
    }

    const conn = await Connection.findById(connectionId);
    if (!conn) {
        return next(new ErrorHandler('Connection request not found', 404));
    }

    if (action === 'accept') {
        if (conn.recipient.toString() !== currentUserId.toString()) {
            return next(new ErrorHandler('Only the recipient can accept a connection request', 403));
        }
        conn.status = 'accepted';
        conn.rejectedAt = null;
        await conn.save();

    } else if (action === 'reject') {
        if (conn.recipient.toString() !== currentUserId.toString()) {
            return next(new ErrorHandler('Only the recipient can reject a connection request', 403));
        }
        conn.status = 'rejected';
        conn.rejectedAt = new Date();
        await conn.save();

    } else if (action === 'block') {
        conn.status = 'blocked';
        conn.blockedBy = currentUserId;
        conn.rejectedAt = null;
        await conn.save();
    }

    res.status(200).json({
        success: true,
        message: `Connection request ${action}ed successfully`,
        data: { connection: conn },
    });
});

// * 4. Get Pending Connection Requests (Incoming & Outgoing)
export const getPendingRequests = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;

    const incoming = await Connection.find({ recipient: currentUserId, status: 'pending' })
        .populate('requester', 'name email role avatar department')
        .sort({ createdAt: -1 })
        .lean();

    const outgoing = await Connection.find({ requester: currentUserId, status: 'pending' })
        .populate('recipient', 'name email role avatar department')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        message: 'Pending connection requests fetched',
        data: { incoming, outgoing, requests: [...incoming, ...outgoing] },
    });
});

// * 5. Get Connection Request History
export const getConnectionHistory = asyncHandler(async (req, res, next) => {
    await cleanupExpiredRejections();

    const currentUserId = req.user._id;
    const history = await Connection.find({
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    })
        .populate('requester', 'name email role avatar department')
        .populate('recipient', 'name email role avatar department')
        .sort({ updatedAt: -1 })
        .lean();

    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

    const formattedHistory = history.map((conn) => {
        let cooldownDays = 0;
        if (conn.status === 'rejected' && conn.rejectedAt) {
            const elapsed = Date.now() - new Date(conn.rejectedAt).getTime();
            if (elapsed < tenDaysMs) {
                cooldownDays = Math.ceil((tenDaysMs - elapsed) / (24 * 60 * 60 * 1000));
            }
        }
        return {
            ...conn,
            cooldownDays,
        };
    });

    res.status(200).json({
        success: true,
        message: 'Connection history fetched',
        data: { history: formattedHistory },
    });
});

// * 6. Get Blocked Users
export const getBlockedUsers = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;

    const blocked = await Connection.find({ blockedBy: currentUserId, status: 'blocked' })
        .populate('requester', 'name email role avatar department')
        .populate('recipient', 'name email role avatar department')
        .lean();

    const blockedUsers = blocked
        .filter(b => b.requester && b.recipient)
        .map((b) => {
            return b.requester._id.toString() === currentUserId.toString()
                ? b.recipient
                : b.requester;
        });

    res.status(200).json({
        success: true,
        message: 'Blocked users fetched',
        data: { blockedUsers },
    });
});

// * 7. Unblock User
export const unblockUser = asyncHandler(async (req, res, next) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    await Connection.deleteMany({
        blockedBy: currentUserId,
        status: 'blocked',
        $or: [
            { requester: currentUserId, recipient: targetUserId },
            { requester: targetUserId, recipient: currentUserId },
        ],
    });

    res.status(200).json({
        success: true,
        message: 'User unblocked successfully',
    });
});

// * 8. Remove Connection
export const removeConnection = asyncHandler(async (req, res, next) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    await Connection.deleteMany({
        $or: [
            { requester: currentUserId, recipient: targetUserId },
            { requester: targetUserId, recipient: currentUserId },
        ],
    });

    res.status(200).json({
        success: true,
        message: 'Connection removed successfully',
    });
});

// * 9. Block User Directly
export const blockUserDirectly = asyncHandler(async (req, res, next) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    let conn = await Connection.findOne({
        $or: [
            { requester: currentUserId, recipient: targetUserId },
            { requester: targetUserId, recipient: currentUserId },
        ],
    });

    if (conn) {
        conn.status = 'blocked';
        conn.blockedBy = currentUserId;
        await conn.save();
    } else {
        await Connection.create({
            requester: currentUserId,
            recipient: targetUserId,
            status: 'blocked',
            blockedBy: currentUserId,
        });
    }

    res.status(200).json({
        success: true,
        message: 'User blocked successfully',
    });
});

// * 10. Get Active Connected Users (Includes peer connections + supervisor/student relationships)
export const getMyConnections = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId).lean();
    if (!currentUser) {
        return next(new ErrorHandler('User profile not found', 404));
    }

    const connectedUserIdsSet = new Set();

    // A) Accepted peer connections
    const connections = await Connection.find({
        status: 'accepted',
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    }).lean();

    connections.forEach((conn) => {
        if (conn && conn.requester && conn.recipient) {
            const otherId = conn.requester.toString() === currentUserId.toString()
                ? conn.recipient.toString()
                : conn.requester.toString();
            connectedUserIdsSet.add(otherId);
        }
    });

    // B) Academic Supervision Relationships: Student <-> Supervisor
    if (currentUser.role === 'Student' && currentUser.supervisor) {
        connectedUserIdsSet.add(currentUser.supervisor.toString());
    }

    if (currentUser.role === 'Teacher' && Array.isArray(currentUser.assignedStudents)) {
        currentUser.assignedStudents.forEach((stId) => {
            if (stId) connectedUserIdsSet.add(stId.toString());
        });
    }

    const connectedUserIds = Array.from(connectedUserIdsSet);

    const connectedUsers = await User.find({
        _id: { $in: connectedUserIds }
    })
        .select('name email role avatar department')
        .lean();

    res.status(200).json({
        success: true,
        message: 'Connected users fetched successfully',
        data: {
            connections: connectedUsers,
            friends: connectedUsers,
        },
    });
});
