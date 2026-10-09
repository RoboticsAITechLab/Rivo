# Production Credential Rotation Runbook

## Overview
This runbook details the authoritative procedure for auditing, rotating, and verifying third-party cloud credentials and infrastructure secrets for the Rivo production environment.

> **CRITICAL SECURITY DIRECTIVE:**
> Never commit active or regenerated credentials, connection strings, or encryption keys into source control, configuration files, pull requests, or issue trackers. All production secrets must reside exclusively within the secure environment variable settings of your production deployment platform (e.g., Vercel Project Settings) and secrets manager.

---

## 1. Credential Audit & Findings Register

| Secret Identifier | Provider / Service | Environment Variable(s) | Category | Audit Status & Exposure History |
| :--- | :--- | :--- | :--- | :--- |
| **Azure Storage Account Key** | Microsoft Azure Blob Storage | `AZURE_STORAGE_CONNECTION_STRING` | **Category B (Historical Secret)** | Exposed in historical Git commit (`dbf0146`). Cleared from active source code, but present in git history. **Status: Unknown / External Rotation Required.** |
| **JWT Session Secret** | Authentication Runtime | `JWT_SECRET` | **Category C (Environment-Only)** | Documentation example placeholder removed from `README.md`. Code runtime fails closed if missing or insecure. Production requires a 256-bit high-entropy secret. |
| **KYC Encryption Key** | AES-256-GCM Crypto Engine | `KYC_ENCRYPTION_KEY` | **Category C (Environment-Only)** | Configured strictly in serverless runtime. Never committed to source. |
| **Database Connection String** | Neon / PostgreSQL | `DATABASE_URL`, `DIRECT_URL` | **Category C (Environment-Only)** | Serverless pooled and direct connections. Stored strictly in environment variables. |
| **Upstash Redis URL** | Upstash Redis | `REDIS_URL` / `UPSTASH_REDIS_URL` | **Category C (Environment-Only)** | Verified: zero embedded passwords in git history. Stored strictly in environment variables. |
| **Resend API Key** | Resend Email Service | `RESEND_API_KEY` | **Category C (Environment-Only)** | Email dispatch token. Stored strictly in environment variables. |
| **MFA Encryption Key** | TOTP / MFA Vault | `MFA_ENCRYPTION_KEY` | **Category C (Environment-Only)** | AES encryption key for 2FA secrets. Stored strictly in environment variables. |

---

## 2. Category Definitions
- **Category A (Active Secret in Source):** Secret found in current working tree. *(0 found)*
- **Category B (Historical Secret):** Secret committed in previous git history. *(1 found: Azure Storage key in commit dbf0146)*
- **Category C (Environment-Only):** Secret managed purely through runtime environment variables.
- **Category D (Already Rotated):** Verified rotated in provider console with previous keys invalidated.
- **Category E (Unknown Status):** Credential was previously exposed or staged; provider invalidation status unconfirmed.

---

## 3. Step-by-Step Rotation Procedures

### 3.1 Azure Storage Account Key (High Priority)
**Provider:** Microsoft Azure Portal (`portal.azure.com`)  
**Impact:** Media uploads, private teacher KYC storage, student avatar storage.

#### Zero-Downtime Dual-Key Rotation:
1. Sign in to the **Azure Portal** and navigate to your Rivo Storage Account.
2. Under **Security + networking**, select **Access keys**.
3. Azure provides two keys: `key1` and `key2`. Determine which key is currently in use:
   - If `key1` was used in the connection string, copy `key2`.
   - Update `AZURE_STORAGE_CONNECTION_STRING` in **Vercel Project Settings > Environment Variables** with the connection string using `key2`.
   - Redeploy the application and verify that media uploads and document access succeed.
4. Once verified, return to Azure Portal and click **Regenerate key** on `key1`.
5. Repeat the process periodically by alternating between `key1` and `key2`.

#### Post-Rotation Verification:
- Call `GET /api/health` and verify `"storage": { "status": "connected" }`.
- Test an avatar or document upload via the portal to ensure SAS tokens generate successfully.

---

### 3.2 Upstash Redis Connection String
**Provider:** Upstash Console (`console.upstash.com`)  
**Impact:** Distributed rate limiting (login, password reset, invitations).

#### Rotation Steps:
1. Log in to the **Upstash Console** and select your Redis database.
2. In the **Details** tab under **REST API / Connect**, locate **Password**.
3. Click **Reset Password** (or create a new read-write token). Note: Upstash supports immediate rotation or dual passwords depending on your plan.
4. Copy the new `rediss://default:<password>@<host>:<port>` connection URL.
5. In **Vercel Project Settings > Environment Variables**, update `REDIS_URL`.
6. Trigger a redeployment.

#### Post-Rotation Verification:
- Call `GET /api/health` and verify `"redis": { "status": "connected" }`.
- Check Vercel function runtime logs for zero `[REDIS_ERROR]` messages.

---

### 3.3 Production JWT Secret
**Runtime:** Node.js HMAC-SHA256 Session Engine  
**Impact:** Active user sessions and authentication cookies.

#### Rotation Steps:
1. Generate a new high-entropy 256-bit cryptographic secret locally:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. In **Vercel Project Settings > Environment Variables**, update `JWT_SECRET`.
3. Redeploy the application.
4. *Note on Session Invalidation:* Rotating `JWT_SECRET` invalidates all currently issued JWT tokens, requiring active users to sign in again. Plan rotations during scheduled maintenance windows.

#### Post-Rotation Verification:
- Sign in to `/login` with an administrator account and verify session cookie issuance and dashboard access.

---

### 3.4 Production KYC Encryption Key
**Runtime:** AES-256-GCM Field-Level Encryption Engine  
**Impact:** Teacher document numbers (`teacherDocument.documentNumber`).

#### Important Key Rotation Rule:
Because `KYC_ENCRYPTION_KEY` encrypts existing records stored at rest in PostgreSQL, **do NOT change this key without running a re-encryption migration script** (`scripts/migrate-kyc-encryption.ts`), or existing encrypted records will fail authentication tag validation during decryption.

#### Re-Encryption Rotation Steps:
1. Generate the new key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. In staging/migration maintenance mode:
   - Provide `OLD_KYC_KEY` and `NEW_KYC_KEY`.
   - Run the re-encryption script to decrypt rows with the old key and re-encrypt with the new key.
   - Update `KYC_ENCRYPTION_KEY` in Vercel to `NEW_KYC_KEY`.
3. Redeploy the application.

---

### 3.5 Neon PostgreSQL Database Password
**Provider:** Neon Console (`console.neon.tech`)  
**Impact:** Core relational database for all tenant data.

#### Rotation Steps:
1. Navigate to your project in the **Neon Console**.
2. Go to **Project Settings > Roles** and select the application database user.
3. Click **Reset password**.
4. Neon generates a new connection string with pooled (`-pooler`) and direct endpoints.
5. Update `DATABASE_URL` and `DIRECT_URL` in **Vercel Project Settings**.
6. Redeploy the application immediately to avoid connection dropouts.

---

### 3.6 Resend API Key
**Provider:** Resend Dashboard (`resend.com/api-keys`)  
**Impact:** Email delivery (invitations, password reset, alerts).

#### Rotation Steps:
1. Log in to **Resend Dashboard > API Keys**.
2. Click **Create API Key**, naming it `Rivo Production (YYYY-MM-DD)`.
3. Update `RESEND_API_KEY` in **Vercel Project Settings**.
4. Redeploy the application.
5. In Resend Dashboard, delete or revoke the previous API key.

---

## 4. Rollback Plan
If any service reports degradation (`503 Service Unavailable` or authentication failures) after updating environment variables:
1. In Vercel, revert the affected environment variable to the previous working value.
2. Trigger an instant redeployment or rollback to the prior production deployment snapshot.
3. Inspect runtime logs via `GET /api/health` to confirm recovery.
