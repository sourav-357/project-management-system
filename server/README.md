# Backend Server Infrastructure Manual & Architectural Rationale

A deep-dive technical engineering handbook for the backend server powering the Academic Final Year Project (FYP) Governance Platform.

The server operates as a unified HTTP and WebSockets process built on **Node.js, Express 5, MongoDB, Mongoose 9, Socket.io 4, and WebRTC**. It adheres to a strict four-tier architecture: **Route → Controller → Service → Model**.

---

## Table of Contents

- [1. Server Architecture & Layer Isolation](#1-server-architecture--layer-isolation)
- [2. Architectural Decisions & Engineering Rationale ("Why Behind Server Decisions")](#2-architectural-decisions--engineering-rationale-why-behind-server-decisions)
  - [2.1 Why Express 5 over Express 4?](#21-why-express-5-over-express-4)
  - [2.2 Why Four-Tier Layer Isolation (`Route -> Controller -> Service -> Model`)?](#22-why-four-tier-layer-isolation-route---controller---service---model)
  - [2.3 Why Dual-JWT Session Security & In-Memory Token Handling?](#23-why-dual-jwt-session-security--in-memory-token-handling)
  - [2.4 Why SHA-256 Token Hashing, Rotation & Reuse Detection?](#24-why-sha-256-token-hashing-rotation--reuse-detection)
  - [2.5 Why Atomic MongoDB Operations (`$addToSet`, `findOneAndUpdate`) for Faculty Capacity?](#25-why-atomic-mongodb-operations-addtoset-findoneandupdate-for-faculty-capacity)
  - [2.6 Why Partial Unique Compound Indexing for Project Lifecycle?](#26-why-partial-unique-compound-indexing-for-project-lifecycle)
  - [2.7 Why Automated Supervision Unlinking on Project Completion?](#27-why-automated-supervision-unlinking-on-project-completion)
  - [2.8 Why Single Process Express & Socket.io Integration?](#28-why-single-process-express--socketio-integration)
- [3. Deep Dive: Entry Points (`server.js` & `app.js`)](#3-deep-dive-entry-points-serverjs--appjs)
- [4. Deep Dive: Security Pipeline & Middlewares](#4-deep-dive-security-pipeline--middlewares)
- [5. Deep Dive: Database Models & Index Strategies](#5-deep-dive-database-models--index-strategies)
- [6. Deep Dive: Business Services & Atomic Operations](#6-deep-dive-business-services--atomic-operations)
- [7. Deep Dive: Controllers & Complete API Endpoint Reference](#7-deep-dive-controllers--complete-api-endpoint-reference)
- [8. Deep Dive: WebSockets & Real-Time Engine](#8-deep-dive-websockets--real-time-engine)
- [9. Database Auto-Seeding System](#9-database-auto-seeding-system)
- [10. Server Sub-Directory Index](#10-server-sub-directory-index)

---

## 1. Server Architecture & Layer Isolation

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

---

## 2. Architectural Decisions & Engineering Rationale ("Why Behind Server Decisions")

### 2.1 Why Express 5 over Express 4?

- **Native Promise Error Handling**: In Express 4, asynchronous errors inside async route handlers required explicit `try/catch` blocks or third-party wrappers to call `next(err)`. Express 5 natively handles rejected promises in middleware and route handlers, automatically passing errors to the centralized `errorMiddleware`.
- **Improved Routing & Parameter Handling**: Express 5 offers updated URL route parsing and security fixes for query string processing.

---

### 2.2 Why Four-Tier Layer Isolation (`Route -> Controller -> Service -> Model`)?

- **Decoupled Responsibilities**:
  - **Routes (`router/`)**: Route definition and middleware chaining only.
  - **Controllers (`controllers/`)**: HTTP parameter extraction, request validation, calling services, and formatting JSON responses. No direct database queries inside controllers.
  - **Services (`services/`)**: Business logic, atomic concurrency operations, and data transformations. Reusable across REST endpoints and Socket event handlers.
  - **Models (`models/`)**: Mongoose schema specifications, type validations, default values, pre-save hooks, and database indexing strategies.
- **Maintainability & Testing**: Business logic isolated in `services/` can be unit tested independently without mocking Express `req`/`res` objects.

---

### 2.3 Why Dual-JWT Session Security & In-Memory Token Handling?

- **Architectural Decision**: Authenticated sessions issue two tokens:
  1. **Access Token**: Short-lived (15 minutes), kept in client memory.
  2. **Refresh Token**: Long-lived (7 days), delivered in an `httpOnly`, `SameSite=Strict` cookie.
- **Engineering Rationale**:
  - **XSS Immunity**: Storing tokens in `localStorage` allows malicious scripts to steal sessions via Cross-Site Scripting (XSS). An `httpOnly` cookie cannot be read by browser scripts.
  - **CSRF Protection**: `SameSite=Strict` guarantees the browser will never send the refresh cookie during cross-origin requests.

---

### 2.4 Why SHA-256 Token Hashing, Rotation & Reuse Detection?

- **Architectural Decision**:
  - Raw refresh token strings are never stored in MongoDB; only SHA-256 cryptographic hashes are saved.
  - Calling `/auth/refresh-token` revokes the old token hash and issues a new access/refresh token pair (Token Rotation).
  - Presenting a revoked token hash triggers automatic **Reuse Detection**, revoking all active sessions for the user.
- **Engineering Rationale**:
  - If a database backup is leaked, attackers cannot generate valid refresh token strings.
  - Token rotation limits token replay windows. Reuse detection neutralizes stolen token replay attacks instantly.

---

### 2.5 Why Atomic MongoDB Operations (`$addToSet`, `findOneAndUpdate`) for Faculty Capacity?

- **Architectural Decision**: Supervision applications are processed via atomic conditional updates:
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
- **Engineering Rationale**: A naive check-then-write pattern (`if (teacher.assignedStudents.length < limit) await update(...)`) suffers from race conditions when concurrent requests execute simultaneously. Atomic conditional writes execute inside MongoDB's write lock, guaranteeing that faculty capacity (`maxStudents`) is never exceeded.

---

### 2.6 Why Partial Unique Compound Indexing for Project Lifecycle?

- **Architectural Decision**: Enforced at the database engine level:
  ```javascript
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
- **Engineering Rationale**: Guarantees that a student cannot create a second active proposal while one is ongoing. The `partialFilterExpression` excluding `'completed'` and `'rejected'` allows students to create new proposals after finishing a project.

---

### 2.7 Why Automated Supervision Unlinking on Project Completion?

- **Architectural Decision**: When a project is marked `'completed'`:
  1. `project.status` transitions to `'completed'`.
  2. Student `supervisor` and `project` references are set to `null`.
  3. Student is pulled from teacher's `assignedStudents` list (`$pull`).
  4. Project artifacts are locked read-only.
- **Engineering Rationale**: Restores the student account to clean state for a new proposal while automatically releasing faculty supervision capacity.

---

### 2.8 Why Single Process Express & Socket.io Integration?

- **Architectural Decision**: Express and Socket.io share a single Node `http.Server` instance listening on port `3000`.
- **Engineering Rationale**: Avoids cross-origin issues between REST and WebSockets, simplifies cookie propagation, and reduces container deployment complexity.

---

## 3. Deep Dive: Entry Points (`server.js` & `app.js`)

### `server.js` — Listener & Process Handlers
- Connects to MongoDB (`connectDB()`).
- Creates raw HTTP server wrapping Express `app`.
- Attaches Socket.io engine with CORS security options.
- Registers WebSocket event namespaces (`initializeChatSockets`, `initializeCallSockets`).
- Registers process safety handlers:
  - `uncaughtException`: Logs synchronous unhandled exceptions and exits immediately (`process.exit(1)`).
  - `unhandledRejection`: Logs unhandled promise rejections and gracefully shuts down the HTTP server before process exit.

### `app.js` — Security Pipeline & Routing Gateway
- Configures security headers (`helmet`), NoSQL query sanitization (`express-mongo-sanitize`), gzip compression (`compression`), cookie parser (`cookie-parser`), and IP rate limiting (`express-rate-limit`).
- Mounts modular routers under `/api/v1`.
- Registers centralized error handling middleware (`errorMiddleware`).

---

## 4. Deep Dive: Security Pipeline & Middlewares

1. **`auth.js`**: `isAuthenticated` verifies access tokens from cookies or headers; `isAuthorized(...roles)` enforces RBAC.
2. **`error.js`**: `ErrorHandler` class and `errorMiddleware` capture unhandled errors and format uniform JSON responses (`{ success: false, message }`).
3. **`asyncHandler.js`**: Wrapper catching async exceptions in controllers.

---

## 5. Deep Dive: Database Models & Index Strategies

- **`User.js`**: Stores identity, bcrypt hashed passwords, roles (`Student`/`Teacher`/`Admin`), capacity, and references. Unique index on `email`.
- **`Project.js`**: Governs proposals and deliverables. Partial unique index on `{ student: 1 }` for active proposals.
- **`Connection.js`**: Peer network graph. Compound index `{ requester: 1, recipient: 1 }`.
- **`Meeting.js`**: Video conference metadata. Index `{ host: 1, status: 1 }`.
- **`Message.js`**: Direct chat messages. Compound index `{ sender: 1, recipient: 1, createdAt: -1 }`.
- **`RefreshToken.js`**: Token rotation hashes. Index `{ tokenHash: 1 }` and TTL index `{ expiresAt: 1 }`.

---

## 6. Deep Dive: Business Services & Atomic Operations

- **`teacherService.js`**: Handles atomic supervision requests (`acceptSupervisorRequest`) and project completion unlinking (`completeProjectService`).
- **`projectService.js`**: Proposal submissions, draft edits, and project file attachments.
- **`userService.js`**: Admin account provisioning, pagination, status toggling, and soft deletion.
- **`fileService.js`**: Local file uploads and Cloudinary media processing.

---

## 7. Deep Dive: Controllers & Complete API Endpoint Reference

Full REST endpoint catalog mounted under `/api/v1`:
- `/auth`: Login, refresh token rotation, logout, password change, avatar upload.
- `/admin`: Account creation, user directory, status toggle, proposal override, assign supervisor, stats.
- `/student`: Fetch active project, submit proposal, fetch supervisors, request supervisor, upload files.
- `/teacher`: Supervised proposals, review proposal, complete project, incoming requests, respond request, supervisees list, drop student.
- `/connections`: Connections list, explore users, request connection, respond request, pending requests, blocked list, unblock user.
- `/chat`: Friends list, conversation history, clear chat, emoji reactions.
- `/meetings`: Invitees list, active meetings list, create meeting, join room, end meeting.

---

## 8. Deep Dive: WebSockets & Real-Time Engine

- **Direct Messaging (`chatSocket.js`)**: Real-time message delivery, read status propagation, and emoji reaction broadcasts.
- **Video Calling & Meetings (`callSocket.js`)**: 1-on-1 WebRTC call signaling (`initiate_call`, `answer_call`, `ice_candidate`, `end_call`) and group video conference mesh rooms (`join_meeting_room`, `sending_signal`, `meeting_ended_by_host`).

---

## 9. Database Auto-Seeding System

Executed on every successful database connection (`server/config/seed.js`):
- Seeds default `Admin` (`admin@university.edu` / `admin123456`) if zero admins exist.
- Seeds default `Teacher` (`teacher@university.edu` / `teacher123456`) if zero teachers exist.
- Seeds default `Student` (`student@university.edu` / `student123456`) if zero students exist.

---

## 10. Server Sub-Directory Index

| Directory | Documentation Link |
|-----------|--------------------|
| Configuration | [config/README.md](./config/README.md) |
| Controllers | [controllers/README.md](./controllers/README.md) |
| Middlewares | [middlewares/README.md](./middlewares/README.md) |
| Models | [models/README.md](./models/README.md) |
| Router | [router/README.md](./router/README.md) |
| Services | [services/README.md](./services/README.md) |
| Sockets | [sockets/README.md](./sockets/README.md) |
| Utilities | [utils/README.md](./utils/README.md) |
| Validations | [validations/README.md](./validations/README.md) |
