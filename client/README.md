# Frontend Client — React 19 + Vite 8 + Tailwind CSS 4

Role-tailored SPA for Students, Teachers, and Admins. Handles authentication session restoration, REST API communication with silent token refresh, Socket.io real-time events, and WebRTC peer connections for calls and meetings.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Authentication Flow](#authentication-flow)
- [Real-Time Features](#real-time-features)
- [Build & Deploy](#build--deploy)
- [Documentation Index](#documentation-index)

---

## Architecture Overview

```
Browser
  │
  ├── React Router 7          Role-based route guards (ProtectedRoute)
  ├── AuthContext             Global session state (user, login, logout)
  ├── Axios (api/axios.js)    REST calls + 401 → refresh → retry
  ├── Socket.io Client        Chat, call signaling, meeting rooms
  └── WebRTC (native)         1-on-1 calls + group meeting media
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:3000`, so the client always talks to the backend on a single origin during development.

---

## Directory Structure

```
client/
├── README.md                 ← You are here
├── index.html
├── vite.config.js            Dev proxy + React plugin + Tailwind
├── package.json
├── .env.example
├── public/
│   └── icons.svg
└── src/
    ├── README.md             Source tree overview
    ├── main.jsx              React DOM entry
    ├── App.jsx               Router + layout shell
    ├── App.css / index.css   Global styles
    ├── api/
    │   └── README.md         Axios instance & token refresh
    ├── context/
    │   └── README.md         AuthContext provider
    ├── components/
    │   └── README.md         Shared UI components
    └── pages/
        └── README.md         Route pages by role
```

---

## Development Setup

```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

Ensure the backend is running on port 3000 before testing authenticated routes or Socket.io features.

---

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend base URL (defaults to proxied `/api/v1` in dev) |

---

## Authentication Flow

1. User submits email, password, and role on `/login`.
2. Server sets httpOnly cookies (access + refresh) and returns user JSON.
3. `AuthContext` stores user in React state; access token held in memory via `axios.js`.
4. On app load, `AuthContext` calls `/auth/refresh-token` to restore session from refresh cookie.
5. On HTTP 401, Axios interceptor refreshes token silently and retries the failed request.

Details: [src/api/README.md](./src/api/README.md) · [src/context/README.md](./src/context/README.md)

---

## Real-Time Features

| Feature | Page | Transport |
|---------|------|-----------|
| Instant messaging | `/chat` | Socket.io + REST history |
| 1-on-1 voice/video | `/chat` (CallModal) | WebRTC + Socket.io signaling |
| Group meetings | `/meetings` | WebRTC mesh + Socket.io |
| Notifications | Navbar drawer | REST polling |

WebRTC cleanup: [src/components/README.md](./src/components/README.md)

---

## Build & Deploy

```bash
npm run build     # Output in dist/
npm run preview   # Preview production build locally
```

For production, set `VITE_API_URL` to your deployed backend URL and configure CORS on the server to allow your frontend origin with credentials.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | 19 | UI framework |
| vite | 8 | Dev server, HMR, production bundler |
| react-router-dom | 7 | Client-side routing |
| tailwindcss | 4 | Utility-first CSS |
| axios | 1.x | HTTP client with interceptors |
| socket.io-client | 4 | WebSocket real-time transport |
| lucide-react | 1.x | SVG icon library |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Root project overview |
| [../server/README.md](../server/README.md) | Backend API reference |
| [src/README.md](./src/README.md) | Source entry points |
| [src/api/README.md](./src/api/README.md) | Axios & token refresh |
| [src/context/README.md](./src/context/README.md) | AuthContext |
| [src/components/README.md](./src/components/README.md) | Shared components |
| [src/pages/README.md](./src/pages/README.md) | All route pages |
