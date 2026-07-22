# 🛡️ Middlewares Pipeline & Authorization Guards

Middlewares provide cross-cutting security, JWT token verification, role-based access control (RBAC), and centralized error handling.

---

## 🔒 Security Middleware Pipeline Execution Order

```
Express App
  │
  ├── 1. Helmet Security Headers
  ├── 2. express-mongo-sanitize (NoSQL Injection Defense)
  ├── 3. Gzip Compression (Payloads > 1KB)
  ├── 4. Cookie Parser & Express Body Parser
  ├── 5. express-rate-limit (200 reqs / 15 mins)
  ├── 6. CORS (Allowed origins & credentials enabled)
  │
  ├── 7. Auth Guard (`isAuthenticated` verifies Access Token)
  ├── 8. Role Guard (`isAuthorized('Admin', 'Teacher')`)
  └── 9. Centralized Error Handler (`errorMiddleware`)
```

---

## Key Middleware Modules

- **`auth.middleware.js`**: Decodes JWT Access Token and checks account status (`!user.isDeleted && status !== 'suspended'`).
- **`upload.middleware.js`**: Enforces Multer 10MB document upload limits and allowed file extensions (PDF, DOCX, ZIP, PNG, JPG).
- **`error.middleware.js`**: Standardizes operational exceptions into uniform `{ success: false, message }` JSON responses.

---

## 🔗 Documentation Links
- 🏠 [Root Project README](../../README.md)
- 🖥️ [Backend Server README](../README.md)
