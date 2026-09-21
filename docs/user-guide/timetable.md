# Timetable & Period Management

The Timetable module (`/school/timetable`) provides an interactive weekly scheduling matrix across class sections, rooms, and academic periods. It ensures that teacher assignments and facility bookings do not conflict.

---

## 1. Core Scheduling Principles

1. **Configurable Period Structure**: Period start times, end times, durations, and labels (e.g., Period 1, Break, Period 5) are centrally configured in Timetable Settings (`/school/settings/operations/timetable`) and referenced by ID. They are never hardcoded.
2. **Conflict Prevention**: The timetable engine detects and prevents scheduling overlaps in real-time.
3. **Weekly Grid Layout**: Displays days of the academic week (Monday through Friday/Saturday) against configured periods.

---

## 2. Interactive Schedule Grid

### Navigation & Filtering
- **Class Selector**: Filters the matrix to show only periods assigned to a chosen grade level.
- **Section Selector**: Filters to a specific cohort within that class.
- **Room Filter**: Allows viewing the schedule for a specific facility (e.g., Physics Lab, Room 204).
- **Teacher View**: Toggles the matrix to inspect an individual faculty member's weekly teaching load.

```
+---------------+---------------+---------------+---------------+---------------+
| Period / Day  | Monday        | Tuesday       | Wednesday     | Thursday      |
+---------------+---------------+---------------+---------------+---------------+
| 08:30 - 09:15 | Math (Sec A)  | English (A)   | Math (Sec A)  | Science (A)   |
| Period 1      | Room 101      | Room 101      | Room 101      | Lab 1         |
|               | Teacher: T-01 | Teacher: T-04 | Teacher: T-01 | Teacher: T-08 |
+---------------+---------------+---------------+---------------+---------------+
| 09:15 - 10:00 | Physics (A)   | History (A)   | Computer (A)  | Math (Sec A)  |
| Period 2      | Lab 2         | Room 101      | Comp Lab      | Room 101      |
+---------------+---------------+---------------+---------------+---------------+
```

---

## 3. Creating & Assigning Periods

When clicking on an empty slot in the schedule grid:

1. **Select Subject**: Choose from the canonical Subject Catalog.
2. **Assign Teacher**: Choose an active faculty member qualified for the subject.
3. **Assign Room / Facility**: Specify the physical classroom or specialized lab.
4. **Validation Check**:
   - The engine verifies that the selected **Teacher** is not already assigned to another class during the same day and period.
   - The engine verifies that the selected **Room** is not double-booked.
   - The engine verifies that the target **Section** does not already have a class scheduled.
5. **Save Entry**: The slot updates instantly across views.

---

## 4. Conflict Resolution Engine

The scheduling conflict detector (`timetable-conflict.ts`) evaluates three collision dimensions:

| Conflict Dimension | Collision Condition | Error / Warning Presented |
| :--- | :--- | :--- |
| **Teacher Collision** | Same `teacherId` assigned to `Day + Period` in another section | "Teacher is already scheduled for Class X Section Y during this period." |
| **Room Collision** | Same `roomId` booked by another class during `Day + Period` | "Room/Lab is currently occupied by another class." |
| **Section Collision** | Multiple subjects mapped to the same Section in the same slot | "Section already has an active period." |

If a conflict is detected, the slot highlight turns red and confirmation is blocked until either the room, teacher, or period is reassigned.

---

## 5. Propagation & Schedule Changes

When period timings are updated in Settings (e.g., morning assembly shifts by 15 minutes):
- All timetable entries referencing `periodId` automatically reflect the updated time range on the UI.
- No historical data entry is corrupted because individual schedules bind to the abstract period identifier rather than hardcoded minute timestamps.
