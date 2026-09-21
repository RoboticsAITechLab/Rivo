# Routing & Route Protection

This document explains the route organization, route groups, and middleware guards implemented in `apps/web`.

---

## 1. Route Groups & Layout Organization

Next.js App Router route groups organize views without altering the public URL path:

```
src/app/
├── (auth)/             # Route group for unauthenticated gateways
│   ├── login/          # Maps to /login
│   ├── forgot-password/# Maps to /forgot-password
│   └── verify-email/   # Maps to /verify-email
│
├── (school)/           # Route group for institutional dashboard
│   ├── layout.tsx      # Enforces AppShell, TopNav, and Sidebar
│   └── school/         # Base path /school
│       ├── page.tsx    # Executive dashboard
│       ├── students/   # /school/students
│       ├── teachers/   # /school/teachers
│       └── settings/   # /school/settings/*
│
└── access-denied/      # Standalone authorization failure boundary
```

---

## 2. Middleware & Navigation Interception

### Authentication Gate (`middleware.ts`)
- Evaluates the presence of an active session token on all incoming requests matching `/school/:path*`.
- Unauthenticated requests are intercepted and redirected to `/login?returnUrl=...`.

### Role-Based Access Gate
- If an authenticated user's role is `Teacher`, accessing restricted URLs like `/school/settings/*` or `/school/settings/security/*` redirects them to `/access-denied`.
- Users accessing `/portal` are automatically redirected to their appropriate workspace (`/school` for admins, `/teacher` for faculty).
