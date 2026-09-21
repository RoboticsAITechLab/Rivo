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
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  isBreak?: boolean;
  breakLabel?: string;
}

export interface TimetableConflict {
  type: 'TEACHER_BUSY' | 'CLASS_OCCUPIED' | 'ROOM_OCCUPIED';
  message: string;
  existingPeriod: TimetablePeriod;
}

export type TimetableViewMode = 'CLASS' | 'TEACHER' | 'ROOM';

export interface TimetableFilterState {
  academicSession: string;
  viewMode: TimetableViewMode;
  classId: string;
  sectionId: string;
  teacherId: string;
  room: string;
  selectedWeek: string;
}
