# Account Recovery & Password Reset

The Account Recovery configuration (`/school/settings/security/recovery`) governs forgot-password procedures, reset token lifespans, and emergency recovery policies.

---

## 1. Self-Service Password Reset Workflow

```
[User Clicks "Forgot Password"]
           │
           ▼
[Submits Registered Email Address at /forgot-password]
           │
           ▼
[Generate Cryptographically Secure Token (expires in X hours)]
           │
           ▼
[Dispatch Recovery Email with One-Time Link]
           │
           ▼
[User Follows Link, Enters New Password Meeting Policy]
           │
           ▼
[Invalidate Token, Invalidate All Prior Sessions, Confirm Reset]
```

---

## 2. Configuration Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Self-Service Reset Enabled** | Boolean | `true` | Allows users to initiate resets from the login screen |
| **Reset Link Expiry** | Number | 2 hours | Validity duration of recovery tokens (1 to 24 hours) |
| **Require Admin Approval** | Boolean | `false` | If enabled, password resets require administrator sign-off before activation |
| **Notify on Recovery** | Boolean | `true` | Sends an email alert to the account notifying them that password was changed |
| **Notify Admin on Recovery** | Boolean | `false` | Alerts security administrators of password change events |

---

## 3. Security Protections

- **User Enumeration Prevention**: Submitting an unrecognized email on `/forgot-password` displays the same generic confirmation message (*"If an account exists with this email, a recovery link has been sent"*) to prevent malicious scraping of school email addresses.
- **Single-Use Tokens**: Recovery tokens are immediately consumed upon successful password update and cannot be replayed.
