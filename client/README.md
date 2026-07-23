# Client Application — React 19 + Vite 8 + Tailwind CSS 4

Modern, responsive single-page frontend application powering the Academic FYP Governance Platform.

---

## Technical Overview

- **Framework**: React 19 built with Vite 8 for fast HMR.
- **Styling**: Tailwind CSS 4 with custom dark/light theme tokens and modern glassmorphism UI elements.
- **Icons**: Lucide React icon library.
- **Routing**: React Router 7 with client-side role guards (`ProtectedRoute`).
- **HTTP**: Axios instance with automated 401 interceptors for silent refresh token rotation.
- **Real-Time**: Socket.io Client and WebRTC peer connection signaling.

---

## Page Registry

| Page File | Route Path | Access Role | Description |
|-----------|------------|-------------|-------------|
| `Login.jsx` | `/login` | Public | Role-based authentication portal |
| `Register.jsx` | `/register` | Public | Initial Admin bootstrap registration notice |
| `StudentDashboard.jsx` | `/student/dashboard` | `Student` | Student governance home & lifecycle tracker |
| `ProposalForm.jsx` | `/student/proposal` | `Student` | Proposal document builder & proposal history |
| `SupervisorSelector.jsx` | `/student/supervisors` | `Student` | Faculty directory & supervision request dialog |
| `StudentFiles.jsx` | `/student/documents` | `Student` | Deliverables document repository |
| `TeacherDashboard.jsx` | `/teacher/dashboard` | `Teacher` | Faculty supervision portal & capacity meter |
| `TeacherProposals.jsx` | `/teacher/proposals` | `Teacher` | Supervised proposals evaluation & project completion |
| `TeacherRequests.jsx` | `/teacher/requests` | `Teacher` | Supervision & peer request inbox |
| `AdminDashboard.jsx` | `/admin/dashboard` | `Admin` | System control panel & analytics metrics |
| `UserManagement.jsx` | `/admin/users` | `Admin` | User directory table & account creator |
| `ProjectManagement.jsx` | `/admin/projects` | `Admin` / `Teacher` | Global platform project board |
| `Connections.jsx` | `/connections` | Authenticated | Peer network, explore directory & block list |
| `MeetingsDashboard.jsx` | `/meetings` | Authenticated | Video meetings dashboard & instant room creator |
| `GroupMeeting.jsx` | `/meetings/:meetingId` | Authenticated | WebRTC video conference room |
| `ProfileSettings.jsx` | `/profile` | Authenticated | Avatar uploader, password change & session manager |
