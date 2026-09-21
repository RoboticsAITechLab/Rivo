# Authentication Troubleshooting

This guide addresses login, credential, session, and MFA issues.

---

## 1. Login Failures

### Issue: "Invalid email or password"
- **Check**: Verify caps lock and trailing spaces in email field.
- **Resolution**: Trigger a self-service reset via `/forgot-password`. If self-service resets are disabled, contact the School Administrator to trigger a password reset link from the Users directory.

### Issue: "Account is temporarily locked"
- **Check**: The account exceeded the maximum failed attempts defined in Password Policy.
- **Resolution**: Wait 15 minutes for automatic lockout expiration, or request an administrator unlock the account manually in `/school/settings/people/users`.

---

## 2. Multi-Factor Authentication (MFA) Issues

### Issue: TOTP Code Rejected ("Invalid Verification Code")
- **Cause**: Device clock drift on the user's mobile authenticator app.
- **Resolution**:
  1. Open the Authenticator app settings and select **Sync clock / Time correction**.
  2. Retry entering the 6-digit passcode.
  3. If still failing, use one of the 8 single-use emergency backup recovery codes issued during setup.

### Issue: User Lost MFA Authenticator Device
- **Resolution**: A School Administrator must navigate to `/school/settings/people/users`, locate the user, and select **Reset MFA**. This invalidates their previous authenticator secret and prompts fresh setup on their next login.
