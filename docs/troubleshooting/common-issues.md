# Common Operational Issues & Resolutions

This guide provides troubleshooting diagnostics and solutions for common operational hurdles in the Rivo Web Application.

---

## 1. Academic Configuration Issues

### Issue: Section Dropdown Appears Empty
- **Cause**: No sections have been mapped to the selected Class, or all sections are mapped to a different campus.
- **Resolution**:
  1. Navigate to `/school/settings/sections`.
  2. Verify that sections exist with `classId` matching the selected class.
  3. Ensure the section's `campusId` matches the currently active campus in the top navigation.

### Issue: Student Selector Contains No Students
- **Cause**: No students are enrolled in the chosen Class and Section for the active Academic Session.
- **Resolution**:
  1. Open `/school/students`.
  2. Confirm active enrollments exist for this cohort.
  3. Ensure the student's status is `ACTIVE` (not `TRANSFERRED` or `GRADUATED`).

### Issue: Timetable Shows Slot Conflict Error
- **Cause**: The teacher or room is already booked for another section during the same day and period.
- **Resolution**:
  1. Inspect the conflicting class indicated in the red alert banner.
  2. Select an alternative room or assign a different qualified teacher.

---

## 2. Examination & Roll Number Issues

### Issue: Formal Exam Roll Numbers Missing on Admit Cards
- **Cause**: Roll number allocation has not been executed for the current academic session.
- **Resolution**:
  1. Open `/school/settings/academic/roll-numbers`.
  2. Click **Run Allocation Batch** to assign deterministic exam roll numbers.

### Issue: Exam Schedule Conflict Detected
- **Cause**: Two papers for the same student cohort are scheduled during the same time slot, or venue capacity is exceeded.
- **Resolution**:
  1. Shift one paper to a distinct morning or afternoon time slot.
  2. Reallocate candidates across multiple rooms if venue capacity is exceeded.
