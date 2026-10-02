import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { executeRollNumberRebalance } from '@/lib/students/roll-number-service';

// POST /api/students/rolls/rebalance
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { classId, sectionId } = body;
    let { academicSessionId } = body;

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

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    const result = await executeRollNumberRebalance({
      schoolId: auth.schoolId,
      academicSessionId,
      classId,
      sectionId,
      performedByUserId: auth.userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Roll numbers rebalanced successfully. ${result.updatedCount} auto-assigned students updated; ${result.manualPreservedCount} manual roll numbers preserved.`,
      result,
    });
  } catch (error) {
    console.error('Error in POST /api/students/rolls/rebalance:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
