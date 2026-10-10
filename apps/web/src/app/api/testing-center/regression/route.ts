import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { getRegressionPreflight, runCompleteProductionRegression } from '@/lib/testing/complete-regression';
import { persistRegressionRun } from '@/lib/testing/test-repository';
import { recordAuditLog } from '@/lib/testing/audit-logger';

export async function GET(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const targetUrl = req.nextUrl.searchParams.get('targetUrl') || undefined;
    const preflight = getRegressionPreflight(targetUrl);
    return NextResponse.json(preflight);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.targetUrl;

    recordAuditLog({
      severity: 'INFO',
      service: 'REGRESSION_ENGINE',
      action: 'COMPLETE_REGRESSION_INITIATED',
      operator: auth.user.email || auth.user.id,
      targetUrl: targetUrl || 'DEFAULT_PRODUCTION',
      message: 'Operator launched Run Complete Production Regression across 20 suites',
    });

    const report = await runCompleteProductionRegression(targetUrl);

    // Persist regression run to PostgreSQL
    const savedId = await persistRegressionRun(report, auth.user.email || 'PLATFORM_OPERATOR');

    recordAuditLog({
      severity: report.status === 'PASSED' ? 'INFO' : 'WARN',
      service: 'REGRESSION_ENGINE',
      action: 'COMPLETE_REGRESSION_COMPLETED',
      operator: auth.user.email || auth.user.id,
      targetUrl: report.targetUrl,
      message: `Regression run completed with status ${report.status}. Pass rate: ${report.passRate}%`,
      details: {
        runId: savedId,
        passedTests: report.passedTests,
        failedTests: report.failedTests,
        blockedTests: report.blockedTests,
      },
    });

    return NextResponse.json({ ...report, runId: savedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
