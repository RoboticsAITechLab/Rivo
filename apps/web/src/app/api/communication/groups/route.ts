import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { CommunicationService } from '@/lib/communication/communication-service';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const groups = await CommunicationService.getGroups(auth.schoolId);
    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error fetching communication groups:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch communication groups' },
      { status: 500 }
    );
  }
}
