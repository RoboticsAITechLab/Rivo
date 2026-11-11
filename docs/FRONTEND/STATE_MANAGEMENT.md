# Frontend State Management & Data Patterns

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src/shared/mock-store`, `apps/web/src/lib/auth`, React Hooks

---

## 1. Overview of State Architecture

The frontend avoids monolithic global state libraries (e.g. Redux). State is partitioned across four clear levels:
1. **Server-Side URL State:** Navigation tabs, query filters, search strings (`useSearchParams`, `useRouter`).
2. **Context Providers:** Authentication identity (`AuthProvider`) and modal overlay contexts (`SheetContext`, `DialogContext`).
3. **Component Local State:** Controlled form inputs, stepper state, loading spinners, and validation error records (`useState`, `useReducer`).
4. **Data Fetching & Cache:** Component-level `useEffect` hooks querying Next.js App Router API endpoints (`/api/*`) with `credentials: 'include'`.

---

## 2. Authentication Context (`lib/auth/auth-context.tsx`)

The `AuthProvider` wraps the entire application tree inside `apps/web/src/app/layout.tsx`:

```typescript
export interface AuthContextValue {
  user: CurrentUser | null;
  authState: 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

- **Bootstrap Lifecycle:**
  1. On initial mount, `useEffect` triggers `authService.getCurrentUser()`.
  2. Calls `GET /api/auth/me`.
  3. If valid, populates `user` and sets `authState = 'AUTHENTICATED'`.
  4. If invalid or 401, clears user and sets `authState = 'UNAUTHENTICATED'`.
- **Session Refresh:** `refreshUser()` can be invoked following profile updates or tenant switches to re-fetch permissions without page reloads.

---

## 3. Cross-Component Synchronization & Events

- **Parent Portal Child Switcher:**
  - Multi-child parents select active children via a top dropdown.
  - The selection persists in `localStorage` (`rivo_selected_child_id`).
  - To synchronize disparate child components without prop drilling, the layout dispatches a custom browser event:
    ```typescript
    window.dispatchEvent(new CustomEvent('parentChildSwitched', { detail: { childId } }));
    ```
  - Dependent pages (`/parent/fees`, `/parent/results`) listen for `parentChildSwitched` to reload data instantly.

---

## 4. The Central Store & Technical Debt (`school-store.ts`)

- **Location:** `apps/web/src/shared/mock-store/school-store.ts` (1,532 lines, 47 KB).
- **Implementation:** Custom state store utilizing React's `useSyncExternalStore`.
- **Historical Role vs Current Reality:**
  - In earlier MVP phases, `schoolStore` held mock in-memory arrays.
  - In the current codebase, it was cleared to empty arrays (`initialCanonicalStudents = []`, etc.), as all primary pages moved to direct REST API fetching.
  - **Remaining Coupling:** 27 files (including shared entity selectors like `class-select.tsx` and `teacher-select.tsx`) still import from `schoolStore`.
- **Architectural Recommendation:** Migrate all shared selectors in `apps/web/src/shared/entities/` to lightweight React hooks calling real backend endpoints (`/api/classes`, `/api/teachers`, `/api/subjects`).

