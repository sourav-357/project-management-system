# Academic Final Year Project (FYP) Governance & Real-Time Collaboration Platform

A production-grade, full-stack monorepo system engineered to govern university Final Year Project (FYP) lifecycles, faculty supervision capacities, proposal evaluations, document repositories, and real-time collaboration tools.

Built with **Node.js (Express 5), MongoDB (Mongoose 9), React 19, Tailwind CSS 4, Socket.io 4, and WebRTC**, this platform merges academic administration with high-concurrency real-time tools into a single deployable architecture.

---

## Table of Contents

- [1. Executive Summary & Academic Domain Problem Context](#1-executive-summary--academic-domain-problem-context)
- [2. System Architecture & Component Interactions](#2-system-architecture--component-interactions)
- [3. Deep Technical Rationale: Architectural Decisions & System Design](#3-deep-technical-rationale-architectural-decisions--system-design)
  - [3.1 Monorepo Architecture: Express 5 API & React 19 Client](#31-monorepo-architecture-express-5-api--react-19-client)
  - [3.2 Database Selection: MongoDB Document Store with Mongoose 9 ODM](#32-database-selection-mongodb-document-store-with-mongoose-9-odm)
  - [3.3 Administrative Account Provisioning (Blocking Public Registration)](#33-administrative-account-provisioning-blocking-public-registration)
  - [3.4 Dual-JWT Session Security & In-Memory Token Management](#34-dual-jwt-session-security--in-memory-token-management)
  - [3.5 Cryptographic Refresh Token Hashing, Rotation & Reuse Detection](#35-cryptographic-refresh-token-hashing-rotation--reuse-detection)
  - [3.6 Atomic MongoDB Operations (`$expr`, `$addToSet`) for Faculty Capacity](#36-atomic-mongodb-operations-expr-addtoset-for-faculty-capacity)
  - [3.7 Partial Unique Compound Indexing for Single Active Project Invariant](#37-partial-unique-compound-indexing-for-single-active-project-invariant)
  - [3.8 Project Completion Unlinking & Immutable Archiving](#38-project-completion-unlinking--immutable-archiving)
  - [3.9 Single-Process Express HTTP & Socket.io Hybrid Server](#39-single-process-express-http--socketio-hybrid-server)
  - [3.10 Peer-to-Peer WebRTC 1-on-1 Voice & Video Calling Engine](#310-peer-to-peer-webrtc-1-on-1-voice--video-calling-engine)
- [4. Project Proposal State Machine & Supervision Workflow](#4-project-proposal-state-machine--supervision-workflow)
- [5. Exhaustive Feature Directory](#5-exhaustive-feature-directory)
  - [5.1 Student Governance Workspace](#51-student-governance-workspace)
  - [5.2 Faculty Supervision Desk](#52-faculty-supervision-desk)
  - [5.3 Administrative Governance Control Panel](#53-administrative-governance-control-panel)
  - [5.4 Peer Networking & Discovery Graph](#54-peer-networking--discovery-graph)
  - [5.5 App-Wide Real-Time Messaging & WebRTC Calling System](#55-app-wide-real-time-messaging--webrtc-calling-system)
- [6. Database Models, Schemas & Indexing Strategy](#6-database-models-schemas--indexing-strategy)
- [7. Complete REST API Endpoint Specification](#7-complete-rest-api-endpoint-specification)
- [8. Real-Time Socket.io Event Specification](#8-real-time-socketio-event-specification)
- [9. Security Pipeline & Middleware Execution Chain](#9-security-pipeline--middleware-execution-chain)
- [10. Quick Start, Environment Configuration & Seeding Guide](#10-quick-start-environment-configuration--seeding-guide)
- [11. Comprehensive Project Directory Index](#11-comprehensive-project-directory-index)

---

## 1. Executive Summary & Academic Domain Problem Context

In higher education institutions, Final Year Projects (FYP) represent the capstone evaluation for graduating students. Traditional management of FYPs suffers from critical structural problems:

1. **Unvetted Account Registrations**: Open self-registration permits unauthorized accounts, duplicate profiles, or role escalation (students creating faculty profiles to self-approve proposals).
2. **Race Conditions in Faculty Supervision Quotas**: Popular faculty supervisors are inundated with applications. Manual processing leads to over-allocation beyond faculty capacity limits.
3. **Audit Trail Loss & State Drift**: Document submissions, evaluations, and supervisor assignments scattered across emails and messaging apps result in lost records and audit failures.
4. **Post-Completion Deadlocks**: Students completing an initial project are locked in legacy software without a clean mechanism to reset state and initiate a new project under a new supervisor.

This platform resolves these challenges by introducing a **governed state machine**, **atomic database operations**, **role-restricted access controls**, **app-wide WebSocket messaging**, and an **integrated WebRTC calling engine**.

---

## 2. System Architecture & Component Interactions

```
                               ┌────────────────────────────────────────┐
                               │           React 19 Frontend            │
                               │    Vite + Tailwind CSS + Contexts      │
                               └───────────────────┬────────────────────┘
                                                   │ (REST API & WebSockets)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Express 5 API Server                                       │
│                                                                                                  │
│  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │ Security Pipeline        │   │ Controller Tier          │   │ Real-Time Engine             │  │
│  │ Helmet, MongoSanitize,   │──>│ Request validation,      │──>│ Socket.io Event Handlers &   │  │
│  │ CORS, Rate Limiting      │   │ HTTP response formatting │   │ WebRTC P2P Call Signaling    │  │
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

## 3. Deep Technical Rationale: Architectural Decisions & System Design

### 3.1 Monorepo Architecture: Express 5 API & React 19 Client
- **Single Repository Design**: Housing client (`/client`) and server (`/server`) in one repository simplifies version control, environment synchronization, and CI/CD deployment pipelines.
- **Express 5 API Engine**:
  - **Native Async Error Catching**: Express 5 automatically forwards rejected promises in async middleware directly to centralized error middleware (`errorMiddleware`), eliminating boilerplate wrappers.
  - **Security-First Path Parsing**: Upgraded routing and query string parsing logic protects against parameter pollution attacks.
- **React 19 & Vite Build**:
  - Vite leverages Esbuild for fast HMR and sub-second production builds.
  - Context APIs (`AuthContext`, `SocketContext`) maintain clean global authentication and real-time state without third-party store overhead.

### 3.2 Database Selection: MongoDB Document Store with Mongoose 9 ODM
- **Document Store Fit**: Academic projects contain dynamic arrays (file attachments, review feedback remarks, chat reactions). Storing these as embedded arrays within MongoDB documents eliminates multi-table SQL `JOIN` overhead.
- **Mongoose 9 ODM Protection**: Enforces strict schema compilation, type casting, pre-save hooks, and partial compound indexing over MongoDB collections.

### 3.3 Administrative Account Provisioning (Blocking Public Registration)
- **Design Choice**: Public self-registration (`POST /auth/register`) is restricted exclusively to initial Admin bootstrap account creation. Students and Teachers **cannot** create accounts independently. Account creation is managed by Admins via `/admin/create-student` and `/admin/create-teacher`.
- **Engineering Rationale**: Prevents unauthorized registration, role escalation, and duplicate academic identity records.

### 3.4 Dual-JWT Session Security & In-Memory Token Management
- **Access Token**: Short-lived (15 minutes), kept strictly in client JavaScript memory (`AuthContext`). Prevents XSS token theft.
- **Refresh Token**: Long-lived (7 days), stored in an `httpOnly`, `SameSite=Strict` cookie. Prevents CSRF attacks.

### 3.5 Cryptographic Refresh Token Hashing, Rotation & Reuse Detection
- Raw refresh tokens are never saved in MongoDB. Only SHA-256 cryptographic hashes are stored.
- On token refresh, the server revokes the old token hash and issues a brand-new token pair (Rotation).
- Presenting a revoked token hash triggers **Reuse Detection**, revoking all active sessions for that user account.

### 3.6 Atomic MongoDB Operations (`$expr`, `$addToSet`) for Faculty Capacity
- Faculty supervision applications process via atomic conditional updates:
  ```javascript
  const teacher = await User.findOneAndUpdate(
    {
      _id: teacherId,
      role: 'Teacher',
      $expr: { $lt: [{ $size: '$assignedStudents' }, '$maxStudents'] }
    },
    { $addToSet: { assignedStudents: studentId } },
    { new: true }
  );
  ```
- **Rationale**: Eliminates race conditions during high-concurrency supervision requests, ensuring capacity limits are never breached inside MongoDB's write lock.

### 3.7 Partial Unique Compound Indexing for Single Active Project Invariant
- Database partial unique index on `{ student: 1 }` with `partialFilterExpression: { isDeleted: false, status: { $nin: ['completed', 'rejected'] } }`.
- **Rationale**: Guarantees a student cannot possess multiple active proposals simultaneously, while allowing completed historical projects without blocking new proposal submissions.

### 3.8 Project Completion Unlinking & Immutable Archiving
- When a faculty supervisor marks a project as `'completed'`:
  1. `project.status` is set to `'completed'`.
  2. Student `supervisor` and `project` references are reset to `null`.
  3. Student is pulled from teacher's `assignedStudents` list (`$pull`).
  4. Project details and files are locked read-only.
- **Rationale**: Automatically recycles faculty supervision capacity and resets student state for new project proposals while retaining permanent academic audit records.

### 3.9 Single-Process Express HTTP & Socket.io Hybrid Server
- Express and Socket.io run within a single Node `http.Server` instance listening on port `3000`.
- **Rationale**: Avoids cross-origin issues, simplifies cookie propagation, and streamlines deployment configuration.

### 3.10 Peer-to-Peer WebRTC 1-on-1 Voice & Video Calling Engine
- Direct P2P WebRTC connections signaled via Socket.io events (`initiate_call`, `answer_call`, `ice_candidate`, `end_call`).
- **Rationale**: Media streams travel directly between peers, ensuring ultra-low latency and zero server media bandwidth cost.

---

## 4. Project Proposal State Machine & Supervision Workflow

```
  [ Draft ] ──────► [ Pending ] ──────► [ Approved ] ──────► [ Completed ] (Read-Only Archive)
                          │                   │                     ▲
                          │                   ▼ font                │
                          └───────────► [ Rejected ]          Supervision Released
                                              │               Student Free to Start
                                              ▼               New Project Proposal
                                     (Editable & Resubmit)
```

1. **Draft**: Proposal title and abstract written by student.
2. **Pending**: Submitted for faculty review; locked against student editing.
3. **Approved**: Accepted by faculty; unlocks faculty supervisor selector directory.
4. **Rejected**: Rejected with evaluation remarks; student can edit and resubmit.
5. **Assigned**: Supervision request accepted by faculty member; student and teacher linked.
6. **Completed**: Project completed; supervision capacity released; project locked read-only.

---

## 5. Exhaustive Feature Directory

### 5.1 Student Governance Workspace
- **Lifecycle Tracker**: Progress gauge tracking proposal submission, approval, supervisor assignment, and completion.
- **Proposal Workspace**: Document editor with edit locks on active proposals and historical draft archives.
- **Supervisor Selector**: Faculty directory with live capacity gauges (`assignedStudents / maxStudents`).
- **Deliverables Repository**: Upload and manage project deliverables (PDF, DOCX, ZIP).

### 5.2 Faculty Supervision Desk
- **Capacity Meter**: Visual capacity progress bar.
- **Proposal Evaluation Desk**: Filterable workspace with review remarks modal.
- **Supervision Requests Inbox**: Student applications inbox.
- **Mark as Completed Action**: Finalizes project, releases capacity, and locks records.

### 5.3 Administrative Governance Control Panel
- **Account Provisioning**: Dedicated forms for Student and Teacher account creation.
- **User Directory**: Paginated account search table with status controls (`active`/`suspended`).
- **Global Project Board**: Platform-wide project oversight and supervisor assignment overrides.

### 5.4 Peer Networking & Discovery Graph
- **Explore Network**: Discover users excluding existing connections and pending requests.
- **Connection Graph**: Send, accept, decline, or block peer requests.

### 5.5 App-Wide Real-Time Messaging & WebRTC Calling System
- **Global Socket Context**: Users connect and show online immediately upon logging into any page.
- **App-Wide Incoming Call Popups**: Incoming 1-on-1 call popups display over any active route.
- **Live Unread Badges**: Dynamic unread message counter badge on sidebar navigation.
- **1-on-1 Direct Messaging & WebRTC Calls**: Low-latency chat, emoji reactions, and P2P video/voice calling.

---

## 6. Database Models, Schemas & Indexing Strategy

- **`User`** (`server/models/user.js`): Account identity, bcrypt hashed passwords, roles (`Student`/`Teacher`/`Admin`), capacity, assigned students, supervisor reference, project reference. Index: `{ email: 1 }` (Unique).
- **`Project`** (`server/models/project.js`): Proposals and deliverables. Partial unique index on `{ student: 1 }` for active proposals.
- **`Connection`** (`server/models/connection.js`): Peer connection graph. Compound index `{ requester: 1, recipient: 1 }`.
- **`Message`** (`server/models/message.js`): Direct chat messages. Compound index `{ sender: 1, recipient: 1, createdAt: -1 }`.
- **`CallHistory`** (`server/models/callHistory.js`): 1-on-1 call logs. Index `{ host: 1, createdAt: -1 }`.
- **`RefreshToken`** (`server/models/refreshToken.js`): SHA-256 token hashes. Index `{ tokenHash: 1 }` (Unique), TTL Index `{ expiresAt: 1 }`.

---

## 7. Complete REST API Endpoint Specification

Base Prefix: `/api/v1`

### Authentication (`/auth`)
- `POST /auth/login` - Authenticate credentials & role
- `POST /auth/register` - Initial Admin bootstrap registration
- `POST /auth/refresh-token` - Rotate access & refresh token pair
- `GET /auth/me` - Fetch authenticated user profile
- `POST /auth/logout` - Revoke current user session
- `PUT /auth/password/change` - Change user password
- `PUT /auth/profile/avatar` - Upload profile avatar image

### Admin Governance (`/admin`)
- `POST /admin/create-student` - Provision new Student account
- `POST /admin/create-teacher` - Provision new Teacher account
- `GET /admin/getAllUsers` - User directory with search & role filters
- `PUT /admin/users/:id/status` - Toggle user status (`active`/`suspended`)
- `DELETE /admin/delete-student/:id` - Delete student account
- `DELETE /admin/delete-teacher/:id` - Delete teacher account
- `GET /admin/projects` - Overview of all platform projects
- `POST /admin/assign-supervisor` - Assign supervisor to project
- `GET /admin/dashboard-stats` - Platform analytics metrics

### Student Services (`/student`)
- `GET /student/project` - Active project & proposal history
- `POST /student/project-proposal` - Submit proposal or save draft
- `GET /student/fetch-supervisors` - Browse available faculty with capacity details
- `POST /student/supervisor-request` - Request supervisor for approved project
- `POST /student/upload/:projectId` - Upload project deliverables
- `GET /student/fetch-dashboard-stats` - Student metrics

### Faculty / Teacher Services (`/teacher`)
- `GET /teacher/proposals` - List supervised proposals
- `PUT /teacher/projects/:projectId/review` - Approve or reject proposal
- `PUT /teacher/projects/:projectId/complete` - Mark project completed
- `GET /teacher/requests` - List supervision applications
- `POST /teacher/requests/:requestId/respond` - Accept or decline request
- `GET /teacher/students` - List active supervisees
- `PUT /teacher/students/:studentId/drop` - Release supervision

### Peer Networking (`/connections`)
- `GET /connections/my-connections` - List active connections
- `GET /connections/explore` - Discover users for connection
- `POST /connections/request` - Send connection request
- `PUT /connections/respond/:connectionId` - Accept, decline, or block request
- `GET /connections/pending` - Pending requests
- `GET /connections/blocked` - Blocked user directory
- `PUT /connections/unblock/:targetUserId` - Unblock user

### Direct Messaging (`/chat`)
- `GET /chat/friends` - Connected friends list
- `GET /chat/messages/:partnerId` - Fetch message history
- `DELETE /chat/clear-chat/:partnerId` - Clear conversation history
- `POST /chat/messages/:messageId/react` - Toggle emoji reaction
- `GET /chat/call-history` - Fetch call history logs
- `DELETE /chat/call-history/:historyId` - Delete call log

---

## 8. Real-Time Socket.io Event Specification

### Direct Messaging (`chatSocket.js`)
- `send_message`: Delivers message to recipient socket; saves message document.
- `mark_read`: Emits read status updates (`isRead: true`).
- `toggle_reaction`: Broadcasts emoji reaction changes.

### WebRTC 1-on-1 Calls (`callSocket.js`)
- `initiate_call`: Triggers app-wide incoming call popup on recipient's screen.
- `answer_call`: Delivers WebRTC answer signal and logs call in `CallHistory`.
- `ice_candidate`: Forwards WebRTC candidate for NAT traversal.
- `reject_call`: Logs declined call in history and notifies caller.
- `end_call`: Terminates active call session.

---

## 9. Security Pipeline & Middleware Execution Chain

1. **Helmet**: Sets security headers (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`).
2. **MongoSanitize**: Sanitizes body, params, and query strings to block NoSQL injection.
3. **Compression**: Compresses response payloads via gzip.
4. **Cookie Parser**: Parses `httpOnly` refresh cookies.
5. **Rate Limiting**: Limits IP request frequency (2,000 requests per 15 minutes).
6. **CORS Policy**: Restricts origins with `credentials: true`.
7. **Authentication Guard**: Verifies Access Token from cookie or header.
8. **RBAC Guard**: Enforces role access restrictions.
9. **Centralized Error Middleware**: Captures unhandled errors and formats uniform JSON responses.

---

## 10. Quick Start & Environment Configuration

### Server `.env`
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/project_management_db
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Commands
```bash
# Server
cd server
npm install
npm run dev

# Client
cd client
npm install
npm run dev
```

Default Seeded Accounts:
- **Admin**: `admin@university.edu` / `admin123456`
- **Teacher**: `teacher@university.edu` / `teacher123456`
- **Student**: `student@university.edu` / `student123456`
