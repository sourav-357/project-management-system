# Request Validations (`server/validations/`)

Input validation middleware applied at the router level before controllers execute. Returns 400 with descriptive messages on invalid input.

---

## Files

| File | Used By | Validates |
|------|---------|-----------|
| [authValidation.js](./authValidation.js) | user.route.js | Register and login payloads |
| [projectValidation.js](./projectValidation.js) | student.route.js | Proposal and supervisor request payloads |

---

## authValidation.js

### validateRegisterInput

| Field | Rules |
|-------|-------|
| name | Required, non-empty string |
| email | Required, valid email format |
| password | Required, minimum length |
| role | Required; must be allowed role |

### validateLoginInput

| Field | Rules |
|-------|-------|
| email | Required, valid format |
| password | Required |
| role | Required (`Student`, `Teacher`, or `Admin`) |

---

## projectValidation.js

### validateProposalInput

| Field | Rules |
|-------|-------|
| title | Required, trimmed, max length |
| description | Required |
| milestones | Array with title and dueDate per item |
| status | Optional; `draft` or `submitted` |

### validateSupervisorRequestInput

| Field | Rules |
|-------|-------|
| supervisorId | Required, valid ObjectId |
| message | Optional string |

---

## Validation Pattern

Validators are Express middleware functions:

```javascript
export const validateLoginInput = (req, res, next) => {
  const errors = [];
  // check fields...
  if (errors.length) return next(new ErrorHandler(errors.join(', '), 400));
  next();
};
```

Errors flow to the centralized error middleware via `next(new ErrorHandler(...))`.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [../router/README.md](../router/README.md) | Where validators are mounted |
| [../middlewares/README.md](../middlewares/README.md) | Error handling pipeline |
| [../controllers/README.md](../controllers/README.md) | Handlers receiving validated input |
