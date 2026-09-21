# Active Sessions & Device Security

The Active Sessions module (`/school/settings/security/sessions`) monitors concurrent device logins and enables real-time session revocation.

---

## 1. Session Attributes

Every active login creates a verifiable session object containing:

| Attribute | Description |
| :--- | :--- |
| **Session ID** | Unique cryptographic token identifier |
| **Device / OS** | Operating system and client hardware identifier (e.g., Windows 11, macOS) |
| **Browser** | Client user agent (e.g., Chrome 124, Safari) |
| **IP Address** | Originating network IPv4/IPv6 address |
| **Location** | Geolocation estimate derived from IP |
| **Last Active** | Timestamp of most recent authenticated request |
| **Is Current** | Indicates whether the session belongs to the user currently viewing the page |

---

## 2. Session Revocation Controls

- **Revoke Session**: Terminating an individual session immediately invalidates its token; the target browser is logged out on its next request.
- **Revoke All Other Sessions**: Terminates every concurrent login across all devices except the current active session.
- **Admin Emergency Revoke**: Administrators can terminate all active sessions for a compromised user from `/school/settings/people/users`.
