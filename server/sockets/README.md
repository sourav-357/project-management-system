# Socket.io Handlers (`server/sockets/`)

Real-time WebSocket event handlers attached to the HTTP server in [server.js](../server.js). Authenticated via JWT in `socket.handshake.auth.token`.

---

## Modules

| File | Domain |
|------|--------|
| [chatSocket.js](./chatSocket.js) | 1-on-1 messaging, read receipts, reactions |
| [callSocket.js](./callSocket.js) | WebRTC signaling (1-on-1 calls + group meetings) |

---

## Chat Events (chatSocket.js)

### Client → Server

| Event | Payload | Action |
|-------|---------|--------|
| `send_message` | `{ recipientId, content, replyTo? }` | Persist message, emit to both users |
| `mark_read` | `{ senderId }` | Mark unread messages as read |
| `toggle_reaction` | `{ messageId, emoji }` | Add/remove emoji reaction |

### Server → Client

| Event | Purpose |
|-------|---------|
| `receive_message` | New message delivered |
| `messages_read` | Read receipt to original sender |
| `reaction_updated` | Reaction sync on message |

### Room Strategy

Each user joins a personal room keyed by their user ID on connect. Messages are emitted to both sender and recipient rooms for instant delivery.

---

## Call Events (callSocket.js)

### 1-on-1 WebRTC Signaling

| Event | Direction | Purpose |
|-------|-----------|---------|
| `initiate_call` | C→S | Caller sends SDP offer to recipient |
| `incoming_call` | S→C | Recipient receives call notification |
| `answer_call` | C→S | Recipient sends SDP answer |
| `call_accepted` | S→C | Caller receives answer |
| `reject_call` | C→S | Decline call |
| `call_rejected` | S→C | Caller notified of decline |
| `ice_candidate` | C↔S | Relay ICE candidates between peers |
| `end_call` | C→S | End active call |
| `call_ended` | S→C | Both parties notified |

On accept: creates `CallHistory` record. On reject/miss: inserts system "missed call" message into chat.

### Group Meeting Events

| Event | Purpose |
|-------|---------|
| `join_meeting_room` | User enters meeting room by roomId |
| `sending_signal` | WebRTC offer/answer in mesh topology |
| `returning_signal` | Signal relay to target peer |
| `send_meeting_message` | In-meeting text chat broadcast |
| `host_mute_user` | Host mutes participant audio |
| `host_remove_user` | Host removes participant |
| `host_end_meeting` | Host ends meeting for all |

---

## Authentication

Socket.io middleware verifies JWT before connection:

```javascript
const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
socket.userId = decoded.id;
```

Unauthenticated connections are rejected.

---

## Architecture Notes (Interview Focus)

| Topic | Decision |
|-------|----------|
| Why Socket.io for signaling? | Reliable delivery, room management, reconnection |
| Why not Socket.io for media? | WebRTC handles P2P media; server only relays SDP/ICE |
| Offline messages | REST persists to MongoDB; Socket.io handles online delivery |
| Mesh vs SFU for meetings | Mesh (simple-peer) suitable for small groups; SFU needed at scale |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Backend overview |
| [../../client/src/pages/README.md](../../client/src/pages/README.md) | Frontend chat/meeting pages |
| [../../client/src/components/README.md](../../client/src/components/README.md) | CallModal WebRTC cleanup |
| [../models/README.md](../models/README.md) | Message, CallHistory, Meeting schemas |
