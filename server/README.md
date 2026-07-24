# Server Backend Architecture & System Design Manual

A comprehensive engineering handbook for the backend server powering the Academic Final Year Project (FYP) Governance Platform.

The server operates as a unified HTTP and WebSockets process built on **Node.js, Express 5, MongoDB, Mongoose 9, Socket.io 4, and WebRTC**. It adheres strictly to a four-tier architecture: **Route → Controller → Service → Model**.

---

## Table of Contents

- [1. Four-Tier Architecture & Layer Responsibilities](#1-four-tier-architecture--layer-responsibilities)
- [2. System Design Rationale ("Why Behind Backend Choices")](#2-system-design-rationale-why-behind-backend-choices)
  - [2.1 Why Express 5 Native Async Error Propagation?](#21-why-express-5-native-async-error-propagation)
  - [2.2 Why Dual-JWT Session Architecture & In-Memory Access Tokens?](#22-why-dual-jwt-session-architecture--in-memory-access-tokens)
  - [2.3 Why Cryptographic Refresh Token Hashing, Rotation & Reuse Detection?](#23-why-cryptographic-refresh-token-hashing-rotation--reuse-detection)
  - [2.4 Why Atomic MongoDB Operations (`$expr`, `$addToSet`) for Faculty Capacity?](#24-why-atomic-mongodb-operations-expr-addtoset-for-faculty-capacity)
  - [2.5 Why Partial Unique Compound Indexing for Single Active Proposals?](#25-why-partial-unique-compound-indexing-for-single-active-proposals)
  - [2.6 Why Project Completion Unlinking & Capacity Recycling?](#26-why-project-completion-unlinking--capacity-recycling)
  - [2.7 Why Single Process Express & Socket.io Integration?](#27-why-single-process-express--socketio-integration)
- [3. Deep Dive: Entry Points (`server.js` & `app.js`)](#3-deep-dive-entry-points-serverjs--appjs)
- [4. Deep Dive: Security Pipeline & Middlewares](#4-deep-dive-security-pipeline--middlewares)
- [5. Deep Dive: Database Models & Index Strategies](#5-deep-dive-database-models--index-strategies)
- [6. Deep Dive: Business Services & Atomic Operations](#6-deep-dive-business-services--atomic-operations)
- [7. Deep Dive: Controllers & REST API Directory](#7-deep-dive-controllers--rest-api-directory)
- [8. Deep Dive: WebSockets & Real-Time Engine](#8-deep-dive-websockets--real-time-engine)
- [9. Auto-Seeding System](#9-auto-seeding-system)

---

## 1. Four-Tier Architecture & Layer Responsibilities

```
                            ┌─────────────────────────────────────────┐
                            │   Client REST Request / Socket Event    │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │            Security Pipeline            │
                            │  Helmet, MongoSanitize, CORS, Rate-Limit│
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │          Authentication & RBAC          │
                            │  JWT Verification & Role Access Guards  │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │           Controller Layer              │
                            │   Input Parsing & HTTP Status Handlers  │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │             Service Layer               │
                            │   Business Logic & Atomic Operations    │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │           Data Access Layer             │
                            │      Mongoose Schemas & Query Index     │
                            └─────────────────────────────────────────┘
```

1. **Routes (`router/`)**: Route path definition and middleware chaining. No business logic.
2. **Controllers (`controllers/`)**: Request parsing, validation parameter check, service invocation, and HTTP JSON response formatting.
3. **Services (`services/`)**: Business logic, atomic concurrency operations, and data transformations. Reusable across REST and WebSockets.
4. **Models (`models/`)**: Mongoose schema specifications, type validations, hooks, and index definitions.

---

## 2. System Design Rationale ("Why Behind Backend Choices")

### 2.1 Why Express 5 Native Async Error Propagation?
- Express 5 automatically catches rejected promises in async middleware and route handlers, forwarding them directly to `errorMiddleware`. This eliminates third-party `try/catch` wrapper libraries.

### 2.2 Why Dual-JWT Session Security & In-Memory Access Tokens?
- Access Tokens (15m) are held in memory (`AuthContext`) to prevent XSS session theft from browser `localStorage`.
- Refresh Tokens (7d) are stored in `httpOnly`, `SameSite=Strict` cookies to block CSRF attacks.

### 2.3 Why Cryptographic Refresh Token Hashing, Rotation & Reuse Detection?
- Refresh token raw strings are never stored in MongoDB; only SHA-256 hashes are saved.
- Token Rotation issues a new token pair on every refresh. Replaying a revoked token triggers **Automatic Reuse Detection**, invalidating all active user sessions instantly.

### 2.4 Why Atomic MongoDB Operations for Faculty Capacity?
- Using conditional updates (`$expr: { $lt: [{ $size: '$assignedStudents' }, '$maxStudents'] }`, `$addToSet`) inside MongoDB's write lock eliminates race conditions during simultaneous student supervision applications.

### 2.5 Why Partial Unique Compound Indexing for Single Active Proposals?
- Mongoose partial unique index on `{ student: 1 }` excluding `'completed'` and `'rejected'` statuses enforces that a student can only have one active project at a time while allowing completed project history.

### 2.6 Why Project Completion Unlinking & Capacity Recycling?
- Marking a project `'completed'` automatically clears active links (`supervisor: null`, `project: null`), pulls the student from the teacher's list (`$pull`), and releases faculty supervision capacity.

### 2.7 Why Single Process Express & Socket.io Integration?
- Shares a single HTTP server port, aligning CORS origins, cookie handshakes, and deployment configuration seamlessly.

---

## 3. Deep Dive: Entry Points (`server.js` & `app.js`)

- `server.js`: Connects to MongoDB (`connectDB()`), wraps Express `app` in `http.Server`, binds Socket.io engine, registers socket event handlers, handles process signals (`uncaughtException`, `unhandledRejection`).
- `app.js`: Configures security pipeline (`helmet`, `express-mongo-sanitize`, `compression`, `cookie-parser`, `express-rate-limit`), mounts `/api/v1` routes, registers `errorMiddleware`.

---

## 4. Deep Dive: Security Pipeline & Middlewares

1. **`helmet`**: Sets HTTP security headers (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`).
2. **`express-mongo-sanitize`**: Neutralizes NoSQL injection operators (`$gt`, `$where`).
3. **`express-rate-limit`**: Enforces IP rate limiting (2,000 requests per 15 minutes).
4. **`isAuthenticated`**: Verifies Access Tokens from cookies or headers.
5. **`isAuthorized(...roles)`**: Restricts endpoints by user role.
6. **`errorMiddleware`**: Centralized error formatter.

---

## 5. Deep Dive: Database Models & Index Strategies

- **`User.js`**: User identity, bcrypt hashed passwords, role (`Student`/`Teacher`/`Admin`), capacity quotas. Index: `{ email: 1 }` (Unique).
- **`Project.js`**: Proposals and deliverables. Partial unique index on `{ student: 1 }` for active proposals.
- **`Connection.js`**: Peer network connections. Compound index `{ requester: 1, recipient: 1 }`.
- **`Message.js`**: Direct chat messages. Compound index `{ sender: 1, recipient: 1, createdAt: -1 }`.
- **`CallHistory.js`**: 1-on-1 call logs. Index `{ host: 1, createdAt: -1 }`.
- **`RefreshToken.js`**: SHA-256 token hashes. Unique index `{ tokenHash: 1 }`, TTL index `{ expiresAt: 1 }`.

---

## 6. Deep Dive: Business Services

- `teacherService.js`: Atomic supervision requests and project completion unlinking.
- `projectService.js`: Proposal submissions, draft edits, and deliverables file attachments.
- `userService.js`: Admin user provisioning, directory pagination, and status toggling.
- `fileService.js`: File uploads and Cloudinary media processing.

---

## 7. REST API Endpoints (Base `/api/v1`)

- `/auth`: Login, refresh token rotation, profile, avatar, password change, logout.
- `/admin`: Account creation, user directory, status toggle, proposal override, assign supervisor, stats.
- `/student`: Active project, submit proposal, fetch supervisors, request supervisor, upload files, stats.
- `/teacher`: Proposals review, complete project, requests inbox, respond request, supervisees list, drop student.
- `/connections`: Connections list, explore users, request connection, respond request, blocked list, unblock.
- `/chat`: Friends list, conversation history, clear chat, emoji reactions, call history.

---

## 8. WebSockets & Real-Time Engine

- **`chatSocket.js`**: Direct messaging, read status propagation (`isRead: true`), emoji reactions.
- **`callSocket.js`**: 1-on-1 WebRTC call signaling (`initiate_call`, `answer_call`, `reject_call`, `ice_candidate`, `end_call`) triggering app-wide call popups and logging in `CallHistory`.

---

## 9. Auto-Seeding System

Seeds default accounts on MongoDB connection (`server/config/seed.js`) if role count is 0:
- **Admin**: `admin@university.edu` / `admin123456`
- **Teacher**: `teacher@university.edu` / `teacher123456`
- **Student**: `student@university.edu` / `student123456`
