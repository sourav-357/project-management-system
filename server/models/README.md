# Server Database Models & Schema Design Manual

Technical reference guide for Mongoose models in `server/models/`.

---

## 1. User Model (`server/models/user.js`)

Represents all platform user identities (`Student`, `Teacher`, `Admin`).

### Schema Definition & Fields

```javascript
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Omitted from query results by default
    },
    role: {
      type: String,
      enum: ['Student', 'Teacher', 'Admin'],
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      default: 'Computer Science',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Faculty Specific Fields
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxStudents: {
      type: Number,
      default: 5,
    },
    // Student Specific Fields
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  { timestamps: true }
);
```

### Methods & Middleware Hooks
- **Pre-Save Hook**: Automatically hashes `password` using bcrypt with a salt factor of `10` whenever `isModified('password')` is true.
- **`comparePassword(candidatePassword)`**: Instance method executing `bcrypt.compare` against the stored password hash.

### Database Index Strategy
- `{ email: 1 }` (Unique Index) — Guarantees zero duplicate email registrations at the MongoDB engine layer.
- `{ role: 1, status: 1 }` (Compound Index) — Optimizes directory filtering and user queries.

---

## 2. Project Model (`server/models/project.js`)

Governs proposal submissions, evaluations, milestone deliverables, and completion status.

### Schema Definition & Fields

```javascript
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
};

const projectSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PENDING,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    files: [
      {
        fileType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    feedback: [
      {
        supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['positive', 'negative', 'general'], default: 'general' },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
```

### Database Index Strategy
- **Partial Unique Index**:
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
  - Enforces that a student can only have **one** active project in non-finalized status. Allows multiple historical completed/rejected records.
- `{ supervisor: 1, status: 1, isDeleted: 1 }` — Optimizes faculty supervision query execution.
- `{ status: 1, createdAt: -1 }` — Speeds up platform dashboard listing queries.

---

## 3. Connection Model (`server/models/connection.js`)

Manages peer network connections, pending applications, and block lists.

### Schema Definition & Fields

```javascript
const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
    cooldownUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
```

### Database Index Strategy
- `{ requester: 1, recipient: 1 }` (Compound Unique Index) — Prevents duplicate connection records between the same pair of users.

---

## 4. Meeting Model (`server/models/meeting.js`)

Manages video conference room instances and participant invitations.

### Schema Definition & Fields

```javascript
const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
```

### Database Index Strategy
- `{ host: 1, status: 1 }` — Speeds up meeting queries by host and room state.
- `{ invitedUsers: 1 }` — Optimizes user invitation dashboard lookup queries.

---

## 5. Message Model (`server/models/message.js`)

Direct chat message documents between users.

### Schema Definition & Fields

```javascript
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);
```

### Database Index Strategy
- `{ sender: 1, recipient: 1, createdAt: -1 }` (Compound Index) — Ensures fast conversation retrieval and unread message count queries.

---

## 6. Refresh Token Model (`server/models/refreshToken.js`)

Persists SHA-256 refresh token hashes for session security and token rotation.

### Schema Definition & Fields

```javascript
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);
```

### Database Index Strategy
- `{ tokenHash: 1 }` (Unique Index) — Speeds up token validation during refresh requests.
- `{ expiresAt: 1 }` (TTL Index) — Automatically removes expired token documents from MongoDB.
