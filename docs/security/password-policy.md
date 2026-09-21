# Password Policy Configuration

The Password Policy configuration (`/school/settings/security/password-policy`) dictates credential complexity, longevity, and brute-force lockout rules across the institution.

---

## 1. Complexity Rules

| Parameter | Type | Default | Range / Description |
| :--- | :--- | :--- | :--- |
| **Minimum Length** | Number | 8 | 8 to 32 characters |
| **Require Uppercase** | Boolean | `true` | Requires at least one uppercase character (`A-Z`) |
| **Require Lowercase** | Boolean | `true` | Requires at least one lowercase character (`a-z`) |
| **Require Numbers** | Boolean | `true` | Requires at least one numeric digit (`0-9`) |
| **Require Special Characters** | Boolean | `true` | Requires at least one symbol (`!@#$%^&*`, etc.) |

---

## 2. Longevity & Lifecycle

- **Password Expiry Days**: Number of days before users are prompted to rotate passwords (e.g., 90 days, 180 days, or `0` to disable).
- **Password History Prevention**: Prohibits users from reusing their last 3 passwords.

---

## 3. Brute-Force & Lockout Controls

- **Max Failed Attempts**: Number of consecutive invalid login attempts allowed before account locking (default: 5 attempts).
- **Lockout Duration**: Minutes an account remains locked following threshold violation (default: 15 minutes).
- **Admin Unlock**: Administrators can manually unlock a locked account from the Users Directory.
