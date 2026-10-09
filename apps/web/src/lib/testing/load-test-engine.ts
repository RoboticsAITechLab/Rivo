/**
 * Rivo Production Testing & Observability Center
 * Bounded Load Testing Engine with High Concurrency Control and Server-Side Cancellation
 */

import { validateTargetUrl, DEFAULT_PRODUCTION_TARGET } from './target-config';
import { recordAuditLog } from './audit-logger';

export type LoadTestStage = 'SMOKE' | 'BASELINE' | 'CONTROLLED' | 'STRESS' | 'SOAK';

export interface LoadTestConfig {
  stage: LoadTestStage;
  targetUrl?: string;
  endpoints?: string[];
  virtualUsers: number; // Max ceiling 20
  durationSeconds: number; // Max ceiling 60s
  timeoutMs?: number;
  maxErrorRatePercent?: number; // e.g. 5%
  maxP95LatencyMs?: number; // e.g. 2000ms
  operator?: string;
  notes?: string;
}

export interface LatencyPercentiles {
  min: number;
  p50: number; // Median
  p90: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
}

export interface LoadTestMetrics {
  runId: string;
  stage: LoadTestStage;
  targetUrl: string;
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  virtualUsers: number;
  totalRequests: number;
  successfulRequests: number; // 2xx
  redirectRequests: number; // 3xx
  clientErrors: number; // 4xx
  serverErrors: number; // 5xx
  timeouts: number;
  networkErrors: number;
  requestsPerSecond: number;
  errorRatePercent: number;
  latencyPercentiles: LatencyPercentiles;
  perEndpointMetrics: Record<
    string,
    {
      requests: number;
      success: number;
      errors: number;
      avgLatencyMs: number;
    }
  >;
  thresholdEvaluation: {
    passed: boolean;
    errorRatePassed: boolean;
    latencyPassed: boolean;
    reason?: string;
  };
}

// Global registry of active load tests for server-side cancellation
const activeLoadTests = new Map<
  string,
  {
    controller: AbortController;
    metrics: LoadTestMetrics;
    isCancelled: boolean;
  }
>();

// Approved read-only endpoints suitable for load testing
const SAFE_LOAD_ENDPOINTS = ['/api/health', '/', '/login', '/api/auth/me'];

/**
 * Calculates latency percentiles from a sorted array of millisecond values
 */
function calculatePercentiles(latencies: number[]): LatencyPercentiles {
  if (latencies.length === 0) {
    return { min: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p: number) => {
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return sorted[idx];
  };

  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / sorted.length);

  return {
    min: sorted[0],
    p50: getP(50),
    p90: getP(90),
    p95: getP(95),
    p99: getP(99),
    max: sorted[sorted.length - 1],
    avg,
  };
}

/**
 * Executes a controlled, bounded load test
 */
export async function startLoadTest(config: LoadTestConfig): Promise<LoadTestMetrics> {
  const validated = validateTargetUrl(config.targetUrl || DEFAULT_PRODUCTION_TARGET);
  const targetUrl = validated.url;

  // Enforce Safety Ceilings
  const virtualUsers = Math.max(1, Math.min(config.virtualUsers || 3, 20)); // Ceiling: 20 VUs
  const durationSeconds = Math.max(3, Math.min(config.durationSeconds || 10, 60)); // Ceiling: 60s
  const timeoutMs = Math.max(1000, Math.min(config.timeoutMs || 5000, 10000));
  const maxErrorRate = config.maxErrorRatePercent ?? 5;
  const maxP95 = config.maxP95LatencyMs ?? 2000;

  // Filter allowed safe endpoints
  const endpoints = (config.endpoints || ['/api/health', '/']).filter((ep) =>
    SAFE_LOAD_ENDPOINTS.includes(ep)
  );
  if (endpoints.length === 0) {
    endpoints.push('/api/health');
  }

  const runId = `lt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const startedAt = new Date().toISOString();
  const controller = new AbortController();

  const metrics: LoadTestMetrics = {
    runId,
    stage: config.stage,
    targetUrl,
    status: 'RUNNING',
    startedAt,
    elapsedSeconds: 0,
    virtualUsers,
    totalRequests: 0,
    successfulRequests: 0,
    redirectRequests: 0,
    clientErrors: 0,
    serverErrors: 0,
    timeouts: 0,
    networkErrors: 0,
    requestsPerSecond: 0,
    errorRatePercent: 0,
    latencyPercentiles: { min: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0, avg: 0 },
    perEndpointMetrics: {},
    thresholdEvaluation: {
      passed: true,
      errorRatePassed: true,
      latencyPassed: true,
    },
  };

  endpoints.forEach((ep) => {
    metrics.perEndpointMetrics[ep] = {
      requests: 0,
      success: 0,
      errors: 0,
      avgLatencyMs: 0,
    };
  });

  activeLoadTests.set(runId, {
    controller,
    metrics,
    isCancelled: false,
  });

  recordAuditLog({
    severity: 'INFO',
    service: 'LOAD_TEST',
    action: 'START_LOAD_TEST',
    operator: config.operator || 'ADMIN_OPERATOR',
    targetUrl,
    message: `Started ${config.stage} load test (${virtualUsers} VUs, ${durationSeconds}s duration)`,
    details: { runId, stage: config.stage, virtualUsers, durationSeconds, endpoints },
  });

  const latencies: number[] = [];
  const endpointLatencies: Record<string, number[]> = {};
  endpoints.forEach((ep) => (endpointLatencies[ep] = []));

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  // Worker generator function
  async function runVirtualUser(workerId: number) {
    let epIndex = workerId % endpoints.length;

    while (Date.now() < endTime && !controller.signal.aborted) {
      const ep = endpoints[epIndex % endpoints.length];
      epIndex++;
      const reqStart = Date.now();

      try {
        const reqController = new AbortController();
        const reqTimer = setTimeout(() => reqController.abort(), timeoutMs);

        // Link parent controller
        const onParentAbort = () => reqController.abort();
        controller.signal.addEventListener('abort', onParentAbort);

        const res = await fetch(`${targetUrl}${ep}`, {
          method: 'GET',
          headers: {
            'User-Agent': `Rivo-LoadTest-Worker/${workerId}`,
          },
          signal: reqController.signal,
          cache: 'no-store',
        });

        clearTimeout(reqTimer);
        controller.signal.removeEventListener('abort', onParentAbort);

        const latency = Date.now() - reqStart;
        latencies.push(latency);
        endpointLatencies[ep].push(latency);

        metrics.totalRequests++;
        metrics.perEndpointMetrics[ep].requests++;

        if (res.status >= 200 && res.status < 300) {
          metrics.successfulRequests++;
          metrics.perEndpointMetrics[ep].success++;
        } else if (res.status >= 300 && res.status < 400) {
          metrics.redirectRequests++;
          metrics.successfulRequests++;
          metrics.perEndpointMetrics[ep].success++;
        } else if (res.status >= 400 && res.status < 500) {
          // Expected 401s on protected endpoints are recorded
          metrics.clientErrors++;
          if (res.status === 401 || res.status === 403) {
            metrics.successfulRequests++; // Protected endpoint correctly guarding
          } else {
            metrics.perEndpointMetrics[ep].errors++;
          }
        } else {
          metrics.serverErrors++;
          metrics.perEndpointMetrics[ep].errors++;
        }
      } catch (err: any) {
        if (controller.signal.aborted) break;

        const latency = Date.now() - reqStart;
        latencies.push(latency);

        metrics.totalRequests++;
        metrics.perEndpointMetrics[ep].requests++;
        metrics.perEndpointMetrics[ep].errors++;

        if (err.name === 'AbortError') {
          metrics.timeouts++;
        } else {
          metrics.networkErrors++;
        }
      }

      // Small pacing delay (50ms - 150ms) to ensure realistic burst distribution
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  // Launch virtual user workers concurrently
  const workers = Array.from({ length: virtualUsers }, (_, i) => runVirtualUser(i + 1));
  await Promise.all(workers);

  const totalDurationMs = Date.now() - startTime;
  const actualDurationSeconds = Math.max(1, totalDurationMs / 1000);

  const activeEntry = activeLoadTests.get(runId);
  const wasCancelled = activeEntry?.isCancelled || controller.signal.aborted;

  metrics.status = wasCancelled ? 'CANCELLED' : 'COMPLETED';
  metrics.completedAt = new Date().toISOString();
  metrics.elapsedSeconds = Number(actualDurationSeconds.toFixed(1));
  metrics.requestsPerSecond = Number((metrics.totalRequests / actualDurationSeconds).toFixed(1));

  const totalFailed = metrics.serverErrors + metrics.timeouts + metrics.networkErrors;
  metrics.errorRatePercent =
    metrics.totalRequests > 0 ? Number(((totalFailed / metrics.totalRequests) * 100).toFixed(1)) : 0;

  metrics.latencyPercentiles = calculatePercentiles(latencies);

  // Compute per-endpoint averages
  endpoints.forEach((ep) => {
    const list = endpointLatencies[ep];
    const avg = list.length > 0 ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0;
    metrics.perEndpointMetrics[ep].avgLatencyMs = avg;
  });

  // Evaluate Pass/Fail Thresholds
  const errorRatePassed = metrics.errorRatePercent <= maxErrorRate;
  const latencyPassed = metrics.latencyPercentiles.p95 <= maxP95;
  const overallPassed = !wasCancelled && errorRatePassed && latencyPassed;

  let reason = '';
  if (wasCancelled) reason = 'Operator manually halted load test';
  else if (!errorRatePassed) reason = `Error rate (${metrics.errorRatePercent}%) exceeded threshold (${maxErrorRate}%)`;
  else if (!latencyPassed) reason = `p95 Latency (${metrics.latencyPercentiles.p95}ms) exceeded threshold (${maxP95}ms)`;

  metrics.thresholdEvaluation = {
    passed: overallPassed,
    errorRatePassed,
    latencyPassed,
    reason: reason || 'All thresholds satisfied',
  };

  recordAuditLog({
    severity: overallPassed ? 'INFO' : 'WARN',
    service: 'LOAD_TEST',
    action: wasCancelled ? 'CANCEL_LOAD_TEST' : 'COMPLETE_LOAD_TEST',
    operator: config.operator || 'ADMIN_OPERATOR',
    targetUrl,
    message: `Load test ${runId} ${metrics.status}: ${metrics.totalRequests} reqs, p95 ${metrics.latencyPercentiles.p95}ms, error rate ${metrics.errorRatePercent}%`,
    details: { runId, status: metrics.status, metrics },
  });

  activeLoadTests.delete(runId);
  return metrics;
}

/**
 * Cancels an in-progress load test
 */
export function cancelLoadTest(runId: string, operator?: string): boolean {
  const active = activeLoadTests.get(runId);
  if (!active) return false;

  active.isCancelled = true;
  active.controller.abort();
  active.metrics.status = 'CANCELLED';

  recordAuditLog({
    severity: 'WARN',
    service: 'LOAD_TEST',
    action: 'OPERATOR_CANCEL_LOAD_TEST',
    operator: operator || 'ADMIN_OPERATOR',
    targetUrl: active.metrics.targetUrl,
    message: `Load test ${runId} was manually stopped by operator`,
    details: { runId },
  });

  return true;
}

/**
 * Retrieves status of an active or recent load test
 */
export function getLoadTestStatus(runId: string): LoadTestMetrics | null {
  const active = activeLoadTests.get(runId);
  return active ? active.metrics : null;
}
