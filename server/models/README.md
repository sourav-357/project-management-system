# Mongoose Models (`server/models/`)

Database schemas, validation rules, indexes, and entity relationships for MongoDB.

---

## Entity Relationship Diagram

```
User ──────────────> Project (student, supervisor refs)
  │                      │
  ├── assignedStudents   ├── milestones[] (embedded)
  ├── supervisor         ├── feedback[] (embedded)
  └── project            └── files[] (embedded)

SupervisorRequest ──> student, supervisor (User refs)
Connection ─────────> requester, recipient (User refs)
Message ────────────> sender, recipient, replyTo (Message ref)
Notification ───────> user (User ref)
Deadline ───────────> createdBy, project (optional)
Meeting ────────────> host, invitedUsers[]
CallHistory ────────> host, participants[]
RefreshToken ───────> user (User ref)
```

---

## Model Registry

### User — [user.js](./user.js)

Core identity model for all platform actors.

| Field | Type | Notes |
|-------|------|-------|
| name, email, password | String | Email unique; password bcrypt-hashed |
| role | Enum | `Student`, `Teacher`, `Admin` |
| department | String | Academic department |
| status | Enum | `active`, `suspended`, `archived` |
| avatar | String | Cloudinary URL |
| supervisor | ObjectId → User | Student's assigned teacher |
| assignedStudents | [ObjectId → User] | Teacher's supervisees |
| project | ObjectId → Project | Current active project ref |
| maxStudents | Number | Teacher capacity (default 5) |
| expertise | [String] | Teacher specializations |
| isDeleted | Boolean | Soft delete flag |

**Indexes:** `{ email: 1 }` unique; `{ role, status, isDeleted }` compound

---

### Project — [project.js](./project.js)

Student FYP proposal and lifecycle container.

| Field | Type | Notes |
|-------|------|-------|
| student | ObjectId → User | Required owner |
| supervisor | ObjectId → User | Assigned faculty |
| title, description | String | Proposal content |
| status | Enum | `draft`, `pending`, `submitted`, `approved`, `rejected`, `assigned`, `completed` |
| milestones | [Embedded] | title, dueDate, status, submissionUrl, teacherFeedback |
| feedback | [Embedded] | supervisorId, message, createdAt |
| files | [Embedded] | name, url, size, uploadedAt |
| isDeleted | Boolean | Soft delete |

**Indexes:** Partial unique `{ student: 1 }` where `isDeleted: false` — enforces one active project per student

---

### SupervisorRequest — [supervisorRequest.js](./supervisorRequest.js)

Workflow record when a student requests faculty supervision.

| Field | Notes |
|-------|-------|
| student, supervisor | User refs |
| status | `pending`, `accepted`, `rejected` |
| message | Optional student note |

---

### Connection — [connection.js](./connection.js)

Social graph between users.

| Field | Notes |
|-------|-------|
| requester, recipient | User refs |
| status | `pending`, `accepted`, `rejected`, `blocked` |
| blockedBy | User ref (who initiated block) |
| rejectedAt | Timestamp for 10-day cooldown |

**Indexes:** Unique `{ requester, recipient }`

---

### Message — [message.js](./message.js)

1-on-1 chat messages.

| Field | Notes |
|-------|-------|
| sender, recipient | User refs |
| content | Max 2000 characters |
| isRead, readAt | Read receipt tracking |
| replyTo | Message ref (threading) |
| reactions | [{ emoji, userId }] — 6 supported emojis |

---

### Notification — [notification.js](./notification.js)

In-app notification records.

| Field | Notes |
|-------|-------|
| user | Recipient |
| type | Event category (connection, proposal, milestone, etc.) |
| message, link | Display content and navigation target |
| isRead | Read flag |

---

### Deadline — [deadline.js](./deadline.js)

Academic deadlines set by teachers/admins.

| Field | Notes |
|-------|-------|
| title, dueDate | Deadline info |
| createdBy | Teacher or Admin |
| project | Optional project association |

---

### Meeting — [meeting.js](./meeting.js)

Group video meeting sessions.

| Field | Notes |
|-------|-------|
| title, roomId | Meeting identity |
| host | Teacher or Admin |
| invitedUsers | Participant list |
| status | `active`, `ended` |
| startedAt, endedAt | Timestamps |

---

### CallHistory — [callHistory.js](./callHistory.js)

1-on-1 WebRTC call records.

| Field | Notes |
|-------|-------|
| host, participants | User refs |
| callType | `audio` or `video` |
| status | `completed`, `declined`, `missed` |
| duration | Seconds (if completed) |

---

### RefreshToken — [refreshToken.js](./refreshToken.js)

Persistent refresh token store for rotation and reuse detection.

| Field | Notes |
|-------|-------|
| user | Token owner |
| tokenHash | SHA-256 of raw refresh token |
| isRevoked | Set true on rotation or logout |
| ipAddress, userAgent | Session metadata |
| expiresAt | TTL index for auto-cleanup |

---

## Indexing Strategy (Interview Focus)

| Index | Why |
|-------|-----|
| User email unique | O(1) login lookup |
| Project student partial unique | Database-enforced business rule |
| Connection requester+recipient unique | Prevent duplicate requests |
| RefreshToken tokenHash | Fast rotation lookup |
| RefreshToken expiresAt TTL | Automatic expired token cleanup |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Backend overview |
| [../../README.md](../../README.md) | Root project workflows |
| [../services/README.md](../services/README.md) | Business logic using these models |
| [../controllers/README.md](../controllers/README.md) | HTTP handlers |
