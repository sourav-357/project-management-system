# Server Controllers Module Reference & Technical Handbook

The `controllers` layer in this architecture serves as the HTTP adapter between incoming Express requests and the underlying business logic services and database models.

Every controller method is wrapped in the `asyncHandler` higher-order utility to guarantee uniform error propagation to Express middleware. This layer is responsible for parsing inputs, extracting query/body parameters, enforcing request validation, calling services, and returning consistent RESTful JSON responses.

---

## 1. Authentication Controller (`server/controllers/auth.controller.js`)

Manages user identity lifecycle, dual-JWT session issuance, token rotation, password administration, and profile media uploads.

### Functions Breakdown

#### `login(req, res, next)`
- **Purpose**: Authenticates a user by matching email, password, and requested role.
- **Input Parameters**: `req.body` → `{ email, password, role }`.
- **Validation**: Ensures all three parameters are present. Validates format using `validator.isEmail`.
- **Logic**:
  1. Searches database for user matching `email` (explicitly selecting `+password`).
  2. Compares password hash using bcrypt `comparePassword`.
  3. Verifies that `user.role === role` (prevents role-spoofing).
  4. Generates an Access Token (15m expiration).
  5. Generates a Refresh Token (7d expiration), computes its SHA-256 hash, and saves the hash in the `RefreshToken` collection.
  6. Sets the Refresh Token as an `httpOnly`, `SameSite=Strict`, path-scoped cookie.
- **Response**: `200 OK` with `{ success: true, message, token, user }`.

#### `refreshToken(req, res, next)`
- **Purpose**: Rotates Access Token and Refresh Token pair without requiring user re-authentication.
- **Input**: `req.cookies.refreshToken` or `req.body.refreshToken`.
- **Security Mechanics**:
  1. Verifies token signature using `JWT_REFRESH_SECRET`.
  2. Hashes token using SHA-256 and searches `RefreshToken` collection.
  3. If token hash is missing or marked `isRevoked: true` → triggers **Reuse Detection**: revokes **all** active tokens for the user account.
  4. Marks current refresh token as `isRevoked: true`.
  5. Issues a new Access Token and new Refresh Token pair.
- **Response**: `200 OK` with new tokens and set-cookie header.

#### `logout(req, res, next)`
- **Purpose**: Revokes current user session.
- **Logic**: Extracts refresh token cookie, hashes token, sets `isRevoked = true` in DB, and clears cookie header.
- **Response**: `200 OK` with `{ success: true, message: 'Logged out successfully' }`.

#### `logoutAll(req, res, next)`
- **Purpose**: Revokes all active sessions across all devices for the authenticated user.
- **Logic**: Updates all `RefreshToken` entries matching `req.user._id` to `isRevoked: true` and clears cookies.
- **Response**: `200 OK`.

#### `getMe(req, res, next)`
- **Purpose**: Fetches fresh profile document of currently authenticated user.
- **Logic**: Queries `User.findById(req.user._id)` populating `supervisor` and `project` references.
- **Response**: `200 OK` with user payload.

#### `changePassword(req, res, next)`
- **Purpose**: Changes account password for logged-in user.
- **Input**: `{ oldPassword, newPassword }`.
- **Validation**: Ensures `newPassword` length is at least 8 characters. Verifies `oldPassword` matches current hash.
- **Response**: `200 OK`.

#### `updateAvatar(req, res, next)`
- **Purpose**: Uploads user avatar image.
- **Processing**: Accepts multipart file upload via Multer, streams file to Cloudinary (or local uploads directory fallback), updates `user.avatar`, and saves document.
- **Response**: `200 OK` with updated user object.

---

## 2. Admin Controller (`server/controllers/admin.controller.js`)

Provides system administration, user account provisioning, status management, and global project oversight.

### Functions Breakdown

#### `createStudent(req, res, next)`
- **Purpose**: Admin provisioning of student accounts.
- **Input**: `{ name, email, password, department }`.
- **Logic**: Validates email format, checks for duplicate email, hashes password, creates User with `role: 'Student'`, and saves account.
- **Response**: `201 Created`.

#### `createTeacher(req, res, next)`
- **Purpose**: Admin provisioning of faculty supervisor accounts.
- **Input**: `{ name, email, password, department, maxStudents }`.
- **Logic**: Provisions User with `role: 'Teacher'` and sets initial supervision quota (`maxStudents` defaults to 5).
- **Response**: `201 Created`.

#### `getAllUsers(req, res, next)`
- **Purpose**: Paginated directory of platform accounts.
- **Query Params**: `page`, `limit`, `role`, `search`, `status`.
- **Logic**: Constructs dynamic Mongoose query matching name/email/department regex, executes paginated query, and returns total count metadata.
- **Response**: `200 OK` with `{ users, total, totalPages, currentPage }`.

#### `updateStudent(req, res, next)` / `updateTeacher(req, res, next)`
- **Purpose**: Admin updates to student/teacher profiles.
- **Input**: User ID in `req.params.id`, updated fields in `req.body`.
- **Response**: `200 OK` with updated user payload.

#### `deleteStudent(req, res, next)` / `deleteTeacher(req, res, next)`
- **Purpose**: Soft-deletes user accounts (`isDeleted: true`).
- **Response**: `200 OK`.

#### `toggleUserStatus(req, res, next)`
- **Purpose**: Switches user status between `active`, `suspended`, and `archived`.
- **Input**: `req.params.id`, `req.body.status`.
- **Response**: `200 OK`.

#### `reviewProposalAdmin(req, res, next)`
- **Purpose**: Admin override evaluation for student project proposals.
- **Guard**: Blocks modification if project status is already `'completed'`.
- **Logic**: Updates proposal status to `'approved'` or `'rejected'` and attaches admin remarks.
- **Response**: `200 OK`.

#### `assignSupervisor(req, res, next)`
- **Purpose**: Manually links a faculty supervisor to a student's approved project.
- **Guard**: Checks project status (must not be `'completed'`) and verifies teacher capacity.
- **Logic**: Atomically updates teacher `assignedStudents`, updates student `supervisor` reference, and sets `project.supervisor`.
- **Response**: `200 OK`.

#### `getDashboardStats(req, res, next)`
- **Purpose**: System-wide administrative analytics.
- **Output**: Total count of students, faculty members, proposals, approved projects, and conversion rates.
- **Response**: `200 OK`.

---

## 3. Student Controller (`server/controllers/student.controller.js`)

Manages student proposal submissions, supervisor discovery, applications, and file uploads.

### Functions Breakdown

#### `getStudentProject(req, res, next)`
- **Purpose**: Retrieves student's active project and historic proposals array.
- **Logic**: Queries `Project.find({ student: studentId })`. Separates current active non-finalized project from historic completed/rejected entries.
- **Response**: `200 OK` with `{ project, projectsHistory }`.

#### `createOrUpdateProposal(req, res, next)`
- **Purpose**: Creates new proposal or updates existing draft/rejected proposal.
- **Guards**:
  - Enforces database single active project invariant.
  - Blocks edits if proposal status is active (`submitted`, `approved`, `assigned`, `completed`).
- **Input**: `{ title, description, isDraft }`.
- **Response**: `201 Created` or `200 OK`.

#### `getAvailableSupervisors(req, res, next)`
- **Purpose**: Returns list of faculty members open for supervision applications.
- **Logic**: Queries teachers where `assignedStudents.length < maxStudents` and calculates remaining capacity for each teacher.
- **Response**: `200 OK` with list of eligible teachers.

#### `requestSupervisor(req, res, next)`
- **Purpose**: Student application for faculty supervision.
- **Guards**: Requires project status to be `'approved'` or `'assigned'`. Blocks duplicate pending applications to the same teacher.
- **Logic**: Creates a `SupervisorRequest` document with status `'pending'`.
- **Response**: `201 Created`.

#### `uploadFiles(req, res, next)`
- **Purpose**: Uploads project deliverables.
- **Guards**: Blocks file uploads if project status is `'completed'`. Requires student to have an assigned supervisor.
- **Response**: `200 OK` with uploaded file metadata.

#### `getDashboardStats(req, res, next)`
- **Purpose**: Student dashboard metrics, supervisor info, and project status.
- **Response**: `200 OK`.

---

## 4. Teacher Controller (`server/controllers/teacher.controller.js`)

Manages faculty proposal evaluation, supervision request processing, and project completion release.

### Functions Breakdown

#### `getSupervisedProposals(req, res, next)`
- **Purpose**: Lists proposals assigned to or supervised by the teacher.
- **Query Params**: `status` filter (`All`, `Pending`, `Approved`, `Completed`), `search`.
- **Response**: `200 OK` with matching projects.

#### `reviewProposal(req, res, next)`
- **Purpose**: Faculty evaluation of student proposal.
- **Input**: `{ status: 'approved' | 'rejected', remarks }`.
- **Guard**: Blocks review if project status is `'completed'`.
- **Response**: `200 OK`.

#### `completeProject(req, res, next)`
- **Purpose**: Marks an approved project as **Completed** and releases supervision capacity.
- **Logic**:
  1. Sets `project.status = 'completed'`.
  2. Resets `User.findByIdAndUpdate(studentId, { supervisor: null, project: null })`.
  3. Pulls student from teacher's `assignedStudents` list (`$pull`).
  4. Project details and files become read-only. Student is free to submit a new proposal.
- **Response**: `200 OK` with message and updated project.

#### `getIncomingRequests(req, res, next)`
- **Purpose**: Lists pending supervision applications from students.
- **Response**: `200 OK`.

#### `respondToSupervisorRequest(req, res, next)`
- **Purpose**: Accepts or declines student supervision application.
- **Logic**: If action is `'accept'`, calls `teacherService.acceptSupervisorRequest` using atomic MongoDB capacity checks (`$expr: { $lt: [{ $size: "$assignedStudents" }, "$maxStudents"] }`). Links student and teacher upon success.
- **Response**: `200 OK`.

#### `getAssignedStudents(req, res, next)`
- **Purpose**: Returns active supervisees list with profile details.
- **Response**: `200 OK`.

#### `dropStudent(req, res, next)`
- **Purpose**: Faculty release of student supervision before project completion.
- **Logic**: Unlinks student supervisor reference and removes student from teacher `assignedStudents`.
- **Response**: `200 OK`.

---

## 5. Connection Controller (`server/controllers/connection.controller.js`)

Manages peer discovery, connection requests, and block lists.

### Functions Breakdown

#### `getMyConnections(req, res, next)`
- **Purpose**: Returns list of accepted peer connections.
- **Response**: `200 OK`.

#### `exploreUsers(req, res, next)`
- **Purpose**: User discovery directory excluding existing connections, pending requests, and blocked users.
- **Query Params**: `search`, `role`.
- **Response**: `200 OK`.

#### `sendConnectionRequest(req, res, next)`
- **Purpose**: Sends connection request to a recipient.
- **Guards**: Checks if target is blocked or if rejected cooldown is active (10 days).
- **Response**: `201 Created`.

#### `respondToRequest(req, res, next)`
- **Purpose**: Accepts, rejects, or blocks connection request.
- **Logic**: If rejected, calculates 10-day cooldown timestamp (`cooldownUntil`). If blocked, creates block status.
- **Response**: `200 OK`.

#### `unblockUser(req, res, next)` / `removeConnection(req, res, next)`
- **Purpose**: Unblocks a user or deletes an existing connection.
- **Response**: `200 OK`.

---

## 6. Meeting Controller (`server/controllers/meeting.controller.js`)

Manages instant video conference room creation and meeting controls.

### Functions Breakdown

#### `getAvailableInvitees(req, res, next)`
- **Purpose**: Returns list of active users available for meeting invitation.
- **Response**: `200 OK`.

#### `createMeeting(req, res, next)`
- **Purpose**: Creates an instant video meeting.
- **Input**: `{ title, description, invitedUserIds }`.
- **Logic**: Creates Meeting document with `status: 'active'`, `startedAt: new Date()`, and populates `invitedUsers`.
- **Response**: `201 Created`.

#### `getMyMeetings(req, res, next)`
- **Purpose**: Retrieves active and invited meetings for current user.
- **Logic**: Queries `Meeting.find({ $or: [{ host: userId }, { invitedUsers: userId }], status: { $in: ['scheduled', 'active'] } })` populating `host` and `invitedUsers`.
- **Response**: `200 OK`.

#### `getMeetingById(req, res, next)`
- **Purpose**: Fetches meeting details for room joining.
- **Guard**: Rejects request if meeting status is `'ended'`.
- **Response**: `200 OK`.

#### `endMeeting(req, res, next)`
- **Purpose**: Ends active meeting for all participants (Host or Admin only).
- **Logic**: Sets `status = 'ended'`, records `endedAt`, updates call history, and broadcasts `meeting_ended_by_host` socket event.
- **Response**: `200 OK`.

#### `deleteMeeting(req, res, next)`
- **Purpose**: Deletes meeting document and broadcasts termination event.
- **Response**: `200 OK`.
