# Error & Exception Reference

This reference documents the error codes, validation alerts, and boundary exception states encountered across the Rivo Web Application.

---

## 1. Authentication & Boundary Exceptions

| Error State | Triggering Condition | UI Presentation | Resolution |
| :--- | :--- | :--- | :--- |
| **`AUTH_INVALID_CREDENTIALS`** | Mismatched email or password on `/login` | Inline alert: *"Invalid email or password. Please try again."* | Re-enter valid credentials or trigger `/forgot-password`. |
| **`AUTH_ACCOUNT_LOCKED`** | Exceeded maximum failed login attempts (Password Policy) | Modal alert: *"Account locked due to consecutive failed attempts. Try again in 15 minutes or contact administrator."* | Wait for lockout expiry or request administrator unlock. |
| **`AUTH_UNVERIFIED_EMAIL`** | User attempting login before completing email confirmation | Redirect to `/verify-email?email=...` with notice | User checks inbox and follows verification token link. |
| **`ACCESS_DENIED_ROUTE`** | Authenticated user navigating to route prohibited by role | Redirect to `/access-denied` with descriptive explanation | Informs user of missing permission scope. |
| **`SESSION_EXPIRED`** | Idle duration exceeded `sessionTimeoutMinutes` | In-app notification with modal re-authentication prompt | Re-enter credentials to resume session without data loss. |

---

## 2. Validation & Collision Errors

| Error State | Code Location | UI Presentation | Resolution |
| :--- | :--- | :--- | :--- |
| **`STUDENT_DUPLICATE_FOUND`** | `duplicate-detector.ts` | `DuplicateDialog` modal showing matched student profile | Review existing profile; cancel intake or confirm override. |
| **`TIMETABLE_TEACHER_CLASH`** | `timetable-conflict.ts` | Slot turns red: *"Teacher already scheduled for Class X Section Y."* | Assign an alternative teacher or select another period. |
| **`TIMETABLE_ROOM_CLASH`** | `timetable-conflict.ts` | Slot turns red: *"Room is occupied by Class X during this period."* | Assign an available classroom or laboratory. |
| **`EXAM_CANDIDATE_CLASH`** | `exam-conflict-detector.ts` | Conflict modal: *"Candidate has 2 concurrent papers scheduled."* | Adjust time slot or separate paper sessions. |
| **`EXAM_VENUE_OVERCAPACITY`**| `exam-conflict-detector.ts` | Banner: *"Candidates (N) exceed room capacity (M)."* | Reallocate to larger examination hall or divide into sections. |
| **`MARKS_EXCEED_MAXIMUM`** | `apps/web/src/app/.../results`| Cell validation ring: *"Marks cannot exceed maximum (X)."* | Correct score entry within `0` to `maxMarks`. |

---

## 3. Empty State Guidance

| Context | Empty State Condition | Guidance Displayed |
| :--- | :--- | :--- |
| **No Academic Sessions** | Initial installation | Banner: *"No academic session configured. Create your first session in Settings."* |
| **No Classes / Sections** | Initial installation | Empty container with **+ Add Class** quick action. |
| **No Active Timetable** | Unscheduled section | Calendar placeholder: *"No timetable scheduled for this section. Click empty slots to add periods."* |
| **No Active Notices** | Filter returned 0 results | Notice feed placeholder: *"No active notices found for this cohort."* |
