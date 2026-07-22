# 🎓 Academic FYP Governance & Real-Time Collaboration Platform

An enterprise-grade, production-ready MERN monorepo platform designed for governing Final Year Academic Project (FYP) proposals, faculty supervisor allocation, milestone deliverables, real-time social networking, 1-on-1 instant messaging, and WebRTC peer-to-peer audio/video meetings.

Built to showcase senior MERN stack & backend engineering standards for **15–20+ LPA engineering roles**, featuring state-machine workflow state protection, atomic MongoDB concurrency write-locks, dual JWT refresh token rotation, WebRTC media stream cleanup, and full mobile-responsive UI aesthetics.

---

## 📚 Table of Contents

- [🌟 Core System Highlights](#-core-system-highlights)
- [🔒 Account Provisioning & 0-User Auto-Seed System](#-account-provisioning--0-user-auto-seed-system)
- [👥 Role-Based Workflows & Governance Matrix](#-role-based-workflows--governance-matrix)
- [🔄 Project Proposal Lifecycle & Proposal History Rules](#-project-proposal-lifecycle--proposal-history-rules)
- [💬 Real-Time Collaboration & Communication Engine](#-real-time-collaboration--communication-engine)
- [🏗️ System Design & Architectural Defense for Interviewers](#-system-design--architectural-defense-for-interviewers)
- [📁 Repository Monorepo Structure & File Links](#-repository-monorepo-structure--file-links)
- [🛠️ Technology Stack & Dependencies Rationale](#️-technology-stack--dependencies-rationale)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [📝 Credentials for Testing](#-credentials-for-testing)

---

## 🌟 Core System Highlights

1. **Strict User Provisioning Model**: Public registration is disabled to maintain academic compliance. User accounts can **only** be created by System Admins.
2. **Automated 0-User DB Seed**: Bootstraps 3 default demo accounts (Admin, Teacher, Student) automatically whenever MongoDB starts with zero users.
3. **Single Active Project Rule & Historical Archive**: Students can maintain only **1 active ongoing project** at a time. All past rejected/completed proposals remain stored as non-editable historical records.
4. **Supervisor Request Guard**: Students can request faculty supervisors **only** for proposals that are in **Approved** or **Accepted** status.
5. **Real-Time WebRTC Media Cleanup**: Instant audio/video tracks are explicitly stopped (`track.stop()`) on call decline, end call, or tab exit—preventing hardware camera/microphone resource leaks.
6. **Dual JWT Token Security**: 15-minute in-memory Access Tokens + 7-day `httpOnly` Refresh Tokens with automatic token rotation via Axios HTTP 401 interceptors.
7. **Responsive UI & Constant Sticky Sidebar**: Layout stays fixed on desktop while featuring a smooth slide-over mobile drawer navigation on phone viewports.

---

## 🔒 Account Provisioning & 0-User Auto-Seed System

### Public Registration Guard
To prevent unauthorized users from registering in an academic institution environment:
- Public user registration is explicitly restricted.
- Account creation is performed exclusively by **System Admins** through the **Admin User Directory** (`/admin/users`).

### Automated Database Seed System (`server/config/seed.js`)
When launching the application for the first time on a fresh database:
1. The server checks the `User` collection.
2. If total users count is **`0`**, it automatically seeds 3 pre-configured demo user accounts:

| Role | Name | Email | Default Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Admin | `admin@fyp.com` | `Admin@1234` | Computer Science |
| **Teacher** | System Teacher | `teacher@fyp.com` | `Teacher@1234` | Computer Science |
| **Student** | System Student | `student@fyp.com` | `Student@1234` | Computer Science |

---

## 👥 Role-Based Workflows & Governance Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            ACADEMIC WORKFLOW MATRIX                              │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ ROLE              │ PERMISSIONS & CAPABILITIES                                   │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👨‍🎓 Student        │ • Submit 1 active project proposal.                          │
│                   │ • View proposal history (read-only for rejected/completed).  │
│                   │ • Request supervisor for APPROVED proposals.                 │
│                   │ • Upload milestone document deliverables.                    │
│                   │ • Connect, chat, and voice/video call with connected users.  │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👩‍🏫 Teacher        │ • Review incoming supervisor allocation requests.            │
│                   │ • Approve or Reject submitted student project proposals.     │
│                   │ • Grade student milestone document submissions.              │
│                   │ • Host group video meetings and conduct 1-on-1 calls.        │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 🛡️ Admin          │ • Create student and teacher user accounts.                  │
│                   │ • Toggle user status (Active / Suspended).                   │
│                   │ • Global project overview and evaluation overrides.          │
│                   │ • System performance & platform metrics dashboard.           │
└───────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Project Proposal Lifecycle & Proposal History Rules

### Proposal Lifecycle States
1. **Draft**: Student creates initial proposal draft.
2. **Submitted**: Student submits proposal for evaluation.
3. **Under Review**: Proposal is under evaluation by faculty supervisor or department admin.
4. **Approved / Rejected**: Faculty or Admin accepts or rejects the proposal with feedback notes.
5. **Assigned**: Student requests an approved teacher who accepts supervision.
6. **Completed**: Project milestone deliverables completed and marked finished.

```
 [Draft] ──> [Submitted] ──> [Under Review] ──> [Approved] ──> [Assigned] ──> [Completed]
                  │                                  │
                  └───> [Rejected] (Historical) ─────┘
```

### Proposal History Rules
- **Active Project Isolation**: A student can only have **1 active ongoing project** (`draft`, `submitted`, `under_review`, `approved`).
- **History View**: In the My Proposal workspace (`/student/proposal`), students can view their complete submission history.
- **Edit Restrictions**: Earlier completed or rejected proposals are displayed as **read-only historical cards**. Only the current active project proposal can be modified.

---

## 💬 Real-Time Collaboration & Communication Engine

### 1. Network & Connections Engine (`/connections`)
- **Connection Requests**: Send, accept, or decline connection requests.
- **Filtered Explore Directory**: Hides already connected users, pending requests, and blocked users.
- **Connection Management**: Clear chat history, remove connection, or directly block users from the chat header.

### 2. 1-on-1 Instant Messaging (`/chat`)
- **Socket.io WebSocket Delivery**: Low-latency instant delivery over port 3000.
- **Offline Message Persistence**: Messages sent to offline users are stored in MongoDB and rendered upon re-login with unread badges.
- **Interactive Features**: Emoji quick-reactions, tagged message jump navigation (smooth scroll & highlight glow), single-instance message rendering.

### 3. WebRTC Peer-to-Peer 1-on-1 Voice & Video Calls
- Full WebRTC peer connection handling via Socket.io signaling.
- **Hardened Track Teardown**: Invokes `track.stop()` on all audio/video tracks when calls end or decline to immediately free camera/microphone hardware.
- **Missed Call Alerts**: Automatically inserts system missed call notifications in the chat stream and call history logs.

### 4. WebRTC Group Video Meetings (`/meetings`)
- Multi-user video meetings powered by WebRTC mesh signaling.
- **Host Controls**: Host can mute individual users, kick participants, or end meeting for all users.
- In-meeting live text chat with message broadcasting.

---

## 🏗️ System Design & Architectural Defense for Interviewers

### Q1: Why Dual JWT Tokens instead of basic sessions or single JWTs?
> **Answer**: Single JWTs stored in LocalStorage leave apps vulnerable to XSS attacks. Basic sessions require database reads on every single HTTP request.
> 
> **Our Solution**:
> - **Short-Lived Access Token (15 min)**: Kept in memory, minimizing exposure window if intercepted.
> - **Long-Lived Refresh Token (7 days)**: Stored in an `httpOnly`, `SameSite=Strict` cookie, inaccessible to JavaScript XSS attacks.
> - **Silent Refresh**: On HTTP 401 response, Axios interceptor seamlessly hits `/api/v1/auth/refresh-token`, obtains a fresh access token, and retries the request without forcing user re-login.

### Q2: How does the system handle MongoDB race conditions during supervisor acceptance?
> **Answer**: If multiple students request a supervisor with only 1 slot remaining, traditional read-then-write code creates race conditions.
> 
> **Our Solution**: We use **atomic MongoDB write-locks** in `teacherService.js`:
> ```javascript
> const updatedTeacher = await User.findOneAndUpdate(
>   {
>     _id: teacherId,
>     $expr: { $lt: [{ $size: "$assignedStudents" }, "$maxStudents"] }
>   },
>   { $addToSet: { assignedStudents: studentId } },
>   { new: true }
> );
> ```
> If `assignedStudents` has reached `maxStudents`, the query fails atomically in MongoDB engine without race conditions.

### Q3: How is hardware resource cleanup enforced for WebRTC calls?
> **Answer**: Closing a WebRTC peer connection without stopping media tracks leaves camera/microphone indicator LEDs turned on in browsers.
> 
> **Our Solution**: In [CallModal.jsx](./client/src/components/CallModal.jsx), `cleanupCall()` explicitly iterates over all active tracks on the local stream:
> ```javascript
> if (localStreamRef.current) {
>   localStreamRef.current.getTracks().forEach(track => {
>     track.stop();
>     track.enabled = false;
>   });
>   localStreamRef.current = null;
> }
> ```

---

## 📁 Repository Monorepo Structure & File Links

```
project-management-system/
├── [README.md](./README.md)                      # Root Documentation
├── [INTERVIEW_QNA.md](./INTERVIEW_QNA.md)               # Senior MERN Interview Questions & Architecture Defense
│
├── 📁 server/                                 # Express.js & Socket.io Backend API
│   ├── [README.md](./server/README.md)                # Backend Server Walkthrough & Route Table
│   ├── [app.js](./server/app.js)                   # Express App Pipeline & Security Setup
│   ├── [server.js](./server/server.js)                # HTTP Server Bootstrapper & Socket.io Setup
│   ├── 📁 config/
│   │   ├── [db.js](./server/config/db.js)             # MongoDB Mongoose Connection Setup
│   │   └── [seed.js](./server/config/seed.js)         # Automatic 0-User Demo Data Bootstrap Script
│   ├── 📁 models/                             # Mongoose Schemas & Compound Indexes
│   │   ├── [README.md](./server/models/README.md)         # Schema Design & Indexing Defense
│   │   ├── [user.js](./server/models/user.js)           # User Model with Role Enums
│   │   ├── [project.js](./server/models/project.js)        # Project Proposal Schema & Feedback Array
│   │   ├── [connection.js](./server/models/connection.js)     # Network Connections & Block List
│   │   └── [message.js](./server/models/message.js)         # Chat Message Schema & Reactions
│   ├── 📁 controllers/                        # REST Controllers
│   │   ├── [README.md](./server/controllers/README.md)    # Controller Layer Walkthrough
│   │   ├── [student.controller.js](./server/controllers/student.controller.js) # Proposal Submission & Supervisor Request
│   │   ├── [teacher.controller.js](./server/controllers/teacher.controller.js) # Proposal Evaluation & Supervisees
│   │   └── [admin.controller.js](./server/controllers/admin.controller.js)   # Admin Directory & Override Review
│   ├── 📁 sockets/                            # Real-Time WebSocket Event Handlers
│   │   ├── [chatSocket.js](./server/sockets/chatSocket.js)       # Instant Messaging & Reactions Socket
│   │   └── [callSocket.js](./server/sockets/callSocket.js)       # WebRTC Call & Meeting Signals Socket
│   └── 📁 middlewares/                        # Middleware Safeguards
│       ├── [README.md](./server/middlewares/README.md)    # Auth & RBAC Security Defense
│       └── [auth.middleware.js](./server/middlewares/auth.middleware.js) # JWT Auth Guard & Role Policy
│
└── 📁 client/                                 # React + Vite + Tailwind Frontend
    ├── [README.md](./client/README.md)                # Frontend Architecture Walkthrough
    ├── [vite.config.js](./client/vite.config.js)           # Vite Config with Socket Proxy
    └── 📁 src/
        ├── [App.jsx](./client/src/App.jsx)                 # Router Setup & Layout Boundaries
        ├── 📁 api/
        │   └── [axios.js](./client/src/api/axios.js)         # Axios Instance & Silent Token Refresh
        ├── 📁 components/
        │   ├── [Navbar.jsx](./client/src/components/Navbar.jsx)       # Header & Theme Toggle
        │   ├── [Sidebar.jsx](./client/src/components/Sidebar.jsx)      # Constant Sticky Sidebar & Mobile Drawer
        │   └── [CallModal.jsx](./client/src/components/CallModal.jsx)    # WebRTC Call Interface & Track Releases
        └── 📁 pages/
            ├── [InstantChat.jsx](./client/src/pages/InstantChat.jsx)   # Instant Messaging & Call Directory
            ├── [ProposalForm.jsx](./client/src/pages/ProposalForm.jsx)  # Proposal Submission & History View
            ├── [TeacherProposals.jsx](./client/src/pages/TeacherProposals.jsx) # Faculty Proposal Review Hub
            └── [UserManagement.jsx](./client/src/pages/UserManagement.jsx) # Admin User Account Creation
```

---

## 🛠️ Technology Stack & Dependencies Rationale

| Category | Technology | Rationale & Selection Criteria |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 + Vite | Fast HMR builds, component isolation, smooth rendering. |
| **Styling** | Vanilla CSS + TailwindCSS | Modern utility styling, responsive grid flex layout, curated dark theme. |
| **Real-Time Messaging** | Socket.io v4 | Low-latency WebSockets with automatic polling fallback and room isolation. |
| **Media Calling** | WebRTC (simple-peer / Native) | Direct peer-to-peer browser video/audio streaming with minimal server bandwidth. |
| **Backend Core** | Node.js + Express.js | Event-driven non-blocking I/O architecture suitable for async socket operations. |
| **Database** | MongoDB + Mongoose | Flexible JSON-like document store with schemas, compound indexes, and atomic updates. |
| **Security & Auth** | JsonWebToken + Cookie-Parser | Stateless Access Tokens coupled with secure HttpOnly Refresh Token storage. |
| **Icons** | Lucide React | Lightweight SVG icons with native dark/light mode compatibility. |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB service running locally (`mongodb://localhost:27017/project_management`) or MongoDB Atlas connection string.

### 1. Backend Server Setup
```bash
cd server
npm install
npm test          # Runs automated unit/integration tests
npm run dev       # Launches Express & Socket.io server on http://localhost:3000
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run build     # Validates Vite build
npm run dev       # Launches Vite dev server on http://localhost:5173
```

---

## 📝 Credentials for Testing

Use these pre-seeded demo accounts (generated automatically on first boot):
- **Admin**: `admin@fyp.com` / `Admin@1234`
- **Teacher**: `teacher@fyp.com` / `Teacher@1234`
- **Student**: `student@fyp.com` / `Student@1234`
