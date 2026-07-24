import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import { Connection } from '../models/connection.js';

export const initializeChatSockets = (io) => {
    io.on('connection', (socket) => {
        if (!socket.user) return;
        const userId = socket.user._id.toString();

        // Join personal user room for direct messaging & notifications
        socket.join(userId);

        // Notify user status online to active connections
        socket.broadcast.emit('user_online', { userId });

        // Handler: Send Message in 1-on-1 Chat
        socket.on('send_message', async (data, callback) => {
            try {
                const { recipientId, content, mediaUrl, fileUrl, mediaType, fileName, fileSize } = data;

                if (!recipientId || (!content && !mediaUrl && !fileUrl)) {
                    if (callback) callback({ success: false, error: 'Recipient and content or media required' });
                    return;
                }

                // Check connection status or block status
                const isBlocked = await Connection.findOne({
                    status: 'blocked',
                    $or: [
                        { requester: userId, recipient: recipientId },
                        { requester: recipientId, recipient: userId },
                    ],
                });

                if (isBlocked) {
                    if (callback) callback({ success: false, error: 'Cannot send message to this user' });
                    return;
                }

                const message = await Message.create({
                    sender: userId,
                    recipient: recipientId,
                    content: content || '',
                    mediaUrl: mediaUrl || fileUrl || '',
                    mediaType: mediaType || 'none',
                    fileName: fileName || '',
                    fileSize: fileSize || '',
                    isRead: false,
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'name avatar role department')
                    .populate('recipient', 'name avatar role department')
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
                    { $set: { isRead: true } }
                );

                io.to(senderId).emit('messages_read_by_recipient', { recipientId: userId });
            } catch (err) {
                console.error('Socket mark_read error:', err);
            }
        });

        // Handler: Toggle Message Reaction
        socket.on('toggle_reaction', async (data) => {
            try {
                const { messageId, emoji } = data;
                const message = await Message.findById(messageId);
                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === userId && r.emoji === emoji
                );

                if (existingIndex > -1) {
                    message.reactions.splice(existingIndex, 1);
                } else {
                    message.reactions.push({ user: userId, emoji });
                }

                await message.save();

                const updated = await Message.findById(messageId)
                    .populate('sender', 'name avatar role department')
                    .populate('recipient', 'name avatar role department')
                    .populate('reactions.user', 'name')
                    .lean();

                const otherUser = message.sender.toString() === userId ? message.recipient.toString() : message.sender.toString();
                io.to(otherUser).emit('message_reaction_updated', updated);
                io.to(userId).emit('message_reaction_updated', updated);
            } catch (err) {
                console.error('Socket toggle_reaction error:', err);
            }
        });

        // Handler: Typing Indicator
        socket.on('typing_start', ({ recipientId }) => {
            if (recipientId) {
                io.to(recipientId).emit('user_typing', { userId });
            }
        });

        socket.on('typing_stop', ({ recipientId }) => {
            if (recipientId) {
                io.to(recipientId).emit('user_stop_typing', { userId });
            }
        });

        // Handler: Disconnect
        socket.on('disconnect', () => {
            socket.broadcast.emit('user_offline', { userId });
        });
    });
};
