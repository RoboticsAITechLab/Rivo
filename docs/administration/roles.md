# Role Management

The Roles module (`/school/settings/people/roles`) defines institutional authorization profiles and security tiers.

---

## 1. System Roles vs Custom Roles

Rivo distinguishes between immutable core roles and user-defined institutional roles:

### Core System Roles (Immutable)
1. **School Admin**: Unrestricted institutional authority across all academic, security, and administrative configurations.
2. **Teacher**: Academic authority scoped to assigned classes, subjects, attendance registers, and marks entry.
3. **Student**: Portal access to personal homework, timetable, attendance records, and published results.
4. **Parent**: Guardian access to linked student profiles, attendance summaries, homework tracking, and school circulars.

### Custom Roles
Schools can create tailored roles for specialized staff (e.g., "Accountant", "Librarian", "Exam Coordinator", "Attendance Officer"). Custom roles inherit explicit subsets of permissions configured in the Permission Matrix.

---

## 2. Role Configuration Attributes

| Attribute | Description | Constraints |
| :--- | :--- | :--- |
| **Role Name** | Descriptive title | Required, unique |
| **Description** | Summary of operational scope | Optional |
| **Is System** | System-reserved flag | System roles cannot be deleted or renamed |
| **User Count** | Number of active accounts assigned | Automatically computed metric |

---

## 3. Operational Safeguards

- **Deletion Lock**: A role cannot be deleted if active user accounts are currently assigned to it.
- **Admin Lockout Protection**: The system prevents revoking `School Admin` privileges if it would result in zero active administrative accounts.
