import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getReceiptPrintData } from '@/lib/fees/fee-payment-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.receipt_view' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const receipt = await getReceiptPrintData(auth.schoolId, id);

    return NextResponse.json({ receipt });
  } catch (error: any) {
    console.error('Error in GET /api/fees/receipts/[id]:', error);
    return NextResponse.json(
      { message: error.message || 'Receipt not found' },
      { status: 404 }
    );
  }
}
