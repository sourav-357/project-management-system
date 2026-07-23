# Server Services Module Reference & Technical Handbook

The `services` layer encapsulates domain business logic, data transformation pipelines, complex aggregation queries, and atomic concurrency controls.

Separating business logic from controllers into dedicated service modules ensures DRY code reuse, testability, and centralized transactional security.

---

## 1. Teacher Service (`server/services/teacherService.js`)

Governs faculty supervisor allocations, atomic capacity locks, request acceptances, and project completion releases.

### Service Routines

#### `acceptSupervisorRequest(requestId, teacherId)`
- **Purpose**: Processes a student's supervision application and links student/teacher accounts.
- **Concurrency Security**: Implements atomic capacity verification directly in MongoDB write commands to prevent race conditions when concurrent requests arrive:
  ```javascript
  const teacher = await User.findOneAndUpdate(
    {
      _id: teacherId,
      role: 'Teacher',
      $expr: { $lt: [{ $size: '$assignedStudents' }, '$maxStudents'] }
    },
    { $addToSet: { assignedStudents: request.student } },
    { new: true }
  );

  if (!teacher) {
    throw new ErrorHandler('Teacher has reached maximum supervision capacity', 400);
  }
  ```
- **Operations Executed**:
  1. Finds `SupervisorRequest` document matching `requestId`.
  2. Executes conditional atomic `findOneAndUpdate` on `User` collection checking `$size: '$assignedStudents' < '$maxStudents'`.
  3. Updates `request.status = 'accepted'`.
  4. Links `student.supervisor = teacherId`.
  5. Updates `project.supervisor = teacherId` and sets `project.status = 'assigned'`.
- **Returns**: Updated request document.

#### `completeProjectService(projectId, teacherId)`
- **Purpose**: Marks an approved project as **Completed**, unlinks active student supervision, and releases faculty capacity.
- **Operations Executed**:
  ```javascript
  // 1. Mark project as completed
  const project = await Project.findById(projectId);
  if (!project) throw new ErrorHandler('Project not found', 404);

  project.status = 'completed';
  await project.save();

  // 2. Unlink student active supervision references
  await User.findByIdAndUpdate(project.student, {
    supervisor: null,
    project: null
  });

  // 3. Release faculty capacity
  await User.findByIdAndUpdate(teacherId, {
    $pull: { assignedStudents: project.student }
  });
  ```
- **Impact**:
  - The completed project and its deliverables become permanently locked as a read-only historical record.
  - The student's active references are cleared to `null`, enabling them to submit a brand new proposal.
  - The teacher's `assignedStudents` array is updated (`$pull`), freeing up capacity for new students.
- **Returns**: Completed project document.

---

## 2. Project Service (`server/services/projectService.js`)

Governs proposal submissions, draft revisions, file attachment metadata, and proposal query listings.

### Service Routines

#### `createOrUpdateProposalService(studentId, { title, description, isDraft })`
- **Purpose**: Creates a new proposal or updates an existing draft/rejected proposal.
- **Validation**: Enforces database partial unique index checks. Ensures active proposals (`submitted`, `approved`, `assigned`, `completed`) cannot be modified.
- **Returns**: Project document.

#### `getStudentProjectService(studentId)`
- **Purpose**: Returns active project along with array of historic completed/rejected proposal records.
- **Returns**: `{ project, projectsHistory }`.

---

## 3. User Service (`server/services/userService.js`)

Governs user directory search, administrative account provisioning, pagination, status toggling, and soft deletion.

### Service Routines

#### `getAllUsersService({ page, limit, role, search, status })`
- **Purpose**: Builds dynamic regex query matching name, email, or department, and executes paginated Mongoose query.
- **Returns**: `{ users, total, totalPages, currentPage }`.

#### `createUserAccountService(userData, role)`
- **Purpose**: Validates email format, checks for duplicate email, hashes password with bcrypt, and creates User record.
- **Returns**: User document.

---

## 4. File Service (`server/services/fileService.js`)

Processes local storage file writes and Cloudinary media uploads.

### Service Routines

#### `uploadToCloudinaryService(fileBuffer, folderPath)`
- **Purpose**: Streams file buffer to Cloudinary cloud storage and returns secure HTTPS asset URL.
- **Returns**: `{ secure_url, public_id }`.
