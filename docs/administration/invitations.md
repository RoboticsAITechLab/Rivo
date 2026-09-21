# User Invitations & Onboarding

The Invitations module (`/school/settings/people/invitations`) manages outbound staff onboarding, invitation tokens, and registration lifecycles.

---

## 1. Invitation Lifecycle

```
[Admin Dispatches Invite] ──> [Token Generated & Emailed] ──> [User Sets Password] ──> [Account Activated]
             │                                                         │
             └──> [Invitation Revoked / Expired] <─────────────────────┘
```

1. **Pending**: Invitation created, email dispatched containing a one-time cryptographic token.
2. **Accepted**: Recipient followed the link, verified identity, and established credentials.
3. **Revoked**: Administrator canceled the invitation before acceptance.
4. **Expired**: Recipient failed to activate within the validity window (default: 72 hours).

---

## 2. Dispatching Invitations

When inviting a new staff member:

1. **Email Address**: Recipient's institutional or verified personal email.
2. **Assigned Role**: Select target role (e.g., Teacher, Accountant).
3. **Campus Scope**: (Optional) Restrict user to a specific campus.
4. **Expiration Window**: 24h, 48h, or 72h before token invalidation.

---

## 3. Administrative Controls

- **Resend Invite**: Regenerates token and redispatches email.
- **Revoke Invite**: Immediately invalidates the active activation link.
- **Status Filter**: View pending, accepted, expired, or revoked invitations.
