import { TimetablePeriod, TimetableConflict } from '../types';

export function checkPeriodConflict(
  candidate: {
    day: TimetablePeriod['day'];
    startTime: string;
    endTime: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    room: string;
    teacherName: string;
    className: string;
    sectionName: string;
  },
  existingSchedule: TimetablePeriod[],
  excludePeriodId?: string,
): TimetableConflict | null {
  for (const existing of existingSchedule) {
    if (excludePeriodId && existing.id === excludePeriodId) continue;
    if (existing.day !== candidate.day) continue;

    // Time collision check
    const isOverlapping = existing.startTime === candidate.startTime;
    if (!isOverlapping) continue;

    // 1. Teacher Conflict
    if (existing.teacherId === candidate.teacherId) {
      return {
        type: 'TEACHER_BUSY',
        message: `${candidate.teacherName} is already scheduled to teach ${existing.subjectName} in ${existing.className}-${existing.sectionName} during this time (${existing.periodSlot}).`,
        existingPeriod: existing,
      };
    }

    // 2. Class & Section Conflict
    if (existing.classId === candidate.classId && existing.sectionId === candidate.sectionId) {
      return {
        type: 'CLASS_OCCUPIED',
        message: `${candidate.className}-${candidate.sectionName} already has ${existing.subjectName} with ${existing.teacherName} scheduled at ${existing.periodSlot}.`,
        existingPeriod: existing,
      };
    }

    // 3. Room Conflict
    if (candidate.room && existing.room && candidate.room.trim().toLowerCase() === existing.room.trim().toLowerCase()) {
      return {
        type: 'ROOM_OCCUPIED',
        message: `${candidate.room} is already occupied by ${existing.className}-${existing.sectionName} (${existing.subjectName}) at ${existing.periodSlot}.`,
        existingPeriod: existing,
      };
    }
  }

  return null;
}
