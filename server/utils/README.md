# Utilities (`server/utils/`)

Shared helper functions used across controllers and services.

---

## Files

| File | Purpose |
|------|---------|
| [generateToken.js](./generateToken.js) | JWT access + refresh token generation and cookie setting |
| [emailTemplates.js](./emailTemplates.js) | HTML email templates for password reset |

---

## generateToken.js

Core authentication utility. Used by login, register, and refresh flows.

### generateTokenResponse(user, statusCode, message, req, res)

1. Creates access token (15 min default) signed with `JWT_ACCESS_SECRET`
2. Creates refresh token (7 days default) signed with `JWT_REFRESH_SECRET`
3. Hashes refresh token with SHA-256 → stores in `RefreshToken` collection with IP/userAgent
4. Sets httpOnly cookies:
   - `accessToken` — path `/`, SameSite Strict
   - `refreshToken` — path `/api/v1/auth/refresh-token`, SameSite Strict
5. Returns JSON `{ success, message, accessToken, user }`

### Why hash refresh tokens in DB?

Raw tokens are never stored. If the database is compromised, attackers cannot use stored hashes to authenticate. On refresh, incoming token is hashed and compared.

### Token rotation flow

On refresh:
1. Verify incoming refresh JWT
2. Look up hash in DB; check not revoked
3. Revoke old token (`isRevoked: true`)
4. Issue new pair
5. If revoked token is reused → revoke ALL user tokens (breach detection)

---

## emailTemplates.js

### generateForgotPasswordEmailTemplate(resetUrl, userName)

Returns HTML email with:
- Branded header
- Reset link button (15-minute expiry noted)
- Fallback plain URL

Used by `auth.controller.js` → `forgotPassword` handler via Nodemailer.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../models/refreshToken.js](../models/refreshToken.js) | Refresh token schema |
| [../controllers/auth.controller.js](../controllers/auth.controller.js) | Auth handlers using tokens |
| [../../README.md](../../README.md) | Root project (refresh token Q&A) |
| [../../client/src/api/README.md](../../client/src/api/README.md) | Client-side refresh interceptor |
