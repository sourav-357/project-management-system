# Middlewares (`server/middlewares/`)

Cross-cutting concerns: authentication, authorization, file upload, async error handling, and centralized error responses.

---

## Pipeline Order

Configured in [app.js](../app.js):

```
1. helmet()                    Security headers
2. mongoSanitize()             Strip $ and . from user input
3. compression()               Gzip responses > 1KB
4. cookieParser()              Parse httpOnly cookies
5. express.json / urlencoded   Body parsing
6. rateLimit()                 2000 req / 15 min / IP
7. cors({ credentials: true }) Allowed origins
   ─── per-route ───
8. isAuthenticated             JWT verification
9. isAuthorized('Role', ...)   RBAC check
10. upload / validate          Route-specific
11. errorMiddleware            Catch-all error formatter
```

---

## Middleware Registry

### authMiddleware.js

| Export | Purpose |
|--------|---------|
| `isAuthenticated` | Verifies JWT access token from httpOnly cookie (`accessToken` or legacy `token`) |
| `isAuthorized(...roles)` | Checks `req.user.role` against allowed roles |

**Checks performed:**
- Token exists and is valid JWT
- User exists in database
- User is not soft-deleted (`isDeleted: false`)
- User is not suspended (`status !== 'suspended'`)

**Note:** REST auth reads cookies, not `Authorization: Bearer` header. Socket.io auth reads `socket.handshake.auth.token`.

---

### asyncHandler.js

Wraps async route handlers to forward rejected promises to Express error middleware:

```javascript
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Eliminates try/catch boilerplate in every controller.

---

### error.js

| Export | Purpose |
|--------|---------|
| `ErrorHandler` | Custom error class with `statusCode` and `message` |
| `errorMiddleware` | Formats all errors as `{ success: false, message }` JSON |

Operational errors (400, 401, 403, 404) return their status code. Unhandled errors return 500 without leaking stack traces in production.

---

### upload.js

Multer configuration for file uploads.

| Setting | Value |
|---------|-------|
| Max file size | 10 MB |
| Max files per request | 10 |
| Allowed types | PDF, DOCX, ZIP, PNG, JPG, JPEG |
| Avatar field | Single file (`avatar`) |
| Project files | Array field (`files`) |

Exports `handleUploadError` middleware for Multer error formatting.

---

## Security Decisions (Interview Focus)

| Decision | Rationale |
|----------|-----------|
| httpOnly cookies for tokens | JavaScript cannot access them — XSS-resistant |
| mongoSanitize | Prevents `{ "$gt": "" }` NoSQL injection |
| Rate limiting | Mitigates brute-force and DoS |
| Role check at router level | Single enforcement point, not scattered in controllers |
| Suspended user check in auth | Immediate lockout without token invalidation delay |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../router/README.md](../router/README.md) | Where middleware is applied |
| [../controllers/README.md](../controllers/README.md) | Handlers wrapped by asyncHandler |
| [../../README.md](../../README.md) | Root auth architecture |
