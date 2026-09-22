# Database Migration Policy

## Strict Rules for Production Migrations

1. **NEVER Run `prisma migrate reset` in Production:**
   - `prisma migrate reset` drops the database schema and deletes all data. It is forbidden in staging, preview, and production environments.
2. **Deterministic Migration Pipeline:**
   - Production migrations must only be executed via:
     ```bash
     npm run prisma:migrate:deploy
     ```
   - This script applies pending SQL migrations in `prisma/migrations/` sequentially and records execution hashes in the `_prisma_migrations` table.
3. **Additive Schema Modifications:**
   - Always prefer additive schema migrations (adding nullable columns or columns with defaults) to avoid breaking active serverless instances during deployment rollout.
   - For column renames or deletions, follow a 2-phase migration strategy:
     - Phase 1: Add new column, duplicate writes, backfill historical rows.
     - Phase 2: Switch reads to new column, deprecate and remove old column in a subsequent release.
4. **Reconciling Historical Baselines:**
   - When environments are baselined with tables created outside of migration files, use `prisma migrate resolve --applied <migration_name>` to record synchronization without re-executing conflicting DDL.
