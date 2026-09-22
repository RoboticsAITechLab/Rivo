# Production Rollback Standard Operating Procedure

This runbook describes the incident response protocols for rolling back deployments or mitigating failed releases.

## 1. Application-Level Rollback (Instant)

If a deployment introduces regressions, runtime crashes, or API latency spikes:

1. Navigate to the **Vercel Dashboard** > Project > **Deployments**.
2. Locate the previous stable deployment.
3. Click the options menu (`...`) and select **Instant Rollback** (or promote previous deployment to Production).
4. Vercel routes 100% of incoming production edge traffic to the previous immutable build artifact within seconds.

## 2. Database Migration Rollback Strategy

### Cardinal Rule
> **NEVER run `prisma migrate reset` in production.** It drops the entire database.

### Rollback Guidelines:
- **Additive Migrations:** If the migration only added new columns or tables, **NO database rollback is required**. The previous application version simply ignores the new columns.
- **Breaking Schema Alterations:**
  - Create a new forward-fix migration using `prisma migrate dev --create-only` that reverses the problematic change.
  - Apply the forward-fix via `npm run prisma:migrate:deploy`.
- **Destructive Data Loss Incidents:**
  - If data was inadvertently altered or dropped, invoke Point-In-Time Recovery (PITR) on Neon to restore a branch prior to the migration execution.

## 3. Secret & Credential Compromise Containment

If a production credential (`RESEND_API_KEY`, `DATABASE_URL`, or `MFA_ENCRYPTION_KEY`) is compromised:

1. **Rotate Credential at Provider:**
   - Database: Reset password in Neon console or provision a new user role.
   - Resend: Revoke the compromised API key and generate a new key.
2. **Update Vercel Environment Variables:**
   - Save the updated secret in Vercel Project Settings > Environment Variables.
3. **Trigger Immediate Production Redeploy:**
   - Trigger a redeploy on Vercel so all running serverless lambdas pick up the renewed environment variables.
4. **Invalidate Active Sessions:**
   - If session integrity is suspect, execute an emergency session flush by invalidating active records in the `Session` table.
