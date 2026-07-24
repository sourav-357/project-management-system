# Server Socket.io & Real-Time Engine Handbook

Technical specification for WebSocket event handlers, 1-on-1 direct chat messaging, and WebRTC audio/video call signaling in `server/sockets/`.

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
- **Payload**: `{ recipientId, content, replyToId }`
- **Logic**:
  1. Checks `userSocketMap` for `recipientId`.
  2. If online: emits `receive_message` payload directly to recipient's `socketId`.
  3. Saves Message document to MongoDB with `isRead: false`.
  4. Emits `message_sent` acknowledgment back to sender.

#### `mark_read`
- **Direction**: Client → Server → Client
- **Payload**: `{ senderId }`
- **Logic**:
  1. Updates matching Message documents in MongoDB to `isRead: true`.
  2. If message sender is online: emits `messages_read` event to sender's `socketId` to update unread badge UI.

#### `toggle_reaction`
- **Direction**: Client → Server → Client
- **Payload**: `{ messageId, emoji }`
- **Logic**:
  1. Updates reactions array in Message document.
  2. Emits `reaction_updated` event to partner's `socketId`.

---

## 3. WebRTC 1-on-1 Calling Socket (`server/sockets/callSocket.js`)

Handles 1-on-1 WebRTC signaling for audio and video calls.

### 1-on-1 WebRTC Calling Events

#### `initiate_call`
- **Payload**: `{ recipientId, offer, callType }`
- **Logic**: Looks up recipient `socketId`. If online, emits `incoming_call` with caller details and offer signal across any active page.

#### `answer_call`
- **Payload**: `{ callerId, answer }`
- **Logic**: Emits `call_accepted` with answer signal to caller's `socketId`, establishing peer-to-peer WebRTC connection and logging in `CallHistory`.

#### `ice_candidate`
- **Payload**: `{ targetId, candidate }`
- **Logic**: Forwards WebRTC ICE candidate to target user's socket for NAT traversal.

#### `reject_call`
- **Payload**: `{ callerId }`
- **Logic**: Logs declined/missed call record in `CallHistory` and sends system message to chat.

#### `end_call`
- **Payload**: `{ targetId }`
- **Logic**: Emits `call_ended` signal to peer socket and logs call duration in `CallHistory`.
