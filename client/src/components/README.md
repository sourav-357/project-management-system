# Shared Components (`src/components/`)

Reusable UI building blocks used across role-specific pages.

---

## Component Registry

| Component | File | Purpose |
|-----------|------|---------|
| **Navbar** | [Navbar.jsx](./Navbar.jsx) | Top bar: branding, theme toggle, notifications drawer, profile menu |
| **Sidebar** | [Sidebar.jsx](./Sidebar.jsx) | Role-aware navigation; sticky on desktop, slide-over drawer on mobile |
| **ProtectedRoute** | [ProtectedRoute.jsx](./ProtectedRoute.jsx) | Redirects unauthenticated or wrong-role users to `/login` |
| **CallModal** | [CallModal.jsx](./CallModal.jsx) | Full-screen WebRTC 1-on-1 call UI with signaling |
| **NotificationDrawer** | [NotificationDrawer.jsx](./NotificationDrawer.jsx) | Slide-out panel for in-app notifications |

---

## ProtectedRoute

Wraps route groups in [App.jsx](../App.jsx):

```jsx
<Route element={<ProtectedRoute allowedRoles={['Student']} />}>
  {/* student pages */}
</Route>
```

Checks `AuthContext.user.role` against `allowedRoles`. Shows loading spinner during session restoration.

---

## Sidebar Layout

- **Desktop (`≥768px`):** Fixed sticky sidebar (`top: 65px`, full viewport height minus navbar)
- **Mobile:** Hamburger toggle opens overlay drawer with backdrop

Navigation items are filtered by user role—students see proposal/supervisor links; teachers see requests/proposals; admins see user/project management.

---

## CallModal — WebRTC Lifecycle

Critical for production and interview discussions:

1. **Initiate** — Creates `RTCPeerConnection`, gets user media, emits `initiate_call` via Socket.io
2. **Answer** — Handles `incoming_call`, creates answer SDP, emits `answer_call`
3. **ICE** — Relays candidates through `ice_candidate` events
4. **Cleanup** — On end, decline, or unmount:

```javascript
localStreamRef.current.getTracks().forEach(track => {
  track.stop();
  track.enabled = false;
});
```

Without explicit `track.stop()`, browser camera/microphone indicators remain active after calls end.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../pages/README.md](../pages/README.md) | Pages that consume these components |
| [../../README.md](../../README.md) | Root project overview |
| [../../../server/sockets/README.md](../../../server/sockets/README.md) | Socket event catalog |
