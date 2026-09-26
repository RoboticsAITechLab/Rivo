import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { publishFeePlan } from '@/lib/fees/fee-plan-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.plan_publish' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const versionNumber = Number(body.versionNumber || 1);

    const published = await publishFeePlan(
      auth.schoolId,
      id,
      versionNumber,
      auth.session.userId
    );

    return NextResponse.json({
      message: `Fee plan version v${versionNumber} published successfully.`,
      version: published,
    });
  } catch (error: any) {
    console.error('Error in POST /api/fees/plans/[id]/publish:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to publish fee plan' },
      { status: 400 }
    );
  }
}
