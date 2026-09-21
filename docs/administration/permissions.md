# Permission Matrix Administration

The Permission Matrix (`/school/settings/people/permissions`) governs fine-grained access control across modules, actions, and data scopes.

---

## 1. Permission Matrix Architecture

Access rights are evaluated across three dimensions:

1. **Target Module**: Students, Teachers, Classes, Attendance, Homework, Examinations, Results, Notices, Settings.
2. **Action Type**:
   - `VIEW`: Read and inspect records.
   - `CREATE`: Instantiate new entities.
   - `EDIT`: Modify existing records.
   - `DELETE`: Deactivate or remove records.
   - `PUBLISH`: Broadcast circulars or release formal results.
   - `EXPORT`: Download CSV, Excel, or PDF reports.
3. **Data Scope**:
   - `OWN`: Confined strictly to records authored by the logged-in user.
   - `ASSIGNED`: Confined to classes, subjects, or campuses explicitly mapped to the user.
   - `SCHOOL`: Institution-wide access across all branches and cohorts.

---

## 2. Interactive Matrix Grid

The configuration matrix allows administrators to toggle action checkboxes per role and adjust data scope dropdowns:

```
+----------------+--------+--------+--------+--------+---------+--------+----------+
| Module         | VIEW   | CREATE | EDIT   | DELETE | PUBLISH | EXPORT | Scope    |
+----------------+--------+--------+--------+--------+---------+--------+----------+
| Students       |  [X]   |  [X]   |  [X]   |  [ ]   |   N/A   |  [X]   | ASSIGNED |
| Attendance     |  [X]   |  [X]   |  [X]   |  [ ]   |   N/A   |  [X]   | ASSIGNED |
| Examinations   |  [X]   |  [ ]   |  [ ]   |  [ ]   |   [ ]   |  [X]   | SCHOOL   |
| Results Entry  |  [X]   |  [X]   |  [X]   |  [ ]   |   [ ]   |  [X]   | ASSIGNED |
+----------------+--------+--------+--------+--------+---------+--------+----------+
```

---

## 3. Enforcement Boundary

> [!IMPORTANT]
> **Architectural Enforcement Principle**:
> The Web Application enforces permissions at the UI boundary (hiding action buttons, disabling forms, blocking navigation). The backend API gateway must independently evaluate JWT bearer claims and role scopes on every incoming mutation request.
