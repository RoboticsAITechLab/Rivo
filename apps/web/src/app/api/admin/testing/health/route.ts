import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { runComprehensiveHealthCheck } from '@/lib/testing/health-adapter';
import { persistHealthCheck } from '@/lib/testing/test-repository';

export async function GET(req: NextRequest) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const targetUrl = req.nextUrl.searchParams.get('targetUrl') || undefined;
    const report = await runComprehensiveHealthCheck(targetUrl);

    // Persist check in background
    persistHealthCheck(report).catch((e) => console.error('Error persisting health check:', e));

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
