export type UserRole = 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: UserRole;
  avatarUrl?: string;
  initials: string;
  schoolName: string;
  sessionName: string;
}

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  iconName: string;
}

export interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  context?: string;
  actionLabel: string;
  href: string;
}

export interface DailyAttendance {
  day: string;
  date: string;
  present: number;
  absent: number;
  percentage: number;
}

export interface AttendanceSummary {
  todayPercentage: number;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  weeklyTrend: DailyAttendance[];
}

export interface UpcomingExamItem {
  id: string;
  name: string;
  date: string;
  time: string;
  className: string;
  subject: string;
  room: string;
  status: 'SCHEDULED' | 'PREPARING';
}

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  audience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  summary: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'STUDENT' | 'HOMEWORK' | 'ATTENDANCE' | 'RESULT' | 'NOTICE';
}

/* ============================================================
   ADMIN OPERATIONAL ENTITY TYPES
   ============================================================ */

export * from './student';
export * from './custom-fields';

export interface StudentRow {
  id: string;
  admissionNumber: string;
  name: string;
  className: string;
  section: string;
  status: import('./student').StudentStatus;
  attendancePercentage: number;
  guardianName: string;
  guardianPhone: string;
  gender: string;
  homeworkCompleted: number;
  homeworkTotal: number;
  averageMarks: number;
  enrollmentDate: string;
}

export interface TeacherRow {
  id: string;
  name: string;
  department: string;
  primarySubject: string;
  assignedClasses: string[];
  weeklyPeriods: number;
  totalStudents: number;
  homeworkAssigned: number;
  status: 'ACTIVE' | 'INACTIVE';
  email: string;
  phone: string;
}

export interface ClassDivision {
  id: string;
  gradeName: string;
  sections: string[];
  totalStudents: number;
  classTeacher: string;
  attendancePercentage: number;
}

export interface SectionDetail {
  sectionName: string;
  studentCount: number;
  classTeacher: string;
  attendancePercentage: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  classes: string[];
  teachers: string[];
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AttendanceRow {
  id: string;
  studentName: string;
  admissionNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  punchTime?: string;
  markedBy: string;
}

export interface HomeworkRow {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  status: 'REVIEW' | 'PUBLISHED' | 'DRAFT';
  submissionsCount: number;
  totalStudents: number;
  teacherName: string;
}

export interface ExamRow {
  id: string;
  name: string;
  subject: string;
  className: string;
  date: string;
  time: string;
  room: string;
  status: 'SCHEDULED' | 'PREPARING' | 'COMPLETED';
  invigilator: string;
}

export interface ResultPeriodRow {
  id: string;
  periodName: string;
  className: string;
  subjectsCount: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
}

export interface TimetableSlot {
  id: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  periodTime: string;
  subject: string;
  teacher: string;
  room: string;
  isBreak?: boolean;
  isConflict?: boolean;
}

export interface SchoolNotification {
  id: string;
  category: 'ATTENDANCE' | 'HOMEWORK' | 'EXAMS' | 'RESULTS' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  priority: 'CRITICAL' | 'NORMAL' | 'LOW';
}

export interface AcademicSessionRow {
  id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

export * from './house';
