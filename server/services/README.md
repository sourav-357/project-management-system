# Services (`server/services/`)

Business logic layer. Encapsulates domain operations, complex MongoDB queries, atomic updates, and external integrations. Controllers call services; services call models.

---

## Service Registry

### userService.js

User directory and profile operations.

- Paginated user listing with search filters
- User status transitions with validation
- Profile field updates with duplicate email checks

---

### projectService.js

Project lifecycle management.

- Create proposal with one-active-project enforcement
- Status transitions with edit-lock validation (draft/rejected only)
- Milestone submission and completion detection
- When all milestones are `approved` → project status becomes `completed`
- Proposal history retrieval (active + past projects)

---

### teacherService.js

Faculty supervision with **atomic concurrency protection**.

#### acceptSupervisorRequestAtomic

Prevents supervisor overbooking when multiple students accept simultaneously:

```javascript
const updatedTeacher = await User.findOneAndUpdate(
  {
    _id: teacherId,
    $expr: { $lt: [{ $size: "$assignedStudents" }, "$maxStudents"] }
  },
  { $addToSet: { assignedStudents: studentId } },
  { new: true }
);
```

If capacity is full, the query returns `null`—no partial state. This is a key interview talking point for MongoDB atomic operations vs. read-modify-write races.

Also handles:
- Setting `student.supervisor` and `project.supervisor` on acceptance
- Rejecting requests with notification
- Dropping supervision (removes from assignedStudents, clears supervisor ref)

---

### requestService.js

SupervisorRequest workflow helpers.

- Create request with duplicate-pending guard
- Validate project is in approved state before request
- Status updates and notification triggers

---

### fileService.js

File upload pipeline with cloud/local fallback.

| Environment | Storage |
|-------------|---------|
| Production (Cloudinary configured) | Cloudinary CDN |
| Development (no credentials) | `server/uploads/` local disk |

Functions:
- `uploadProjectFile` — student deliverables to `academic_platform/projects/<projectId>/`
- `uploadAvatar` — profile images
- `deleteFile` — remove from storage
- Validates file types and size limits

**Why Cloudinary:** Cloud platforms use ephemeral filesystems. Files uploaded to local disk are lost on container restart. Cloudinary provides persistent, CDN-backed storage.

---

### emailService.js

Transactional email via Nodemailer.

- Password reset emails with 15-minute token links
- Uses HTML templates from [utils/emailTemplates.js](../utils/emailTemplates.js)
- Graceful failure if SMTP not configured (logs warning, doesn't crash)

---

### notificationService.js

Centralized notification creation.

- Called by controllers/services after state changes
- Creates `Notification` documents with type, message, and navigation link
- Used for: connection requests, proposal reviews, supervisor responses, milestone grades

---

## Service Layer Principles

1. **Single responsibility** — each service owns one domain area
2. **Atomic writes** — use `findOneAndUpdate` with conditions, not read-then-write
3. **No HTTP concerns** — services return data or throw errors; no `res.json()`
4. **Reusable** — same service functions callable from multiple controllers

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../models/README.md](../models/README.md) | Data schemas |
| [../controllers/README.md](../controllers/README.md) | HTTP handlers |
| [../config/cloudinary.js](../config/cloudinary.js) | Cloudinary config |
| [../../README.md](../../README.md) | Root project (concurrency Q&A) |
