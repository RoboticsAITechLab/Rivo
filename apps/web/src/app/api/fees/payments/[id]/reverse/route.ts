import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { reverseFeePayment } from '@/lib/fees/fee-payment-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.payment_reverse' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const body = await req.json();

    if (!body.reversalReason || body.reversalReason.trim().length < 5) {
      return NextResponse.json(
        { message: 'A detailed reversal reason (at least 5 characters) is required.' },
        { status: 400 }
      );
    }

    const reversed = await reverseFeePayment(
      auth.schoolId,
      {
        paymentId: id,
        reversalReason: body.reversalReason,
      },
      auth.session.userId
    );

    return NextResponse.json({
      message: 'Payment reversed successfully. Obligation balances rolled back.',
      payment: reversed,
    });
  } catch (error: any) {
    console.error('Error in POST /api/fees/payments/[id]/reverse:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reverse payment' },
      { status: 400 }
    );
  }
}
