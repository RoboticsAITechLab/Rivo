# Timetable Setup Workflow

This workflow guides administrators and academic coordinators in configuring institutional periods and populating the master weekly schedule.

---

## 1. Sequential Workflow

```
[1. Configure Working Days & Conflict Rules]
                     │
                     ▼
[2. Define Abstract Periods & Time Bounds]
                     │
                     ▼
[3. Verify Rooms & Specialized Facilities]
                     │
                     ▼
[4. Populate Class Schedules on Weekly Grid]
                     │
                     ▼
[5. Resolve Any Real-Time Teacher or Room Clashes]
                     │
                     ▼
[6. Commit Schedule & Propagate to Daily Views]
```

---

## 2. Step-by-Step Instructions

### Step 1: Establish Institutional Working Schedule
1. Open `/school/settings/operations/timetable`.
2. Select working days (e.g., Monday through Friday, or Monday through Saturday).
3. Ensure conflict detection toggles are enabled: Teacher Conflict Detection, Room Conflict Detection, and Class Conflict Detection.

### Step 2: Define Periods
1. Under Timetable Periods in Settings, define periods sequentially:
   - Period 1: 08:30 - 09:15
   - Period 2: 09:15 - 10:00
   - Break: 10:00 - 10:20 (Non-teaching interval)
   - Period 3: 10:20 - 11:05
2. Save periods. These IDs become the canonical scheduling slots.

### Step 3: Verify Facilities
1. Ensure physical classrooms and laboratories (Physics Lab, Computer Center) are registered under `/school/settings/operations/rooms`.

### Step 4: Populate Schedule
1. Navigate to `/school/timetable`.
2. Select target Campus, Class, and Section.
3. Click an empty period block.
4. Select Subject, Teacher, and Room.
5. If the teacher or room is already booked, the system displays an alert with the conflicting class details.
6. Adjust selection and confirm. Repeat across the weekly matrix.
