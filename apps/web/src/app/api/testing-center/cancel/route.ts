import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { cancelLoadTest } from '@/lib/testing/load-test-engine';

export async function POST(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { runId } = body;
    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const operatorName = auth.user ? (auth.user.email || auth.user.name || 'PLATFORM_OPERATOR') : 'PLATFORM_OPERATOR';
    const cancelled = cancelLoadTest(runId, operatorName);

    return NextResponse.json({
      runId,
      cancelled,
      message: cancelled ? 'Test run cancelled successfully' : 'Test run not found or already completed',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
