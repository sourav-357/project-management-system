# Academic FYP Governance & Real-Time Collaboration Platform

A production-grade, full-stack monorepo system engineered to govern university Final Year Project (FYP) lifecycles, faculty supervision capacities, proposal evaluations, document repositories, and real-time collaboration tools.

Built with **Node.js (Express 5), MongoDB (Mongoose 9), React 19, Tailwind CSS 4, Socket.io 4, and WebRTC**, this platform merges academic administration with high-concurrency real-time tools into a single deployable architecture.

---

## Table of Contents

- [1. Executive Summary & Domain Problem Context](#1-executive-summary--domain-problem-context)
- [2. Deep Dive: Architectural Decisions & Engineering Rationale ("Why Behind Decisions")](#2-deep-dive-architectural-decisions--technical-rationale-why-behind-decisions)
  - [2.1 Why Monorepo with Express 5 & React 19?](#21-why-monorepo-with-express-5--react-19)
  - [2.2 Why MongoDB & Mongoose 9 over Relational SQL Databases?](#22-why-mongodb--mongoose-9-over-relational-sql-databases)
  - [2.3 Why Administrative Account Provisioning (Blocking Public Self-Registration)?](#23-why-administrative-account-provisioning-blocking-public-self-registration)
  - [2.4 Why Dual-JWT Authentication with In-Memory Access Tokens & `httpOnly` Refresh Cookies?](#24-why-dual-jwt-authentication-with-in-memory-access-tokens--httponly-refresh-cookies)
  - [2.5 Why SHA-256 Refresh Token Hashing, Token Rotation & Reuse Detection?](#25-why-sha-256-refresh-token-hashing-token-rotation--reuse-detection)
  - [2.6 Why Atomic Database Operations (`$addToSet`, `findOneAndUpdate`) for Faculty Capacity?](#26-why-atomic-database-operations-addtoset-findoneandupdate-for-faculty-capacity)
  - [2.7 Why Database-Enforced Partial Unique Indexing for Single Active Project Invariant?](#27-why-database-enforced-partial-unique-indexing-for-single-active-project-invariant)
  - [2.8 Why Project Completion Unlinking & Immutable Read-Only Archiving?](#28-why-project-completion-unlinking--immutable-read-only-archiving)
  - [2.9 Why Hybrid HTTP/Socket.io Single Process Architecture?](#29-why-hybrid-httpsocketio-single-process-architecture)
  - [2.10 Why WebRTC Peer Mesh for Video Calls & Group Meetings?](#210-why-webrtc-peer-mesh-for-video-calls--group-meetings)
- [3. End-to-End System Architecture & Layer Diagram](#3-end-to-end-system-architecture--layer-diagram)
- [4. Complete Proposal & Completion State Machine](#4-complete-proposal--completion-state-machine)
- [5. Exhaustive Feature Catalog](#5-exhaustive-feature-catalog)
  - [5.1 Student Workspace & Proposal Builder](#51-student-workspace--proposal-builder)
  - [5.2 Faculty / Teacher Supervision Portal](#52-faculty--teacher-supervision-portal)
  - [5.3 Administrator Governance Panel](#53-administrator-governance-panel)
  - [5.4 Peer Connections Graph & Discovery Network](#54-peer-connections-graph--discovery-network)
  - [5.5 Socket.io Direct Messaging & WebRTC Video Conferencing](#55-socketio-direct-messaging--webrtc-video-conferencing)
- [6. Complete Database Models, Schemas & Index Strategy](#6-complete-database-models-schemas--index-strategy)
- [7. Complete REST API Endpoint Directory](#7-complete-rest-api-endpoint-directory)
- [8. Real-Time Socket.io Event Catalog](#8-real-time-socketio-event-catalog)
- [9. Security Pipeline & Middleware Execution Order](#9-security-pipeline--middleware-execution-order)
- [10. Quick Start, Environment Setup & Auto-Seeding Guide](#10-quick-start-environment-setup--auto-seeding-guide)
- [11. Comprehensive Project Directory Index](#11-comprehensive-project-directory-index)

---

## 1. Executive Summary & Domain Problem Context

In higher education institutions, Final Year Projects (FYP) represent the capstone evaluation for graduating students. Traditional management of FYPs suffers from critical structural problems:

1. **Unvetted Account Registrations**: Standard open registration allows unauthorized users, duplicate accounts, or incorrect role selection (e.g. students registering as teachers).
2. **Race Conditions in Faculty Selection**: When multiple students apply for popular faculty supervisors simultaneously, manual processing leads to over-allocation beyond faculty capacity quotas.
3. **Loss of Audit Trail & State Drift**: Document submissions, evaluations, and supervisor assignments scattered across emails, WhatsApp, and Google Drive lead to lost records and state drift.
4. **Post-Completion Deadlocks**: Students who finish an initial project are often locked in legacy software without a clean mechanism to initiate a new project under a new supervisor.

This platform resolves these challenges by introducing a **governed state machine**, **atomic database operations**, **role-restricted access controls**, and an **integrated real-time communication suite**.

---

## 2. Deep Dive: Architectural Decisions & Technical Rationale ("Why Behind Decisions")

### 2.1 Why Monorepo with Express 5 & React 19?

- **Unified Single Repository Structure**: Housing the client (`/client`) and server (`/server`) in a single monorepo simplifies version control, environment variable coordination, and simultaneous deployments.
- **Express 5 Framework Rationale**:
  - **Native Async Error Handling**: In Express 4, asynchronous errors inside async route handlers required explicit `try/catch` blocks or third-party wrapper libraries (like `express-async-handler`) to forward errors to `next(err)`. Express 5 natively catches rejected promises in middleware and route handlers, automatically invoking centralized error middleware without boilerplate wrapper code.
  - **Updated Query Parsing & Route Matching**: Express 5 improves security around query string parsing and updates path matching rules to prevent parameter pollution exploits.
- **React 19 + Vite 8 Rationale**:
  - **Fast Module Replacement (HMR)**: Vite 8 leverages Esbuild for ultra-fast development startup times and hot reloading compared to legacy Webpack setups.
  - **Modern Component & State Architecture**: Built using React 19 functional components, hooks (`useState`, `useEffect`, `useContext`, `useCallback`), and React Context (`AuthContext`) for centralized session and theme state.

---

### 2.2 Why MongoDB & Mongoose 9 over Relational SQL Databases?

- **Document Model Flexibility**:
  - Academic projects contain dynamic arrays such as uploaded file metadata (`files`), reviewer feedback remarks (`feedback`), and message emoji reactions (`reactions`). Storing these as embedded sub-documents in MongoDB avoids complex multi-table SQL `JOIN` operations on every read.
- **Mongoose 9 ODM Protection**:
  - Compiles strict schema validation models over MongoDB's schemaless collections.
  - Enforces type casting, string trimming, min/max length checks, email format validation, pre-save hooks (e.g., automatic password hashing), and custom instance methods.
- **Atomic MongoDB Array & Conditional Operations**:
  - Features like `$addToSet`, `$pull`, `$expr`, and `$nin` allow atomic array updates and conditional checks directly within MongoDB write locks, avoiding multi-row locking overhead.

---

### 2.3 Why Administrative Account Provisioning (Blocking Public Self-Registration)?

- **Architectural Decision**: Public self-registration (`POST /auth/register`) is restricted exclusively to initial Admin bootstrap account creation. Students and Teachers **cannot** create accounts independently. Account creation is managed by Admins via `/admin/create-student` and `/admin/create-teacher`.
- **Engineering Rationale**:
  - **Academic Identity Verification**: Universities require strict identity validation. Unrestricted self-registration allows unauthorized users to create fake student profiles or self-register as faculty members to approve their own project proposals.
  - **Privilege Escalation Prevention**: Prevents malicious clients from sending request payloads containing `role: 'Teacher'` or `role: 'Admin'` during registration.

---

### 2.4 Why Dual-JWT Authentication with In-Memory Access Tokens & `httpOnly` Refresh Cookies?

- **Architectural Decision**: Authenticated sessions issue two tokens:
  1. **Access Token**: Short-lived (15 minutes), kept strictly in client JavaScript memory (`AuthContext`).
  2. **Refresh Token**: Long-lived (7 days), delivered in an `httpOnly`, `SameSite=Strict`, path-scoped cookie.
- **Engineering Rationale**:
  - **XSS Defense**: Storing access tokens in browser `localStorage` or `sessionStorage` leaves applications vulnerable to token theft via Cross-Site Scripting (XSS). Keeping the access token in memory means client scripts cannot extract tokens from storage.
  - **CSRF Defense**: Setting `SameSite=Strict` on the `httpOnly` refresh cookie prevents Cross-Site Request Forgery (CSRF) attacks, as third-party domains cannot include the cookie in cross-origin requests.
  - **Stateless Verification**: The Access Token is cryptographically signed using `JWT_ACCESS_SECRET`. API routes verify token authenticity statelessly without querying the database on every HTTP request.

---

### 2.5 Why SHA-256 Refresh Token Hashing, Token Rotation & Reuse Detection?

- **Architectural Decision**:
  - Raw refresh token strings are never saved in MongoDB. Only SHA-256 cryptographic hashes are stored in the `RefreshToken` collection.
  - Upon calling `/auth/refresh-token`, the server revokes the old token hash and issues a brand-new access/refresh token pair (Token Rotation).
  - If a revoked token hash is presented (indicative of a malicious token replay attack), the system triggers **Automatic Reuse Detection** and revokes **all active sessions** for that user account.
- **Engineering Rationale**:
  - **Database Leak Protection**: If the database is compromised, an attacker possessing the database backup cannot obtain valid refresh token strings because only one-way SHA-256 hashes are stored.
  - **Stolen Token Containment**: Token rotation ensures a stolen refresh token is rendered useless as soon as the legitimate user refreshes their token pair. Automatic reuse detection instantly invalidates the attacker's access if a stolen token is replayed.

---

### 2.6 Why Atomic Database Operations (`$addToSet`, `findOneAndUpdate`) for Faculty Capacity?

- **Architectural Decision**: Faculty supervision applications are processed using atomic conditional database writes:
  ```javascript
  // server/services/teacherService.js
  const teacher = await User.findOneAndUpdate(
    {
      _id: teacherId,
      role: 'Teacher',
      $expr: { $lt: [{ $size: '$assignedStudents' }, '$maxStudents'] }
    },
    { $addToSet: { assignedStudents: studentId } },
    { new: true }
  );

  if (!teacher) {
    throw new ErrorHandler('Faculty supervisor has reached maximum student capacity', 400);
  }
  ```
- **Engineering Rationale**:
  - **Race Condition Elimination**: A standard check-then-write pattern (`if (teacher.assignedStudents.length < limit) await update(...)`) creates a race condition window. If 10 students submit applications simultaneously, all 10 checks pass before any write completes, exceeding the faculty quota (`maxStudents`).
  - **Atomic Concurrency Guarantee**: The `$expr` condition evaluates `$size: '$assignedStudents' < '$maxStudents'` inside MongoDB's write lock, guaranteeing that capacity limits are never breached regardless of concurrency levels.

---

### 2.7 Why Database-Enforced Partial Unique Indexing for Single Active Project Invariant?

- **Architectural Decision**: Single active project enforcement is guaranteed at the database engine layer:
  ```javascript
  // server/models/project.js
  projectSchema.index(
    { student: 1 },
    { 
      unique: true, 
      partialFilterExpression: { 
        isDeleted: false, 
        status: { $nin: ['completed', 'rejected'] } 
      } 
    }
  );
  ```
- **Engineering Rationale**:
  - **Application Code Flaw Protection**: Application-level checks (`if (existingProject) return error`) can fail under race conditions or bugs. A unique index guarantees that MongoDB itself will reject duplicate active projects.
  - **Multi-Project Lifecycle Support**: Using a `partialFilterExpression` excluding `'completed'` and `'rejected'` statuses ensures that completed historic projects do not block students from submitting a new proposal.

---

### 2.8 Why Project Completion Unlinking & Immutable Read-Only Archiving?

- **Architectural Decision**: When a faculty supervisor marks a project as `'completed'`:
  1. `project.status` is set to `'completed'`.
  2. The student's active `supervisor` and `project` references are set to `null`.
  3. The student is pulled from the teacher's `assignedStudents` list (`$pull`).
  4. Project details, files, and remarks are locked as a read-only historical record.
- **Engineering Rationale**:
  - **Automated Capacity Recycling**: Automatically frees up the faculty member's supervision capacity as soon as a project is finished.
  - **Clean Student State Reset**: Restores the student account to clean state (`supervisor: null`, `project: null`), allowing them to immediately submit a new proposal and choose a new supervisor.
  - **Permanent Audit Record**: Preserves the completed project artifacts in history for academic audits.

---

### 2.9 Why Hybrid HTTP/Socket.io Single Process Architecture?

- **Architectural Decision**: Express and Socket.io run within a single Node `http.Server` instance bound to port `3000`.
- **Engineering Rationale**:
  - **Port & Origin Alignment**: Avoids complex cross-origin issues between separate REST and WebSocket servers.
  - **Shared Cookie Authentication**: Handshake requests for WebSockets automatically include the `httpOnly` authentication cookies, simplifying user authentication over WebSockets.
  - **Simplified Deployment**: Reduces operational complexity by containerizing and deploying a single backend process.

---

### 2.10 Why WebRTC Peer Mesh for Video Calls & Group Meetings?

- **Architectural Decision**: Video calling uses direct WebRTC peer connections signaled via Socket.io events.
- **Engineering Rationale**:
  - **Low Latency & High Performance**: Media streams travel directly peer-to-peer (P2P), reducing server bandwidth cost and latency.
  - **Built-in Host Controls**: Hosts can mute participants or terminate conference rooms via WebSocket signaling.

---

## 3. End-to-End System Architecture & Layer Diagram

```
                               ┌────────────────────────────────────────┐
                               │           React 19 Frontend            │
                               │   Vite + Tailwind CSS + Lucide Icons   │
                               └───────────────────┬────────────────────┘
                                                   │ (REST + WebSockets)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Express 5 API Server                                       │
│                                                                                                  │
│  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │ Security Pipeline        │   │ Controller Tier          │   │ Real-Time Engine             │  │
│  │ Helmet, MongoSanitize,   │──>│ Request validation,      │──>│ Socket.io Event Handlers &   │  │
│  │ CORS, Rate Limiting      │   │ HTTP response formatting │   │ WebRTC Mesh Signaling        │  │
│  └──────────────────────────┘   └─────────────┬────────────┘   └──────────────────────────────┘  │
│                                               │                                                  │
│                                               ▼                                                  │
│                                 ┌──────────────────────────┐                                     │
│                                 │ Business Services        │                                     │
│                                 │ Atomic logic & workflows │                                     │
│                                 └─────────────┬────────────┘                                     │
└───────────────────────────────────────────────┼──────────────────────────────────────────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────────────┐
                               │         MongoDB Document Store         │
                               │   Mongoose 9 Models & Compound Indexes │
                               └────────────────────────────────────────┘
```

---

## 4. Complete Proposal & Completion State Machine

```
  [ Draft ] ──────► [ Pending ] ──────► [ Approved ] ──────► [ Completed ] (Read-Only Archive)
                          │                   │                     ▲
                          │                   ▼                     │
                          └───────────► [ Rejected ]          Supervision Released
                                              │               Student Free to Start
                                              ▼               New Project Proposal
                                     (Editable & Resubmit)
```

1. **Draft**: Student writes proposal title and abstract.
2. **Pending / Submitted**: Awaiting faculty evaluation; proposal locked against student editing.
3. **Approved**: Accepted by faculty; unlocks supervisor selection directory for the student.
4. **Rejected**: Rejected with faculty remarks; allows student to edit and resubmit.
5. **Assigned**: Supervision request accepted by a teacher; student and supervisor linked.
6. **Completed**: Project finalized by teacher; supervision capacity released; project locked read-only.

---

## 5. Exhaustive Feature Catalog

### 5.1 Student Workspace & Proposal Builder
- **Governance Tracker**: 4-stage visual progress bar (0% to 100%).
- **Proposal Workspace**: Document editor with edit locks on active proposals.
- **Supervisor Selector**: Directory of available teachers with expertise tags and live capacity gauges.
- **Document Repository**: Support for PDF, DOCX, and ZIP deliverables.
- **Completed Projects Archive**: Historical drawer displaying completed project records.

### 5.2 Faculty / Teacher Supervision Portal
- **Capacity Meter**: Visual progress bar (`assignedStudents.length / maxStudents`).
- **Proposal Evaluation Desk**: Filterable workspace (All, Pending, Approved, Completed) with evaluation remarks drawer.
- **Supervision Requests Inbox**: Student applications inbox with custom notes.
- **Mark as Completed Action**: Finalizes project, releases capacity, and locks records.
- **Supervisee Directory**: Student table with direct chat and supervision release (`drop`) actions.

### 5.3 Administrator Governance Panel
- **Account Provisioning**: Dedicated creator forms for Students and Teachers.
- **Paginated User Directory**: Account search table with status controls (`active`, `suspended`, `archived`).
- **Global Project Board**: Platform-wide project oversight and administrative review overrides.
- **Platform Analytics**: Real-time metrics on users, proposals, and approval ratios.

### 5.4 Peer Connections Graph & Discovery Network
- **Explore Network**: Discover users excluding existing connections, pending requests, and blocked accounts.
- **Connection Graph**: Send, accept, decline, or block peer requests (enforces a 10-day cooldown on rejections).

### 5.5 Socket.io Direct Messaging & WebRTC Video Conferencing
- **1-on-1 Direct Messaging**: Socket.io real-time chat with delivery read receipts and emoji reactions.
- **1-on-1 WebRTC Calls**: Direct WebRTC audio/video calls with media track cleanup on hangup.
- **Instant Video Meetings**: Group video conference rooms with active call controls and host termination features.

---

## 6. Complete Database Models, Schemas & Index Strategy

### `User` Model (`server/models/user.js`)
- **Fields**: `name`, `email`, `password` (bcrypt hashed), `role` (`Student`/`Teacher`/`Admin`), `department`, `avatar`, `status` (`active`/`suspended`/`archived`), `assignedStudents` (Array of ObjectIds), `supervisor` (ObjectId), `project` (ObjectId), `maxStudents` (Number, default: 5).
- **Hooks & Methods**: Pre-save hook executing bcrypt hashing (10 salt rounds) when modified. `comparePassword(candidatePassword)` instance method.
- **Indexes**: Unique `{ email: 1 }`, Compound `{ role: 1, status: 1 }`.

### `Project` Model (`server/models/project.js`)
- **Fields**: `title`, `description`, `student` (ObjectId), `supervisor` (ObjectId), `status` (`draft`/`pending`/`submitted`/`approved`/`rejected`/`assigned`/`completed`), `isDraft`, `isDeleted`, `files` Array, `feedback` Array.
- **Indexes**:
  - Partial unique index on `{ student: 1 }` for non-deleted, active non-completed proposals.
  - Compound index on `{ supervisor: 1, status: 1, isDeleted: 1 }`.

### `Connection` Model (`server/models/connection.js`)
- **Fields**: `requester` (ObjectId), `recipient` (ObjectId), `status` (`pending`/`accepted`/`rejected`/`blocked`), `cooldownUntil` (Date).
- **Indexes**: Compound `{ requester: 1, recipient: 1 }`.

### `Meeting` Model (`server/models/meeting.js`)
- **Fields**: `title`, `description`, `host` (ObjectId), `invitedUsers` (Array of ObjectIds), `status` (`scheduled`/`active`/`ended`), `startedAt`, `endedAt`.
- **Indexes**: `{ host: 1, status: 1 }`.

### `Message` Model (`server/models/message.js`)
- **Fields**: `sender` (ObjectId), `recipient` (ObjectId), `content`, `isRead` (Boolean, default: false), `reactions` Array.
- **Indexes**: Compound `{ sender: 1, recipient: 1, createdAt: -1 }`.

### `RefreshToken` Model (`server/models/refreshToken.js`)
- **Fields**: `user` (ObjectId), `tokenHash` (SHA-256 string), `expiresAt` (Date), `isRevoked` (Boolean, default: false).
- **Indexes**: Unique `{ tokenHash: 1 }`, TTL Index on `{ expiresAt: 1 }`.

---

## 7. Complete REST API Endpoint Directory

Base Prefix: `/api/v1`

### 1. Authentication Router (`/auth`)
- `POST /auth/login` - Authenticate user credentials & role
- `POST /auth/register` - Initial Admin bootstrap registration
- `POST /auth/refresh-token` - Rotate access & refresh token pair
- `GET /auth/me` - Fetch authenticated user profile
- `POST /auth/logout` - Revoke current user session
- `POST /auth/logout-all` - Revoke all active sessions across devices
- `PUT /auth/password/change` - Change password
- `PUT /auth/profile/avatar` - Upload profile avatar image

### 2. Admin Governance Router (`/admin`)
- `POST /admin/create-student` - Provision new Student account
- `POST /admin/create-teacher` - Provision new Teacher account
- `GET /admin/getAllUsers` - Paginated user directory with search & role filters
- `PUT /admin/update-student/:id` - Update student profile
- `PUT /admin/update-teacher/:id` - Update teacher profile
- `DELETE /admin/delete-student/:id` - Soft-delete student account
- `DELETE /admin/delete-teacher/:id` - Soft-delete teacher account
- `PUT /admin/users/:id/status` - Toggle user status (`active`/`suspended`/`archived`)
- `GET /admin/projects` - Overview of all platform projects
- `PUT /admin/projects/:projectId/review` - Review or override proposal status
- `POST /admin/assign-supervisor` - Manually assign supervisor to project
- `GET /admin/dashboard-stats` - Aggregate platform analytics metrics

### 3. Student Services Router (`/student`)
- `GET /student/project` - Active project & proposal history
- `POST /student/project-proposal` - Submit new proposal or save draft
- `GET /student/fetch-supervisors` - Browse available faculty with capacity details
- `POST /student/supervisor-request` - Request supervisor for approved project
- `POST /student/upload/:projectId` - Upload project deliverables
- `GET /student/fetch-dashboard-stats` - Student dashboard metrics

### 4. Teacher / Faculty Router (`/teacher`)
- `GET /teacher/proposals` - List supervised project proposals
- `PUT /teacher/projects/:projectId/review` - Approve or reject proposal
- `PUT /teacher/projects/:projectId/complete` - Mark project Completed (releases capacity)
- `GET /teacher/requests` - List incoming supervision applications
- `POST /teacher/requests/:requestId/respond` - Accept or decline supervision request
- `GET /teacher/students` - List active supervisees
- `POST /teacher/students/:studentId/drop` - Release supervision of a student

### 5. Peer Networking Router (`/connections`)
- `GET /connections/my-connections` - List active peer connections
- `GET /connections/explore` - Discover users eligible for connection
- `POST /connections/request` - Send connection request
- `PUT /connections/respond/:connectionId` - Accept, decline, or block connection request
- `GET /connections/pending` - List incoming & outgoing requests
- `DELETE /connections/remove/:targetUserId` - Remove connection
- `GET /connections/history` - Connection log history
- `GET /connections/blocked` - Blocked user directory
- `PUT /connections/unblock/:targetUserId` - Unblock user account

### 6. Direct Messaging Router (`/chat`)
- `GET /chat/friends` - Connected friends with unread message badges
- `GET /chat/messages/:partnerId` - Fetch message history & mark as read
- `DELETE /chat/clear-chat/:partnerId` - Clear conversation history
- `POST /chat/messages/:messageId/react` - Toggle emoji reaction on message

### 7. Instant Meetings Router (`/meetings`)
- `GET /meetings/available-invitees` - List users available for meeting invitation
- `GET /meetings` - Fetch active meetings for current user
- `POST /meetings` - Create instant video meeting room
- `GET /meetings/:meetingId` - Fetch meeting room details
- `PUT /meetings/:meetingId/end` - End active meeting room
- `DELETE /meetings/:meetingId` - Delete meeting room

---

## 8. Real-Time Socket.io Event Catalog

### Direct Messaging Events (`chatSocket.js`)
- `send_message`: Delivers message to online recipient socket; saves message to MongoDB if recipient is offline.
- `mark_read`: Emits real-time read status updates (`isRead: true`) to message senders.
- `toggle_reaction`: Broadcasts emoji reaction changes to both participants.

### WebRTC Call & Meeting Events (`callSocket.js`)
- **1-on-1 WebRTC Calls**: `initiate_call`, `answer_call`, `ice_candidate`, `end_call`.
- **Group Video Conferences**: `join_meeting_room`, `sending_signal`, `receiving_signal`, `meeting_ended_by_host`.

---

## 9. Security Pipeline & Middleware Execution Order

Execution order configured in `server/app.js`:

1. **Helmet** (`helmet()`): Sets HTTP response headers (`X-DNS-Prefetch-Control`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
2. **MongoSanitize** (`express-mongo-sanitize()`): Sanitizes request body, params, and headers to neutralize NoSQL operator injection attacks (`$gt`, `$where`).
3. **Compression** (`compression()`): Compresses HTTP response bodies via gzip.
4. **Cookie Parser** (`cookie-parser()`): Parses incoming `httpOnly` cookies.
5. **Rate Limiting** (`express-rate-limit`): Limits requests (2,000 requests per 15 minutes per IP) to prevent denial of service (DoS).
6. **CORS Policy**: Restricts HTTP/WebSocket origins to configured client URLs (`CLIENT_URL`) with `credentials: true`.
7. **Authentication Guard** (`isAuthenticated`): Extracts and verifies Access Token from cookie or Authorization header.
8. **RBAC Role Guard** (`isAuthorized(...roles)`): Verifies user role against required route permissions.
9. **Centralized Error Middleware** (`errorMiddleware`): Intercepts unhandled errors, formats uniform JSON responses, and logs stack trace.

---

## 10. Quick Start, Environment Setup & Auto-Seeding Guide

### Server Environment Setup (`server/.env`)

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/project_management_db

JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

CLIENT_URL=http://localhost:5173
```

### Execution Commands

```bash
# Server Setup & Start
cd server
npm install
npm run dev     # Starts Nodemon server on :3000

# Client Setup & Start
cd client
npm install
npm run dev     # Starts Vite development server on :5173
```

### Auto-Seeding System
Upon MongoDB connection (`server/config/seed.js`), default accounts are auto-seeded if zero accounts exist for a given role:
- **Admin**: `admin@university.edu` / `admin123456`
- **Teacher**: `teacher@university.edu` / `teacher123456`
- **Student**: `student@university.edu` / `student123456`

---

## 11. Comprehensive Project Directory Index

```
project-management-system/
├── README.md                           ← Master System Architecture & Technical Rationale
├── client/                             ← React 19 Frontend Application
│   ├── README.md                       ← Frontend Stack & Component Overview
│   └── src/
│       ├── api/README.md               ← Axios Instance & Interceptors
│       ├── components/README.md        # UI Components & Layout Guards
│       ├── context/README.md           # Auth Context & Session Provider
│       └── pages/README.md             # Page Registry & Component Documentation
│
└── server/                             ← Express 5 & Socket.io Backend Application
    ├── README.md                       ← Server Infrastructure & Architectural Rationale
    ├── config/README.md                # DB Connection, Cloudinary & Auto-Seed Setup
    ├── controllers/README.md           # HTTP Controllers Technical Handbook
    ├── middlewares/README.md           # Security Pipeline, Auth & Error Middlewares
    ├── models/README.md                # Mongoose Database Schemas & Indexing Manual
    ├── router/README.md                # Express Router Definitions
    ├── services/README.md              # Business Logic & Atomic Services Handbook
    ├── sockets/README.md               # Socket.io & WebRTC Event Catalog
    ├── utils/README.md                 # Token Utilities & Email Templates
    └── validations/README.md           # Request Validation Specs
```
