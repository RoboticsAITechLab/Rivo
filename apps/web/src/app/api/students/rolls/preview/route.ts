import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { previewRollNumberRebalance } from '@/lib/students/roll-number-service';

// GET /api/students/rolls/preview?classId=...&sectionId=...&academicSessionId=...
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    let academicSessionId = searchParams.get('academicSessionId');

    if (!academicSessionId) {
      const activeSession = await prisma.academicSession.findFirst({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
      });
      if (!activeSession) {
        return NextResponse.json(
          { message: 'No active academic session found for this school.' },
          { status: 400 }
        );
      }
      academicSessionId = activeSession.id;
    }

    const preview = await previewRollNumberRebalance({
      schoolId: auth.schoolId,
      academicSessionId,
      classId,
      sectionId,
    });

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error in GET /api/students/rolls/preview:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
