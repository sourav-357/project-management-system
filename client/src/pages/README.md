# Route Pages (`src/pages/`)

One React component per major view. Each page maps to a route defined in [App.jsx](../App.jsx).

---

## Public Pages

| Page | Route | File | Description |
|------|-------|------|-------------|
| Landing | `/` | [LandingPage.jsx](./LandingPage.jsx) | Platform hero, feature highlights, login links |
| Login | `/login` | [Login.jsx](./Login.jsx) | Email + password + role selector |
| Register | `/register` | [Register.jsx](./Register.jsx) | **Restriction notice only** — no signup form |
| Forgot Password | `/forgot-password` | [ForgotPassword.jsx](./ForgotPassword.jsx) | Sends reset email |
| Reset Password | `/reset-password` | [ResetPassword.jsx](./ResetPassword.jsx) | Sets new password from email token |

---

## Student Pages

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/student/dashboard` | [StudentDashboard.jsx](./StudentDashboard.jsx) | Project status, milestones, deadlines |
| Proposal | `/student/proposal` | [ProposalForm.jsx](./ProposalForm.jsx) | Create/edit proposal + read-only history |
| Supervisors | `/student/supervisors` | [SupervisorSelector.jsx](./SupervisorSelector.jsx) | Browse teachers, send supervisor request |
| Documents | `/student/documents` | [StudentFiles.jsx](./StudentFiles.jsx) | Upload/download project files |
| Feedback | `/student/feedback` | [StudentFeedback.jsx](./StudentFeedback.jsx) | View teacher feedback on project |
| Profile | `/student/profile` | [ProfileSettings.jsx](./ProfileSettings.jsx) | Avatar, password change |

---

## Teacher Pages

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/teacher/dashboard` | [TeacherDashboard.jsx](./TeacherDashboard.jsx) | Supervisee stats, pending items |
| Requests | `/teacher/requests` | [TeacherRequests.jsx](./TeacherRequests.jsx) | Accept/decline supervisor requests |
| Students | `/teacher/students` | [SupervisedStudents.jsx](./SupervisedStudents.jsx) | Assigned students and their projects |
| Proposals | `/teacher/proposals` | [TeacherProposals.jsx](./TeacherProposals.jsx) | Review approve/reject proposals |
| Milestones | `/teacher/milestones` | [TeacherMilestones.jsx](./TeacherMilestones.jsx) | Grade milestone submissions |
| Profile | `/teacher/profile` | [ProfileSettings.jsx](./ProfileSettings.jsx) | Shared profile settings |

---

## Admin Pages

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/admin/dashboard` | [AdminDashboard.jsx](./AdminDashboard.jsx) | Platform metrics |
| Users | `/admin/users` | [UserManagement.jsx](./UserManagement.jsx) | Create/edit/suspend students and teachers |
| Projects | `/admin/projects` | [ProjectManagement.jsx](./ProjectManagement.jsx) | All projects, override review, assign supervisor |
| Profile | `/admin/profile` | [ProfileSettings.jsx](./ProfileSettings.jsx) | Shared profile settings |

---

## Shared Pages (All Roles)

| Page | Route | File | Description |
|------|-------|------|-------------|
| Connections | `/connections` | [Connections.jsx](./Connections.jsx) | Explore, request, accept, block users |
| Chat | `/chat` | [InstantChat.jsx](./InstantChat.jsx) | Real-time messaging, reactions, 1-on-1 calls |
| Meetings List | `/meetings` | [MeetingsDashboard.jsx](./MeetingsDashboard.jsx) | Active and past group meetings |
| Meeting Room | `/meetings/:id` | [GroupMeeting.jsx](./GroupMeeting.jsx) | WebRTC group video + in-meeting chat |

---

## Key User Flows by Page

### ProposalForm (Student)

1. Student fills title, description, milestones
2. Saves as `draft` or submits as `submitted`
3. Rejected proposals become editable; completed ones appear as read-only history cards
4. Only one active project allowed at a time

### SupervisorSelector (Student)

- Enabled only when project status is `approved`
- Lists teachers with available capacity (`assignedStudents < maxStudents`)
- Sends `SupervisorRequest`; teacher responds on TeacherRequests page

### UserManagement (Admin)

- **Only place** to create student and teacher accounts
- Modal forms for create/edit with department, expertise, maxStudents
- Status toggle: active → suspended → archived

### InstantChat (All Roles)

- Friends list populated from accepted connections only
- Socket.io for live messages; REST for history pagination
- CallModal launched from chat header for voice/video

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../components/README.md](../components/README.md) | Shared UI components |
| [../../README.md](../../README.md) | Client package overview |
| [../../../README.md](../../../README.md) | Root project workflows |
| [../../../server/router/README.md](../../../server/router/README.md) | API endpoints these pages call |
