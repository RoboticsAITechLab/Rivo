# Cloud Storage & Third-Party Integrations

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src/lib/storage`, `apps/web/src/lib/redis`, `apps/web/src/lib/email`

---

## 1. Azure Blob Storage (Direct SAS Upload)

### 1.1 Architecture & Security
- **Service File:** `apps/web/src/lib/storage/azure-blob.ts`
- **Containers:**
  - `rivo-public`: Anonymous read access via Azure CDN for school crests, logos, and public branding assets.
  - `rivo-private`: Zero anonymous access. Houses student avatars, KYC identity documents (Aadhaar, PAN), birth certificates, and teacher contracts. Access strictly requires a generated SAS URL.
- **Direct-to-Cloud SAS Uploads:**
  - Rather than uploading multi-megabyte files through Vercel serverless functions (which introduces execution timeouts and payload size limits), the browser requests a write-only Shared Access Signature via `POST /api/media/sas/upload`.
  - The server generates a short-lived SAS token (15 minutes / 900 seconds TTL) with `cw` (Create, Write) permissions.
  - The client uploads directly from the browser to Azure Blob Storage via an HTTP `PUT` request.
- **Deterministic Storage Keys:**
  `schools/{schoolId}/{category}/{entityId}/{subCategory}/{randomToken}.{extension}`
- **Magic-Byte Signature Validation:**
  Every upload is verified against binary file signatures before issuing SAS tokens:
  - JPEG: `0xFF 0xD8 0xFF`
  - PNG: `0x89 0x50 0x4E 0x47`
  - WebP: `RIFF .... WEBP`
  - PDF: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
- **Local Fallback:** In local development without Azure credentials, files are stored in an in-memory map returning data URLs with **zero local disk writes**.

---

## 2. Upstash Redis (Session Cache & Rate Limiting)

- **Client Configuration:** `apps/web/src/lib/redis/client.ts` uses `ioredis` with serverless-tuned resilience parameters:
  - `maxRetriesPerRequest: 1`
  - `connectTimeout: 2500ms`
  - `enableOfflineQueue: false` (Fails fast instead of hanging serverless invocations)
  - Automatic conversion of `upstash.io` URLs to TLS (`rediss://`)
  - Redaction of connection credentials in all error handlers
- **Fail-Closed vs. Local Fallback Matrix:**
  - When `AUTH_INFRA_MODE === 'production'`: If Redis is offline, rate limiting strictly fails closed (`HTTP 429`) to prevent brute-force attacks.
  - When `AUTH_INFRA_MODE === 'local'`: If Redis is absent, gracefully falls back to process in-memory sliding windows.

---

## 3. Resend Transactional Email

- **Service File:** `apps/web/src/lib/email/email-service.ts` & `resend.ts`
- **Use Cases:** Staff onboarding invitations, password recovery links, critical security alerts.
- **Audit Logging:** Every email dispatch outcome is immutably logged into PostgreSQL via `logSecurityAudit()` (`EMAIL_INVITATION_SENT`, `EMAIL_INVITATION_FAILED`, `PASSWORD_RESET_EMAIL_SENT`).
- **Local Fallback:** When `RESEND_API_KEY` is omitted in development, email contents are logged directly to the server console with simulated success.

