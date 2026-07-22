# ⚡ Services Layer & Production File Storage Architecture

The services layer encapsulates domain business logic, MongoDB queries, and file storage pipelines.

---

## Production File Storage Architecture (`fileService.js`)

- **Cloud Storage (Cloudinary)**: When students upload project deliverables or avatars, `uploadProjectFile` streams binaries to Cloudinary under folder `academic_platform/projects/<projectId>`.
- **Ephemeral Storage Protection**: Cloud platforms (Render, Railway, AWS ECS, Heroku) use ephemeral file systems. Cloudinary guarantees permanent file persistence across container restarts.
- **Development Fallback**: Falls back to local disk storage in `server/uploads/` if cloud credentials are absent during local development.

---

## Concurrency Protection & Atomic Write-Locks

- **`teacherService.js`**: Employs atomic Mongoose write-locks:
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
This guarantees faculty supervisor capacity limits cannot be overbooked during simultaneous request acceptances.

---

## 🔗 Documentation Links
- 🏠 [Root Project README](../../README.md)
- 🖥️ [Backend Server README](../README.md)
