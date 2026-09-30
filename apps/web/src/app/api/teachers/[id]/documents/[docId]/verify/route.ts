import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// POST/PATCH /api/teachers/[id]/documents/[docId]/verify - Admin verification workflow
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Security check: Teachers cannot verify their own legal/KYC documents
    if (auth.role === 'TEACHER' || teacher.userId === auth.userId) {
      return NextResponse.json(
        { message: 'Self-verification is strictly prohibited. An authorized administrator must review and verify legal records.' },
        { status: 403 }
      );
    }

    const existingDoc = await prisma.teacherDocument.findFirst({
      where: { id: docId, teacherId: teacher.id },
    });

    if (!existingDoc) {
      return NextResponse.json({ message: 'Document record not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, verificationNote, rejectionReason } = body;

    if (action !== 'VERIFY' && action !== 'REJECT') {
      return NextResponse.json(
        { message: "Invalid action. Expected 'VERIFY' or 'REJECT'." },
        { status: 400 }
      );
    }

    if (action === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { message: 'Rejection reason is required when rejecting a document.' },
        { status: 400 }
      );
    }

    const updated = await prisma.teacherDocument.update({
      where: { id: docId },
      data: {
        status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
        verifiedById: auth.userId,
        verifiedAt: new Date(),
        verificationNote: verificationNote ? verificationNote.trim() : null,
        rejectionReason: action === 'REJECT' ? rejectionReason.trim() : null,
      },
      include: {
        verifiedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: action === 'VERIFY' ? 'Document marked as verified.' : 'Document rejected.',
      document: {
        id: updated.id,
        status: updated.status,
        verifiedAt: updated.verifiedAt?.toISOString(),
        verifiedByName: updated.verifiedBy ? `${updated.verifiedBy.firstName} ${updated.verifiedBy.lastName}`.trim() : null,
        verificationNote: updated.verificationNote,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error: any) {
    console.error('[TEACHER_DOC_VERIFY_ERROR] Error in document verification:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  return POST(req, context);
}
