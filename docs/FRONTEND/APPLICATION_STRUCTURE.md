# Frontend Application Structure

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src`

---

## 1. Directory Tree & Architecture Boundaries

The web application source directory (`apps/web/src`) separates layout routing, modular UI features, reusable headless primitives, and domain services:

```
apps/web/src/
├── app/                          # Next.js 16 App Router (Pages, Layouts, API Handlers)
│   ├── (auth)/                   # Authentication route group (public / semi-protected)
│   ├── (parent)/                 # Parent Portal route group
│   ├── (school)/                 # School Admin OS route group
│   ├── (teacher)/                # Teacher Portal route group
│   ├── access-denied/            # 403 Forbidden error screen
│   ├── admin/                    # Legacy admin area (redirects to /testing-center)
│   ├── testing-center/           # Standalone live testing and diagnostic center
│   ├── api/                      # 30+ Domain API route handlers (74+ endpoints)
│   ├── layout.tsx                # Root layout (AuthProvider, Geist fonts)
│   └── page.tsx                  # Root redirect (/ -> /login)
├── components/                   # Presentation and layout components
│   ├── auth/                     # AuthGuard, role guards, login wrappers
│   ├── dashboard/                # Operational stats cards, attention queues
│   ├── fees/                     # Payment modals, fee cards, plan builders
│   ├── layout/                   # AppShell, TopNav, Sidebar, MobileNav, CommandSearch
│   ├── navigation/               # NavIcon, active route markers
│   ├── students/                 # AdmissionWorkspace (2000 lines), roll rebalance
│   └── ui/                       # Headless UI primitives (Button, Dialog, Sheet, Tabs)
├── features/                     # Modular domain feature components
│   ├── attendance/               # Attendance register components
│   ├── classes/                  # Class & section builders, validations
│   ├── homework/                 # Homework form sheet & assignment cards
│   ├── settings/                 # Modular settings components
│   ├── shared/                   # Shared feature components
│   ├── subjects/                 # Subject catalog cards
│   ├── teachers/                 # Faculty onboarding workspace & permissions editor
│   └── timetable/                # Weekly timetable matrix and period slots
├── lib/                          # Core business services & utilities
│   ├── auth/                     # Auth service, session resolution, crypto, MFA
│   ├── fees/                     # Fee ledger service, payment service, PDF engine
│   ├── id-generator/             # Sequential identifier generator
│   ├── students/                 # Student admission, roll-number balancing service
│   ├── storage/                  # Azure Blob direct SAS upload & magic-byte validation
│   ├── timetable/                # Timetable clash validation engine
│   └── testing/                  # Testing center runner, health adapter, load engine
├── shared/                       # Shared entity selectors and conflict validators
├── types/                        # Active TypeScript interfaces and domain models
└── middleware.ts                 # Next.js Edge Middleware security guard
```

---

## 2. Layout Hierarchy & Shell Integration

### Root Shell Structure
```
RootLayout (apps/web/src/app/layout.tsx)
 └── AuthProvider (apps/web/src/lib/auth/auth-context.tsx)
      ├── (auth)/layout.tsx (Hero branding panel + centered form)
      ├── (school)/school/layout.tsx
      │    └── AuthGuard (components/auth/auth-guard.tsx)
      │         └── AppShell (components/layout/app-shell.tsx)
      │              ├── TopNav (School badge, CommandSearch, UserNav)
      │              ├── Sidebar (collapsible desktop sidebar, 256px -> 72px)
      │              └── MobileNav (slide-out sheet drawer for mobile)
      ├── (teacher)/teacher/layout.tsx (Faculty sidebar + RBAC guard)
      ├── (parent)/parent/layout.tsx (Child switcher + bottom tab bar)
      └── testing-center/layout.tsx (Platform engineering dark theme)
```

- **AppShell Features:**
  - Collapsible desktop sidebar with persistent state in `localStorage`.
  - Global `Cmd+K` / `Ctrl+K` Command Search palette for instant route and entity navigation.
  - Active path highlighting derived dynamically via `usePathname()`.
  - Institutional tenant badge displaying current school name and session.

