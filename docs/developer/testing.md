# Testing & Quality Assurance Reference

This document outlines the testing, linting, and type verification commands for `apps/web`.

---

## 1. Quality Assurance Verification Commands

The following commands are defined in `apps/web/package.json` and must pass with zero errors:

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Type Check** | `npx tsc --noEmit` | Strict static type validation across all components, pages, and hooks. |
| **Linting** | `npm run lint` | ESLint execution for syntax and React best practices. |
| **Production Build** | `npm run build` | Next.js production compilation and route bundle optimization. |
| **Development Server**| `npm run dev` | Starts local development server on `localhost:3000`. |

---

## 2. Validation Engine Unit Testing Plan

When writing tests for the core calculation engines, target the following pure functions in `src/shared/validation/`:

1. **`duplicate-detector.ts`**:
   - Verify that matching First Name + Last Name + DOB + Phone flags duplicate.
   - Verify that different DOB or Phone passes duplicate check.
2. **`timetable-conflict.ts`**:
   - Verify teacher collision detection across different sections during the same period.
   - Verify room double-booking detection.
3. **`roll-allocation-engine.ts`**:
   - Verify alphabetical ordering of examinee candidates.
   - Verify stream-aware sorting rules.
   - Verify that retired roll numbers are not re-issued.

---

## 3. Route Verification Checklist

Run through every core route before creating pull requests:
- `/login`, `/forgot-password`, `/verify-email`
- `/school` (verify KPI cards render without errors even with empty stores)
- `/school/students` (verify search, filtering, and 360 sheet open cleanly)
- `/school/students/admission` (verify 8-step wizard and document rules)
- `/school/teachers`, `/school/classes`, `/school/subjects`
- `/school/timetable`, `/school/attendance`, `/school/homework`
- `/school/exams`, `/school/results`, `/school/notices`
- `/school/settings/*` (verify independent sidebar scrolling and unsaved changes guard)
