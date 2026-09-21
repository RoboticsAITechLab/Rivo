import { SchoolStoreState } from '../mock-store/school-store';
import {
  TimetableEntry,
  TeacherId,
  ClassId,
  SectionId,
  SubjectId,
  RoomId,
  PeriodId,
  DayOfWeek,
} from '../types';
import {
  resolveTeacherName,
  resolveClassName,
  resolveSectionName,
  resolveSubjectName,
  resolveRoomName,
  resolvePeriodDetails,
  selectTeacherById,
} from '../selectors';

export interface TimetableConflict {
  type: 'TEACHER_BUSY' | 'CLASS_SECTION_OCCUPIED' | 'ROOM_OCCUPIED' | 'INACTIVE_TEACHER';
  message: string;
  existingEntry?: TimetableEntry;
}

export interface CandidateTimetableEntry {
  day: DayOfWeek;
  periodId: PeriodId;
  classId: ClassId;
  sectionId: SectionId;
  subjectId: SubjectId;
  teacherId: TeacherId;
  roomId?: RoomId | null;
  excludeEntryId?: string;
}

/**
 * Validates whether a candidate timetable entry has conflicts with existing entries in the school store
 */
export function checkTimetableConflicts(
  state: SchoolStoreState,
  candidate: CandidateTimetableEntry
): TimetableConflict | null {
  // 1. Check inactive teacher rule
  const teacher = selectTeacherById(state, candidate.teacherId);
  if (teacher && teacher.status === 'INACTIVE') {
    return {
      type: 'INACTIVE_TEACHER',
      message: `Cannot assign ${resolveTeacherName(state, candidate.teacherId)} because the faculty member is marked as Inactive.`,
    };
  }

  const periodDetails = resolvePeriodDetails(state, candidate.periodId);

  // Search existing timetable entries for matching day and period
  for (const existing of state.timetable) {
    if (candidate.excludeEntryId && existing.id === candidate.excludeEntryId) {
      continue;
    }

    if (existing.day !== candidate.day || existing.periodId !== candidate.periodId) {
      continue;
    }

    // 2. Check Teacher Conflict
    if (existing.teacherId === candidate.teacherId) {
      const existingClass = resolveClassName(state, existing.classId);
      const existingSection = resolveSectionName(state, existing.classId, existing.sectionId);
      const existingSubject = resolveSubjectName(state, existing.subjectId);
      const teacherName = resolveTeacherName(state, candidate.teacherId);

      return {
        type: 'TEACHER_BUSY',
        message: `${teacherName} is already scheduled for ${existingSubject} with ${existingClass}-${existingSection} on ${candidate.day} (${periodDetails.name} • ${periodDetails.timeRange}).`,
        existingEntry: existing,
      };
    }

    // 3. Check Class & Section Conflict
    if (existing.classId === candidate.classId && existing.sectionId === candidate.sectionId) {
      const className = resolveClassName(state, candidate.classId);
      const sectionName = resolveSectionName(state, candidate.classId, candidate.sectionId);
      const existingTeacher = resolveTeacherName(state, existing.teacherId);
      const existingSubject = resolveSubjectName(state, existing.subjectId);

      return {
        type: 'CLASS_SECTION_OCCUPIED',
        message: `${className}-${sectionName} already has ${existingSubject} with ${existingTeacher} on ${candidate.day} (${periodDetails.name}).`,
        existingEntry: existing,
      };
    }

    // 4. Check Room Conflict
    if (
      candidate.roomId &&
      existing.roomId &&
      candidate.roomId === existing.roomId
    ) {
      const roomName = resolveRoomName(state, candidate.roomId);
      const existingClass = resolveClassName(state, existing.classId);
      const existingSection = resolveSectionName(state, existing.classId, existing.sectionId);
      const existingSubject = resolveSubjectName(state, existing.subjectId);

      return {
        type: 'ROOM_OCCUPIED',
        message: `${roomName} is already booked by ${existingClass}-${existingSection} (${existingSubject}) on ${candidate.day} (${periodDetails.name}).`,
        existingEntry: existing,
      };
    }
  }

  return null;
}
