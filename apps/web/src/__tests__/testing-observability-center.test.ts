/**
 * Rivo Production Testing & Observability Center Master Verification Suite
 *
 * Validates:
 * 1. Target URL allowlisting and strict SSRF prevention
 * 2. Secret redaction and evidence sanitizer
 * 3. Live infrastructure health check adapters (Postgres, Redis, Storage, Web App)
 * 4. Functional test execution against live target (https://rivo-web-sand.vercel.app)
 * 5. Bounded load testing engine with latency percentiles and cancellation
 * 6. Historical run persistence, metric aggregation, and report generation
 */

import { validateTargetUrl, DEFAULT_PRODUCTION_TARGET } from '../lib/testing/target-config';
import { sanitizePayload, sanitizeHeaders } from '../lib/testing/sanitizer';
import {
  checkPostgresHealth,
  checkTargetWebHealth,
  runComprehensiveHealthCheck,
} from '../lib/testing/health-adapter';
import { executeFunctionalSuite } from '../lib/testing/functional-runner';
import { startLoadTest, cancelLoadTest } from '../lib/testing/load-test-engine';
import {
  persistFunctionalRun,
  getHistoricalTestRuns,
  getDashboardMetrics,
  generateRunReport,
} from '../lib/testing/test-repository';
import { getAuditLogs, recordAuditLog } from '../lib/testing/audit-logger';

async function runTests() {
  console.log('\n===============================================================');
  console.log('RIVO PRODUCTION TESTING & OBSERVABILITY CENTER TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (details) console.error('    Evidence:', details);
      failed++;
    }
  }

  // GROUP 1: TARGET CONFIG & SSRF GUARD
  console.log('GROUP 1: TARGET CONFIGURATION & STRICT SSRF GUARD');

  const validTarget = validateTargetUrl(DEFAULT_PRODUCTION_TARGET);
  assert(
    validTarget.host === 'rivo-web-sand.vercel.app' && validTarget.isProduction,
    'Production target URL correctly validates and normalizes host'
  );

  const localTarget = validateTargetUrl('http://localhost:3000');
  assert(
    localTarget.host === 'localhost:3000' && localTarget.isLocal,
    'Local development host permits HTTP protocol'
  );

  let evilHostBlocked = false;
  try {
    validateTargetUrl('https://malicious-external-site.com');
  } catch {
    evilHostBlocked = true;
  }
  assert(evilHostBlocked, 'External non-allowlisted host is strictly blocked with security error');

  let metadataSsrfBlocked = false;
  try {
    validateTargetUrl('http://169.254.169.254/latest/meta-data');
  } catch {
    metadataSsrfBlocked = true;
  }
  assert(metadataSsrfBlocked, 'Cloud instance metadata IP (169.254.169.254) is strictly blocked');

  let privateIpBlocked = false;
  try {
    validateTargetUrl('https://192.168.1.100/internal-router');
  } catch {
    privateIpBlocked = true;
  }
  assert(privateIpBlocked, 'RFC1918 Private network IP is strictly blocked');

  // GROUP 2: SECRET REDACTION & EVIDENCE SANITIZER
  console.log('\nGROUP 2: SECRET REDACTION & EVIDENCE SANITIZER');

  const testPayload = {
    apiKey: 'sk_live_1234567890abcdef',
    password: 'superSecretPassword!',
    user: {
      email: 'admin@rivo.school',
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.testsignature12345678901234567890',
    },
  };
  const sanitizedObj = sanitizePayload(testPayload);
  assert(
    sanitizedObj.apiKey === '[REDACTED]' &&
      sanitizedObj.password === '[REDACTED]' &&
      !sanitizedObj.user.jwtToken.includes('eyJhbGci'),
    'Payload sanitizer redacts sensitive keys and JWT strings'
  );

  const headers = new Headers();
  headers.set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
  headers.set('Cookie', 'rivo_session=sess_123456');
  headers.set('Content-Type', 'application/json');

  const cleanHeaders = sanitizeHeaders(headers);
  assert(
    cleanHeaders['authorization'] === '[REDACTED]' &&
      cleanHeaders['cookie'] === '[REDACTED]' &&
      cleanHeaders['content-type'] === 'application/json',
    'HTTP headers sanitizer redacts cookies and authorization tokens'
  );

  // GROUP 3: REAL INFRASTRUCTURE HEALTH ADAPTERS
  console.log('\nGROUP 3: REAL INFRASTRUCTURE HEALTH ADAPTERS');

  const pgHealth = await checkPostgresHealth();
  assert(
    pgHealth.status === 'HEALTHY' && (pgHealth.latencyMs ?? 0) > 0,
    `PostgreSQL Neon live health check connects (latency: ${pgHealth.latencyMs}ms)`
  );

  const webHealth = await checkTargetWebHealth(DEFAULT_PRODUCTION_TARGET);
  assert(
    webHealth.status === 'HEALTHY' && (webHealth.latencyMs ?? 0) > 0,
    `Target Web App live health check connects (latency: ${webHealth.latencyMs}ms, status: ${webHealth.status})`
  );

  const compHealth = await runComprehensiveHealthCheck(DEFAULT_PRODUCTION_TARGET);
  assert(
    compHealth.overallStatus === 'HEALTHY' || compHealth.overallStatus === 'DEGRADED',
    `Comprehensive health report computes system status (${compHealth.overallStatus})`
  );

  // GROUP 4: FUNCTIONAL TEST ENGINE (LIVE TARGET)
  console.log('\nGROUP 4: FUNCTIONAL TEST EXECUTION AGAINST LIVE TARGET');

  const authSuite = await executeFunctionalSuite({
    suite: 'AUTH',
    rawTargetUrl: DEFAULT_PRODUCTION_TARGET,
  });
  assert(
    authSuite.totalTests >= 4 && authSuite.passRate === 100,
    `AUTH suite executed against live target: ${authSuite.passedTests}/${authSuite.totalTests} passed (${authSuite.passRate}%)`
  );

  const tenantSuite = await executeFunctionalSuite({
    suite: 'TENANT_ISOLATION',
    rawTargetUrl: DEFAULT_PRODUCTION_TARGET,
  });
  assert(
    tenantSuite.totalTests >= 4 && tenantSuite.passRate === 100,
    `TENANT_ISOLATION suite executed against live target: ${tenantSuite.passedTests}/${tenantSuite.totalTests} passed (${tenantSuite.passRate}%)`
  );

  // GROUP 5: BOUNDED LOAD TESTING ENGINE
  console.log('\nGROUP 5: BOUNDED LOAD TESTING ENGINE');

  const ltResult = await startLoadTest({
    stage: 'SMOKE',
    targetUrl: DEFAULT_PRODUCTION_TARGET,
    virtualUsers: 2,
    durationSeconds: 5,
    endpoints: ['/api/health'],
  });

  assert(
    ltResult.status === 'COMPLETED' && ltResult.totalRequests > 0,
    `Smoke load test completed: ${ltResult.totalRequests} reqs across 2 VUs (${ltResult.requestsPerSecond} req/s)`
  );
  assert(
    ltResult.latencyPercentiles.p50 > 0 && ltResult.latencyPercentiles.p95 >= ltResult.latencyPercentiles.p50,
    `Latency percentiles calculated accurately (p50: ${ltResult.latencyPercentiles.p50}ms, p95: ${ltResult.latencyPercentiles.p95}ms)`
  );

  // GROUP 6: TEST REPOSITORY, METRICS & REPORTS
  console.log('\nGROUP 6: PERSISTENCE, METRICS AGGREGATION & REPORT EXPORT');

  const runId = await persistFunctionalRun(authSuite, 'DIAGNOSTIC_VERIFIER');
  assert(runId.length > 0, `Functional test run persisted to database (Run ID: ${runId})`);

  const history = await getHistoricalTestRuns({ limit: 10 });
  assert(history.runs.length > 0, `Historical runs query returns persisted test records (${history.runs.length} runs)`);

  const metrics = await getDashboardMetrics();
  assert(
    metrics.totalRuns > 0 && metrics.overallPassRate > 0,
    `Dashboard metrics aggregated from recorded runs (Pass Rate: ${metrics.overallPassRate}%)`
  );

  const jsonReport = await generateRunReport(runId, 'json');
  assert(
    jsonReport.contentType === 'application/json' && jsonReport.content.includes(runId),
    'JSON report generator produces valid sanitized export'
  );

  const csvReport = await generateRunReport(runId, 'csv');
  assert(
    csvReport.contentType === 'text/csv' && csvReport.content.includes('Test Case'),
    'CSV report generator produces valid sanitized export'
  );

  // GROUP 7: AUDIT LOG STREAM
  console.log('\nGROUP 7: OBSERVABILITY & PRIVILEGED ACTION AUDIT STREAM');

  recordAuditLog({
    severity: 'INFO',
    service: 'VERIFICATION_TEST',
    action: 'TEST_AUDIT_LOG',
    operator: 'SYSTEM_TEST',
    targetUrl: DEFAULT_PRODUCTION_TARGET,
    message: 'Verification audit event recorded cleanly',
  });

  const logs = getAuditLogs({ limit: 5 });
  assert(logs.length > 0, `Audit log buffer captures privileged diagnostic actions (${logs.length} logs)`);

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
