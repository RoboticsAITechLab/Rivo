# Multi-Factor Authentication (MFA)

The Multi-Factor Authentication configuration (`/school/settings/security/mfa`) governs two-step identity verification enforcement.

---

## 1. Enforcement Levels

Institutions can select from three enforcement tiers:

1. **Optional (`OPTIONAL`)**: Users can independently choose to link an authenticator app for added security.
2. **Required for Administrators (`REQUIRED_FOR_ADMINS`)**: Mandatory for all users holding the `School Admin` role; optional for teachers and staff.
3. **Required for All Staff (`REQUIRED_FOR_ALL`)**: Mandatory for all staff and faculty accounts prior to accessing the platform.

---

## 2. Supported Methods

- **Time-Based One-Time Password (TOTP)**: Primary recommended standard (compatible with Google Authenticator, Microsoft Authenticator, 1Password).
- **SMS Passcode**: Fallback method dispatching 6-digit numeric codes via SMS.
- **Email OTP**: Secondary fallback dispatching one-time codes to verified email.

---

## 3. Account Setup & Recovery Codes

When enabling MFA:
1. The user scans a secret QR code into their authenticator app.
2. Submits a 6-digit confirmation token to verify synchronization.
3. Receives a set of 8 single-use emergency backup recovery codes.
4. If a user loses their authenticator device, an administrator can reset their MFA enrollment from `/school/settings/people/users`.
