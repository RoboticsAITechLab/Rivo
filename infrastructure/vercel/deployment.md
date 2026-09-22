# Vercel Environment & Configuration Strategy

## Environment Categorization

Rivo defines three operational environments within Vercel:

| Environment | Purpose | Database Target | Auth Mode |
| :--- | :--- | :--- | :--- |
| **Development** | Local developer testing | Local / Dev Neon branch | `local` |
| **Preview** | Pull Request review branches | Ephemeral Neon branch / Staging | `local` or `production` |
| **Production** | Live tenant production environment | Production Neon primary cluster | `production` |

## Environment Variable Classification

| Variable Name | Scope | Production Status | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-Only | **REQUIRED** | Neon pooled PostgreSQL connection URL with PgBouncer. |
| `DIRECT_URL` | Server-Only | **REQUIRED** | Direct Neon PostgreSQL connection URL for DDL/migrations. |
| `MFA_ENCRYPTION_KEY` | Server-Only | **REQUIRED** | 32+ byte key for AES-256-GCM encryption of TOTP secrets. |
| `RESEND_API_KEY` | Server-Only | **REQUIRED** | Production API token for transactional emails. |
| `RESEND_FROM_EMAIL` | Server-Only | **REQUIRED** | Verified sender email address (e.g., `no-reply@yourdomain.com`). |
| `RESEND_FROM_NAME` | Server-Only | Optional | Display name for outbound emails (Default: "Rivo School Management"). |
| `REDIS_URL` | Server-Only | **REQUIRED (Prod)** | Upstash or managed Redis connection string for rate limiting. |
| `AUTH_INFRA_MODE` | Server-Only | **REQUIRED** | Set to `production` in production; set to `local` in preview/dev. |
| `NEXT_PUBLIC_APP_URL` | Public / Client | **REQUIRED** | Canonical public URL of the application. |
| `NEXT_PUBLIC_APP_NAME`| Public / Client | Optional | Display brand name in UI components. |
