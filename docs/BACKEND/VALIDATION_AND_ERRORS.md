# Backend Validation & Error Handling Architecture

> **Last Verified:** November 11, 2026  
> **Source Directory:** `apps/web/src/app/api`, `apps/web/src/lib/validation`

---

## 1. Input Validation Architecture

In `apps/web`, input validation is enforced server-side within API route handlers using deterministic assertions, type coercion guards, and specialized validators:

### Core Validation Strategies
1. **Sanitization:** String trimming, case normalization, and Unicode NFC normalization (`name.trim().normalize('NFC')`).
2. **Numeric Validation:** Strict positive decimal/integer checks (`amount > 0`, `Number.isInteger(periodNumber)`).
3. **Enum Validation:** Type casting against generated Prisma enums (`Object.values(Role).includes(body.role)`).
4. **File Validation (`lib/storage/validation.ts`):**
   - Category quota limits: Avatars (2MB), Logos (3MB), Documents (10MB).
   - Magic-byte file signature validation:
     - JPEG: `0xFF 0xD8 0xFF`
     - PNG: `0x89 0x50 0x4E 0x47`
     - WebP: `RIFF .... WEBP`
     - PDF: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
   - SVG avatars are strictly rejected to eliminate stored cross-site scripting (XSS).

---

## 2. Standardized Response Envelopes

Every API route in `apps/web/src/app/api` emits a standardized JSON envelope:

### Success Envelopes
```json
// Entity creation / mutation
{
  "success": true,
  "message": "Fee payment recorded successfully.",
  "payment": { "id": "...", "paymentNumber": "RCP-2026-001" },
  "receiptId": "rec_uuid"
}

// Queries with pagination
{
  "students": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 340,
    "totalPages": 14
  }
}
```

### Error Envelopes
```json
{
  "success": false,
  "code": "CLASH_TEACHER_DOUBLE_BOOKED",
  "message": "Teacher Rahul Sharma is already assigned to Class 10-A during Period 2 on Monday.",
  "errors": [
    "Conflict detected with slot slot_uuid in Room 104"
  ]
}
```

---

## 3. Standard HTTP Status Code Map

| HTTP Status | Meaning | Typical Usage in Rivo API Handlers |
| :---: | :--- | :--- |
| **200 OK** | Successful Query / Update | Successful `GET`, `PUT`, `PATCH`, or `DELETE` requests. |
| **201 Created** | Entity Created | Successful `POST` creating records (admissions, payments, plans). |
| **400 Bad Request** | Validation Failure | Missing required fields, invalid date formats, overpayment attempts. |
| **401 Unauthorized** | Missing / Expired Session | No `rivo_session` cookie or token expired/revoked. |
| **403 Forbidden** | Role / Scope Boundary | Teacher attempting to view unassigned students; Admin accessing Security settings. |
| **404 Not Found** | Record Missing | Target student, plan, or invoice ID does not exist in the tenant. |
| **409 Conflict** | Business Rule Violation | Duplicate admission number, timetable clash, or publishing locked plan. |
| **415 Unsupported Media** | Invalid File Signature | File magic bytes do not match declared MIME type. |
| **422 Unprocessable** | Invariant Violation | Fee installment sums do not equal plan total amount. |
| **429 Rate Limited** | Request Limit Exceeded | Brute-force protection on `/api/auth/login` or OTP verification. |
| **500 Server Error** | Unhandled Server Exception | Uncaught exception; stack trace redacted in production. |
| **503 Unavailable** | Datastore Offline | Neon PostgreSQL or Redis connection pool unreachable. |

