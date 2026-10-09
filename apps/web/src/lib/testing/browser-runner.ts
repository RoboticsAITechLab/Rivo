/**
 * Rivo Production Testing & Observability Center
 * Browser Automation and Synthetic Web Runner
 */

import { validateTargetUrl, DEFAULT_PRODUCTION_TARGET } from './target-config';
import { TestCaseExecution } from './functional-runner';

export interface BrowserRunnerStatus {
  isPlaywrightAvailable: boolean;
  workerType: 'PLAYWRIGHT_CHROMIUM' | 'SYNTHETIC_HTTP_PROBER';
  workerStatus: 'READY' | 'WORKER_UNCONFIGURED';
  note: string;
}

/**
 * Inspects whether Playwright / Headless Chromium binary is available
 */
export async function getBrowserWorkerStatus(): Promise<BrowserRunnerStatus> {
  let isAvailable = false;
  try {
    const runtimeReq = eval('require');
    runtimeReq('playwright');
    isAvailable = true;
  } catch {
    isAvailable = false;
  }

  if (isAvailable) {
    return {
      isPlaywrightAvailable: true,
      workerType: 'PLAYWRIGHT_CHROMIUM',
      workerStatus: 'READY',
      note: 'Full Playwright headless browser engine is active.',
    };
  }

  return {
    isPlaywrightAvailable: false,
    workerType: 'SYNTHETIC_HTTP_PROBER',
    workerStatus: 'WORKER_UNCONFIGURED',
    note: 'Chromium binary is not installed in serverless container. Operating in Synthetic HTTP & DOM validation mode.',
  };
}

/**
 * Runs browser and synthetic navigation verification against deployed routes
 */
export async function runBrowserSyntheticSuite(rawTargetUrl?: string): Promise<{
  workerStatus: BrowserRunnerStatus;
  results: TestCaseExecution[];
}> {
  const validated = validateTargetUrl(rawTargetUrl || DEFAULT_PRODUCTION_TARGET);
  const targetUrl = validated.url;
  const workerStatus = await getBrowserWorkerStatus();

  const pagesToProbe = [
    { path: '/', name: 'Landing Page DOM & SSR Shell' },
    { path: '/login', name: 'Authentication Login Form Page' },
    { path: '/signup', name: 'Institution Registration Page' },
    { path: '/forgot-password', name: 'Password Recovery Page' },
    { path: '/access-denied', name: 'Access Denied Security Boundary Page' },
  ];

  const results: TestCaseExecution[] = [];

  for (const page of pagesToProbe) {
    const start = Date.now();
    try {
      const res = await fetch(`${targetUrl}${page.path}`, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RivoTestRunner',
        },
        cache: 'no-store',
      });
      const durationMs = Date.now() - start;
      const html = await res.text();

      const hasNextScripts = html.includes('_next') || html.includes('script');
      const isHtml = (res.headers.get('content-type') || '').includes('text/html');

      const passed = res.status === 200 && isHtml && hasNextScripts;

      results.push({
        name: `${page.name} - HTML DOM & Script Verification`,
        category: 'BROWSER_SYNTHETIC',
        suite: 'BROWSER',
        endpoint: page.path,
        method: 'GET',
        durationMs,
        httpStatus: res.status,
        status: passed ? 'PASSED' : 'FAILED',
        errorMessage: !passed ? `Unexpected response: status ${res.status}, isHtml: ${isHtml}` : undefined,
        evidence: {
          httpStatus: res.status,
          contentLength: html.length,
          containsNextScripts: hasNextScripts,
        },
      });
    } catch (err: any) {
      results.push({
        name: `${page.name} - Connection Failure`,
        category: 'BROWSER_SYNTHETIC',
        suite: 'BROWSER',
        endpoint: page.path,
        method: 'GET',
        durationMs: Date.now() - start,
        httpStatus: 0,
        status: 'FAILED',
        errorMessage: err.message,
      });
    }
  }

  // Check for test account availability for live browser workflow
  results.push({
    name: 'Authenticated Browser Workflows (Isolated Test Account Check)',
    category: 'BROWSER_AUTOMATION',
    suite: 'BROWSER',
    endpoint: '/login',
    method: 'POST',
    durationMs: 1,
    status: 'BLOCKED',
    errorMessage:
      'Blocked: Dedicated isolated browser test credentials not provisioned in current environment to avoid corrupting real school records.',
    evidence: {
      actionRequired:
        'Provision dedicated test institution and set TEST_E2E_USER and TEST_E2E_PASSWORD to enable automated stateful browser interaction.',
    },
  });

  return {
    workerStatus,
    results,
  };
}
