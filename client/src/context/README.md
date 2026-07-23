# React Context (`src/context/`)

Global state providers that avoid Redux overhead for this application's scope.

---

## Files

| File | Purpose |
|------|---------|
| [AuthContext.jsx](./AuthContext.jsx) | User session, login, logout, profile refresh |

---

## AuthContext

### Provided values

| Property / Method | Description |
|-------------------|-------------|
| `user` | Current authenticated user object (null if logged out) |
| `loading` | True while session restoration is in progress |
| `login(email, password, role)` | Authenticates and stores user |
| `logout()` | Revokes refresh token, clears state, redirects |
| `refreshUser()` | Re-fetches `/auth/me` to sync profile changes |

### Session restoration on app load

On mount, `AuthContext` calls `POST /auth/refresh-token`. If the httpOnly refresh cookie is valid, a new access token is issued and `/auth/me` populates the user state—no re-login required after browser refresh.

### Consumer usage

```javascript
import { useAuth } from '../context/AuthContext';

const { user, logout } = useAuth();
```

The entire app is wrapped in `<AuthProvider>` inside [App.jsx](../App.jsx).

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../api/README.md](../api/README.md) | Token refresh interceptor |
| [../components/README.md](../components/README.md) | ProtectedRoute uses auth state |
| [../../README.md](../../README.md) | Root auth architecture |
