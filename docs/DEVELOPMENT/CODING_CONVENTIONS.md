# Coding Standards & Architecture Conventions

> **Last Verified:** November 11, 2026  
> **Status:** Mandatory Engineering Conventions

---

## 1. Multi-Tenant Query Rules

1. **Mandatory Tenant Scoping:**
   - Every database query accessing school-scoped models (`Student`, `Teacher`, `Class`, `FeePlan`, `AttendanceRegister`, etc.) **must** include `schoolId: auth.schoolId` in its `where` clause.
   - Example:
     ```typescript
     // CORRECT:
     const student = await prisma.student.findFirst({
       where: { id: studentId, schoolId: auth.schoolId }
     });

     // WRONG (CRITICAL SECURITY VIOLATION):
     const student = await prisma.student.findUnique({
       where: { id: studentId }
     });
     ```
2. **Never Trust Client Tenant Identifiers:**
   - Never accept `schoolId` as an unvalidated parameter from request bodies or query strings for authenticated users. Always derive `schoolId` from the cryptographically verified `auth.schoolId`.

---

## 2. Transactional Concurrency Rules

1. **Mandatory Transactions on Multi-Table Mutations:**
   - Any operation that updates multiple tables, generates sequential numbers, or records financial transactions **must** be wrapped in `prisma.$transaction(async (tx) => ...)`.
2. **Double-Entry Financial Invariants:**
   - Payments must allocate funds to specific obligation IDs.
   - Balances must be recalculated inside the transaction.
   - Reversals must restore original obligation balances before marking the payment as reversed.

---

## 3. Frontend Component Conventions

1. **Client vs. Server Components:**
   - Mark interactive components (forms, modals, tabs, search bars) with `'use client';` at the top of the file.
   - Server Components should be used for layouts and static data wrappers where possible.
2. **Design System Primitives:**
   - Use headless primitives from `apps/web/src/components/ui/` (`Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Badge`).
   - Do not install competing UI component libraries (e.g. Material UI, Chakra UI, Ant Design).
3. **Motion & Accessibility:**
   - Use the `motion` package (`import { motion } from 'motion/react'`).
   - Always honor `prefers-reduced-motion` using Tailwind's `motion-reduce:` utilities or the `useReducedMotion()` hook.
4. **Icons:**
   - Use `lucide-react`. Wrap dynamic lookups in `NavIcon` to prevent undefined icon crashes.

---

## 4. API Route Handler Standards

1. **Centralized Auth Guard:**
   - Begin route handlers with `requireAuth()`:
     ```typescript
     const auth = await requireAuth(req, { permission: 'students.view', scope: 'SCHOOL' });
     if (!auth.authorized) return auth.response;
     ```
2. **Standardized Responses:**
   - Success: `NextResponse.json({ success: true, ...data }, { status: 200 })`
   - Errors: `NextResponse.json({ success: false, code: 'ERROR_CODE', message: '...' }, { status: 400 })`
3. **Secret Redaction:**
   - Never log full user objects, tokens, passwords, or connection strings in `console.log` or server telemetry.

