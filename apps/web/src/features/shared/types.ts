export type TeacherId = string;
export type ClassId = string;
export type SectionId = string;
export type SubjectId = string;
export type StudentId = string;
export type TimetablePeriodId = string;
export type AttendanceRecordId = string;
export type HomeworkId = string;

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING';
export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export type SubjectType = 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'LANGUAGE' | 'PRACTICAL' | 'ACTIVITY';
export type SubjectStatus = 'ACTIVE' | 'INACTIVE';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';

export type HomeworkLifecycle = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'CLOSED';
export type StudentHomeworkStatus = 'ASSIGNED' | 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}
