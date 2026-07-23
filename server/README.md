# Backend Server — Express 5 + Socket.io + MongoDB

REST API and real-time WebSocket server for the Academic FYP Governance Platform. Follows a four-tier architecture: **Route → Controller → Service → Model**.

---

## Table of Contents

- [Architecture](#architecture)
- [Entry Points](#entry-points)
- [Directory Structure](#directory-structure)
- [Database Seed System](#database-seed-system)
- [API Route Reference](#api-route-reference)
- [Socket.io Events](#socketio-events)
- [Security Pipeline](#security-pipeline)
- [Environment Variables](#environment-variables)
- [Development & Testing](#development--testing)
- [Documentation Index](#documentation-index)

---

## Architecture

```
HTTP Request / WebSocket
        │
        ▼
┌─────────────────────────────────────┐
│  Middleware (Helmet, sanitize, CORS,│
│  rate-limit, auth, role guard)      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Router → Controller                │
│  Parse input, validate, respond     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Service                            │
│  Business logic, atomic DB ops      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Model (Mongoose)                   │
│  Schema validation, indexes         │
└─────────────────────────────────────┘
```

---

## Entry Points

| File | Purpose |
|------|---------|
| [server.js](./server.js) | Creates HTTP server, attaches Socket.io, starts listening |
| [app.js](./app.js) | Express app: middleware stack, route mounting, error handler |

---

## Directory Structure

```
server/
├── README.md              ← You are here
├── app.js / server.js
├── config/                DB, seed, Cloudinary
├── models/                Mongoose schemas
├── controllers/           HTTP request handlers
├── services/              Business logic layer
├── middlewares/           Auth, upload, errors
├── router/                Express route definitions
├── sockets/               Socket.io event handlers
├── validations/           Request body validators
├── utils/                 Token generation, email templates
└── tests/                 Node.js native test runner
```

---

## Database Seed System

On every successful MongoDB connection ([config/db.js](./config/db.js)), [config/seed.js](./config/seed.js) runs:

- If **zero Admin** users exist → creates `admin@university.edu`
- If **zero Teacher** users exist → creates `teacher@university.edu`
- If **zero Student** users exist → creates `student@university.edu`

Each role is seeded independently—not tied to total user count.

Details: [config/README.md](./config/README.md)

---

## API Route Reference

Base prefix: `/api/v1`

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Admin self-registration only |
| POST | `/login` | Public | Login (email + password + role) |
| POST | `/refresh-token` | Public | Rotate access + refresh tokens |
| GET | `/me` | Yes | Current user profile |
| POST/GET | `/logout` | Yes | Revoke current refresh token |
| POST | `/logout-all` | Yes | Revoke all sessions |
| POST | `/password/forgot` | Public | Send reset email |
| PUT | `/password/reset/:token` | Public | Reset password |
| PUT | `/password/change` | Yes | Change password |
| PUT | `/profile/avatar` | Yes | Upload avatar (Cloudinary) |

### Admin — `/admin` (Admin only)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create-student` | Provision student account |
| PUT | `/update-student/:id` | Update student |
| DELETE | `/delete-student/:id` | Soft-delete student |
| POST | `/create-teacher` | Provision teacher account |
| PUT | `/update-teacher/:id` | Update teacher |
| DELETE | `/delete-teacher/:id` | Soft-delete teacher |
| PUT | `/users/:id/status` | Toggle active/suspended/archived |
| GET | `/getAllUsers` | Paginated user directory |
| GET | `/projects` | All platform projects |
| PUT | `/projects/:projectId/review` | Override proposal review |
| POST | `/assign-supervisor` | Manual supervisor assignment |
| GET | `/dashboard-stats` | Admin metrics |

### Student — `/student` (Student only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/project` | Active project + history |
| POST | `/project-proposal` | Submit or edit proposal |
| POST | `/milestones/:milestoneId/submit` | Submit milestone work |
| POST | `/upload/:projectId` | Upload project files |
| GET | `/fetch-supervisors` | Available teachers |
| GET | `/supervisor` | Assigned supervisor |
| POST | `/supervisor-request` | Request supervisor |
| GET | `/feedback/:projectId` | Project feedback |
| GET | `/fetch-dashboard-stats` | Dashboard data |
| GET | `/download/:projectId/:fileId` | Download file |

### Teacher — `/teacher` (Teacher only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/requests` | Incoming supervisor requests |
| POST | `/requests/:requestId/respond` | Accept/reject request |
| GET | `/students` | Assigned students |
| POST | `/students/:studentId/drop` | Drop supervision |
| GET | `/projects` | Supervised projects |
| POST | `/projects/:projectId/feedback` | Add feedback |
| PUT | `/projects/:projectId/review` | Approve/reject proposal |
| PUT | `/projects/:projectId/milestones/:milestoneId` | Grade milestone |
| GET | `/dashboard-stats` | Teacher metrics |

### Connections — `/connections` (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/explore` | Discover users |
| POST | `/request` | Send connection request |
| PUT | `/respond/:connectionId` | Accept/reject/block |
| GET | `/pending` | Pending requests |
| GET | `/history` | Connection history |
| GET | `/blocked` | Blocked users |
| PUT | `/unblock/:targetUserId` | Unblock user |
| DELETE | `/remove/:targetUserId` | Remove connection |
| PUT | `/block-user/:targetUserId` | Block directly |

### Chat — `/chat` (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/friends` | Connected friends + unread counts |
| GET | `/messages/:partnerId` | Conversation (marks read) |
| DELETE | `/clear-chat/:partnerId` | Delete all messages |
| POST | `/messages/:messageId/react` | Toggle emoji reaction |
| GET | `/call-history` | 1-on-1 call log |
| DELETE | `/call-history/:historyId` | Delete call record |

### Meetings — `/meetings` (Authenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/available-invitees` | Teacher/Admin | Users to invite |
| GET | `/` | All | Active meetings |
| GET | `/history` | All | Past meetings |
| GET | `/:meetingId` | All | Meeting details |
| POST | `/` | Teacher/Admin | Create meeting |
| PUT | `/:meetingId/end` | Teacher/Admin | End meeting |
| DELETE | `/history/:historyId` | All | Delete history record |

### Notifications — `/notifications` (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | My notifications |
| PUT | `/mark-all-read` | Mark all read |
| PUT | `/:id/read` | Mark one read |
| DELETE | `/clear-all` | Clear all |
| DELETE | `/:id` | Delete one |

### Deadlines — `/deadlines` (Authenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | All | List deadlines |
| POST | `/` | Admin/Teacher | Create deadline |
| DELETE | `/:id` | Admin/Teacher | Delete deadline |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |

Full route mounting details: [router/README.md](./router/README.md)

---

## Socket.io Events

Real-time handlers in [sockets/](./sockets/):

| Module | Events | Purpose |
|--------|--------|---------|
| chatSocket | `send_message`, `mark_read`, `toggle_reaction` | Messaging |
| callSocket | `initiate_call`, `answer_call`, `ice_candidate`, `end_call` | 1-on-1 WebRTC |
| callSocket | `join_meeting_room`, `sending_signal`, `host_mute_user` | Group meetings |

Full catalog: [sockets/README.md](./sockets/README.md)

---

## Security Pipeline

Execution order in [app.js](./app.js):

1. **Helmet** — Secure HTTP headers
2. **express-mongo-sanitize** — NoSQL injection prevention
3. **compression** — Gzip responses
4. **cookie-parser** + body parsers
5. **express-rate-limit** — 2000 requests / 15 min per IP
6. **CORS** — Configured origins with credentials
7. **isAuthenticated** — JWT from httpOnly cookie
8. **isAuthorized(roles)** — RBAC per route
9. **error middleware** — Uniform JSON error responses

Details: [middlewares/README.md](./middlewares/README.md)

---

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `JWT_ACCESS_EXPIRE` | Access token TTL (default 15m) |
| `JWT_REFRESH_EXPIRE` | Refresh token TTL (default 7d) |
| `CLIENT_URL` | Frontend origin for CORS |
| `CLOUDINARY_*` | Cloud file storage (optional in dev) |
| `SMTP_*` | Email for password reset |

---

## Development & Testing

```bash
cd server
npm install
npm run dev     # Nodemon on :3000
npm test        # Node native test runner (tests/auth.test.js)
npm start       # Production start
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| express 5 | HTTP framework |
| mongoose 9 | MongoDB ODM |
| socket.io 4 | WebSocket server |
| jsonwebtoken | JWT access + refresh tokens |
| bcrypt | Password hashing |
| cookie-parser | httpOnly cookie handling |
| helmet | Security headers |
| express-mongo-sanitize | Injection defense |
| express-rate-limit | Rate limiting |
| multer / express-fileupload | File uploads |
| cloudinary | Cloud storage |
| nodemailer | Transactional email |
| validator | Email format validation |
| compression | Response compression |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Root project overview |
| [../client/README.md](../client/README.md) | Frontend client |
| [config/README.md](./config/README.md) | DB, seed, Cloudinary |
| [models/README.md](./models/README.md) | All Mongoose schemas |
| [controllers/README.md](./controllers/README.md) | HTTP handlers |
| [services/README.md](./services/README.md) | Business logic |
| [middlewares/README.md](./middlewares/README.md) | Auth & security |
| [router/README.md](./router/README.md) | Route definitions |
| [sockets/README.md](./sockets/README.md) | Real-time events |
| [validations/README.md](./validations/README.md) | Input validators |
| [utils/README.md](./utils/README.md) | Token & email utilities |
| [tests/README.md](./tests/README.md) | Test suite |
