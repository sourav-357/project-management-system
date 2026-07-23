# Controllers (`server/controllers/`)

HTTP request handlers. Parse input, enforce authorization, delegate to services, return standardized JSON responses. Wrapped with `asyncHandler` for automatic error propagation.

---

## Controller Registry

### auth.controller.js

Authentication and session management.

| Handler | Route | Description |
|---------|-------|-------------|
| `registerUser` | POST `/auth/register` | Admin-only self-registration; blocks Student/Teacher |
| `login` | POST `/auth/login` | Validates email + password + role match |
| `refreshToken` | POST `/auth/refresh-token` | Rotates token pair; detects reuse |
| `logout` | POST `/auth/logout` | Revokes current refresh token |
| `logoutAll` | POST `/auth/logout-all` | Revokes all user sessions |
| `forgotPassword` | POST `/auth/password/forgot` | Sends 15-min reset email |
| `resetPassword` | PUT `/auth/password/reset/:token` | Sets new password |
| `changePassword` | PUT `/auth/password/change` | Authenticated password change |
| `getUser` | GET `/auth/me` | Current user with populated relations |
| `updateAvatar` | PUT `/auth/profile/avatar` | Cloudinary avatar upload |

**Key rule:** Student and Teacher self-registration returns 403 with explicit message directing to admin provisioning.

---

### admin.controller.js

Platform administration (Admin role only).

| Handler | Description |
|---------|-------------|
| `createStudent` | Provisions student with department |
| `updateStudent` | Updates student fields |
| `deleteStudent` | Soft-delete (isDeleted flag) |
| `createTeacher` | Provisions teacher with maxStudents, expertise |
| `updateTeacher` | Updates teacher fields |
| `deleteTeacher` | Soft-delete |
| `toggleUserStatus` | active / suspended / archived |
| `getAllUsers` | Paginated, searchable user directory |
| `getAllProjects` | All platform projects |
| `reviewProposalAdmin` | Override approve/reject any proposal |
| `assignSupervisor` | Manual supervisor assignment bypassing request flow |
| `getAdminDashboardStats` | User counts, project stats |

---

### student.controller.js

Student academic workflow.

| Handler | Description |
|---------|-------------|
| `getStudentProject` | Active project + full history |
| `submitProposal` | Create/edit proposal; enforces one active project |
| `submitMilestone` | Submit milestone deliverable |
| `uploadFiles` | Upload project documents (requires supervisor) |
| `downloadFile` | Download project file |
| `getAvailableSupervisors` | Teachers with available capacity |
| `getSupervisor` | Currently assigned supervisor |
| `requestSupervisor` | Send supervisor request (approved project only) |
| `getFeedback` | Teacher feedback on project |
| `getDashboardStats` | Student dashboard metrics |

---

### teacher.controller.js

Faculty supervision and evaluation.

| Handler | Description |
|---------|-------------|
| `getIncomingRequests` | Pending supervisor requests |
| `respondToRequest` | Accept/reject; delegates to atomic service |
| `getAssignedStudents` | Supervisees with project summaries |
| `dropSupervision` | Remove student from assignedStudents |
| `getSupervisedProjects` | Projects under supervision |
| `reviewProposal` | Approve/reject student proposal |
| `addFeedback` | Structured feedback entry |
| `updateMilestoneStatus` | Grade milestone; triggers completion check |
| `getTeacherDashboardStats` | Teacher metrics |

---

### connection.controller.js

Social connection graph.

| Handler | Description |
|---------|-------------|
| `exploreUsers` | Users not connected/pending/blocked |
| `sendConnectionRequest` | Create pending connection + notification |
| `respondToRequest` | Accept, reject, or block |
| `getPendingRequests` | Incoming and outgoing pending |
| `getConnectionHistory` | Full history with cooldown info |
| `getBlockedUsers` | Blocked user list |
| `unblockUser` | Remove block |
| `removeConnection` | Delete connection record |
| `blockUserDirectly` | Block without prior connection |

**Cooldown:** 10 days after rejection before re-requesting same user.

---

### chat.controller.js

Messaging and call history REST endpoints.

| Handler | Description |
|---------|-------------|
| `getConnectedFriends` | Accepted connections with unread counts |
| `getConversationMessages` | Paginated messages; marks as read |
| `clearChat` | Delete all messages with partner |
| `reactToMessage` | Toggle emoji reaction |
| `getCallHistory` | 1-on-1 call log |
| `deleteCallHistoryRecord` | Remove call record |

---

### meeting.controller.js

Group meeting management.

| Handler | Description |
|---------|-------------|
| `getAvailableInvitees` | Users eligible for meeting invite |
| `getMeetings` | Active meetings |
| `getMeetingHistory` | Past meetings |
| `getMeetingById` | Single meeting details |
| `createMeeting` | Teacher/Admin creates meeting room |
| `endMeeting` | Host ends meeting for all |
| `deleteMeetingHistoryRecord` | Remove history entry |

---

### notification.controller.js

In-app notification CRUD.

| Handler | Description |
|---------|-------------|
| `getMyNotifications` | User's notifications |
| `markAllAsRead` | Bulk read |
| `markAsRead` | Single read |
| `clearAllNotifications` | Delete all |
| `deleteNotification` | Delete one |

---

### deadline.controller.js

Academic deadline management.

| Handler | Description |
|---------|-------------|
| `getDeadlines` | List all deadlines |
| `createDeadline` | Admin/Teacher creates |
| `deleteDeadline` | Admin/Teacher removes |

---

## Controller Design Principles

1. **Thin controllers** — validation and HTTP concerns only; business logic in services
2. **Consistent responses** — `{ success, message, data }` shape
3. **Error propagation** — `next(new ErrorHandler(message, statusCode))` caught by error middleware
4. **Role enforcement** — at router level via `isAuthorized`, not duplicated in controllers

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../services/README.md](../services/README.md) | Business logic layer |
| [../router/README.md](../router/README.md) | Route mounting |
| [../middlewares/README.md](../middlewares/README.md) | Auth guards |
| [../../README.md](../../README.md) | Root project overview |
