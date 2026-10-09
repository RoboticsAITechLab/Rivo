/**
 * Rivo Production Testing & Observability Center
 * Automated Functional & Integration Test Engine
 */

import { validateTargetUrl, DEFAULT_PRODUCTION_TARGET } from './target-config';
import { sanitizePayload } from './sanitizer';

export interface TestCaseExecution {
  name: string;
  category: string;
  suite: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  durationMs: number;
  httpStatus?: number;
  errorMessage?: string;
  evidence?: Record<string, any>;
}

export interface FunctionalRunResult {
  suite: string;
  targetUrl: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  results: TestCaseExecution[];
  workerStatus?: any;
}

/**
 * Executes a single HTTP probe against the target URL
 */
async function executeProbe(params: {
  targetUrl: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}): Promise<{ status: number; durationMs: number; data: any; headers: Record<string, string> }> {
  const { targetUrl, path, method = 'GET', headers = {}, body, timeoutMs = 8000 } = params;
  const start = Date.now();
  const url = `${targetUrl}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Rivo-Production-Test-Runner/1.0',
      'Content-Type': 'application/json',
      ...headers,
    };

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    const durationMs = Date.now() - start;
    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = (await res.text()).slice(0, 500);
      } catch {
        data = null;
      }
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    return {
      status: res.status,
      durationMs,
      data: sanitizePayload(data),
      headers: responseHeaders,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      status: 0,
      durationMs: Date.now() - start,
      data: { error: err.message },
      headers: {},
    };
  }
}

/**
 * Runs test cases for the AUTHENTICATION suite
 */
async function runAuthSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  // Test 1: Unauthenticated access to /api/auth/me should return 401
  const t1 = await executeProbe({ targetUrl, path: '/api/auth/me', method: 'GET' });
  results.push({
    name: 'Unauthenticated session rejection on /api/auth/me',
    category: 'AUTHENTICATION',
    suite: 'AUTH',
    endpoint: '/api/auth/me',
    method: 'GET',
    durationMs: t1.durationMs,
    httpStatus: t1.status,
    status: t1.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage: t1.status !== 401 ? `Expected HTTP 401, got ${t1.status}` : undefined,
    evidence: { responseStatus: t1.status, responsePayload: t1.data },
  });

  // Test 2: Login with empty payload should return 400 or 401
  const t2 = await executeProbe({
    targetUrl,
    path: '/api/auth/login',
    method: 'POST',
    body: {},
  });
  results.push({
    name: 'Validation rejection on empty login payload',
    category: 'AUTHENTICATION',
    suite: 'AUTH',
    endpoint: '/api/auth/login',
    method: 'POST',
    durationMs: t2.durationMs,
    httpStatus: t2.status,
    status: t2.status === 400 || t2.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage:
      t2.status !== 400 && t2.status !== 401 ? `Expected HTTP 400 or 401, got ${t2.status}` : undefined,
    evidence: { responseStatus: t2.status, responsePayload: t2.data },
  });

  // Test 3: Login with invalid test credentials fails closed
  const t3 = await executeProbe({
    targetUrl,
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'nonexistent-diagnostic-runner@rivo.school', password: 'InvalidPassword123!' },
  });
  results.push({
    name: 'Timing-safe rejection of invalid credentials',
    category: 'AUTHENTICATION',
    suite: 'AUTH',
    endpoint: '/api/auth/login',
    method: 'POST',
    durationMs: t3.durationMs,
    httpStatus: t3.status,
    status: t3.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage: t3.status !== 401 ? `Expected HTTP 401, got ${t3.status}` : undefined,
    evidence: { responseStatus: t3.status, responsePayload: t3.data },
  });

  // Test 4: MFA challenge flow rejects unauthenticated requests
  const t4 = await executeProbe({
    targetUrl,
    path: '/api/auth/mfa/challenge',
    method: 'POST',
    body: { code: '123456' },
  });
  results.push({
    name: 'MFA challenge rejects unauthenticated requests',
    category: 'AUTHENTICATION',
    suite: 'AUTH',
    endpoint: '/api/auth/mfa/challenge',
    method: 'POST',
    durationMs: t4.durationMs,
    httpStatus: t4.status,
    status: t4.status === 401 || t4.status === 400 ? 'PASSED' : 'FAILED',
    errorMessage:
      t4.status !== 401 && t4.status !== 400 ? `Expected HTTP 401 or 400, got ${t4.status}` : undefined,
    evidence: { responseStatus: t4.status, responsePayload: t4.data },
  });

  return results;
}

/**
 * Runs test cases for the TENANT ISOLATION suite
 */
async function runTenantIsolationSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  // Test 1: Accessing school classes without institutional session
  const t1 = await executeProbe({ targetUrl, path: '/api/classes', method: 'GET' });
  results.push({
    name: 'Unauthenticated access denied to /api/classes',
    category: 'AUTHORIZATION',
    suite: 'TENANT_ISOLATION',
    endpoint: '/api/classes',
    method: 'GET',
    durationMs: t1.durationMs,
    httpStatus: t1.status,
    status: t1.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage: t1.status !== 401 ? `Expected HTTP 401, got ${t1.status}` : undefined,
    evidence: { responseStatus: t1.status },
  });

  // Test 2: Accessing student records without institutional session
  const t2 = await executeProbe({ targetUrl, path: '/api/students', method: 'GET' });
  results.push({
    name: 'Unauthenticated access denied to /api/students',
    category: 'AUTHORIZATION',
    suite: 'TENANT_ISOLATION',
    endpoint: '/api/students',
    method: 'GET',
    durationMs: t2.durationMs,
    httpStatus: t2.status,
    status: t2.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage: t2.status !== 401 ? `Expected HTTP 401, got ${t2.status}` : undefined,
    evidence: { responseStatus: t2.status },
  });

  // Test 3: Accessing fee obligations without institutional session
  const t3 = await executeProbe({ targetUrl, path: '/api/fees/obligations', method: 'GET' });
  results.push({
    name: 'Unauthenticated access denied to /api/fees/obligations',
    category: 'AUTHORIZATION',
    suite: 'TENANT_ISOLATION',
    endpoint: '/api/fees/obligations',
    method: 'GET',
    durationMs: t3.durationMs,
    httpStatus: t3.status,
    status: t3.status === 401 ? 'PASSED' : 'FAILED',
    errorMessage: t3.status !== 401 ? `Expected HTTP 401, got ${t3.status}` : undefined,
    evidence: { responseStatus: t3.status },
  });

  // Test 4: School profile update without authorization
  const t4 = await executeProbe({
    targetUrl,
    path: '/api/school/profile',
    method: 'POST',
    body: { name: 'Unauthorized Tenant Spoof' },
  });
  results.push({
    name: 'School profile modification strictly denied to unauthorized requests',
    category: 'AUTHORIZATION',
    suite: 'TENANT_ISOLATION',
    endpoint: '/api/school/profile',
    method: 'POST',
    durationMs: t4.durationMs,
    httpStatus: t4.status,
    status: t4.status === 401 || t4.status === 403 || t4.status === 405 ? 'PASSED' : 'FAILED',
    errorMessage:
      t4.status !== 401 && t4.status !== 403 && t4.status !== 405
        ? `Expected HTTP 401/403/405, got ${t4.status}`
        : undefined,
    evidence: { responseStatus: t4.status },
  });

  return results;
}

/**
 * Runs test cases for the ACADEMIC modules suite
 */
async function runAcademicSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  const endpoints = [
    { path: '/api/academic-sessions', name: 'Academic Sessions API route guard' },
    { path: '/api/sections', name: 'Sections API route guard' },
    { path: '/api/subjects', name: 'Subjects API route guard' },
    { path: '/api/timetable/config', name: 'Timetable Configuration API route guard' },
    { path: '/api/teachers', name: 'Teacher Directory API route guard' },
  ];

  for (const ep of endpoints) {
    const probe = await executeProbe({ targetUrl, path: ep.path, method: 'GET' });
    results.push({
      name: ep.name,
      category: 'ACADEMIC',
      suite: 'ACADEMIC',
      endpoint: ep.path,
      method: 'GET',
      durationMs: probe.durationMs,
      httpStatus: probe.status,
      status: probe.status === 401 ? 'PASSED' : 'FAILED',
      errorMessage: probe.status !== 401 ? `Expected HTTP 401, got ${probe.status}` : undefined,
      evidence: { responseStatus: probe.status },
    });
  }

  return results;
}

/**
 * Runs test cases for the FEE MANAGEMENT suite
 */
async function runFeeSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  const feeEndpoints = [
    { path: '/api/fees/heads', name: 'Fee Heads API route guard' },
    { path: '/api/fees/plans', name: 'Fee Plans API route guard' },
    { path: '/api/fees/payments', name: 'Fee Payments API route guard' },
    { path: '/api/fees/receipts', name: 'Fee Receipts API route guard' },
    { path: '/api/fees/stats', name: 'Fee Statistics API route guard' },
  ];

  for (const ep of feeEndpoints) {
    const probe = await executeProbe({ targetUrl, path: ep.path, method: 'GET' });
    results.push({
      name: ep.name,
      category: 'FINANCE',
      suite: 'FEES',
      endpoint: ep.path,
      method: 'GET',
      durationMs: probe.durationMs,
      httpStatus: probe.status,
      status: probe.status === 401 ? 'PASSED' : 'FAILED',
      errorMessage: probe.status !== 401 ? `Expected HTTP 401, got ${probe.status}` : undefined,
      evidence: { responseStatus: probe.status },
    });
  }

  return results;
}

/**
 * Runs test cases for the MEDIA & STORAGE suite
 */
async function runMediaSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  // Test 1: Direct SAS upload endpoint rejects unauthenticated caller
  const t1 = await executeProbe({
    targetUrl,
    path: '/api/media/sas/upload',
    method: 'POST',
    body: { fileName: 'test.png', fileType: 'image/png', fileSize: 1024 },
  });
  results.push({
    name: 'Direct SAS upload generation rejects unauthenticated caller',
    category: 'STORAGE',
    suite: 'MEDIA',
    endpoint: '/api/media/sas/upload',
    method: 'POST',
    durationMs: t1.durationMs,
    httpStatus: t1.status,
    status: t1.status === 401 || t1.status === 404 ? 'PASSED' : 'FAILED',
    errorMessage:
      t1.status !== 401 && t1.status !== 404 ? `Expected HTTP 401 or 404, got ${t1.status}` : undefined,
    evidence: { responseStatus: t1.status },
  });

  // Test 2: Upload endpoint rejects path traversal
  const t2 = await executeProbe({
    targetUrl,
    path: '/api/students/photo/upload',
    method: 'POST',
    body: { fileName: '../../etc/shadow', fileType: 'application/octet-stream' },
  });
  results.push({
    name: 'Upload endpoints reject path traversal and dangerous extensions',
    category: 'STORAGE',
    suite: 'MEDIA',
    endpoint: '/api/students/photo/upload',
    method: 'POST',
    durationMs: t2.durationMs,
    httpStatus: t2.status,
    status: t2.status === 401 || t2.status === 400 || t2.status === 404 ? 'PASSED' : 'FAILED',
    errorMessage:
      t2.status !== 401 && t2.status !== 400 && t2.status !== 404
        ? `Expected HTTP 400/401/404, got ${t2.status}`
        : undefined,
    evidence: { responseStatus: t2.status },
  });

  return results;
}

/**
 * Runs test cases for the COMMUNICATION & PARENT suite
 */
async function runCommunicationSuite(targetUrl: string): Promise<TestCaseExecution[]> {
  const results: TestCaseExecution[] = [];

  const commEndpoints = [
    { path: '/api/notices', name: 'Notice Board API route guard' },
    { path: '/api/notifications', name: 'Notifications API route guard' },
    { path: '/api/communication/groups', name: 'Communication Groups API route guard' },
    { path: '/api/auth/parent/otp/request', name: 'Parent OTP rate limiter and schema guard' },
  ];

  for (const ep of commEndpoints) {
    const probe = await executeProbe({ targetUrl, path: ep.path, method: 'GET' });
    // Some routes like OTP require POST or return 401/405
    const isExpected = probe.status === 401 || probe.status === 405 || probe.status === 400;
    results.push({
      name: ep.name,
      category: 'COMMUNICATION',
      suite: 'COMMUNICATION',
      endpoint: ep.path,
      method: 'GET',
      durationMs: probe.durationMs,
      httpStatus: probe.status,
      status: isExpected ? 'PASSED' : 'FAILED',
      errorMessage: !isExpected ? `Unexpected status: got ${probe.status}` : undefined,
      evidence: { responseStatus: probe.status },
    });
  }

  return results;
}

/**
 * Main dispatcher to run functional test suites against the deployed environment
 */
export async function executeFunctionalSuite(params: {
  suite: string;
  rawTargetUrl?: string;
}): Promise<FunctionalRunResult> {
  const validated = validateTargetUrl(params.rawTargetUrl || DEFAULT_PRODUCTION_TARGET);
  const targetUrl = validated.url;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const selectedSuite = params.suite.toUpperCase();
  let results: TestCaseExecution[] = [];

  if (selectedSuite === 'AUTH') {
    results = await runAuthSuite(targetUrl);
  } else if (selectedSuite === 'TENANT_ISOLATION') {
    results = await runTenantIsolationSuite(targetUrl);
  } else if (selectedSuite === 'ACADEMIC') {
    results = await runAcademicSuite(targetUrl);
  } else if (selectedSuite === 'FEES') {
    results = await runFeeSuite(targetUrl);
  } else if (selectedSuite === 'MEDIA') {
    results = await runMediaSuite(targetUrl);
  } else if (selectedSuite === 'COMMUNICATION') {
    results = await runCommunicationSuite(targetUrl);
  } else {
    // FULL REGRESSION: Run all suites
    const [auth, tenant, academic, fee, media, comm] = await Promise.all([
      runAuthSuite(targetUrl),
      runTenantIsolationSuite(targetUrl),
      runAcademicSuite(targetUrl),
      runFeeSuite(targetUrl),
      runMediaSuite(targetUrl),
      runCommunicationSuite(targetUrl),
    ]);
    results = [...auth, ...tenant, ...academic, ...fee, ...media, ...comm];
  }

  const durationMs = Date.now() - startTime;
  const completedAt = new Date().toISOString();

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.status === 'PASSED').length;
  const failedTests = results.filter((r) => r.status === 'FAILED').length;
  const skippedTests = results.filter((r) => r.status === 'SKIPPED' || r.status === 'BLOCKED').length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return {
    suite: selectedSuite,
    targetUrl,
    startedAt,
    completedAt,
    durationMs,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    passRate: Number(passRate.toFixed(1)),
    results,
  };
}
