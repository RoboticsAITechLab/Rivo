import { DayOfWeek } from '@/features/shared/types';

export interface TimetablePeriod {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  periodSlot: string;
  periodIndex: number;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  streamId?: string | null;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  isBreak?: boolean;
  breakLabel?: string;
}

export interface TimetableConflict {
  type: 'TEACHER_CONFLICT' | 'CLASS_SECTION_CONFLICT' | 'ROOM_CONFLICT' | 'TEACHER_BUSY' | 'CLASS_OCCUPIED' | 'ROOM_OCCUPIED';
  message: string;
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
  existingPeriod?: TimetablePeriod;
}

export type TimetableViewMode = 'CLASS' | 'TEACHER' | 'ROOM';

export interface TimetableFilterState {
  academicSession: string;
  viewMode: TimetableViewMode;
  campusId?: string;
  classId: string;
  sectionId: string;
  streamId?: string;
  teacherId: string;
  room: string;
  selectedWeek: string;
}
