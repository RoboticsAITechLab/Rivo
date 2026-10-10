import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { getTestRunDetails } from '@/lib/testing/test-repository';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const params = await context.params;
    const runId = params.id;
    const run = await getTestRunDetails(runId);
    if (!run) {
      return NextResponse.json({ error: `Test run ${runId} not found` }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
