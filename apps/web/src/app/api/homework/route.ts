import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getHomeworkSettings } from '@/lib/settings/settings-service';

// GET /api/homework - List homework assignments with tenant isolation and cohort stats
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');

    // Resolve active academic session
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    const homeworkList = await prisma.homework.findMany({
      where: {
        schoolId: auth.schoolId,
        ...(activeSession ? { academicSessionId: activeSession.id } : {}),
        ...(classId && classId !== 'ALL' ? { classId } : {}),
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
        ...(subjectId && subjectId !== 'ALL' ? { subjectId } : {}),
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute cohort enrollment counts for each homework
    const formatted = await Promise.all(
      homeworkList.map(async (hw) => {
        const studentCount = await prisma.studentEnrollment.count({
          where: {
            schoolId: auth.schoolId,
            classId: hw.classId,
            ...(hw.sectionId ? { sectionId: hw.sectionId } : {}),
            status: 'ACTIVE',
          },
        });

        const teacherName = hw.teacher?.user
          ? `${hw.teacher.user.firstName} ${hw.teacher.user.lastName}`.trim()
          : 'Faculty';

        const rawAttachments = hw.attachments ? (hw.attachments as any[]) : [];
        const attachments = Array.isArray(rawAttachments) ? rawAttachments : [];

        return {
          id: hw.id,
          title: hw.title,
          description: hw.description,
          subjectId: hw.subjectId,
          subjectName: hw.subject.name,
          classId: hw.classId,
          className: hw.class.name,
          sectionId: hw.sectionId || '',
          sectionName: hw.section?.name || 'All Sections',
          teacherId: hw.teacherId || '',
          teacherName,
          assignedDate: hw.assignedDate.toISOString().split('T')[0],
          dueDate: hw.dueDate.toISOString().split('T')[0],
          status: hw.status as any,
          priority: 'NORMAL' as const,
          notifyStudents: true,
          attachments,
          totalStudents: studentCount,
          completedCount: 0,
          pendingCount: studentCount,
          overdueCount: new Date(hw.dueDate).getTime() < Date.now() ? studentCount : 0,
          createdAt: hw.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ success: true, homework: formatted });
  } catch (error: any) {
    console.error('[HOMEWORK_GET_ERROR] Error fetching homework:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/homework - Create a new curriculum homework assignment
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    const homeworkSettings = await getHomeworkSettings(auth.schoolId);

    // Enforce faculty assignment permission
    if (auth.role === 'TEACHER' && !homeworkSettings.teacherCanCreate) {
      return NextResponse.json(
        { message: 'Teacher homework creation is disabled in institution settings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      classId,
      sectionId,
      subjectId,
      teacherId,
      assignedDate,
      dueDate,
      attachments = [],
      status = 'PUBLISHED',
    } = body;

    if (!title || !description || !classId || !subjectId || !dueDate) {
      return NextResponse.json(
        { message: 'Title, description, class, subject, and due date are required.' },
        { status: 400 }
      );
    }

    // Enforce attachment settings
    if (attachments && attachments.length > 0 && !homeworkSettings.attachmentsEnabled) {
      return NextResponse.json(
        { message: 'Homework attachments are disabled in institution settings.' },
        { status: 400 }
      );
    }

    // Resolve active academic session
    const activeSession = await prisma.academicSession.findFirst({
      where: { schoolId: auth.schoolId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      return NextResponse.json({ message: 'No active academic session found for school.' }, { status: 400 });
    }

    // Resolve teacher if not explicitly passed
    let finalTeacherId = teacherId || null;
    if (!finalTeacherId && auth.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { schoolId: auth.schoolId, userId: auth.userId },
      });
      if (teacher) finalTeacherId = teacher.id;
    }

    const created = await prisma.homework.create({
      data: {
        schoolId: auth.schoolId,
        academicSessionId: activeSession.id,
        classId,
        sectionId: sectionId && sectionId !== 'ALL' ? sectionId : null,
        subjectId,
        teacherId: finalTeacherId,
        title: title.trim(),
        description: description.trim(),
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        dueDate: new Date(dueDate),
        attachments: attachments,
        status,
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Homework assigned and published successfully.',
      homework: {
        id: created.id,
        title: created.title,
        description: created.description,
        subjectId: created.subjectId,
        subjectName: created.subject.name,
        classId: created.classId,
        className: created.class.name,
        sectionId: created.sectionId || '',
        sectionName: created.section?.name || 'All Sections',
        teacherId: created.teacherId || '',
        teacherName: created.teacher?.user
          ? `${created.teacher.user.firstName} ${created.teacher.user.lastName}`.trim()
          : 'Faculty',
        assignedDate: created.assignedDate.toISOString().split('T')[0],
        dueDate: created.dueDate.toISOString().split('T')[0],
        status: created.status,
        priority: 'NORMAL',
        notifyStudents: true,
        attachments: created.attachments || [],
        totalStudents: 0,
        completedCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[HOMEWORK_POST_ERROR] Error creating homework:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/homework - Update homework assignment details or status
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { id, title, description, dueDate, status, attachments } = body;

    if (!id) {
      return NextResponse.json({ message: 'Homework ID is required.' }, { status: 400 });
    }

    const existing = await prisma.homework.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Homework not found.' }, { status: 404 });
    }

    const updated = await prisma.homework.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        ...(status ? { status } : {}),
        ...(attachments !== undefined ? { attachments } : {}),
      },
    });

    return NextResponse.json({ success: true, message: 'Homework updated successfully.', homework: updated });
  } catch (error: any) {
    console.error('[HOMEWORK_PATCH_ERROR] Error updating homework:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/homework - Delete a homework assignment
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Homework ID is required.' }, { status: 400 });
    }

    const existing = await prisma.homework.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Homework not found.' }, { status: 404 });
    }

    await prisma.homework.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Homework assignment deleted successfully.' });
  } catch (error: any) {
    console.error('[HOMEWORK_DELETE_ERROR] Error deleting homework:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
