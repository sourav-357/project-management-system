# Client Source (`src/`)

Entry point for the React application. All application logic lives under this directory.

---

## Entry Files

| File | Role |
|------|------|
| [main.jsx](./main.jsx) | Mounts `<App />` into `#root` |
| [App.jsx](./App.jsx) | Defines all routes, `DashboardLayout`, and role guards |
| [App.css](./App.css) | Component-scoped and layout styles |
| [index.css](./index.css) | Tailwind directives and global theme variables |

---

## Module Map

```
src/
├── api/           HTTP layer (Axios + refresh interceptor)
├── context/       Global React context providers
├── components/    Reusable UI (Navbar, Sidebar, CallModal, etc.)
└── pages/         One file per route/view
```

---

## Routing Architecture

`App.jsx` organizes routes into three layers:

1. **Public** — `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
2. **Role-protected** — Wrapped in `<ProtectedRoute allowedRoles={[...]} />`
3. **Dashboard layout** — Navbar + Sidebar + `<Outlet />` for nested pages

Shared routes (all authenticated roles): `/connections`, `/chat`, `/meetings`, `/meetings/:id`

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Client package overview |
| [../../README.md](../../README.md) | Root project overview |
| [api/README.md](./api/README.md) | Axios configuration |
| [context/README.md](./context/README.md) | Auth state management |
| [components/README.md](./components/README.md) | Shared components |
| [pages/README.md](./pages/README.md) | Route page registry |
