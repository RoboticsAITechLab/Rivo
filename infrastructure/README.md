# Infrastructure & DevOps Architecture

This directory houses the deployment, continuous integration, operational runbooks, and cloud topology definitions for the Rivo platform.

## Directory Structure

```
infrastructure/
├── ci/                      # Continuous Integration architecture and workflows
│   └── README.md
├── database/                # Neon PostgreSQL topology, connection pooling, and migrations
│   ├── README.md
│   └── migration-policy.md
├── vercel/                  # Vercel serverless deployment specifications
│   ├── README.md
│   └── deployment.md
├── redis/                   # Redis distributed rate limiting and caching specifications
│   └── README.md
├── security/                # Security policies, secret management, and threat vectors
│   └── production-security.md
├── monitoring/              # Health probes, telemetry, and logging standards
│   └── README.md
└── docs/                    # Standard Operating Procedures & Runbooks
    ├── DEPLOYMENT.md        # Step-by-step production deployment runbook
    ├── ROLLBACK.md          # Incident containment and rollback procedures
    └── DISASTER-RECOVERY.md # High-severity disaster recovery runbook
```

## Guiding Principles

1. **Enterprise-Grade Foundations, Not Enterprise-Grade Complexity:** Avoid premature microservices and unnecessary orchestration layers.
2. **Fail-Closed Security:** In production mode, security protections (rate limiting, MFA verification, session token checks) must never silently degrade into an open or insecure state.
3. **Multi-Tenant Isolation:** Data must be strictly isolated by `schoolId` at all database access points.
4. **Zero Secret Leakage:** No plaintext credentials in Git, CI logs, or client-side bundles.
