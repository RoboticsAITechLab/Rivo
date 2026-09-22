# Disaster Recovery & Business Continuity Plan

This document establishes operational response procedures for major infrastructure outages and data loss events.

## Provider Resilience Matrix

| Component | Provider | High Availability (HA) & Disaster Recovery Mechanisms |
| :--- | :--- | :--- |
| **Frontend & API Edge** | Vercel | Multi-region edge network, automated DDoS mitigation, atomic rollbacks. |
| **Relational Database** | Neon PostgreSQL | Storage separation architecture, automated write-ahead log (WAL) archiving, Point-in-Time Recovery (PITR). |
| **Cache & Rate Limiting**| Upstash Redis | Multi-zone replication, automated node failover. |
| **Transactional Email** | Resend | Cloud-native multi-IP delivery clusters. |

## Outage Scenarios & Response Procedures

### 1. Database Outage (Neon Unreachable)
- **Symptom:** `/api/health` returns `503 Service Unavailable`, API routes throw connection errors.
- **Immediate Action:**
  1. Check Neon Cloud Status dashboard (`status.neon.tech`).
  2. If an outage is localized to a specific Neon compute endpoint, restart or provision a new compute endpoint pointing to the primary branch.
  3. If catastrophic data corruption occurs, restore the database from a point-in-time snapshot to an instant recovery branch.

### 2. Redis Outage (Upstash Unreachable)
- **Symptom:** In `AUTH_INFRA_MODE="production"`, authentication endpoints return `429 Too Many Requests` (fail-closed policy).
- **Immediate Action:**
  1. Check Upstash status dashboard (`status.upstash.com`).
  2. If prolonged outage occurs and emergency authentication must be restored:
     - Temporarily set `AUTH_INFRA_MODE="local"` in Vercel environment variables to fall back to in-memory rate limiting.
     - Trigger redeploy.
     - Restore `AUTH_INFRA_MODE="production"` immediately once the Redis provider recovers.

### 3. Transactional Email Outage (Resend Unreachable)
- **Symptom:** Staff invitations and password resets fail to deliver; API returns graceful provider error.
- **Immediate Action:**
  1. Verify Resend system health (`resend-status.com`).
  2. Ensure the sender domain DNS records (SPF, DKIM, DMARC) have not expired or been modified.
  3. Inform affected school administrators that invitations can be resent once service is restored.

### 4. Cross-Tenant Data Leakage Incident
- **Symptom:** User reports seeing records belonging to another school.
- **Immediate Containment:**
  1. Immediately suspend affected user accounts or invoke emergency maintenance mode.
  2. Review `security_audit_logs` for anomalous `schoolId` access patterns.
  3. Identify the offending query in the codebase, patch the tenant filter (`schoolId: session.schoolId`), and deploy a hotfix immediately.
