# Permissions & Access Control Troubleshooting

This guide assists administrators in resolving access restrictions and role boundaries.

---

## 1. Route Redirections & Access Denied

### Issue: User Redirected to `/access-denied`
- **Cause**: The user's assigned role lacks permission to view the requested page (e.g., a teacher attempting to view `/school/settings`).
- **Resolution**:
  1. If the user requires access, open `/school/settings/people/users`.
  2. Inspect their assigned role.
  3. If they require administrative privileges, elevate their role to `School Admin` or create a customized role with appropriate module rights in the Permission Matrix.

---

## 2. Action Buttons Missing or Disabled

### Issue: "Publish Results" Button is Disabled
- **Cause**: One or more papers have incomplete marks, or the user's role lacks the `PUBLISH` action permission for Results.
- **Resolution**:
  1. Ensure all candidate marks are submitted without empty entries.
  2. In `/school/settings/people/permissions`, verify that the role has `PUBLISH` checked under the Results module.

### Issue: Teacher Cannot Mark Attendance for a Class
- **Cause**: The teacher is not assigned as the Class Teacher for that section, or the daily cutoff time has passed.
- **Resolution**:
  1. Verify section assignment under `/school/settings/classes`.
  2. Check attendance settings to see if `lockPreviousRecords` is active and requires administrative correction.
