# 🖥️ Backend Server Architecture - Express.js & Socket.io REST API

The backend server is built with Node.js, Express.js, and Socket.io using a clean 4-tier layered architecture (`Route -> Controller -> Service -> Model`).

---

## 📚 Table of Contents
- [Architecture & Layering](#architecture--layering)
- [Database Seed System](#database-seed-system)
- [API Route Reference](#api-route-reference)
- [Socket.io Event Registry](#socketio-event-registry)
- [Production File Storage](#production-file-storage)
- [Security Middleware Pipeline](#security-middleware-pipeline)

---

## Architecture & Layering

```
+-------------------------------------------------------------------+
|                        Client Layer (React)                       |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                          Middleware Layer                         |
|  Helmet | Sanitizer | Rate Limiter | Auth Guard | Policy Check    |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                         Controller Layer                          |
|  Request Parsing | Input Validation | Response Standardization    |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                          Services Layer                           |
|  Business Logic | Workflow Transitions | Atomic DB Operations     |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                          Database Layer                           |
|  Mongoose Models | Compound Indexes | MongoDB Storage             |
+-------------------------------------------------------------------+
```

---

## Database Seed System (`config/seed.js`)

On server startup, [seed.js](./config/seed.js) executes:
1. Queries `User.countDocuments()`.
2. If count is `0`, creates default demo accounts:
   - **Admin**: `admin@fyp.com` / `Admin@1234`
   - **Teacher**: `teacher@fyp.com` / `Teacher@1234`
   - **Student**: `student@fyp.com` / `Student@1234`

This guarantees out-of-the-box readiness without manual seeding commands.

---

## API Route Reference

### 🔐 Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Authenticate user & issue Access/Refresh tokens | Public |
| `POST` | `/refresh-token` | Rotate Access token via HttpOnly Refresh cookie | Public |
| `POST` | `/logout` | Revoke Refresh token & clear cookies | Authenticated |
| `POST` | `/forgot-password` | Generate reset token & send email | Public |
| `PUT` | `/reset-password/:token` | Reset user password using token | Public |
| `GET` | `/me` | Get current logged in user details | Authenticated |

### 👨‍🎓 Student Routes (`/api/v1/student`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects` | Submit new project proposal (max 1 active) | Student |
| `GET` | `/projects/my-proposal` | Fetch current proposal & submission history | Student |
| `PUT` | `/projects/:id` | Edit draft/rejected proposal | Student |
| `POST` | `/request-supervisor` | Request faculty supervisor for approved proposal | Student |
| `GET` | `/supervisors` | View available teachers & capacity | Student |
| `POST` | `/documents` | Upload milestone document deliverable | Student |

### 👩‍🏫 Teacher Routes (`/api/v1/teacher`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/requests` | Fetch pending supervisor requests | Teacher |
| `PUT` | `/requests/:id` | Accept/Decline supervisor request | Teacher |
| `GET` | `/students` | List assigned supervisees & projects | Teacher |
| `GET` | `/projects` | View supervised/department proposals | Teacher |
| `PUT` | `/projects/:id/review` | Evaluate proposal (Approve/Reject) | Teacher |
| `POST` | `/projects/:id/feedback` | Send structured project feedback | Teacher |

### 🛡️ Admin Routes (`/api/v1/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List system users directory | Admin |
| `POST` | `/users` | Create new Student or Teacher user account | Admin |
| `PUT` | `/users/:id/status` | Toggle user status (Active/Suspended) | Admin |
| `GET` | `/projects` | View all platform projects | Admin |
| `PUT` | `/projects/:id/review` | Override proposal evaluation | Admin |

### 💬 Chat & Social Routes (`/api/v1/chat` & `/api/v1/connections`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/chat/friends` | List connected friends for instant messaging | Authenticated |
| `GET` | `/chat/messages/:partnerId` | Fetch message history with pagination | Authenticated |
| `DELETE` | `/chat/clear-chat/:partnerId` | Clear message history with partner | Authenticated |
| `GET` | `/connections/explore` | Explore non-connected users directory | Authenticated |
| `POST` | `/connections/request/:targetId` | Send connection request | Authenticated |
| `PUT` | `/connections/accept/:requestId` | Accept incoming connection request | Authenticated |
| `DELETE` | `/connections/remove/:targetId` | Remove existing connection | Authenticated |
| `PUT` | `/connections/block-user/:targetId` | Block user directly | Authenticated |

---

## Socket.io Event Registry

### 1. Instant Messaging ([chatSocket.js](./sockets/chatSocket.js))
- `send_message`: Emits text payload to target recipient room; returns DB message object.
- `mark_read`: Updates unread message statuses to `true`.
- `toggle_reaction`: Adds/removes emoji reaction on target message.

### 2. Audio/Video Signaling ([callSocket.js](./sockets/callSocket.js))
- `initiate_call`: Sends WebRTC offer to target recipient room.
- `answer_call`: Returns WebRTC answer to caller room & logs call record in `CallHistory`.
- `reject_call`: Emits decline signal & posts system Missed Call message into chat timeline.
- `ice_candidate`: Relays WebRTC ICE candidate signals between peers.
- `join_meeting_room` / `send_meeting_message`: Group WebRTC meeting room & live text chat.

---

## Production File Storage

- **Cloudinary Integration**: Deliverable documents and avatars uploaded via `multer` are stored in Cloudinary (`academic_platform/projects/<projectId>`).
- **Development Disk Fallback**: Automatically stores files locally in `server/uploads/` if cloud API credentials are not provided.

---

## Security Middleware Pipeline

- **`Helmet`**: Secures HTTP response headers.
- **`express-mongo-sanitize`**: Sanitizes incoming request bodies against NoSQL injection.
- **`express-rate-limit`**: Enforces 200 requests per 15-minute window per IP.
- **`auth.middleware.js`**: Verifies JWT Access Tokens & enforces Role-Based Access Control (RBAC).

---

## 🔗 Related Documentation Links
- 🏠 [Root Project README](../README.md)
- 🎨 [Client Frontend README](../client/README.md)
- 📊 [Models Documentation](./models/README.md)
- ⚙️ [Controllers Documentation](./controllers/README.md)
- ⚡ [Services Documentation](./services/README.md)
- 🛡️ [Middlewares Documentation](./middlewares/README.md)
