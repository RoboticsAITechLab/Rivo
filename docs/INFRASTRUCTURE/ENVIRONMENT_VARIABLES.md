# Exhaustive Environment Variable Reference

> **Last Verified:** November 11, 2026  
> **Security Classification:** Strict Sanitization Enforced (Zero Credentials Exposed)

---

## 1. Environment Variables Table

| Variable Name | Used By | Requirement Level | Fallback Behavior in Local Dev | Fail-Closed in Production (`AUTH_INFRA_MODE="production"`) | Purpose & Security Constraints | Example (Sanitized Placeholder) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `apps/web`, `apps/api`, `prisma` | **STRICTLY REQUIRED** | None. Fails process on start. | **Fails immediately.** | PostgreSQL connection string via Neon PgBouncer (`port 6543`). Must include `sslmode=require`. | `postgresql://<user>:<password>@<neon-host>-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | `prisma`, CI workflows | **REQUIRED for Migrations** | None. | Fails migration deploy step. | Direct connection string to PostgreSQL on `port 5432` without PgBouncer. Essential for advisory locks during `prisma migrate deploy`. | `postgresql://<user>:<password>@<neon-direct-host>:5432/neondb?sslmode=require` |
| `JWT_SECRET` | `apps/web` (`lib/auth/crypto.ts`) | **STRICTLY REQUIRED (Prod)** | Falls back to internal dev key `rivo-dev-temporary-...` | **Fails Closed:** Rejects missing, default, placeholder, or `< 32 chars` secrets. | Used to sign and verify HMAC session cookies (`rivo_session`). Must be 32+ cryptographically random bytes. | `<32_byte_random_hex_string>` |
| `KYC_ENCRYPTION_KEY` | `apps/web` (`lib/security/encryption.ts`) | **STRICTLY REQUIRED (Prod)** | Falls back to deterministic SHA-256 dev key | **Fails Closed:** Throws `[SECURITY FATAL]` if missing or `< 16 chars`. | Field-level AES-256-GCM encryption key for sensitive PII/KYC at rest (Aadhaar, PAN, Voter ID). Format: `enc:v1:<iv>:<tag>:<ciphertext>`. | `<32_byte_random_string>` |
| `MFA_ENCRYPTION_KEY` | `apps/web` (`lib/auth/mfa.ts`) | **STRICTLY REQUIRED (Prod)** | Falls back to default dev buffer | **Fails Closed:** Throws fatal security exception if `< 32 chars`. | AES-256-GCM encryption key for TOTP secrets stored in `user_mfa` table. Hashed via SHA-256 to ensure 256-bit key length. | `<32_byte_random_string>` |
| `AUTH_INFRA_MODE` | `apps/web` (Core security flag) | **REQUIRED** | Defaults to `'local'` if not explicitly set | Must be set to `'production'`. | Switches authentication, Redis, and storage between graceful local fallbacks and strict fail-closed security. | `production` |
| `REDIS_URL` | `apps/web` (`lib/redis/client.ts`) | Optional (Local) / **MANDATORY (Prod)** | Gracefully returns `null`; in-memory token bucket used. | **Fails Closed:** Rate limiter denies authentication requests with HTTP 429 if Redis is offline/missing. | Redis / Upstash connection URL. Automatically converts `upstash.io` endpoints to TLS `rediss://`. Localhost URLs rejected in production. | `rediss://default:<token>@<upstash-host>:6379` |
| `UPSTASH_REDIS_URL`| `apps/web` (`lib/redis/client.ts`) | Optional Fallback Alias | Treated identically to `REDIS_URL`. | Same as `REDIS_URL`. | Alternative environment key for Upstash Redis serverless connection strings. | `rediss://default:<token>@<upstash-host>:6379` |
| `AZURE_STORAGE_CONNECTION_STRING` | `apps/web` (`lib/storage/azure-blob.ts`) | Optional (Local) / **MANDATORY (Prod)** | Falls back to in-memory blob store (zero local disk writes). | **Fails Closed:** Throws error: `Production storage service is not configured`. | Storage account connection string for Azure Blob Storage. | `DefaultEndpointsProtocol=https;AccountName=<account>;AccountKey=<key>;EndpointSuffix=core.windows.net` |
| `AZURE_STORAGE_PRIVATE_CONTAINER` | `apps/web` (`lib/storage`) | Optional | Defaults to `rivo-private`. | Uses default container name. | Destination Azure Blob container for private documents and KYC photos. Anonymous access prohibited; access via SAS only. | `rivo-private` |
| `AZURE_STORAGE_PUBLIC_CONTAINER` | `apps/web` (`lib/storage`) | Optional | Defaults to `rivo-public`. | Uses default container name. | Destination Azure Blob container for anonymous school logos and branding graphics. | `rivo-public` |
| `RESEND_API_KEY` | `apps/web` (`lib/email/resend.ts`) | Optional (Local) / **MANDATORY (Prod)** | Simulated delivery logged to server console; returns simulated success. | Email operations log failure; system audit records `EMAIL_INVITATION_FAILED`. | API key for Resend transactional email platform. | `re_<resend_api_key>` |
| `RESEND_FROM_EMAIL` | `apps/web` (`lib/email/resend.ts`) | Optional | Defaults to `no-reply@homyhaven.app`. | Uses default sender address. | Outbound verified sender address. Must align with Resend SPF/DKIM verified domains. | `no-reply@rivo.school` |
| `RESEND_FROM_NAME` | `apps/web` (`lib/email/resend.ts`) | Optional | Defaults to `Rivo School Management`. | Uses default sender name. | Display name for transactional emails. | `Rivo School Management` |
| `APP_URL` | `apps/web` (`lib/email/resend.ts`) | Optional (Local) / **MANDATORY (Prod)** | Defaults to `http://localhost:3000`. | **Fails Closed:** Throws `[SECURITY_ERROR]` if missing or non-HTTPS in production. | Canonical application URL used to construct invite and password reset links. | `https://app.rivo.school` |
| `NEXT_PUBLIC_APP_URL` | `apps/web` (Client & Server) | Optional | Fallback for `APP_URL`. | Must be valid HTTPS URL. | Publicly exposed application URL injected into browser client code. | `https://app.rivo.school` |
| `NEXT_PUBLIC_APP_NAME` | `apps/web` (Client-side) | Optional | Defaults to `Rivo School Management`. | Uses default name. | Application brand display name in client UI headers and page titles. | `Rivo School Management` |
| `NODE_ENV` | Global Node runtime | Standard runtime flag | Defaults to `development`. | Set to `production` by Vercel/Render. | Controls React server component bundling, detailed error messages, and logging verbosity. | `production` |
| `PORT` | `apps/api` | Optional | Defaults to `4000`. | Uses `process.env.PORT` assigned by host. | HTTP listening port for NestJS backend. | `4000` |
| `CORS_ORIGIN` | `apps/api` | Optional | Defaults to `http://localhost:3000`. | Uses configured origin. | Allowed CORS origins for NestJS backend endpoints. | `http://localhost:3000` |

