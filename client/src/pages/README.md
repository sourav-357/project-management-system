# Client Pages Module Reference

Detailed breakdown of all user-facing dashboard and management pages.

---

## Component Index

### 1. `StudentDashboard.jsx`
Student home workspace featuring greeting hero banner, 4-stage project governance lifecycle status bar (0% to 100%), metric cards, quick action tiles, and completed project history drawer.

### 2. `ProposalForm.jsx`
Document proposal builder supporting proposal title and abstract entry, active project lock notices, and historical proposal drawer with quick "Create New Proposal" trigger.

### 3. `SupervisorSelector.jsx`
Faculty selection directory displaying available teachers with expertise tags, department info, capacity meters (`assignedStudents.length / maxStudents`), and supervision request dialog.

### 4. `StudentFiles.jsx`
Document repository supporting drag-and-drop file selector, file type icons, download triggers, and read-only lock banner when project is completed.

### 5. `TeacherDashboard.jsx`
Faculty portal featuring supervision capacity gauge, pending request metrics, and supervisee directory table with drop supervision action.

### 6. `TeacherProposals.jsx`
Supervised proposals evaluation desk with filter tabs (All, Pending, Approved, Completed), evaluation remarks drawer, and "Mark Project as Completed" lock action.

### 7. `TeacherRequests.jsx`
Supervision and peer request inbox displaying student department context, request notes, and accept/decline action controls.

### 8. `AdminDashboard.jsx`
System governance panel featuring student and faculty metrics, total proposals count, approval conversion gauge, and global system overview.

### 9. `UserManagement.jsx`
Paginated user directory table with live search, role filters, account status switches (`active`/`suspended`), CSV export, and student/teacher provisioning modals.

### 10. `ProjectManagement.jsx`
Global platform project board displaying all proposals, supervisor assignment modals, and completed read-only cards.

### 11. `Connections.jsx`
Peer networking hub with tabs for My Connections, Explore Network, Pending Requests, and History/Blocked directory with direct message shortcuts.

### 12. `MeetingsDashboard.jsx`
Video conference dashboard displaying active calls and simple "Start Meeting" modal.

### 13. `ProfileSettings.jsx`
User account card featuring avatar image uploader, password update form, and active session termination manager.
