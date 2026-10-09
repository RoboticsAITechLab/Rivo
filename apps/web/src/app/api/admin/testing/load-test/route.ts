import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { startLoadTest, LoadTestConfig } from '@/lib/testing/load-test-engine';
import { persistLoadTestRun } from '@/lib/testing/test-repository';

export async function POST(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const operatorName = auth.user ? (auth.user.email || auth.user.name || 'ADMIN_OPERATOR') : 'ADMIN_OPERATOR';

    const config: LoadTestConfig = {
      stage: body.stage || 'SMOKE',
      targetUrl: body.targetUrl,
      endpoints: body.endpoints,
      virtualUsers: body.virtualUsers || 3,
      durationSeconds: body.durationSeconds || 10,
      timeoutMs: body.timeoutMs || 5000,
      maxErrorRatePercent: body.maxErrorRatePercent || 5,
      maxP95LatencyMs: body.maxP95LatencyMs || 2000,
      operator: operatorName,
      notes: body.notes,
    };

    const metrics = await startLoadTest(config);
    const persistedId = await persistLoadTestRun(metrics, operatorName);

    return NextResponse.json({
      persistedId,
      ...metrics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
