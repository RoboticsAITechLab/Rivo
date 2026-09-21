# Academic Sessions Administration

The Academic Sessions module (`/school/settings/academic/sessions`) governs school years, calendar bounds, and the active session context.

---

## 1. Academic Session Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| **Session Name** | String | Descriptive calendar period (e.g., "2025-2026", "2026-2027") |
| **Start Date** | Date | Official beginning of the academic calendar |
| **End Date** | Date | Official conclusion of the academic calendar |
| **Is Current** | Boolean | Flags the primary active session for standard daily operations |
| **Status** | Enum | `ACTIVE`, `UPCOMING`, or `ARCHIVED` |

---

## 2. Active Session Principles

- **Single Current Session**: Exactly one academic session may be flagged as `isCurrent = true` at any given time. Marking a new session as current automatically unflags the previous session.
- **Historical Immutability**: Sessions marked as `ARCHIVED` enter read-only state. Attendance registers, marks, and historical timetable records associated with archived sessions cannot be mutated.
- **Cascade Scope**:
  - Class Enrollments belong to an Academic Session.
  - Formal Examinations are bound to an Academic Session.
  - Class & Exam Roll Number allocations are calculated within the scope of an Academic Session.

---

## 3. Administrative Workflows

### Creating a New Session
1. Navigate to `/school/settings/academic/sessions`.
2. Click **Add Academic Session**.
3. Specify Name, Start Date, and End Date.
4. If starting the academic year immediately, toggle **Set as Current Session**.
5. Save. The session becomes available across class promotion and exam creation wizards.

### Transitioning to a New Academic Year
1. Create the upcoming session in advance with status `UPCOMING`.
2. Complete all end-of-year examinations, moderation, and result publication under the current session.
3. Perform grade progression / student promotion into the upcoming session.
4. Set the new session as `isCurrent = true`.
5. Transition the previous session status to `ARCHIVED`.
