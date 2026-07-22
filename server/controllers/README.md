# 🎮 Controllers Layer Architecture

Controllers in this architecture parse incoming HTTP request payloads, enforce ABAC authorization policies, delegate business operations to services, and return standardized JSON responses.

---

## 📋 Controller Modules Summary

- **`auth.controller.js`**: `login`, `refreshToken` (token rotation), `logout`, `forgotPassword`, `resetPassword`, `getMe`, `updateAvatar`.
- **`student.controller.js`**: `submitProposal` (1 active project limit), `requestSupervisor` (approved proposals guard), `uploadDeliverableDocument`, `getStudentDashboard`.
- **`teacher.controller.js`**: `getIncomingRequests`, `respondToRequest` (atomic capacity check), `reviewProposal` (approve/reject), `sendStructuredFeedback`, `getSupervisedStudents`.
- **`admin.controller.js`**: `createUser` (admin-only provisioning for Students & Teachers), `toggleUserStatus` (Active/Suspended), `getAllUsers`, `reviewProposalAdmin` (override review).
- **`chat.controller.js`**: `getFriends`, `getConversationMessages`, `clearChat`, `getCallHistory`, `deleteCallRecord`.
- **`connection.controller.js`**: `getExploreUsers`, `sendConnectionRequest`, `acceptConnectionRequest`, `removeConnection`, `blockUserDirectly`.
- **`meeting.controller.js`**: `createMeeting`, `getMeetings`, `joinMeeting`, `cancelMeeting`.

---

## 🔗 Documentation Links
- 🏠 [Root Project README](../../README.md)
- 🖥️ [Backend Server README](../README.md)
