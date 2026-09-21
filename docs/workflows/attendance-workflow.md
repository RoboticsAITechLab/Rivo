# Attendance Recording & Verification Workflow

This workflow describes the daily attendance recording process for teachers and monitoring/correction by administrators.

---

## 1. Daily Attendance Lifecycle

```
[Teacher Opens Class Attendance]
               │
               ▼
[Selects Date (Default: Today)]
               │
               ▼
[Roster Pre-Populated (Default: Present)]
               │
               ▼
[Toggle Exceptions: Absent / Late / Excused]
               │
               ▼
[Submit Register]
               │
               ▼
[Absence SMS/Notifications Dispatched to Parents]
               │
               ▼
[Lockout After Cutoff Window / Admin Correction Only]
```

---

## 2. Detailed Steps

### Step 1: Open Register
1. Navigate to `/school/attendance`.
2. Select Class, Section, and Date.
3. The register loads with all active enrolled students sorted by Class Roll Number.

### Step 2: Mark Exceptions
1. By default, all students are initialized as `PRESENT` to expedite data entry.
2. Click student row buttons to mark exceptions:
   - `A`: Absent
   - `L`: Late (with optional arrival timestamp)
   - `E`: Excused (medical leave or authorized school absence)
3. For absent or excused students, enter an optional note (e.g., "Parent called - sick leave").

### Step 3: Save & Submit
1. Click **Submit Attendance Register**.
2. The register record is saved with timestamp and author metadata.
3. If notification triggers are enabled in Settings, SMS/in-app absence alerts are automatically queued for the guardians of absent students.

### Step 4: Corrections & Lockout
1. Once submitted, the register remains editable by the teacher until the configured daily cutoff hour.
2. After the cutoff window expires, records lock.
3. Only users with the `School Admin` role or `Attendance Officer` custom role can unlock and amend historical registers.
