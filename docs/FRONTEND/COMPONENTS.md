# Frontend Component Architecture

> **Last Verified:** November 11, 2026  
> **Source Directory:** `apps/web/src/components` & `apps/web/src/features`

---

## 1. Headless UI Primitives (`components/ui`)

Rather than relying on third-party design component kits, Rivo utilizes a bespoke, accessible headless UI primitive suite designed with standard `class-variance-authority` (cva) conventions:

| Primitive File | Component Symbol | Responsibilities & Variants |
| :--- | :--- | :--- |
| `button.tsx` | `Button`, `buttonVariants` | Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. Handles loading spinner and disabled state. |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Structural card wrapper with rounded borders, subtle background, and padding tokens. |
| `badge.tsx` | `Badge`, `badgeVariants` | Variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`. |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle` | Pure React context-based modal with backdrop, focus trapping, and keyboard escape handling. |
| `sheet.tsx` | `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle` | Slide-out side drawer for editing workflows (e.g. `HomeworkFormSheet`, `StudentImportSheet`). |
| `dropdown-menu.tsx` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | Native click-outside dropdown menu for action bars and row menus. |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Accessible horizontal tabs for multi-tab views (e.g. Student 360 profile). |
| `input.tsx` | `Input` | Styled HTML input with focus ring and error state classes. |
| `label.tsx` | `Label` | Accessible form label element. |
| `switch.tsx` | `Switch` | Accessible animated toggle switch component. |
| `separator.tsx` | `Separator` | Horizontal or vertical layout divider. |
| `avatar.tsx` | `Avatar`, `AvatarImage`, `AvatarFallback` | Circular avatar with image loading and initials fallback. |
| `skeleton.tsx` | `Skeleton` | Animated pulse placeholder for loading states. |
| `empty-state.tsx` | `EmptyState` | Consistent zero-data placeholder with title, description, and action button. |
| `status-badge.tsx` | `StatusBadge` | Domain-aware status indicator (Active, Draft, Overdue, Cancelled). |

---

## 2. Layout & Shell Components (`components/layout`)

- **`AppShell` (`components/layout/app-shell.tsx`):**
  - Manages the primary admin layout grid.
  - Controls sidebar collapse state (expanded: 256px, collapsed: 72px) with `localStorage` persistence.
  - Mounts desktop `Sidebar`, `TopNav`, and mobile `MobileNav` sheet drawer.
- **`Sidebar` (`components/layout/sidebar.tsx`):**
  - Displays institutional brand and logo.
  - Organizes routes into clear categories: Overview, People (Students, Teachers), Academics (Classes, Subjects, Timetable, Exams, Results), Operations (Attendance, Homework, Notices, Notifications), Finance (Fees), and System (Settings).
- **`TopNav` (`components/layout/top-nav.tsx`):**
  - Displays active school tenant badge and current academic year.
  - Mounts `CommandSearch` palette trigger (`⌘K`).
  - Houses user profile dropdown with role badge, settings link, and logout button.
- **`CommandSearch` (`components/layout/command-search.tsx`):**
  - Modal search palette triggered via `Cmd+K` / `Ctrl+K`.
  - Searches navigation routes, students, teachers, and settings modules with instant keyboard navigation.

---

## 3. Major Domain Feature Components (`features/` & `components/`)

### 1. Student Admission Workspace (`components/students/admission/admission-workspace.tsx`)
- **Scale:** 2,038 lines of comprehensive, code-split intake logic.
- **Multi-Step Stepper:** Personal Information, Guardian Details, Academic Enrollment, Document Attachments, Custom Fields, and Final Review.
- **Motion Integration:** Directional slide transitions (`AnimatePresence`) honoring `prefers-reduced-motion`.
- **Integrations:** Next ID preview generation (`/api/students/next-id`), Azure Blob direct SAS photo upload, duplicate detection engine.

### 2. Fee Management Workspaces (`components/fees/`)
- **`FeePaymentModal`:** Interactive payment collection modal calculating outstanding dues, partial payment allocations, and payment mode options.
- **`FeePlanBuilder`:** Multi-step wizard validating installment percentages and head allocations.

### 3. Faculty Workspaces (`features/teachers/`)
- **`TeacherOnboardingWorkspace`:** Comprehensive faculty creation flow with employee ID generation, department mapping, and qualification inputs.
- **`TeacherPermissionsEditor`:** Interactive granular permission override matrix allowing admins to grant or revoke specific capabilities per teacher.

