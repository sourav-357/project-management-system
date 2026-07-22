# 🎨 Frontend Client Architecture - React 18 + Vite + Tailwind CSS

The frontend client provides role-tailored workspaces for Students, Faculty Teachers, and System Admins. Built with React 18, Vite, Tailwind CSS, Socket.io client, and WebRTC peer connection handling.

---

## 📚 Table of Contents
- [Directory Structure](#directory-structure)
- [Axios Silent Token Refresh Architecture](#axios-silent-token-refresh-architecture)
- [State Management & Context API](#state-management--context-api)
- [Responsive Layout & Sidebar Architecture](#responsive-layout--sidebar-architecture)
- [WebRTC Media Track Teardown Safety](#webrtc-media-track-teardown-safety)
- [Component & Page Registry](#component--page-registry)

---

## Directory Structure

```
client/src/
├── api/
│   └── [axios.js](./src/api/axios.js)               # Axios instance with HTTP 401 token refresh
├── context/
│   └── [AuthContext.jsx](./src/context/AuthContext.jsx)        # Session state provider & logout handlers
├── components/
│   ├── [Navbar.jsx](./src/components/Navbar.jsx)             # Top header, dark theme toggle & profile badge
│   ├── [Sidebar.jsx](./src/components/Sidebar.jsx)            # Sticky constant navigation & mobile drawer
│   ├── [CallModal.jsx](./src/components/CallModal.jsx)          # 1-on-1 WebRTC Call Modal & Track release
│   └── [ProtectedRoute.jsx](./src/components/ProtectedRoute.jsx)     # RBAC Route Guard
└── pages/
    ├── [LandingPage.jsx](./src/pages/LandingPage.jsx)        # Platform hero landing page
    ├── [Login.jsx](./src/pages/Login.jsx)              # Authentication login form
    ├── [InstantChat.jsx](./src/pages/InstantChat.jsx)        # Real-time instant messaging workspace
    ├── [ProposalForm.jsx](./src/pages/ProposalForm.jsx)       # Student proposal editor & history
    ├── [TeacherProposals.jsx](./src/pages/TeacherProposals.jsx)   # Faculty proposal review hub
    ├── [UserManagement.jsx](./src/pages/UserManagement.jsx)     # Admin user directory & account creation
    └── [GroupMeeting.jsx](./src/pages/GroupMeeting.jsx)       # WebRTC group video meeting hub
```

---

## Axios Silent Token Refresh Architecture

Authentication state relies on a short-lived Access Token in memory and a long-lived `httpOnly` Refresh Token cookie.

```
 Client (Axios)                 Express API Server
       │                                 │
       │─── 1. API Request (Expired) ───>│
       │<── 2. HTTP 401 Unauthorized ────│
       │                                 │
       │─── 3. POST /auth/refresh-token >│
       │<── 4. New Access Token ─────────│
       │                                 │
       │─── 5. Retry Original Request ──>│
       │<── 6. HTTP 200 OK ──────────────│
```

Implemented inside [axios.js](./src/api/axios.js):
- On receiving HTTP 401, Axios intercepts the error.
- Hits `/api/v1/auth/refresh-token` seamlessly in the background.
- Updates the Access Token in memory and retries the failed API call automatically.

---

## State Management & Context API

[AuthContext.jsx](./src/context/AuthContext.jsx) provides clean global user state management without extra Redux dependencies:
- Stores `user` profile data, role permissions, and active session status.
- Implements `login()`, `logout()`, and `refreshUser()` helper functions.

---

## Responsive Layout & Sidebar Architecture

- **Sticky Constant Desktop Sidebar**: [Sidebar.jsx](./src/components/Sidebar.jsx) uses `sticky top-[65px] h-[calc(100vh-65px)]`. The navigation panel remains fixed while page content scrolls.
- **Mobile Navigation Drawer**: Uses a responsive slide-over overlay backdrop drawer for phone viewports (`<768px`).

---

## WebRTC Media Track Teardown Safety

In [CallModal.jsx](./src/components/CallModal.jsx):
- Whenever a call finishes, is declined, or window unmounts, `cleanupCall()` iterates through local and remote media streams:
```javascript
stream.getTracks().forEach((track) => {
  track.stop();
  track.enabled = false;
});
```
This guarantees that browser camera and microphone LEDs immediately turn off when calls end.

---

## Component & Page Registry

| Page / Component | Route | Role Access | Description |
| :--- | :--- | :--- | :--- |
| **LandingPage** | `/` | Public | Platform overview, features, and quick login links. |
| **Login** | `/login` | Public | Form login for pre-seeded or admin-created accounts. |
| **StudentDashboard** | `/student/dashboard` | Student | Overview of active project proposal and milestones. |
| **ProposalForm** | `/student/proposal` | Student | Active proposal editor + non-editable historical project cards. |
| **SupervisorSelector**| `/student/supervisors` | Student | View teachers & request supervision (Approved proposals only). |
| **TeacherProposals** | `/teacher/proposals` | Teacher | Review student project proposals (Approve/Reject + remarks). |
| **TeacherRequests** | `/teacher/requests` | Teacher | Manage incoming supervision requests (Accept/Decline). |
| **UserManagement** | `/admin/users` | Admin | Account creation modal + user status toggle (Active/Suspended). |
| **InstantChat** | `/chat` | All Roles | Real-time chat, emoji reactions, call history & connection tools. |
| **GroupMeeting** | `/meetings` | All Roles | WebRTC group video meeting hub with host controls. |

---

## 🔗 Related Documentation Links
- 🏠 [Root Project README](../README.md)
- 🖥️ [Backend Server README](../server/README.md)
- 📘 [Interview Q&A Guide](../INTERVIEW_QNA.md)
