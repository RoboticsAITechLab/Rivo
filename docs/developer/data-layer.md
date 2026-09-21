# Data Layer & API Integration Boundaries

This document outlines the current data persistence architecture in `apps/web` and defines the integration contracts required for production backend services.

---

## 1. Current Client-Side Persistence Model

In the current MVP release:
- The web application executes all CRUD mutations, business validations, and conflict calculations directly within the client-side Zustand store (`school-store.ts`).
- State is initialized with clean configuration defaults (zero fictitious demo students, zero mock teachers).
- State can be persisted across browser refreshes via localStorage synchronization.

---

## 2. Target Production API Boundaries

When connecting `apps/web` to production microservices or REST/GraphQL backends:

```
+-------------------+             +-----------------------+             +----------------------+
|   Next.js UI      |   REST/     |   Backend API Gateway |   Prisma/   |   PostgreSQL /       |
|   (apps/web)      | ──────────> |   (Node.js / Go)      | ──────────> |   Neon Database      |
|   Client Store    | <────────── |   JWT Auth & Scopes   | <────────── |   Central Schema     |
+-------------------+             +-----------------------+             +----------------------+
```

### Essential API Endpoint Contracts

| Target Endpoint | Method | Expected Payload / Response |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Body: `{ email, password }` -> Returns: `{ user, token, mfaRequired }` |
| `/api/school/students` | `GET` | Query params: `classId, sectionId, search` -> Returns: `StudentDetail[]` |
| `/api/school/students` | `POST` | Body: Full intake payload -> Returns: `StudentDetail` |
| `/api/school/attendance` | `POST` | Body: `AttendanceRegister` -> Commits daily register |
| `/api/school/exams/[id]/results` | `PUT` | Body: Marks matrix -> Commits and updates grades |
| `/api/school/settings/[category]`| `PATCH` | Body: Partial category config -> Updates institutional settings |

---

## 3. Data Integrity Principles

- **No Silent Fallbacks**: If an API mutation fails, the client store must revert optimistic updates and present the server error message to the user.
- **Idempotent Mutations**: All POST/PUT requests involving financial or examination publication data must include idempotency keys to prevent double execution.
