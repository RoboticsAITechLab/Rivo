# User Directory Administration

The User Accounts directory (`/school/settings/people/users`) provides a unified management center for all staff, administrative, and institutional accounts.

---

## 1. User Entity Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **Full Name** | String | User's formal identity |
| **Email** | String | Canonical login identity (must be unique) |
| **Phone** | String | Optional contact number for SMS and 2FA |
| **Assigned Role** | Role | System Role (`School Admin`, `Teacher`, etc.) or Custom Role |
| **Campus Scope** | Campus ID | Optional assignment restricting user access to a specific branch |
| **Status** | Enum | `ACTIVE`, `SUSPENDED`, or `INVITED` |
| **MFA Status** | Boolean | Indicates whether Multi-Factor Authentication is active |
| **Last Active** | Timestamp | Most recent session activity |

---

## 2. Directory Actions

- **Search & Filter**: Find accounts by name, email, role, campus, or status.
- **Account Suspension**: Temporarily locks account access without deleting historical logs or assignments.
- **Role Reassignment**: Elevates or restricts user permissions.
- **Password Reset Trigger**: Sends a secure, time-limited reset link to the user's registered email.
- **MFA Reset**: In emergency lockout situations, authorized administrators can reset a user's MFA factor.

---

## 3. Account Creation & Onboarding

Direct creation of user passwords by administrators is prohibited for security. User provisioning occurs via the **Invitations System** (`/school/settings/people/invitations`), ensuring users establish their own confidential credentials.
