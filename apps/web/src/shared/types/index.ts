export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type EntityId = string;
export type TeacherId = string;
export type ClassId = string;
export type SectionId = string;
export type SubjectId = string;
export type StudentId = string;
export type RoomId = string;
export type HouseId = string;
export type PeriodId = string;
export type ScheduleId = string;
export type AcademicSessionId = string;
export type HomeworkId = string;
export type TimetableEntryId = string;

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING';
export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
export type SubjectType = 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'LANGUAGE' | 'PRACTICAL' | 'ACTIVITY';
export type SubjectStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';
export type HomeworkStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type HomeworkPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'SUSPENDED' | 'ALUMNI' | 'WITHDRAWN' | 'DRAFT' | 'ARCHIVED' | 'GRADUATED' | 'TRANSFERRED';
export type ScheduleBlockType = 'TEACHING' | 'BREAK' | 'LUNCH' | 'ASSEMBLY' | 'ACTIVITY';
export type RoomType = 'CLASSROOM' | 'LAB' | 'LIBRARY' | 'AUDITORIUM' | 'SPORTS' | 'HALL' | 'OTHER';

export interface AcademicSession {
  id: AcademicSessionId;
  name: string; // e.g. "2025-26"
  code: string; // e.g. "AY-25-26"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'UPCOMING';
}

export interface TeacherAssignment {
  id: string;
  classId: ClassId;
  sectionId: SectionId;
  subjectId: SubjectId;
  periodsPerWeek: number;
}

export interface Teacher {
  id: TeacherId;
  status: TeacherStatus;
  personal: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
  };
  employment: {
    employeeId: string;
    department: string;
    designation: string;
    joiningDate: string;
    qualification?: string;
    experienceYears?: number;
    employmentType?: EmploymentType;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  assignments: TeacherAssignment[];
  updatedAt?: string;
}

export interface Section {
  id: SectionId;
  classId: ClassId;
  name: string; // e.g. "A", "B", "C"
  classTeacherId?: TeacherId | null;
  roomId?: RoomId | null;
  capacity: number;
}

export interface SchoolClass {
  id: ClassId;
  className: string; // e.g. "Class 10"
  displayName: string;
  gradeLevel: string | number; // e.g. "Grade 10" or 10
  academicSessionId: AcademicSessionId;
  primaryClassTeacherId?: TeacherId | null;
  sections: Section[];
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface Subject {
  id: SubjectId;
  name: string; // e.g. "Mathematics"
  code: string; // e.g. "MAT-10"
  type: SubjectType;
  department: string;
  description?: string;
  applicableClassIds: ClassId[];
  weeklyPeriods: number;
  status: SubjectStatus;
}

export interface Room {
  id: RoomId;
  name: string; // e.g. "Room 204", "Physics Lab"
  code: string; // e.g. "RM-204"
  type: RoomType;
  building: string;
  floor: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  campusId?: CampusId;
  rows?: number;
  columns?: number;
}

export interface House {
  id: HouseId;
  name: string; // e.g. "Ruby Tigers"
  code: string; // e.g. "RUBY"
  color?: string; // Hex color code
  motto?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ScheduleBlock {
  id: PeriodId;
  scheduleId: ScheduleId;
  name: string; // e.g. "Period 1", "Short Break", "Period 3"
  type: ScheduleBlockType;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "08:45"
  order: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PeriodSchedule {
  id: ScheduleId;
  schoolId: string;
  academicSessionId: AcademicSessionId;
  name: string; // e.g. "Regular Daily Schedule"
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string;
  workingDays: DayOfWeek[];
  blocks: ScheduleBlock[];
}

export interface TimetableEntry {
  id: TimetableEntryId;
  academicSessionId: AcademicSessionId;
  scheduleId: ScheduleId;
  periodId: PeriodId;
  day: DayOfWeek;
  classId: ClassId;
  sectionId: SectionId;
  subjectId: SubjectId;
  teacherId: TeacherId;
  roomId?: RoomId | null;
  notes?: string;
}

export interface StudentGuardian {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  occupation?: string;
  isPrimary?: boolean;
}

export interface Student {
  id: StudentId;
  admissionNumber: string;
  academicSessionId: AcademicSessionId;
  classId: ClassId;
  sectionId: SectionId;
  houseId?: HouseId | null;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  bloodGroup?: string;
  status: StudentStatus;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  guardians: StudentGuardian[];
  attendancePercentage: number;
  photoUrl?: string;
  campusId?: CampusId;
  streamId?: StreamId | null;
  classRollNumber?: number;
  examRollNumber?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string | number;
  lastSavedAt?: string;
}

export interface AttendanceRecord {
  studentId: StudentId;
  status: AttendanceStatus;
  reason?: string;
}

export interface AttendanceRegister {
  id: string;
  classId: ClassId;
  sectionId: SectionId;
  date: string; // e.g. "2026-09-19" or "Sep 19, 2025"
  academicSessionId: AcademicSessionId;
  records: AttendanceRecord[];
  updatedAt: string;
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface Homework {
  id: HomeworkId;
  academicSessionId: AcademicSessionId;
  subjectId: SubjectId;
  teacherId: TeacherId;
  classId: ClassId;
  sectionId: SectionId;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: HomeworkStatus;
  priority: HomeworkPriority;
  notifyStudents: boolean;
  attachments: HomeworkAttachment[];
}

// ---------------------------------------------------------------------------
// EXAMINATION & DUAL ROLL NUMBER ARCHITECTURE
// ---------------------------------------------------------------------------

export type CampusId = string;
export type StreamId = string;
export type ExamId = string;
export type ExamPaperId = string;
export type ExamScheduleId = string;
export type ExamRollAssignmentId = string;
export type ClassRollAssignmentId = string;

export type CampusStatus = 'ACTIVE' | 'INACTIVE';
export type StreamStatus = 'ACTIVE' | 'INACTIVE';
export type ExamType = 'ANNUAL' | 'HALF_YEARLY' | 'PRE_BOARD' | 'TERM' | 'UNIT_TEST';
export type ExamStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'RESULT_PROCESSING'
  | 'PUBLISHED'
  | 'ARCHIVED';
export type ExamMode = 'OFFLINE' | 'ONLINE' | 'PRACTICAL';
export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL' | 'EXEMPTED';
export type ExamMarkStatus = 'DRAFT' | 'SAVED' | 'PUBLISHED';
export type ResultStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED';
export type RollAssignmentStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';

export interface Campus {
  id: CampusId;
  schoolId?: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  headName?: string;
  status: CampusStatus;
}

export interface Stream {
  id: StreamId;
  schoolId: string;
  name: string;
  code: string;
  applicableClasses: ClassId[];
  status: StreamStatus;
  description?: string;
}

export interface ClassRollAssignment {
  id: ClassRollAssignmentId;
  studentId: StudentId;
  academicSessionId: AcademicSessionId;
  campusId: CampusId;
  classId: ClassId;
  sectionId: SectionId;
  streamId?: StreamId | null;
  rollNumber: number;
  status: 'ACTIVE' | 'ARCHIVED';
  updatedAt?: string;
}

export interface RollHistoryEntry {
  id: string;
  oldRoll: string | null;
  newRoll: string;
  reason: string;
  changedAt: string;
  changedBy: string;
}

export interface ExamRollAssignment {
  id: ExamRollAssignmentId;
  studentId: StudentId;
  schoolId: string;
  academicSessionId: AcademicSessionId;
  campusId: CampusId;
  classId: ClassId;
  sectionId: SectionId;
  streamId?: StreamId | null;
  examRollNumber: string;
  status: RollAssignmentStatus;
  assignedAt: string;
  assignedBy: string;
  history: RollHistoryEntry[];
}

export interface RollAllocationConfig {
  scope: 'SCHOOL_WIDE' | 'CAMPUS_SPECIFIC';
  class1_10Rule: {
    startNumber: number;
    format: string; // e.g. "1000" or "EX-1000"
  };
  class11_12Rule: {
    streamAware: boolean;
    streamRules: Record<string, { startNumber: number; prefix?: string }>;
  };
  reservedNumbers: number[];
  nextAvailableNumber: number;
  lastUpdated?: string;
}

export interface Exam {
  id: ExamId;
  schoolId: string;
  academicSessionId: AcademicSessionId;
  name: string;
  type: ExamType;
  code: string;
  description: string;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  campusIds: CampusId[];
  classIds: ClassId[];
  createdAt?: string;
}

export interface ExamPaper {
  id: ExamPaperId;
  examId: ExamId;
  subjectId: SubjectId;
  paperCode: string;
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  examMode: ExamMode;
  instructions: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface ExamScheduleEntry {
  id: ExamScheduleId;
  examId: ExamId;
  paperId: ExamPaperId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  campusIds: CampusId[];
  classIds: ClassId[];
  streamIds?: StreamId[];
  room: string;
  instructions?: string;
}

export interface ExamAttendance {
  id: string;
  examId: ExamId;
  paperId: ExamPaperId;
  studentId: StudentId;
  examRollNumber: string;
  status: ExamAttendanceStatus;
  remarks?: string;
}

export interface ExamMark {
  id: string;
  examId: ExamId;
  paperId: ExamPaperId;
  studentId: StudentId;
  examRollNumber: string;
  marksObtained: number;
  maxMarks: number;
  passingMarks: number;
  grade: string;
  status: ExamMarkStatus;
  remarks?: string;
}

export interface ExamSubjectResult {
  subjectId: SubjectId;
  paperId: ExamPaperId;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  status: 'PASS' | 'FAIL';
}

export interface ExamResult {
  id: string;
  examId: ExamId;
  studentId: StudentId;
  examRollNumber: string;
  academicSessionId: AcademicSessionId;
  campusId: CampusId;
  classId: ClassId;
  sectionId: SectionId;
  streamId?: StreamId | null;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  overallStatus: 'PASS' | 'FAIL' | 'COMPARTMENT';
  status: ResultStatus;
  subjectResults: ExamSubjectResult[];
  publishedAt?: string;
}
