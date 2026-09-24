import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/timetable/exam/print-data - Aggregated print-ready payload for admit cards & timetables
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'exam_timetable.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const streamId = searchParams.get('streamId');

    if (!examId) {
      return NextResponse.json({ message: 'examId is required' }, { status: 400 });
    }

    // 1. Fetch Exam Term with School & Campus branding
    const examTerm = await prisma.examTerm.findFirst({
      where: { id: examId, schoolId: auth.schoolId },
      include: {
        school: true,
        campus: true,
        academicSession: true,
        papers: {
          include: {
            subject: true,
            schedules: {
              where: {
                ...(classId && classId !== 'ALL' ? { classId } : {}),
                ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
                ...(streamId && streamId !== 'ALL' ? { streamId } : {}),
              },
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!examTerm) {
      return NextResponse.json({ message: 'Exam cycle not found' }, { status: 404 });
    }

    // Flatten schedules
    const formattedSchedules: any[] = [];
    examTerm.papers.forEach((paper) => {
      paper.schedules.forEach((sch) => {
        const dateObj = new Date(sch.examDate);
        const dayOfWeek = DAY_NAMES[dateObj.getUTCDay()] || 'Monday';

        formattedSchedules.push({
          id: sch.id,
          paperId: paper.id,
          paperName: paper.name,
          subjectName: paper.subject.name,
          subjectCode: paper.subject.code || '',
          maxMarks: paper.maxMarks,
          passingMarks: paper.passingMarks,
          classId: sch.classId,
          className: sch.class.name,
          sectionId: sch.sectionId,
          sectionName: sch.section.name,
          streamId: sch.streamId || 'General',
          examDate: sch.examDate.toISOString().split('T')[0],
          dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
          durationMinutes: sch.durationMinutes || 120,
          reportingTime: sch.reportingTime || '30 mins before start',
          roomNumber: sch.roomNumber || 'Assigned Examination Hall',
          instructions: sch.instructions || null,
        });
      });
    });

    // Sort schedules chronologically
    formattedSchedules.sort((a, b) => {
      const dateCmp = a.examDate.localeCompare(b.examDate);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });

    // 2. Fetch candidates from StudentEnrollments in this session and classes
    const classIds = Array.from(new Set(formattedSchedules.map((s) => s.classId)));
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: auth.schoolId,
        academicSessionId: examTerm.academicSessionId,
        status: 'ACTIVE',
        ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
        ...(classId && classId !== 'ALL' ? { classId } : {}),
        ...(sectionId && sectionId !== 'ALL' ? { sectionId } : {}),
      },
      include: {
        student: true,
        class: true,
        section: true,
      },
      orderBy: [
        { class: { displayOrder: 'asc' } },
        { rollNumber: 'asc' },
        { student: { admissionNumber: 'asc' } },
      ],
    });

    const candidates = enrollments.map((enr, idx) => ({
      studentId: enr.student.id,
      admissionNumber: enr.student.admissionNumber,
      name: `${enr.student.firstName} ${enr.student.lastName}`.trim(),
      firstName: enr.student.firstName,
      lastName: enr.student.lastName,
      classId: enr.classId,
      className: enr.class.name,
      sectionId: enr.sectionId,
      sectionName: enr.section.name,
      stream: enr.student.stream || 'General',
      rollNumber: enr.rollNumber || String(idx + 1).padStart(2, '0'),
      gender: enr.student.gender || 'N/A',
      photoUrl: null, // Photo placeholder or link if available
    }));

    // 3. Format header & persistent instructions
    const branding = {
      schoolName: examTerm.school.name,
      schoolSlug: examTerm.school.slug,
      logoUrl: examTerm.school.logoUrl || null,
      address: examTerm.school.address || examTerm.campus?.address || 'Institutional Campus',
      phone: examTerm.school.phone || examTerm.campus?.phone || '',
      email: examTerm.school.email || examTerm.campus?.email || '',
      website: examTerm.school.website || '',
      campusName: examTerm.campus?.name || 'Main Campus',
      academicSessionName: examTerm.academicSession.name,
      examName: examTerm.name,
      examCode: examTerm.code || '',
      startDate: examTerm.startDate.toISOString().split('T')[0],
      endDate: examTerm.endDate.toISOString().split('T')[0],
      isPublished: examTerm.isPublished,
      instructions: examTerm.instructions || '1. Students must carry their official Admit Card at all times.\n2. Arrive at the exam center 30 minutes prior to reporting time.\n3. Bring authorized writing stationery and standard calculation tools only.',
      advice: examTerm.advice || 'Read every question carefully before writing answers. Budget your time per section.',
      warnings: examTerm.warnings || 'Possession of mobile phones, smartwatches, or unauthorized written materials is strictly prohibited and subject to immediate disqualification.',
    };

    return NextResponse.json({
      branding,
      schedules: formattedSchedules,
      candidates,
    });
  } catch (error) {
    console.error('Error in GET /api/timetable/exam/print-data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
