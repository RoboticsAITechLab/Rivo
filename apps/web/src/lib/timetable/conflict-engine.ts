import { PrismaClient, Prisma } from '@prisma/client';

export interface TimetableConflictCheckInput {
  schoolId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  streamId?: string | null;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  excludeSlotId?: string; // For updates, exclude current slot
}

export interface TimetableConflictResult {
  hasConflict: boolean;
  type?: 'TEACHER_CONFLICT' | 'CLASS_SECTION_CONFLICT' | 'ROOM_CONFLICT';
  message?: string;
  details?: {
    teacherName?: string;
    conflictingClass?: string;
    conflictingSection?: string;
    conflictingSubject?: string;
    dayOfWeek?: string;
    periodNumber?: number;
    startTime?: string;
    endTime?: string;
    roomNumber?: string;
  };
}

/**
 * Validates timetable slot assignment against real-world school scheduling rules:
 * 1. A teacher cannot be in two classes at the same day & period/time.
 * 2. A class-section-stream cannot have two subjects/teachers at the same day & period.
 * 3. A physical room cannot be double-booked at the same day & period.
 */
export async function validateTimetableSlotConflict(
  input: TimetableConflictCheckInput,
  tx: Prisma.TransactionClient | PrismaClient
): Promise<TimetableConflictResult> {
  const {
    schoolId,
    academicSessionId,
    classId,
    sectionId,
    streamId,
    teacherId,
    dayOfWeek,
    periodNumber,
    roomNumber,
    excludeSlotId,
  } = input;

  // 1. Teacher Conflict: Check if teacher is assigned elsewhere at this session/day/period
  const conflictingTeacherSlot = await tx.timetableSlot.findFirst({
    where: {
      schoolId,
      academicSessionId,
      teacherId,
      dayOfWeek,
      periodNumber,
      ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
    },
    include: {
      class: true,
      section: true,
      subject: true,
      teacher: {
        include: { user: true },
      },
    },
  });

  if (conflictingTeacherSlot) {
    const teacherName = conflictingTeacherSlot.teacher?.user
      ? `${conflictingTeacherSlot.teacher.user.firstName} ${conflictingTeacherSlot.teacher.user.lastName}`.trim()
      : 'Teacher';
    const conflictingClass = conflictingTeacherSlot.class?.name || 'Unknown Class';
    const conflictingSection = conflictingTeacherSlot.section?.name || 'Unknown Section';
    const conflictingSubject = conflictingTeacherSlot.subject?.name || 'Unknown Subject';

    return {
      hasConflict: true,
      type: 'TEACHER_CONFLICT',
      message: `${teacherName} is already scheduled for ${conflictingClass} (${conflictingSection}) — ${conflictingSubject} during Period ${periodNumber} on ${dayOfWeek}.`,
      details: {
        teacherName,
        conflictingClass,
        conflictingSection,
        conflictingSubject,
        dayOfWeek,
        periodNumber,
        startTime: conflictingTeacherSlot.startTime,
        endTime: conflictingTeacherSlot.endTime,
        roomNumber: conflictingTeacherSlot.roomNumber || undefined,
      },
    };
  }

  // 2. Class/Section/Stream Conflict: Check if the class-section-stream is already occupied
  const conflictingClassSlot = await tx.timetableSlot.findFirst({
    where: {
      schoolId,
      academicSessionId,
      classId,
      sectionId,
      streamId: streamId || null,
      dayOfWeek,
      periodNumber,
      ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
    },
    include: {
      subject: true,
      teacher: {
        include: { user: true },
      },
    },
  });

  if (conflictingClassSlot) {
    const existingSubject = conflictingClassSlot.subject?.name || 'another subject';
    const assignedTeacher = conflictingClassSlot.teacher?.user
      ? `${conflictingClassSlot.teacher.user.firstName} ${conflictingClassSlot.teacher.user.lastName}`.trim()
      : 'another teacher';

    return {
      hasConflict: true,
      type: 'CLASS_SECTION_CONFLICT',
      message: `Period ${periodNumber} on ${dayOfWeek} is already assigned to ${existingSubject} (${assignedTeacher}).`,
      details: {
        conflictingSubject: existingSubject,
        teacherName: assignedTeacher,
        dayOfWeek,
        periodNumber,
      },
    };
  }

  // 3. Room Conflict: Check if physical facility is already booked
  if (roomNumber && roomNumber.trim()) {
    const trimmedRoom = roomNumber.trim();
    const conflictingRoomSlot = await tx.timetableSlot.findFirst({
      where: {
        schoolId,
        academicSessionId,
        dayOfWeek,
        periodNumber,
        roomNumber: { equals: trimmedRoom, mode: 'insensitive' },
        ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
      },
      include: {
        class: true,
        section: true,
      },
    });

    if (conflictingRoomSlot) {
      return {
        hasConflict: true,
        type: 'ROOM_CONFLICT',
        message: `Room "${trimmedRoom}" is already booked for ${conflictingRoomSlot.class.name} (${conflictingRoomSlot.section.name}) during Period ${periodNumber} on ${dayOfWeek}.`,
        details: {
          roomNumber: trimmedRoom,
          conflictingClass: conflictingRoomSlot.class.name,
          conflictingSection: conflictingRoomSlot.section.name,
          dayOfWeek,
          periodNumber,
        },
      };
    }
  }

  return { hasConflict: false };
}
