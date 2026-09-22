# Monitoring, Health Probes, and Observability

## Infrastructure Health Check Endpoint

Rivo provides a public health probe at:
```http
GET /api/health
```

### Health Response Schema

```json
{
  "status": "healthy",
  "timestamp": "2026-09-22T16:00:00.000Z",
  "environment": "production",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 14
    },
    "redis": {
      "status": "connected",
      "latencyMs": 8
    }
  }
}
```

### Status Codes

- `200 OK`: Core database is connected and responsive. (Redis may report `disabled` in local mode).
- `503 Service Unavailable`: Core database connection failed or timed out.

## Observability Best Practices

1. **Structured Log Sanitation:**
   - Loggers must never print user passwords, session tokens, JWTs, TOTP secrets, or connection strings containing credentials.
2. **Security Event Audit Logging:**
   - Sensitive security events (failed logins, password resets, MFA activations, privilege changes) are recorded immutably in the `security_audit_logs` table.
3. **Uptime Monitoring:**
   - Configure synthetic health checks (e.g., BetterStack, Datadog, or Pingdom) targeting `https://<domain>/api/health` at 1-minute intervals.
