# Authorization & Access Control

Rivo enforces a multi-tiered Role-Based Access Control (RBAC) model combined with data scoping boundaries.

---

## 1. Authorization Layers

Access control is evaluated across three primary layers:

```
[HTTP Request]
      │
      ▼
1. Route Middleware (`middleware.ts`)
      │  Checks: Is user authenticated? Does user role permit accessing `/school/*`?
      ▼
2. Page / Layout RBAC Guards
      │  Checks: Does current user hold required permissions for this specific view?
      ▼
3. Component & Action Guards
         Checks: Does user have permission to click "Publish", "Delete", or "Edit"?
```

---

## 2. Role Boundaries

| Role | Permitted Route Prefixes | Forbidden Route Prefixes |
| :--- | :--- | :--- |
| **School Admin** | `/school/*` (Universal access) | N/A |
| **Teacher** | `/school/attendance`, `/school/homework`, `/school/timetable`, `/school/exams`, `/school/results` | `/school/settings/*`, `/school/settings/security/*` |
| **Student** | `/student/*` (Portal routes) | `/school/*`, `/school/settings/*` |
| **Parent** | `/parent/*` (Portal routes) | `/school/*`, `/school/settings/*` |

Attempting to navigate directly to an unauthorized route triggers an immediate redirect to `/access-denied`.

---

## 3. Scope Boundaries

Beyond role permissions, records are evaluated against the user's operational scope:
- **Campus Scope**: If a user is scoped to Campus A, records from Campus B are excluded from query results unless the user has `SCHOOL` scope.
- **Assignment Scope**: A teacher can only record attendance or enter marks for class sections to which they are officially assigned in the academic timetable or section directory.
