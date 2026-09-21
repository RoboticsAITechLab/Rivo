# Navigation & Workspace Layout

## 1. Global Shell Structure

The Rivo Web Application uses a standardized, responsive application shell (`AppShell`) across all `/school/*` routes:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [≡] School > Settings > School Profile                  [Search ⌘K] [🔔] [👤]│
├───────────────────────┬──────────────────────────────────────────────────────┤
│ GLOBAL RIVO SIDEBAR   │ MAIN VIEWPORT / WORKSPACE                            │
│ (Desktop Collapsible) │ (Width: Up to 1536px)                                │
│                       │                                                      │
│ RIVO - School Cap     │                                                      │
│ ───────────────────── │                                                      │
│ ACADEMIC MANAGEMENT   │                                                      │
│ • Dashboard           │                                                      │
│ • Students            │                                                      │
│ • Teachers            │                                                      │
│ • Classes             │                                                      │
│ • Subjects            │                                                      │
│                       │                                                      │
│ OPERATIONS            │                                                      │
│ • Timetable           │                                                      │
│ • Attendance          │                                                      │
│ • Homework            │                                                      │
│ • Exams               │                                                      │
│ • Results             │                                                      │
│                       │                                                      │
│ COMMUNICATION         │                                                      │
│ • Notices             │                                                      │
│ • Notifications       │                                                      │
│                       │                                                      │
│ ADMINISTRATION        │                                                      │
│ • Settings ✓          │                                                      │
└───────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. Navigation Components

### 1. Global Collapsible Sidebar (`Sidebar`)
- **Location**: Pinned to the left side on desktop displays (`lg:` breakpoint and wider).
- **Collapsible Toggle**: Click the bottom collapse icon (`<` / `>`) to collapse the sidebar from 256px (`w-64`) to an icon-only strip (`w-18` / 72px), maximizing screen real-estate for wide timetable matrices and examination schedules.
- **Scroll Isolation**: Features `overscroll-contain` so scrolling the navigation list never causes the main page to jump or scroll unexpectedly.

### 2. Top Navigation Bar (`TopNav`)
- **Location**: Sticky header across the top of every page.
- **Components**:
  - **Mobile Hamburger Button (`[≡]`)**: Opens the slide-over navigation drawer on tablet and mobile viewports.
  - **Dynamic Breadcrumbs**: Reflects exact hierarchical path with clean title casing (e.g. `School > Settings > School Profile`).
  - **Global Command Palette (`⌘K` / `Ctrl+K`)**: Opens an instant spotlight search to jump to any student, teacher, class, examination, or administrative setting.
  - **Notifications Bell (`🔔`)**: Direct access to `/school/notifications` with unread alert dot indicator.
  - **User Navigation Avatar (`👤`)**: Displays current logged-in user profile, role badge, quick link to School Settings, and Sign Out action.

---

## 3. Settings Control Center Navigation (`SettingsNav`)

When working inside **Settings** (`/school/settings/*`), Rivo provides a dedicated, fixed **Settings Sidebar**:
- **Width**: 260px desktop width.
- **Height**: Fixed viewport-contained (`h-full overflow-y-auto overscroll-contain`).
- **Independent Scrolling**: The Settings Sidebar stays stationary while the active form or table on the right scrolls. If the sidebar contains more items than the screen height, only the sidebar scrolls internally without affecting the main page.
- **No Duplicate Tabs**: Serves as the single primary navigation for all 8 administrative categories (General, Academic, Operations, People, Security, Communication, Documents, Data).
- **Mobile Two-Level Drawer**: On mobile devices, clicking **Sections** opens a category browser (`General ›`, `Academic ›`, etc.) followed by sub-item selection with instant search.

---

## 4. Keyboard Shortcuts

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `⌘K` or `Ctrl+K` | Global | Opens the Global Command Search Palette. |
| `Escape` | Global | Closes open search palettes, modals, sheets, and dialogs. |
| `Tab` / `Shift+Tab` | Forms | Navigates forward/backward through input fields and buttons. |
| `Enter` | Forms / Dialogs | Submits current focused modal form. |
| `Space` | Checkboxes / Switches | Toggles switch states and selection checkboxes. |
