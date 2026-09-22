# Production Deployment Standard Operating Procedure (SOP)

This runbook outlines the required sequence for promoting code to the production environment on Vercel.

## Pre-Deployment Checklist

1. **Verify GitHub Main Branch Status:**
   - Confirm that all checks in `.github/workflows/ci.yml` passed (green checkmark).
2. **Review Database Schema Differences:**
   - Run `npm run prisma:validate` locally to confirm schema validity.
3. **Verify Upstream Credentials in Vercel:**
   - Check that `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `MFA_ENCRYPTION_KEY`, and `REDIS_URL` are configured in Vercel Project Settings > Environment Variables.

## Deployment Execution Steps

### Step 1: Execute Pending Database Migrations
Before deploying new application code that depends on database updates, run migrations against the direct database endpoint:
```bash
npm run prisma:migrate:deploy
```
*Verify that all migrations succeed without errors.*

### Step 2: Deploy Web Application to Vercel
Deploy the `main` branch to production:
```bash
vercel deploy --prod
```
*Alternatively, merge your approved Pull Request into `main` if automatic GitHub-Vercel integration is enabled.*

### Step 3: Post-Deployment Verification (Smoke Tests)

Execute the following verification sequence against the live production URL:

1. **Health Check Probe:**
   ```bash
   curl -i https://<production-domain>/api/health
   ```
   *Expected: HTTP 200 with `"database": { "status": "connected" }`.*
2. **Authentication Flow:**
   - Log in with an authorized administrator account.
   - Verify that session cookie (`rivo_session`) is set with `HttpOnly; Secure; SameSite=Lax`.
3. **Tenant Context Verification:**
   - Switch between multiple school tenants (if applicable).
   - Ensure the school dashboard loads only data belonging to the active tenant.
4. **Email Delivery Verification:**
   - Trigger a staff invitation or password reset request.
   - Confirm receipt in the recipient inbox and verify sender domain DKIM/SPF alignment.
5. **Rate Limiting Check:**
   - Ensure `AUTH_INFRA_MODE="production"` is active and Redis connections are established.
