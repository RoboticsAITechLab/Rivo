# Rivo — Staff Enrolment & Management System: Comprehensive Audit & Remediation Plan

**Document Version:** 1.0.0  
**Audit Date:** October 2026  
**Auditor:** Senior SaaS Architect, Security Engineer & Full-Stack Developer  
**Status:** AUDIT COMPLETE — AWAITING USER APPROVAL PRIOR TO IMPLEMENTATION  

---

## Executive Summary

This audit evaluates the complete **Staff Enrolment & Management Architecture** of the Rivo School Management System. It addresses:
1. **The Root Cause Resolution** of the error `Forbidden: Platform-level access required.` encountered by School Directors.
2. **Platform Control Plane vs. School Tenancy Decoupling**, ensuring that institutional roles (Director, Principal, Admin, Teacher, Staff) operate completely independently from platform administration.
3. **Staff Onboarding Paradigms**:
   - **Path A: Direct Full Enrolment** (Administrator provisions complete profile, employment details, credentials, documents, and immediate activation).
   - **Path B: Invitation Flow** (Administrator dispatches secure cryptographic invitation; invitee activates their account and configures credentials).
4. **Teaching vs. Non-Teaching Staff Workflows**:
   - **Teaching Staff**: Requires academic credentials, pedagogical qualifications (CTET/B.Ed), class/section/subject assignments, and academic KYC.
   - **Non-Teaching Staff** (Accountants, Administrators, Clerks, Lab Assistants, Transport Coordinators, Receptionists, Security): Requires operational employment information, departmental allocation, campus assignment, and KYC documents, **without** mandatory academic subject or classroom allocation.
5. **Authoritative Identification (ID) Generation**:
   - Continuous school-scoped sequence numbering for teachers (`{SCHOOL}-TCH-{XXXX}`) and general staff (`{SCHOOL}-STF-{XXXX}`).

---

## 1. Root Cause Analysis: "Forbidden: Platform-level access required."

### 1.1 The Triggering Bug
When a user logged in as **School Director** (`Role: DIRECTOR`, `SchoolMembership.role: DIRECTOR`) attempted to access school administration endpoints (`/api/users`, `/api/invitations`), the server responded with:
```json
{
  "message": "Forbidden: Platform-level access required."
}
```

### 1.2 Underlying Mechanism
In `apps/web/src/lib/auth/authorize.ts` (lines 360–370):
```typescript
// DEFECTIVE IMPLEMENTATION:
const targetScope = options?.scope || 
  (options?.roles?.some((r) => r === 'PLATFORM_ADMIN') ? 'PLATFORM' : 'SCHOOL');

if (targetScope === 'PLATFORM' && session.scope !== 'PLATFORM') {
  return { authorized: false, response: NextResponse.json({ message: 'Forbidden: Platform-level access required.' }, { status: 403 }) };
}
```

In the route definitions for `/api/users/route.ts` and `/api/invitations/route.ts`:
```typescript
// Route options mistakenly included PLATFORM_ADMIN alongside institutional roles:
const auth = await requireAuth(req, {
  roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'PLATFORM_ADMIN'],
});
```

Because `options.roles.some(r => r === 'PLATFORM_ADMIN')` evaluated to `true`, `targetScope` was inferred as `'PLATFORM'` for the entire endpoint. When a School Director made an API request, their session scope was `'SCHOOL'`. The guard checked `session.scope !== 'PLATFORM'`, resulting in an immediate 403 rejection.

### 1.3 Verified Fix Applied
1. In `apps/web/src/lib/auth/authorize.ts`:
   ```typescript
   const isExclusivelyPlatform =
     options?.roles &&
     options.roles.length > 0 &&
     options.roles.every((r) => r === 'PLATFORM_ADMIN');

   const targetScope = options?.scope || (isExclusivelyPlatform ? 'PLATFORM' : 'SCHOOL');
   ```
2. In `apps/web/src/app/api/users/route.ts` and `apps/web/src/app/api/invitations/route.ts`:
   - Removed `PLATFORM_ADMIN` from the tenant role lists.
   - School routes are now strictly bounded to institutional roles: `['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER']`.
3. **Verification**: Executed `npx tsx src/__tests__/platform-roles.test.ts` (24/24 tests passing). Confirmed clean boundary between platform control plane (`scope: PLATFORM`) and institutional operations (`scope: SCHOOL`).

---

## 2. Audit of Current Staff Architecture

### 2.1 Database Schema Analysis
| Entity | Model | Key Fields & Purpose | Gaps Identified |
| :--- | :--- | :--- | :--- |
| **User** | `User` | `email`, `firstName`, `lastName`, `phone`, `passwordHash`, `status` (`ACTIVE`, `INVITED`, `SUSPENDED`) | Authentication anchor. |
| **School Membership** | `SchoolMembership` | `userId`, `schoolId`, `role` (`Role` enum), `customRoleId`, `status` | Maps user to school tenant and role. Does **not** store employment details (designation, department, employeeId). |
| **Teaching Faculty** | `Teacher` | `employeeId`, `campusId`, `phone`, `department`, `designation`, `qualification`, `photoUrl`, `emergencyContact*`, `address`, `status` | Contains rich profile data, but is named `Teacher` and linked to `TeacherAssignment` and `TeacherDocument`. |
| **Staff Invitations** | `StaffInvitation` | `email`, `role`, `customRoleId`, `campusId`, `department`, `designation`, `tokenHash`, `expiresAt`, `acceptedAt`, `revokedAt` | Supports both built-in and custom roles. |
| **ID Sequences** | `IdSequence` | `schoolId`, `entityType` (`STUDENT`, `TEACHER`, `STAFF`, `RECEIPT`, `PAYMENT`), `year`, `lastNumber` | Atomic sequence counters per entity type. |
| **ID Format Config** | `IdFormatConfig` | `studentPrefix`, `teacherPrefix`, `staffPrefix`, `includeYear`, paddings | Configurable prefixes and formatting. |

### 2.2 Critical Architecture Gaps

#### Gap 1: Absence of a Unified Staff Profile Model
Currently, `Teacher` is the only employment profile table in `prisma/schema.prisma`. 
When an invitation is accepted for a non-teaching role (`STAFF`, `FEE_MANAGER`, `ADMIN`, or custom role):
- A `User` and `SchoolMembership` record are created.
- However, the `department`, `designation`, and `campusId` stored on the `StaffInvitation` are not persisted to any profile table.
- Non-teaching staff do not get an `employeeId` generated.
- Non-teaching staff cannot have documents uploaded or verified, because `TeacherDocument` has a foreign key to `Teacher.id`.

#### Gap 2: Teaching vs. Non-Teaching Onboarding Flow Asymmetry
- `/school/teachers/new` opens `TeacherOnboardingWorkspace`, which enforces:
  - Step 3: Academic Qualifications (CTET/B.Ed, University details).
  - Step 4: Teaching Assignments (Class, Section, Subject).
- Non-teaching personnel (e.g., Accountant, Office Clerk, Librarian, Security, Receptionist) cannot be onboarded via this workspace because they do not have class allocations or teaching certifications.
- Non-teaching personnel can only be invited via `/school/settings/users` or `/school/settings/invitations` using a simple email modal, which bypasses:
  - Employment details (joining date, contract type, emergency contacts, address).
  - Document uploads (Aadhaar, PAN, employment contract, police verification).
  - Authoritative ID generation (`{SCHOOL}-STF-0001`).

#### Gap 3: Direct Enrolment vs. Invitation Disconnect in Workspace
- In `TeacherOnboardingWorkspace`:
  - If a password is entered, it hashes the password and creates the user directly.
  - If password is omitted, it sets `user.status = 'INVITED'`, but does **not** generate a secure `StaffInvitation` token or dispatch an email.
  - The administrator has no explicit toggle between **"Direct Enrolment (Set credentials / immediate activation)"** and **"Invite via Email (Send activation link for staff self-setup)"**.

#### Gap 4: ID Generator Preview Endpoint Missing for Staff
- `apps/web/src/lib/id-generator/index.ts` has `generateNextStaffId()`, but lacks:
  - `getNextStaffIdPreview(schoolId)`
  - Dedicated route `/api/staff/next-id` for real-time frontend sequence previews.

#### Gap 5: Inconsistent Permission Guard on Invitations Route
- In `apps/web/src/app/api/invitations/route.ts` line 280:
  ```typescript
  const auth = await requireAuth(req, { permission: 'teachers.view' });
  ```
  Listing staff invitations required `teachers.view` instead of `invitations.view` or general administrative access. An administrator managing non-teaching staff could be blocked if their permission role did not include faculty view permissions.

---

## 3. Recommended Remediation Architecture

### 3.1 Design Choice: Supporting Non-Teaching Staff Profiles Safely
Under Rule 10 ("Do not mutate production data or execute migrations without explicit approval"), we have two architectural options:

#### Option A: Unified Staff/Employee Profile via Database Migration (Recommended long-term)
Introduce a new `StaffProfile` model in Prisma (or generalize `Teacher` into `Employee`/`Staff`).
- *Pros*: Clean domain model separation.
- *Cons*: Requires a database schema migration (`prisma migrate dev`/`prisma db push`). Under production rules, this requires explicit user confirmation.

#### Option B: Polymorphic Use of Existing `Teacher` Table (Zero-migration, Immediate)
In Rivo's current schema, the `Teacher` model already possesses all necessary fields for any school staff member:
- `employeeId`, `phone`, `department`, `designation`, `qualification`, `photoUrl`, `gender`, `dateOfBirth`, `joiningDate`, `employmentType`, `experienceYears`, `address`, `emergencyContactName`, `emergencyContactPhone`, `status`, `campusId`.
- For **Teaching Faculty**: `assignments` (TeacherAssignment) are populated; `employeeId` uses `{PREFIX}-TCH-{SEQ}`.
- For **Non-Teaching Staff**: `assignments` are empty; `employeeId` uses `{PREFIX}-STF-{SEQ}`.
- *Pros*: Zero risk to production database. Uses existing relations, document storage (`TeacherDocument`), and indexing immediately.

---

## 4. Prioritized Implementation Plan (Controlled Stages)

### Stage 1: Security & Route Hardening (Completed & Verified)
- [x] Fix `targetScope` inference in `apps/web/src/lib/auth/authorize.ts`.
- [x] Remove `PLATFORM_ADMIN` from `/api/users` and `/api/invitations`.
- [x] Update `GET /api/invitations` permission guard to check `invitations.view` or administrative roles (`DIRECTOR`, `PRINCIPAL`, `ADMIN`, `SCHOOL_ADMIN`, `OWNER`).
- [x] Verify complete suite with `platform-roles.test.ts`.

### Stage 2: ID Generator Enhancements
- [ ] Add `getNextStaffIdPreview(schoolId, client)` in `apps/web/src/lib/id-generator/index.ts`.
- [ ] Create `/api/staff/next-id` endpoint with proper permission verification (`invitations.create` or `users.create` or `teachers.create`).
- [ ] Ensure atomic sequence synchronization between teacher (`TCH`) and staff (`STF`) sequences.

### Stage 3: Unified Staff Onboarding Workspace
Upgrade `TeacherOnboardingWorkspace` into a **Unified Staff Onboarding Workspace**:
- [ ] **Role Selection & Mode Switcher** at Step 1:
  - Select Category: **Teaching Faculty** vs. **Administrative / Operational Staff**.
  - Dynamically adjust form steps:
    - If **Teaching**: Keep 6 steps (Personal -> Professional -> Academic/CTET -> Assignments -> KYC Docs -> Review).
    - If **Non-Teaching**: Adjust to 5 steps (Personal -> Professional & Department -> Operational/General Docs -> Review), cleanly skipping CTET/B.Ed and Class/Subject assignments.
- [ ] **Dual Provisioning Mode**:
  - **Option 1: Direct Enrolment**: Admin specifies credentials or auto-generates temp password, sets account active immediately.
  - **Option 2: Invitation Flow**: Admin checks "Send activation invite via email", generating a secure token and emailing the employee.
- [ ] **Authoritative ID Format Selection**:
  - Automatically switches between `TCH-XXXX` and `STF-XXXX` based on staff category.

### Stage 4: Staff Directory & Centralized Management UI
- [ ] Add category filter to staff directory: "All Staff", "Teaching Faculty", "Administrative & Support Staff".
- [ ] Enhance `/school/settings/users` to allow full profile viewing and linking directly to staff records.
- [ ] Ensure seamless invite dispatch, resend, revocation, and manual activation link retrieval.

### Stage 5: Verification & Automated Regression Testing
- [ ] End-to-end test for Direct Enrolment (Teacher and Non-Teacher).
- [ ] End-to-end test for Invitation Flow (Token generation, verification, and acceptance).
- [ ] ID Sequence concurrency and uniqueness test (`generateNextTeacherId` & `generateNextStaffId`).
- [ ] Strict Role Separation validation (Platform Owner vs. School Director vs. Principal vs. Staff).
