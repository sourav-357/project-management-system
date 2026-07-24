import { CallHistory } from '../models/callHistory.js';
import { Message } from '../models/message.js';

export const initializeCallSockets = (io) => {
    // Store active 1-on-1 calls: callKey -> { callerId, recipientId, callType, startedAt, isAnswered, hasRecorded }
    const activeCalls = new Map();

    const getCallKey = (id1, id2) => {
        return [id1.toString(), id2.toString()].sort().join('_');
    };

    io.on('connection', (socket) => {
        if (!socket.user) return;
        const userId = socket.user._id.toString();

        // ==========================================
        // ONE-ON-ONE WEBRTC CALL SIGNALS
        // ==========================================

        socket.on('initiate_call', async (data) => {
            const { recipientId, callType, offer } = data; // callType: 'one_to_one_voice' or 'one_to_one_video'
            if (!recipientId) return;

            const callKey = getCallKey(userId, recipientId);

            activeCalls.set(callKey, {
                callerId: userId,
                recipientId: recipientId.toString(),
                callType: callType || 'one_to_one_video',
                startedAt: new Date(),
                isAnswered: false,
                hasRecorded: false,
            });

            // Emit incoming call event to target user's socket room
            io.to(recipientId).emit('incoming_call', {
                caller: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    role: socket.user.role,
                    avatar: socket.user.avatar,
                },
                callType: callType || 'one_to_one_video',
                offer,
            });
        });

        socket.on('answer_call', async (data) => {
            const { callerId, answer } = data;
            const callKey = getCallKey(userId, callerId);
            const call = activeCalls.get(callKey);

            if (call) {
                call.isAnswered = true;
                call.connectedAt = new Date();
            }

            io.to(callerId).emit('call_accepted', { answer });
        });

        socket.on('reject_call', async (data) => {
            const { callerId } = data;
            const callKey = getCallKey(userId, callerId);
            const call = activeCalls.get(callKey);

            const callType = call ? call.callType : 'one_to_one_voice';
            const callTitle = callType === 'one_to_one_video' ? '📹 Missed Video Call' : '📞 Missed Voice Call';

            if (!call || !call.hasRecorded) {
                if (call) call.hasRecorded = true;

                // Log in CallHistory as declined
                await CallHistory.create({
                    callType,
                    host: callerId,
                    participants: [callerId, userId],
                    title: callTitle,
                    status: 'declined',
                    startedAt: call ? call.startedAt : new Date(),
                    endedAt: new Date(),
                });

                // Create Missed Call System Message in Chat Timeline
                const missedMsg = await Message.create({
                    sender: callerId,
                    recipient: userId,
                    content: callTitle,
                });

                const populatedMsg = await Message.findById(missedMsg._id).lean();

                io.to(callerId).emit('receive_message', populatedMsg);
                io.to(userId).emit('receive_message', populatedMsg);
            }

            activeCalls.delete(callKey);
            io.to(callerId).emit('call_rejected');
        });

        socket.on('ice_candidate', (data) => {
            const { targetId, candidate } = data;
            io.to(targetId).emit('ice_candidate', { candidate, senderId: userId });
        });

        socket.on('end_call', async (data) => {
            const { targetId } = data;
            if (!targetId) return;

            const callKey = getCallKey(userId, targetId);
            const call = activeCalls.get(callKey);

            if (call && !call.hasRecorded) {
                call.hasRecorded = true;
                const callType = call.callType;
                const callTitle = call.isAnswered
                    ? (callType === 'one_to_one_video' ? '1-on-1 Video Call' : '1-on-1 Voice Call')
                    : (callType === 'one_to_one_video' ? '📹 Missed Video Call' : '📞 Missed Voice Call');

                await CallHistory.create({
                    callType,
                    host: call.callerId,
                    participants: [call.callerId, call.recipientId],
                    title: callTitle,
                    status: call.isAnswered ? 'completed' : 'missed',
                    startedAt: call.startedAt,
                    endedAt: new Date(),
                });

                if (!call.isAnswered) {
                    const missedMsg = await Message.create({
                        sender: call.callerId,
                        recipient: call.recipientId,
                        content: callTitle,
                    });

                    const populatedMsg = await Message.findById(missedMsg._id).lean();
                    io.to(call.recipientId).emit('receive_message', populatedMsg);
                    io.to(call.callerId).emit('receive_message', populatedMsg);
                }
            }

            activeCalls.delete(callKey);
            io.to(targetId).emit('call_ended');
        });

        socket.on('disconnect', () => {
            // Clean up any active call associated with this user
            for (const [key, call] of activeCalls.entries()) {
                if (call.callerId === userId || call.recipientId === userId) {
                    const targetId = call.callerId === userId ? call.recipientId : call.callerId;
                    io.to(targetId).emit('call_ended');
                    activeCalls.delete(key);
                }
            }
        });
    });
};
