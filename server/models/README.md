# 📊 Mongoose Database Models & Compound Indexing Defense

This directory defines Mongoose schemas, data validation rules, and compound index strategies for MongoDB.

---

## 🛠️ Schema Models Summary

### 1. `User` Model ([user.js](./user.js))
- Enforces role enums (`Student`, `Teacher`, `Admin`), department affiliation, avatar URLs, and assigned supervisee counts.
- **Indexes**:
  - `{ email: 1 }`: Unique index for fast $O(1)$ login lookups.
  - `{ role: 1, status: 1, isDeleted: 1 }`: Compound index for filtering user directories.

### 2. `Project` Model ([project.js](./project.js))
- Stores project proposal metadata, approval status (`draft`, `submitted`, `under_review`, `approved`, `rejected`, `completed`), feedback timeline array, and milestone deliverable references.
- **Indexes**:
  - `{ student: 1 }`: Unique partial index enforcing 1 active project per student.

### 3. `Connection` Model ([connection.js](./connection.js))
- Manages network connection requests (`pending`, `accepted`), friend relationships, and block lists (`blockedBy`).

### 4. `Message` Model ([message.js](./message.js))
- Stores 1-on-1 instant messages, unread flags (`isRead`), reply parent links (`replyTo`), and quick emoji reaction arrays (`reactions`).

### 5. `CallHistory` Model ([callHistory.js](./callHistory.js))
- Logs 1-on-1 WebRTC audio and video calls (`completed`, `declined`, `missed`) with timestamp durations.

### 6. `Meeting` Model ([meeting.js](./meeting.js))
- Stores group WebRTC video meetings, invited participants, host metadata, and meeting room statuses.

---

## 🔗 Documentation Links
- 🏠 [Root Project README](../../README.md)
- 🖥️ [Backend Server README](../README.md)
