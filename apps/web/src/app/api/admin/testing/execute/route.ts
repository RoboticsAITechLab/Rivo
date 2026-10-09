import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { executeFunctionalSuite } from '@/lib/testing/functional-runner';
import { runBrowserSyntheticSuite } from '@/lib/testing/browser-runner';
import { persistFunctionalRun } from '@/lib/testing/test-repository';
import { recordAuditLog } from '@/lib/testing/audit-logger';

export async function POST(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const suite = (body.suite || 'FULL_REGRESSION').toUpperCase();
    const targetUrl = body.targetUrl || undefined;
    const operatorName = auth.user ? (auth.user.email || auth.user.name || 'ADMIN_OPERATOR') : 'ADMIN_OPERATOR';

    recordAuditLog({
      severity: 'INFO',
      service: 'FUNCTIONAL_TEST',
      action: 'TRIGGER_SUITE',
      operator: operatorName,
      targetUrl: targetUrl || 'DEFAULT_PRODUCTION',
      message: `Triggered functional test suite: ${suite}`,
      details: { suite, targetUrl },
    });

    let runResult;
    if (suite === 'BROWSER') {
      const browserRes = await runBrowserSyntheticSuite(targetUrl);
      const total = browserRes.results.length;
      const passed = browserRes.results.filter((r) => r.status === 'PASSED').length;
      const failed = browserRes.results.filter((r) => r.status === 'FAILED').length;
      const skipped = browserRes.results.filter((r) => r.status === 'SKIPPED' || r.status === 'BLOCKED').length;

      runResult = {
        suite: 'BROWSER',
        targetUrl: targetUrl || 'DEFAULT_PRODUCTION',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1200,
        totalTests: total,
        passedTests: passed,
        failedTests: failed,
        skippedTests: skipped,
        passRate: total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0,
        results: browserRes.results,
        workerStatus: browserRes.workerStatus,
      };
    } else {
      runResult = await executeFunctionalSuite({ suite, rawTargetUrl: targetUrl });
    }

    const runId = await persistFunctionalRun(runResult, operatorName);

    return NextResponse.json({
      runId,
      ...runResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
