# Rivo Staff Invitation & Email Delivery Audit Report
**Date:** October 11, 2026  
**Auditor:** Senior SaaS Architect & Security Engineer  
**Status:** AUDIT COMPLETED — PENDING APPROVAL TO FIX

---

## 1. Executive Summary

A complete audit of the Rivo Staff Invitation and Email Delivery subsystem was conducted following reported issues:
1. Recipient receives or visits an invitation link and gets:
   > **"Invalid Invitation Link: Missing invitation security token in link."**
2. The user reported that invitation emails are not being delivered (`"nahi invite mail ja raha hai"`).

### Key Findings:
- **Root Cause of "Missing Token" Error (CONFIRMED DEFECT - P0):** In `apps/web/src/app/(school)/school/settings/invitations/page.tsx` (Line 277), the `handleCopyLink` function literally copies `${window.location.origin}/invite/accept` **without any security token query parameter (`?token=...`)**. When any recipient clicks or pastes this copied link, the acceptance page detects `!token` and immediately halts with the error message.
- **Root Cause of Email Delivery Issue (CONFIRMED DEFECT / CONFIGURATION - P1):**
  1. The Resend transactional email service **is active and working**. In fact, inspection of Resend API verified that emails to `978rina@gmail.com` and `958rina@gmail.com` were sent and marked `"delivered"` by Amazon SES (`message_id: 01a129f0...`).
  2. However, because the sender address is `invite@homyhaven.app <no-reply@homyhaven.app>`, Google Mail (Gmail) treats unfamiliar domain emails as **Spam / Junk** or drops them into the **Promotions** tab.
  3. Furthermore, `APP_URL` in `.env` is hardcoded to `https://rivo-web-sand.vercel.app`. Any invitation dispatched during local or staging development includes links pointing to Vercel instead of the current running host.
  4. The creation dialog closes immediately upon dispatch without showing a "Copy Link" fallback with the actual generated token, leaving admins with no way to manually hand the link to staff if the email goes to Spam.

---

## 2. Technical Inspection & Trace

### A. The "Copy Link" Defect in UI
- **File:** `apps/web/src/app/(school)/school/settings/invitations/page.tsx:276-282`
- **Code:**
  ```typescript
  const handleCopyLink = (inv: LiveInvitation) => {
    const fullUrl = `${window.location.origin}/invite/accept`; // ❌ BUG: No token appended!
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(inv.id);
    toast.success('Onboarding link copied. Invitees can activate using their email.');
    setTimeout(() => setCopiedId(null), 2500);
  };
  ```
- **Acceptance Guard:** `apps/web/src/app/(auth)/invite/accept/page.tsx:42-45`
  ```typescript
  if (!token) {
    setIsLoading(false);
    setErrorMessage('Missing invitation security token in link.'); // ❌ User hit this
    return;
  }
  ```

### B. Database Cryptographic Token Design
- In `prisma/schema.prisma` (`model StaffInvitation`):
  - Database stores only `tokenHash: sha256(rawToken)`.
  - The raw secret token is ephemeral: it is **only** returned once when the invitation is created via `POST /api/invitations` or refreshed via `POST /api/invitations/[id]/resend`.
  - `GET /api/invitations` does **not** return the token (which is standard cryptographic practice so database read access cannot compromise invite tokens).
  - Consequently, clicking "Copy Link" on an arbitrary table row cannot retrieve the historical raw token from memory without generating/refreshing a new one via the API.

### C. Live Resend Delivery Trace
Direct API verification of Resend API on October 11, 2026:
- **Resend Domain:** `homyhaven.app` (Status: `verified`, Region: `ap-northeast-1`)
- **Recipient:** `978rina@gmail.com`
  - Resend Message ID: `01a129f0-82dc-7ac8-9108-6f8f2d6808c5`
  - Last Event: `delivered` via Amazon SES
  - Reason for not seeing: Flagged to **Spam / Junk** folder by Google's anti-phishing algorithms due to domain reputation and transactional template headers.

---

## 3. Remediation Plan (Requires User Approval)

### Step 1: Fix On-Screen Invitation Creation & Token Delivery (P0)
- In `apps/web/src/app/(school)/school/settings/invitations/page.tsx`:
  - When an invitation is created, instead of closing the modal silently, display a **"Invitation Created Successfully"** dialog.
  - Display the full, valid onboarding link (`${window.location.origin}${data.inviteUrl}`) with a **"Copy Link"** button.
  - Inform the admin that an email was dispatched, but they can also copy and send the direct activation link to the staff member immediately.

### Step 2: Fix Table Row "Copy Link" Action (P0)
- For existing pending invitations in the table:
  - When the admin clicks "Copy Link" on a row, call `/api/invitations/${inv.id}/resend`.
  - This refreshes the token, extends validity by 7 days, returns the fresh `inviteUrl` with `?token=...`, copies it directly to the clipboard, and displays a toast notification:
    `"Fresh invitation link copied to clipboard!"`
  - This eliminates broken `${window.location.origin}/invite/accept` URLs permanently.

### Step 3: Resilient Dynamic URL Generation (P1)
- In `apps/web/src/app/api/invitations/route.ts` and `apps/web/src/app/api/invitations/[id]/resend/route.ts`:
  - Derive the base URL dynamically from request headers (`x-forwarded-host`, `host`, `origin`) if present, falling back to `process.env.APP_URL`.
  - This ensures invite links generated locally or on staging domains point to the correct running application.

### Step 4: Email Deliverability & Spam Mitigation (P1)
- Add clear in-app guidance indicating that automated invite emails may land in the recipient's **Spam / Junk** or **Promotions** folder on Gmail.
- In `staff-invitation.ts`, update email headers (e.g. `List-Unsubscribe`, proper subject tags) to improve inbox placement.

---

## 4. Verification & Testing Criteria
1. Single invite creation creates an active token and immediately presents the full link with `?token=...`.
2. Clicking "Copy Link" on an existing row regenerates and copies a functional link with a valid token.
3. Visiting the copied link resolves the invitation and loads the Set Password screen without "Missing token" errors.
4. Setting a password activates the user and logs them in smoothly.
