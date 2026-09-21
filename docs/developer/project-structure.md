# Project Directory Structure

This document outlines the codebase organization of `apps/web` within the Rivo monorepo.

---

## 1. Directory Tree Overview

```
apps/web/
├── public/                 # Static assets, branding marks, and default avatars
├── src/
│   ├── app/                # Next.js App Router route hierarchy
│   │   ├── (auth)/         # Public authentication gateways (/login, /verify-email, etc.)
│   │   ├── (school)/       # Core school operational routes (/school, /students, etc.)
│   │   ├── access-denied/  # Authorization boundary page
│   │   ├── layout.tsx      # Root HTML and metadata layout
│   │   └── page.tsx        # Root entrypoint redirect
│   │
│   ├── components/         # Shared presentation components
│   │   ├── auth/           # Login form, permission gates, MFA prompts
│   │   ├── layout/         # AppShell, TopNav, Sidebar, PageHeader
│   │   ├── students/       # Student directory, 360 sheet, admission wizard
│   │   └── ui/             # Radix UI / shadcn base design primitives
│   │
│   ├── features/           # Domain-specific feature modules
│   │   └── settings/       # Settings navigation, types, hooks, forms
│   │
│   ├── shared/             # Cross-cutting institutional utilities
│   │   ├── entities/       # Universal selector components and contextual modals
│   │   ├── mock-store/     # Zustand central school store (`school-store.ts`)
│   │   └── validation/     # Conflict engines (duplicate, timetable, exam, roll)
│   │
│   ├── lib/                # Core helper utilities (formatting, styling clsx/twMerge)
│   └── types/              # Global TypeScript declarations
│
├── package.json            # Scripts and dependencies
├── tailwind.config.ts      # Institutional design system color tokens
└── tsconfig.json           # Strict TypeScript configuration
```

---

## 2. Key Directories Explained

### `src/app/(school)/school/`
Contains all authenticated school administration and academic management pages. Every route in this group inherits the institutional `AppShell` with the global top navigation bar, campus selector, and sidebar.

### `src/features/settings/`
Encapsulates all institutional configuration panels. Contains `SettingsNav`, `useUnsavedChanges`, and configuration types for General, Academic, Operations, People, Security, Communication, Documents, and Data.

### `src/shared/entities/`
Hosts the `UniversalSelector` component and contextual modals (`+ Add New Class`, `+ Add New Subject`, etc.), ensuring consistent selection and on-the-fly entity creation across the application.
