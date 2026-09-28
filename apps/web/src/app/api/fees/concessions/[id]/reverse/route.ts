import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { reverseAdHocConcession } from '@/lib/fees/fee-payment-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.assign' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    if (!body.reversalReason || body.reversalReason.trim().length < 5) {
      return NextResponse.json(
        { message: 'A detailed reversal reason (at least 5 characters) is required.' },
        { status: 400 }
      );
    }

    const result = await reverseAdHocConcession(
      auth.schoolId,
      {
        obligationId: id,
        reversalReason: body.reversalReason.trim(),
      },
      auth.session.userId
    );

    return NextResponse.json({
      message: `Concession of ₹${result.reversedAmount} successfully reversed. Obligation balance restored to ₹${result.restoredBalance}.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/fees/concessions/[id]/reverse:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reverse concession' },
      { status: 400 }
    );
  }
}
