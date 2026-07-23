# Configuration (`server/config/`)

Application bootstrap configuration: database connection, default user seeding, and Cloudinary integration.

---

## Files

| File | Purpose |
|------|---------|
| [db.js](./db.js) | MongoDB connection via Mongoose; triggers seed on success |
| [seed.js](./seed.js) | Per-role default user bootstrap |
| [cloudinary.js](./cloudinary.js) | Cloudinary SDK configuration for file uploads |

---

## Database Connection (`db.js`)

```javascript
await mongoose.connect(process.env.MONGO_URI);
await seedDefaultUsers();
```

- Exits process with code 1 on connection failure
- Seed runs on every successful connect (idempotent—only creates missing roles)

---

## Seed System (`seed.js`)

Creates one default account **per role** when that role has zero non-deleted users:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@university.edu` | `admin123456` | Department: Administration |
| Teacher | `teacher@university.edu` | `teacher123456` | maxStudents: 10, expertise array |
| Student | `student@university.edu` | `student123456` | Department: Computer Science |

Passwords are hashed by the User model pre-save hook before storage.

### Why per-role seeding?

If an admin manually creates users but no teacher exists yet, the seed still provisions a demo teacher independently. More resilient than a single "total count === 0" check.

---

## Cloudinary (`cloudinary.js`)

Configures Cloudinary SDK from environment variables:

- Project deliverables → `academic_platform/projects/<projectId>/`
- User avatars → dedicated avatar folder

When Cloudinary credentials are absent, [services/fileService.js](../services/fileService.js) falls back to local disk in `server/uploads/`.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Backend overview |
| [../../README.md](../../README.md) | Root project (seed credentials) |
| [../services/fileService.js](../services/fileService.js) | File upload pipeline |
