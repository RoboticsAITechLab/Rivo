# User Access & Security Provisioning Workflow

This workflow details onboarding administrative and academic personnel, setting up security boundaries, and configuring permissions.

---

## 1. Access Provisioning Lifecycle

```
[1. Define Custom Role if needed (/school/settings/people/roles)]
                             │
                             ▼
[2. Configure Permission Matrix (/school/settings/people/permissions)]
                             │
                             ▼
[3. Dispatch User Invitation (/school/settings/people/invitations)]
                             │
                             ▼
[4. Recipient Accepts Invite & Establishes Strong Password]
                             │
                             ▼
[5. Enforce Multi-Factor Authentication (MFA) Setup on First Login]
                             │
                             ▼
[6. Active User Enters Scoped Dashboard View]
```

---

## 2. Operational Procedures

### Step 1: Role & Permission Assignment
1. If standard roles (`School Admin`, `Teacher`) suffice, proceed directly to invitation.
2. If specialized access is required (e.g., Exam Coordinator), create a new role under `/school/settings/people/roles`.
3. In `/school/settings/people/permissions`, grant appropriate actions (`VIEW`, `CREATE`, `EDIT`, etc.) and set the Data Scope (`OWN`, `ASSIGNED`, or `SCHOOL`).

### Step 2: Issue Secure Invitation
1. In `/school/settings/people/invitations`, click **Invite User**.
2. Provide recipient's institutional email address and assign the target role.
3. If the role is branch-specific, assign the target Campus.
4. Dispatch invitation.

### Step 3: Recipient Onboarding
1. User receives an email with an encrypted onboarding link (`/invite/accept?token=...`).
2. User provides their full name and sets a password that conforms to the institution's Password Policy.
3. If MFA enforcement is set to `REQUIRED_FOR_ADMINS` or `REQUIRED_FOR_ALL`, the user is immediately prompted to link an authenticator app (TOTP) and record emergency recovery codes before accessing system tools.
