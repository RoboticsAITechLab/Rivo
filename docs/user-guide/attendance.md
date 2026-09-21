# Daily Attendance Register (`/school/attendance`)

## 1. Overview

The **Attendance Module** (`/school/attendance`) manages daily student presence tracking, morning roll calls, status classifications, and administrative attendance audits.

---

## 2. Daily Attendance Register Grid

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Daily Attendance Register                                 [Export Register ▾]│
│ Class: [Class 10 ▾]   Section: [Section A ▾]   Date: [2026-09-21 📅]         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Register Status: [UNSAVED CHANGES]  |  Present: 38  |  Absent: 2  |  Late: 1 │
├───────┬────────────────────────┬─────────┬───────────────────────────────────┤
│ ROLL  │ STUDENT NAME           │ ADM NO  │ STATUS SELECTION                  │
├───────┼────────────────────────┼─────────┼───────────────────────────────────┤
│ 101   │ Sharma, Aarav          │ ADM-842 │ (•) Present  ( ) Absent  ( ) Late │
│ 102   │ Patel, Ananya          │ ADM-843 │ ( ) Present  (•) Absent  ( ) Late │
│ 103   │ Khan, Zaid             │ ADM-845 │ (•) Present  ( ) Absent  ( ) Late │
├───────┴────────────────────────┴─────────┴───────────────────────────────────┤
│ [Mark All Present]                           [Discard]  [Save Register (38)] │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Supported Status Codes

As configured in `/school/settings/attendance`:
- **`PRESENT` (`P`)**: Student attended morning roll call and scheduled periods.
- **`ABSENT` (`A`)**: Student did not attend school. Can trigger automated SMS/Email notification to parent guardians.
- **`LATE` (`L`)**: Arrived after the school bell cutoff. Counted in attendance statistics per institutional policy.
- **`EXCUSED` (`E`) / `MEDICAL` (`M`)**: Absence excused by formal parent letter or medical certificate. Does not penalize examination eligibility thresholds.

---

## 4. Operational Rules & Cutoffs

1. **Class-Section Scoping**: Attendance registers are keyed by `${classId}:${sectionId}:${date}`. Each section has exactly one authoritative register per calendar date.
2. **Mark All Present Shortcut**: Clicking **Mark All Present** defaults every student to `PRESENT`, allowing teachers to rapidly toggle only absent or late individuals.
3. **Locking Past Records**:
   - As configured in **Attendance Settings**, teachers are permitted to mark attendance only on the current date or within the configured marking window (e.g. up to 10:30 AM).
   - Past attendance records (older than 24 hours) are automatically locked to prevent unauthorized alterations. Only users with the `ADMIN` role or `Attendance: EDIT` permission with `SCHOOL` scope can unlock and correct historical registers.
4. **Unsaved Changes Protection**: If a teacher modifies register statuses and attempts to change the date or navigate away without saving, Rivo's **Unsaved Changes Dialog** prompts to confirm or discard changes.
