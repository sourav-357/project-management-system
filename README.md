# Academic FYP Governance & Real-Time Collaboration Platform

A production-oriented MERN monorepo for governing Final Year Project (FYP) proposals, faculty supervisor allocation, milestone deliverables, and real-time collaboration (chat, calls, group meetings) between students, teachers, and administrators.

Built with engineering decisions front and center: role-based access control, atomic MongoDB concurrency guards, dual-JWT authentication with refresh-token rotation, Socket.io real-time events, and WebRTC media lifecycle management.

---

## Table of Contents

- [Why This System Exists](#why-this-system-exists)
- [Account Provisioning & Auto-Seed](#account-provisioning--auto-seed)
- [Role Capabilities](#role-capabilities)
- [Project Proposal Lifecycle](#project-proposal-lifecycle)
- [Supervisor Assignment Flow](#supervisor-assignment-flow)
- [Connection Requests](#connection-requests)
- [Chat, Calls & Meetings](#chat-calls--meetings)
- [Authentication & Refresh Tokens](#authentication--refresh-tokens)
- [Server Bootstrap & Reliability](#server-bootstrap--reliability)
- [Technology Stack](#technology-stack)
- [Project Structure & Documentation Index](#project-structure--documentation-index)
- [Quick Start](#quick-start)
- [Default Credentials](#default-credentials)

---

## Why This System Exists

Academic institutions need a controlled environment where:

- Only administrators provision student and faculty accounts (no open self-registration).
- Each student maintains exactly one active project at a time, with full historical audit of past proposals.
- Faculty capacity limits are enforced atomically when multiple students request the same supervisor, avoiding race conditions.
- Supervision, milestones, and deliverables follow a governed state machine instead of ad-hoc file sharing over email or chat apps.
- Students and faculty can collaborate in real time — chat, calls, group meetings — without leaving the platform.
This project pairs **academic governance** (proposal review, supervision, milestones) with **real-time collaboration** (chat/calls/meetings) in one deployable system, rather than treating them as separate tools.

---

## Account Provisioning & Auto-Seed

### Public registration is disabled

Students and teachers **cannot** create their own accounts.

| Action | Who can do it |
|--------|---------------|
| Create Student account | Admin only (`POST /api/v1/admin/create-student`) |
| Create Teacher account | Admin only (`POST /api/v1/admin/create-teacher`) |
| Self-register as Student/Teacher | Blocked (403) |
| Self-register as Admin | Allowed via `POST /api/v1/auth/register` (bootstrap path) |

The frontend [`Register`](./client/src/pages/Register.jsx) page displays a restriction notice—there is no registration form for students or teachers.

### Per-role auto-seed on first boot

When the server connects to MongoDB, [`server/config/seed.js`](./server/config/seed.js) runs automatically. For **each role with zero active users**, one default account is created:

| Role | Email | Password | Department |
|------|-------|----------|------------|
| Admin | `admin@university.edu` | `admin123456` | Administration |
| Teacher | `teacher@university.edu` | `teacher123456` | Computer Science |
| Student | `student@university.edu` | `student123456` | Computer Science |

This means a completely empty database gets three ready-to-use demo accounts—one per role—without manual seed commands.

---

## Role Capabilities

### Student

| Capability | Route / Endpoint |
|------------|------------------|
| Submit and edit project proposal (draft/rejected only) | `/student/proposal` |
| View proposal history (completed/rejected are read-only) | `/student/proposal` |
| Browse teachers and request supervisor (approved proposals only) | `/student/supervisors` |
| Upload milestone files (requires assigned supervisor) | `/student/documents` |
| Submit milestone work | API: `POST /student/milestones/:id/submit` |
| View teacher feedback | `/student/feedback` |
| Send/receive connection requests | `/connections` |
| Real-time chat with connected users | `/chat` |
| Join group meetings, receive 1-on-1 calls | `/meetings` |
| View academic deadlines | Dashboard + notifications |

### Teacher

| Capability | Route / Endpoint |
|------------|------------------|
| Review and approve/reject student proposals | `/teacher/proposals` |
| Accept or decline supervisor requests (capacity-guarded) | `/teacher/requests` |
| View and manage assigned students | `/teacher/students` |
| Grade milestones and add structured feedback | `/teacher/milestones` |
| Drop supervision of a student | API: `POST /teacher/students/:id/drop` |
| Create academic deadlines | API: `POST /deadlines` |
| Host group video meetings | `/meetings` |
| Connections, chat, and 1-on-1 calls | `/connections`, `/chat` |

### Admin

| Capability | Route / Endpoint |
|------------|------------------|
| Create, update, soft-delete students and teachers | `/admin/users` |
| Toggle user status (active / suspended / archived) | `/admin/users` |
| View all platform projects | `/admin/projects` |
| Override proposal review decisions | `/admin/projects` |
| Manually assign supervisor to a project | API: `POST /admin/assign-supervisor` |
| Platform metrics dashboard | `/admin/dashboard` |
| All teacher capabilities (deadlines, meetings) | Shared routes |

---

## Project Proposal Lifecycle

### Status state machine

```
[draft] --submit--> [submitted] --review--> [approved] --supervisor assigned--> [assigned] --all milestones approved--> [completed]
                         |                        |
                         +--review--> [rejected] (historical, editable -> resubmit)
```

| Status | Meaning |
|--------|---------|
| `draft` | Student is editing; not yet submitted for review |
| `submitted` | Awaiting teacher/admin review |
| `approved` | Proposal accepted; student may request a supervisor |
| `rejected` | Returned with feedback; student may edit and resubmit |
| `assigned` | Supervisor linked to project |
| `completed` | All milestones approved; project closed |

### Key business rules

1. **One active project per student** — enforced by a unique partial MongoDB index on `{ student: 1 }` where `isDeleted: false`.
2. **Edit lock** — only `draft` or `rejected` proposals can be modified.
3. **New proposal gate** — allowed only when no active project exists or the previous project is `completed`.
4. **Supervisor request gate** — requires project status `approved` (or `assigned`).
5. **File/milestone uploads** — blocked until a supervisor is assigned on the student account.
6. **Completion** — when every milestone is `approved`, project status transitions to `completed`.

### Who does what

| Step | Actor | Action |
|------|-------|--------|
| 1. Create proposal | Student | Writes title, description, milestones; saves as draft or submits |
| 2. Review proposal | Teacher or Admin | Approves or rejects with remarks |
| 3. Request supervisor | Student | Sends request to a teacher (approved project only) |
| 4. Accept supervision | Teacher | Accepts if under `maxStudents` capacity (atomic DB lock) |
| 5. Submit milestones | Student | Uploads deliverables per milestone |
| 6. Grade milestones | Teacher | Approves/rejects each milestone with feedback |
| 7. Override (optional) | Admin | Can change review status or manually assign supervisor |

---

## Supervisor Assignment Flow

```
Student (approved project)
    │
    ▼
POST /student/supervisor-request  ──>  SupervisorRequest (pending)
    │
    ▼
Teacher reviews at /teacher/requests
    │
    ├── Accept ──> Atomic $addToSet on teacher.assignedStudents
    │              Sets student.supervisor + project.supervisor
    │
    └── Reject ──> Request marked rejected; student may request another teacher
```

Capacity is enforced in [`server/services/teacherService.js`](./server/services/teacherService.js) using a single atomic `findOneAndUpdate`—no read-then-write race condition.

---

## Connection Requests

Social graph between any authenticated users (all roles).

```
Explore users ──> Send request ──> Recipient accepts/rejects/blocks
                                         │
                    Accepted ────────────┴──> Appears in chat friends list
                    Rejected ──────────────> 10-day cooldown before re-request
                    Blocked ───────────────> Hidden from explore; no new requests
```

| Endpoint | Purpose |
|----------|---------|
| `GET /connections/explore` | Discover users (excludes connected, pending, blocked) |
| `POST /connections/request` | Send connection request |
| `PUT /connections/respond/:id` | Accept, reject, or block |
| `GET /connections/pending` | Incoming and outgoing pending requests |
| `DELETE /connections/remove/:targetUserId` | Remove existing connection |

**Chat prerequisite:** only `accepted` connections appear in the chat friends list.

Details: [server/controllers/README.md](./server/controllers/README.md) · [server/models/README.md](./server/models/README.md)

---

## Chat, Calls & Meetings

Both real-time channels are wired into the process at boot via a shared Socket.io instance — see [`server/README.md`](./server/README.md) for exactly how `server.js` initializes them.

### 1-on-1 messaging (`/chat`)

- REST for history, pagination, reactions, clear chat
- Socket.io for real-time delivery, read receipts, emoji reactions
- Offline messages persisted in MongoDB with unread badges on reconnect

### 1-on-1 WebRTC calls

- Signaling via Socket.io (`initiate_call`, `answer_call`, `ice_candidate`, `end_call`)
- Missed/declined calls logged in chat and `CallHistory`
- Media tracks explicitly stopped on hang-up to release camera/microphone hardware

### Group meetings (`/meetings`)

- Teachers and admins create meetings and invite users
- WebRTC mesh with host controls: mute, remove participant, end for all
- In-meeting text chat via Socket.io

Details: [server/sockets/README.md](./server/sockets/README.md) · [client/src/pages/README.md](./client/src/pages/README.md)

---

## Authentication & Refresh Tokens

### Token pair architecture

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | httpOnly cookie + in-memory on client | Authorize API requests |
| Refresh Token | 7 days | httpOnly cookie (path-scoped) | Renew access token without re-login |

### Why two tokens?

- **Short access token** — limits damage if intercepted; kept in memory on the client.
- **Long refresh token** — stored in `httpOnly`, `SameSite=Strict` cookie; JavaScript cannot read it (XSS-resistant).
- **No session DB lookup on every request** — unlike server-side sessions, JWT access tokens are verified statelessly.

### Refresh token rotation

1. Client receives HTTP 401 (expired access token).
2. Axios interceptor calls `POST /api/v1/auth/refresh-token` with the refresh cookie.
3. Server verifies JWT, looks up SHA-256 hash in `RefreshToken` collection.
4. Old refresh token is **revoked**; new pair is issued (rotation).
5. If a revoked token is reused → **all user sessions revoked** (reuse detection).

Implementation: [`client/src/api/axios.js`](./client/src/api/axios.js) · [`server/utils/generateToken.js`](./server/utils/generateToken.js)

### Login requirements

Login requires **email + password + role**. The role must match the stored user record—preventing a student from logging in through the teacher portal even with valid credentials.

---

## Server Bootstrap & Reliability
 
`server.js` is the single process entry point. On startup it:
 
1. Connects to MongoDB (`connectDB()`) before anything else — the server never starts listening against a broken DB connection.
2. Wraps the shared `app` (Express) in a raw `http.Server` so the same server can carry both REST traffic and Socket.io.
3. Attaches Socket.io with CORS restricted to known local dev origins and `credentials: true` (required for the httpOnly cookie auth flow to work over WebSocket handshakes).
4. Initializes chat and call socket namespaces (`initializeChatSockets`, `initializeCallSockets`) against the same `io` instance.
5. Starts listening on `process.env.PORT` (defaults to `3000`).
Process-level safety nets:
 
- `uncaughtException` is logged and the process exits immediately (`exit(1)`) — a synchronous error in application code is treated as unrecoverable rather than left to corrupt state.
- `unhandledRejection` is logged; if the HTTP server is already listening, it is closed gracefully before the process exits, so in-flight requests aren't dropped mid-response.
See [`server/README.md`](./server/README.md) for the full breakdown and current gaps (e.g. no `SIGTERM`/`SIGINT` handler yet, CORS origin list is hardcoded rather than env-driven).
 
---

## Technology Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 19 + Vite 8 | Fast HMR, modern component model |
| Routing | React Router 7 | Declarative role-based route guards |
| Styling | Tailwind CSS 4 | Utility-first responsive UI |
| HTTP | Axios | Interceptors for silent token refresh |
| Real-time | Socket.io Client 4 | Chat, call signaling, meetings |
| Backend | Express 5 + Node.js | REST API + middleware pipeline |
| Database | MongoDB + Mongoose 9 | Document store, indexes, atomic updates |
| Auth | jsonwebtoken + bcrypt | JWT pair + password hashing |
| Files | Multer + Cloudinary | Upload pipeline + persistent cloud storage |
| Email | Nodemailer | Password reset flow |
| Security | Helmet, mongo-sanitize, rate-limit | Headers, injection defense, abuse throttling |

Full dependency breakdown: [client/README.md](./client/README.md) · [server/README.md](./server/README.md)

---

## Project Structure & Documentation Index

All documentation links use **relative paths** so they resolve correctly on GitHub, GitLab, and local clones.

```
project-management-system/
├── README.md                          ← You are here
│
├── client/                            Frontend (React + Vite)
│   ├── README.md
│   └── src/
│       ├── README.md
│       ├── api/README.md
│       ├── components/README.md
│       ├── context/README.md
│       └── pages/README.md
│
└── server/                            Backend (Express + Socket.io)
    ├── README.md
    ├── config/README.md
    ├── models/README.md
    ├── controllers/README.md
    ├── services/README.md
    ├── middlewares/README.md
    ├── router/README.md
    ├── sockets/README.md
    ├── validations/README.md
    ├── utils/README.md
    └── tests/README.md
```

### Quick navigation

| Document | Description |
|----------|-------------|
| [client/README.md](./client/README.md) | Frontend architecture, dev setup, page registry |
| [server/README.md](./server/README.md) | Backend layers, full API tables, Socket events |
| [server/models/README.md](./server/models/README.md) | All Mongoose schemas and relationships |
| [server/controllers/README.md](./server/controllers/README.md) | HTTP handler responsibilities |
| [server/services/README.md](./server/services/README.md) | Business logic and atomic operations |
| [server/middlewares/README.md](./server/middlewares/README.md) | Auth, upload, error pipeline |
| [server/router/README.md](./server/router/README.md) | Route mounting and RBAC per route |
| [server/sockets/README.md](./server/sockets/README.md) | Real-time event catalog |
| [server/config/README.md](./server/config/README.md) | DB connection, seed, Cloudinary |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd server
cp .env.example .env    # Set MONGO_URI, JWT secrets, optional Cloudinary keys
npm install
npm test                # Run auth tests
npm run dev             # http://localhost:3000
```

### Frontend

```bash
cd client
cp .env.example .env    # Set VITE_API_URL if needed
npm install
npm run dev             # http://localhost:5173 (proxies /api to :3000)
```

---

## Default Credentials

Auto-seeded on first boot (when no user exists for that role):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `admin123456` |
| Teacher | `teacher@university.edu` | `teacher123456` |
| Student | `student@university.edu` | `student123456` |

Change these passwords before any production deployment.
