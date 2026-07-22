import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { Connection } from '../models/connection.js';
import { Message } from '../models/message.js';

export const initializeChatSockets = (io) => {
    // Middleware for Socket.io JWT authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
            const user = await User.findById(decoded.id).select('_id name role email');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        socket.join(userId);

        // Handler: Send Message
        socket.on('send_message', async (data, callback) => {
            try {
                const { recipientId, content, replyToId } = data;
                if (!recipientId || !content || !content.trim()) {
                    if (callback) callback({ success: false, error: 'Recipient and message content required' });
                    return;
                }

                const recipientUser = await User.findById(recipientId);
                if (!recipientUser || recipientUser.isDeleted) {
                    if (callback) callback({ success: false, error: 'Recipient user not found' });
                    return;
                }

                const message = await Message.create({
                    sender: userId,
                    recipient: recipientId,
                    content: content.trim(),
                    replyTo: replyToId || null,
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate({
                        path: 'replyTo',
                        select: 'content sender',
                        populate: { path: 'sender', select: 'name' },
                    })
                    .populate('reactions.user', 'name')
                    .lean();

                // Emit real-time message to recipient and sender
                io.to(recipientId).emit('receive_message', populatedMessage);
                io.to(userId).emit('receive_message', populatedMessage);

                if (callback) callback({ success: true, message: populatedMessage });
            } catch (err) {
                console.error('Socket send_message error:', err);
                if (callback) callback({ success: false, error: 'Failed to send message' });
            }
        });

        // Handler: Mark Messages as Read
        socket.on('mark_read', async (data) => {
            try {
                const { senderId } = data;
                if (!senderId) return;

                await Message.updateMany(
                    { sender: senderId, recipient: userId, isRead: false },
                    { isRead: true, readAt: new Date() }
                );

                // Notify original sender that their messages were read
                io.to(senderId).emit('messages_read', { readerId: userId });
            } catch (err) {
                console.error('Socket mark_read error:', err);
            }
        });

        // Handler: Toggle Reaction
        socket.on('toggle_reaction', async (data) => {
            try {
                const { messageId, emoji } = data;
                if (!messageId || !emoji) return;

                const message = await Message.findById(messageId);
                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === userId
                );

                if (existingIndex > -1) {
                    if (message.reactions[existingIndex].emoji === emoji) {
                        message.reactions.splice(existingIndex, 1);
                    } else {
                        message.reactions[existingIndex].emoji = emoji;
                    }
                } else {
                    message.reactions.push({ user: userId, emoji });
                }

                await message.save();
                const populatedMessage = await Message.findById(message._id)
                    .populate('reactions.user', 'name')
                    .lean();

                // Emit reaction update to both users
                io.to(message.sender.toString()).emit('reaction_updated', {
                    messageId: message._id,
                    reactions: populatedMessage.reactions,
                });
                io.to(message.recipient.toString()).emit('reaction_updated', {
                    messageId: message._id,
                    reactions: populatedMessage.reactions,
                });
            } catch (err) {
                console.error('Socket toggle_reaction error:', err);
            }
        });

        socket.on('disconnect', () => {
            // Socket disconnected
        });
    });
};
