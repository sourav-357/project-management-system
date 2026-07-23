# API Layer (`src/api/`)

Centralized HTTP client for all REST communication with the backend.

---

## Files

| File | Purpose |
|------|---------|
| [axios.js](./axios.js) | Configured Axios instance with base URL, credentials, and 401 refresh interceptor |

---

## Axios Configuration

- **Base URL:** `/api/v1` (proxied to backend in dev via Vite)
- **Credentials:** `withCredentials: true` — sends httpOnly cookies on every request
- **In-memory access token:** Updated after login and refresh; attached as `Authorization: Bearer` header

---

## Silent Token Refresh Flow

```
Request fails with 401
        │
        ▼
Is refresh already in progress?
   Yes ──> Queue this request, retry when refresh completes
   No  ──> POST /auth/refresh-token
                │
        Success ──> Update in-memory token, retry original request
        Failure ──> Clear session, redirect to /login
```

This prevents multiple simultaneous refresh calls when several API requests expire at once (request queue pattern).

---

## Usage in Pages

```javascript
import api from '../api/axios';

const { data } = await api.get('/student/project');
```

Never import raw `axios` in pages—always use the configured instance so refresh logic applies globally.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Client source overview |
| [../../README.md](../../README.md) | Root project (auth architecture) |
| [../context/README.md](../context/README.md) | Session state provider |
