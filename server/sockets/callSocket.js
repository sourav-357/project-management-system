import { CallHistory } from '../models/callHistory.js';
import { Meeting } from '../models/meeting.js';
import { Message } from '../models/message.js';

export const initializeCallSockets = (io) => {
    // Store active room participants: meetingId -> Map(userId, { socketId, user, isMuted, isVideoOff })
    const meetingRooms = new Map();

    // Store banned users per meeting: meetingId -> Set(userId)
    const bannedMeetingUsers = new Map();

    // Store active 1-on-1 calls: callerId -> { recipientId, callType, startedAt, isAnswered }
    const activeCalls = new Map();

    io.on('connection', (socket) => {
        if (!socket.user) return;
        const userId = socket.user._id.toString();

        // ==========================================
        // 1. ONE-ON-ONE WEBRTC CALL SIGNALS
        // ==========================================

        socket.on('initiate_call', async (data) => {
            const { recipientId, callType, offer } = data; // callType: 'one_to_one_voice' or 'one_to_one_video'
            if (!recipientId) return;

            activeCalls.set(userId, {
                recipientId,
                callType,
                startedAt: new Date(),
                isAnswered: false,
            });

            // Emit incoming call event to target user's socket room
            io.to(recipientId).emit('incoming_call', {
                caller: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    role: socket.user.role,
                    avatar: socket.user.avatar,
                },
                callType,
                offer,
            });
        });

        socket.on('answer_call', async (data) => {
            const { callerId, answer } = data;
            const call = activeCalls.get(callerId);
            if (call) {
                call.isAnswered = true;
            }

            // Create completed call record in CallHistory
            await CallHistory.create({
                callType: call ? call.callType : 'one_to_one_video',
                host: callerId,
                participants: [callerId, userId],
                title: call?.callType === 'one_to_one_video' ? '1-on-1 Video Call' : '1-on-1 Voice Call',
                status: 'completed',
                startedAt: call ? call.startedAt : new Date(),
                endedAt: new Date(),
            });

            io.to(callerId).emit('call_accepted', { answer });
        });

        socket.on('reject_call', async (data) => {
            const { callerId } = data;
            const call = activeCalls.get(callerId);
            const callType = call ? call.callType : 'one_to_one_voice';
            const callTitle = callType === 'one_to_one_video' ? '📹 Missed Video Call' : '📞 Missed Voice Call';

            activeCalls.delete(callerId);

            // Log in CallHistory as declined/missed
            await CallHistory.create({
                callType,
                host: callerId,
                participants: [callerId, userId],
                title: callTitle,
                status: 'declined',
                startedAt: new Date(),
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
            io.to(callerId).emit('call_rejected');
        });

        socket.on('ice_candidate', (data) => {
            const { targetId, candidate } = data;
            io.to(targetId).emit('ice_candidate', { candidate, senderId: userId });
        });

        socket.on('end_call', async (data) => {
            const { targetId } = data;
            const call = activeCalls.get(userId);

            if (call && !call.isAnswered) {
                // Call was cancelled/unanswered -> Log as Missed Call
                const callType = call.callType;
                const callTitle = callType === 'one_to_one_video' ? '📹 Missed Video Call' : '📞 Missed Voice Call';

                await CallHistory.create({
                    callType,
                    host: userId,
                    participants: [userId, targetId],
                    title: callTitle,
                    status: 'missed',
                    startedAt: call.startedAt,
                    endedAt: new Date(),
                });

                const missedMsg = await Message.create({
                    sender: userId,
                    recipient: targetId,
                    content: callTitle,
                });

                const populatedMsg = await Message.findById(missedMsg._id).lean();
                io.to(targetId).emit('receive_message', populatedMsg);
                io.to(userId).emit('receive_message', populatedMsg);
            }

            activeCalls.delete(userId);
            io.to(targetId).emit('call_ended');
        });

        // ==========================================
        // 2. GROUP VIDEO MEETING WEBRTC SIGNALS
        // ==========================================

        socket.on('join_meeting_room', async ({ meetingId, isMuted, isVideoOff }) => {
            if (!meetingId) return;

            // Check if user was banned/removed from this meeting
            const bannedSet = bannedMeetingUsers.get(meetingId);
            if (bannedSet && bannedSet.has(userId)) {
                socket.emit('join_rejected', {
                    message: 'You were removed from this meeting by the host and cannot rejoin.',
                });
                return;
            }

            try {
                const targetMeeting = await Meeting.findById(meetingId).select('status').lean();
                if (!targetMeeting || targetMeeting.status === 'ended') {
                    socket.emit('meeting_ended_by_host');
                    return;
                }
            } catch (err) {
                socket.emit('meeting_ended_by_host');
                return;
            }

            const roomName = `meeting_${meetingId}`;
            socket.join(roomName);

            if (!meetingRooms.has(meetingId)) {
                meetingRooms.set(meetingId, new Map());
            }
            const roomMap = meetingRooms.get(meetingId);
            roomMap.set(userId, {
                socketId: socket.id,
                user: socket.user,
                isMuted: Boolean(isMuted),
                isVideoOff: Boolean(isVideoOff),
            });

            const existingUsers = Array.from(roomMap.values()).filter((u) => u.user._id.toString() !== userId);
            socket.emit('existing_meeting_users', existingUsers);

            socket.to(roomName).emit('user_joined_meeting', {
                socketId: socket.id,
                user: socket.user,
                isMuted: Boolean(isMuted),
                isVideoOff: Boolean(isVideoOff),
            });
        });

        socket.on('sending_signal', ({ userToSignal, signal }) => {
            io.to(userToSignal).emit('user_signal', { signal, callerSocketId: socket.id, callerUser: socket.user });
        });

        socket.on('returning_signal', ({ signal, callerId }) => {
            io.to(callerId).emit('receiving_returned_signal', { signal, id: socket.id });
        });

        socket.on('group_ice_candidate', ({ targetSocketId, candidate }) => {
            io.to(targetSocketId).emit('group_ice_candidate', { candidate, senderSocketId: socket.id });
        });

        // Media Toggle Sync (Mute / Unmute / Video Off)
        socket.on('toggle_media_state', ({ meetingId, isMuted, isVideoOff }) => {
            if (!meetingId) return;
            const roomMap = meetingRooms.get(meetingId);
            if (roomMap && roomMap.has(userId)) {
                const p = roomMap.get(userId);
                p.isMuted = Boolean(isMuted);
                p.isVideoOff = Boolean(isVideoOff);
            }
            const roomName = `meeting_${meetingId}`;
            socket.to(roomName).emit('peer_media_toggled', {
                userId,
                socketId: socket.id,
                isMuted: Boolean(isMuted),
                isVideoOff: Boolean(isVideoOff),
            });
        });

        // Live In-Meeting Chat Message
        socket.on('send_meeting_message', ({ meetingId, content }) => {
            if (!meetingId || !content || !content.trim()) return;
            const roomName = `meeting_${meetingId}`;

            const msgData = {
                sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
                content: content.trim(),
                createdAt: new Date(),
            };

            io.to(roomName).emit('receive_meeting_message', msgData);
        });

        // Host Control: Mute User
        socket.on('host_mute_user', ({ meetingId, targetUserId }) => {
            const roomMap = meetingRooms.get(meetingId);
            if (roomMap && roomMap.has(targetUserId)) {
                const targetSocketId = roomMap.get(targetUserId).socketId;
                io.to(targetSocketId).emit('muted_by_host');
            }
        });

        // Host Control: Unmute User
        socket.on('host_unmute_user', ({ meetingId, targetUserId }) => {
            const roomMap = meetingRooms.get(meetingId);
            if (roomMap && roomMap.has(targetUserId)) {
                const targetSocketId = roomMap.get(targetUserId).socketId;
                io.to(targetSocketId).emit('unmuted_by_host');
            }
        });

        // Host Control: Remove/Kick User
        socket.on('host_remove_user', ({ meetingId, targetUserId }) => {
            const roomMap = meetingRooms.get(meetingId);
            if (roomMap && roomMap.has(targetUserId)) {
                const targetSocketId = roomMap.get(targetUserId).socketId;
                
                // Add to banned list for this meeting
                if (!bannedMeetingUsers.has(meetingId)) {
                    bannedMeetingUsers.set(meetingId, new Set());
                }
                bannedMeetingUsers.get(meetingId).add(targetUserId);

                // Notify target user
                io.to(targetSocketId).emit('removed_by_host');

                // Remove from meeting room map
                roomMap.delete(targetUserId);

                // Broadcast user_left_meeting to room so all users see them disappear immediately
                const roomName = `meeting_${meetingId}`;
                io.to(roomName).emit('user_left_meeting', { userId: targetUserId, socketId: targetSocketId });
            }
        });

        // Host Control: End Meeting For All
        socket.on('host_end_meeting', ({ meetingId }) => {
            const roomName = `meeting_${meetingId}`;
            io.to(roomName).emit('meeting_ended_by_host');
            meetingRooms.delete(meetingId);
            bannedMeetingUsers.delete(meetingId);
        });

        socket.on('leave_meeting_room', ({ meetingId }) => {
            if (!meetingId) return;
            const roomName = `meeting_${meetingId}`;
            socket.leave(roomName);

            const roomMap = meetingRooms.get(meetingId);
            if (roomMap) {
                roomMap.delete(userId);
                if (roomMap.size === 0) meetingRooms.delete(meetingId);
            }

            socket.to(roomName).emit('user_left_meeting', { userId, socketId: socket.id });
        });

        // Automatic Disconnect Cleanup
        socket.on('disconnect', () => {
            activeCalls.delete(userId);

            meetingRooms.forEach((roomMap, meetingId) => {
                if (roomMap.has(userId)) {
                    const participant = roomMap.get(userId);
                    roomMap.delete(userId);
                    const roomName = `meeting_${meetingId}`;
                    socket.to(roomName).emit('user_left_meeting', { userId, socketId: participant.socketId });
                    if (roomMap.size === 0) {
                        meetingRooms.delete(meetingId);
                    }
                }
            });
        });
    });
};
