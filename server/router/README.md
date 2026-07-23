# Server Router Module Reference

The `router` layer defines Express route mount points, mapping REST HTTP verbs to controller methods and applying authentication (`isAuthenticated`) and role authorization (`isAuthorized`) middlewares.

---

## Mounted Routes Overview (Base Prefix: `/api/v1`)

| Router File | Prefix | Authorization Roles | Purpose |
|-------------|--------|---------------------|---------|
| `user.route.js` | `/auth` | Public / Authenticated | Authentication, token rotation, avatar upload |
| `admin.route.js` | `/admin` | `Admin` | Account provisioning, user directory, global overrides |
| `student.route.js` | `/student` | `Student` | Proposal submissions, supervisor requests, uploads |
| `teacher.route.js` | `/teacher` | `Teacher` | Proposal evaluations, project completion, supervisee drop |
| `connection.route.js` | `/connections` | Authenticated | Peer connection graph, explore directory, block controls |
| `chat.route.js` | `/chat` | Authenticated | Direct messaging history, read badges, emoji reactions |
| `meeting.route.js` | `/meetings` | Authenticated | Instant video meetings dashboard and creation |
