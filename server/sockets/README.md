# Server Socket.io & Real-Time Engine Handbook

Technical specification for WebSocket event handlers, 1-on-1 direct chat messaging, WebRTC audio/video call signaling, and group video conference rooms in `server/sockets/`.

---

## 1. Engine Overview

WebSockets are attached to the Node `http.Server` in `server/server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initializeChatSockets(io);
initializeCallSockets(io);
```

User socket instances are mapped to authenticated user IDs upon connection:

```javascript
// Map mapping userId -> socketId
const userSocketMap = new Map();
```

---

## 2. Direct Messaging & Chat Socket (`server/sockets/chatSocket.js`)

Manages real-time messaging, read status propagation, and emoji reaction broadcasts.

### Socket Events Catalog

#### `send_message`
- **Direction**: Client → Server → Client
- **Payload**: `{ recipientId, content, messageId }`
- **Logic**:
  1. Checks `userSocketMap` for `recipientId`.
  2. If online: emits `receive_message` payload directly to recipient's `socketId`.
  3. Saves Message document to MongoDB with `isRead: false`.
  4. Emits `message_sent` acknowledgment back to sender.

#### `mark_read`
- **Direction**: Client → Server → Client
- **Payload**: `{ senderId, messageIds }`
- **Logic**:
  1. Updates matching Message documents in MongoDB to `isRead: true`.
  2. If message sender is online: emits `messages_read` event to sender's `socketId` to update unread badge UI.

#### `toggle_reaction`
- **Direction**: Client → Server → Client
- **Payload**: `{ messageId, partnerId, emoji }`
- **Logic**:
  1. Updates reactions array in Message document.
  2. Emits `reaction_updated` event to partner's `socketId`.

---

## 3. WebRTC Call & Video Meetings Socket (`server/sockets/callSocket.js`)

Handles 1-on-1 WebRTC signaling and mesh group video conference rooms.

### 1-on-1 WebRTC Calling Events

#### `initiate_call`
- **Payload**: `{ recipientId, offerSignal, callType }`
- **Logic**: Looks up recipient `socketId`. If online, emits `incoming_call` with caller details and offer signal. If offline or busy, returns `call_unavailable`.

#### `answer_call`
- **Payload**: `{ callerId, answerSignal }`
- **Logic**: Emits `call_accepted` with answer signal to caller's `socketId`, establishing peer-to-peer WebRTC connection.

#### `ice_candidate`
- **Payload**: `{ targetUserId, candidate }`
- **Logic**: Forwards WebRTC ICE candidate to target user's socket for NAT traversal.

#### `end_call`
- **Payload**: `{ targetUserId, reason }`
- **Logic**: Emits `call_ended` signal to peer socket and logs call duration in `CallHistory`.

---

### Group Video Conference Events

#### `join_meeting_room`
- **Payload**: `{ meetingId, user }`
- **Logic**: Adds socket to Socket.io room channel `meeting_${meetingId}`. Emits `user_joined_room` to all other participants in the room.

#### `sending_signal`
- **Payload**: `{ userToSignal, callerId, signal }`
- **Logic**: Forwards WebRTC offer signal to existing room participant for peer mesh connection.

#### `receiving_signal`
- **Payload**: `{ signal, callerId }`
- **Logic**: Delivers WebRTC answer signal back to caller.

#### `host_mute_user`
- **Payload**: `{ meetingId, targetUserId, muteType }` (Host/Admin only)
- **Logic**: Emits `host_muted_you` to target user's socket.

#### `meeting_ended_by_host`
- **Payload**: `{ meetingId }`
- **Logic**: Broadcasts `meeting_closed` to all sockets in `meeting_${meetingId}` channel and closes room.
