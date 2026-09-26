import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getStudentFeeLedger } from '@/lib/fees/fee-payment-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const academicSessionId = searchParams.get('academicSessionId') || undefined;

    if (!studentId) {
      return NextResponse.json({ message: 'studentId query parameter is required.' }, { status: 400 });
    }

    const ledger = await getStudentFeeLedger(auth.schoolId, studentId, academicSessionId);
    return NextResponse.json(ledger);
  } catch (error: any) {
    console.error('Error in GET /api/fees/obligations:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch fee obligations' },
      { status: 500 }
    );
  }
}
