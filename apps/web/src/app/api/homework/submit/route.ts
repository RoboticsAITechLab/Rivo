import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getHomeworkSettings } from '@/lib/settings/settings-service';

// POST /api/homework/submit - Student homework turn-in with institutional policy enforcement
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['STUDENT', 'SCHOOL_ADMIN', 'ADMIN', 'DIRECTOR', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { homeworkId, submissionText, attachments = [] } = body;

    if (!homeworkId) {
      return NextResponse.json({ message: 'Homework ID is required.' }, { status: 400 });
    }

    const homework = await prisma.homework.findFirst({
      where: { id: homeworkId, schoolId: auth.schoolId },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!homework) {
      return NextResponse.json({ message: 'Homework assignment not found.' }, { status: 404 });
    }

    const homeworkSettings = await getHomeworkSettings(auth.schoolId);

    // 1. Enforce deadline & late submission policy
    const isPastDeadline = new Date(homework.dueDate).getTime() < Date.now();
    if (isPastDeadline && !homeworkSettings.allowLateSubmissions) {
      return NextResponse.json(
        {
          success: false,
          code: 'LATE_SUBMISSIONS_DISABLED',
          message: 'Late homework submissions are disabled by institution policy.',
        },
        { status: 400 }
      );
    }

    // 2. Enforce attachment permission and size quota
    if (attachments && attachments.length > 0) {
      if (!homeworkSettings.attachmentsEnabled) {
        return NextResponse.json(
          {
            success: false,
            code: 'ATTACHMENTS_DISABLED',
            message: 'Homework file attachments are disabled by institution policy.',
          },
          { status: 400 }
        );
      }

      const maxBytes = (homeworkSettings.maxAttachmentSizeMB || 10) * 1024 * 1024;
      for (const att of attachments) {
        const size = att.size || att.sizeBytes || (att.sizeMB ? att.sizeMB * 1024 * 1024 : 0);
        if (size && size > maxBytes) {
          return NextResponse.json(
            {
              success: false,
              code: 'ATTACHMENT_TOO_LARGE',
              message: `Attachment file exceeds maximum permitted size of ${homeworkSettings.maxAttachmentSizeMB} MB.`,
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Homework turned in successfully.',
      submission: {
        homeworkId: homework.id,
        studentId: auth.userId,
        submittedAt: new Date().toISOString(),
        isLate: isPastDeadline,
        attachmentsCount: attachments.length,
      },
    });
  } catch (error: any) {
    console.error('[HOMEWORK_SUBMIT_ERROR]', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
