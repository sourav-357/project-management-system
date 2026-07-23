# Router Layer (`server/router/`)

Express route definitions. Maps HTTP paths to controller handlers and applies middleware (auth, role guards, validation, upload).

All routes are mounted in [app.js](../app.js) under the `/api/v1` prefix.

---

## Route Files

| File | Mount Path | Role Guard |
|------|------------|------------|
| [user.route.js](./user.route.js) | `/auth` | Mixed (public + authenticated) |
| [admin.route.js](./admin.route.js) | `/admin` | Admin only |
| [student.route.js](./student.route.js) | `/student` | Student only |
| [teacher.route.js](./teacher.route.js) | `/teacher` | Teacher only |
| [connection.route.js](./connection.route.js) | `/connections` | Authenticated (all roles) |
| [chat.route.js](./chat.route.js) | `/chat` | Authenticated (all roles) |
| [meeting.route.js](./meeting.route.js) | `/meetings` | Authenticated; create/end restricted |
| [notification.route.js](./notification.route.js) | `/notifications` | Authenticated (all roles) |
| [deadline.route.js](./deadline.route.js) | `/deadlines` | Authenticated; write restricted |

---

## Mounting Pattern

```javascript
// app.js
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', isAuthenticated, isAuthorized('Admin'), adminRouter);
app.use('/api/v1/student', isAuthenticated, isAuthorized('Student'), studentRouter);
app.use('/api/v1/teacher', isAuthenticated, isAuthorized('Teacher'), teacherRouter);
app.use('/api/v1/connections', isAuthenticated, connectionRouter);
// ...
```

Role guards are applied at the router mount level for student/teacher/admin. Shared routes only require authentication.

---

## Per-Route Middleware Examples

### Auth routes (user.route.js)

```
POST /register        → validateRegisterInput → registerUser
POST /login           → validateLoginInput → login
POST /refresh-token   → refreshToken (no auth required)
GET  /me              → isAuthenticated → getUser
PUT  /profile/avatar  → isAuthenticated → upload.single('avatar') → updateAvatar
```

### Student routes (student.route.js)

```
POST /project-proposal  → validateProposalInput → submitProposal
POST /upload/:projectId → upload.array('files', 10) → uploadFiles
POST /supervisor-request → validateSupervisorRequestInput → requestSupervisor
```

### Meeting routes (meeting.route.js)

```
POST /                  → isAuthorized('Teacher', 'Admin') → createMeeting
PUT  /:meetingId/end    → isAuthorized('Teacher', 'Admin') → endMeeting
GET  /available-invitees → isAuthorized('Teacher', 'Admin') → getAvailableInvitees
```

---

## Design Principles

1. **One file per domain** — keeps route tables manageable
2. **Validation before controller** — input sanitized at router level
3. **Role guard at mount** — not repeated per route for role-specific routers
4. **Granular guards for shared routers** — meeting create/end uses inline `isAuthorized`

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../controllers/README.md](../controllers/README.md) | Handler implementations |
| [../middlewares/README.md](../middlewares/README.md) | Auth and upload middleware |
| [../validations/README.md](../validations/README.md) | Input validators |
| [../README.md](../README.md) | Full API reference tables |
