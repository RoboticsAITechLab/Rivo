import {
  AcademicSessionRow,
  ActivityItem,
  AttentionItem,
  AttendanceRow,
  AttendanceSummary,
  ClassDivision,
  CurrentUser,
  ExamRow,
  HomeworkRow,
  KpiMetric,
  NoticeItem,
  ResultPeriodRow,
  SchoolNotification,
  SectionDetail,
  StudentRow,
  SubjectItem,
  TeacherRow,
  TimetableSlot,
  UpcomingExamItem,
} from '@/types';

// Generic shell administrator profile (Not real school identity)
export const mockCurrentUser: CurrentUser = {
  id: 'usr-admin-01',
  name: 'Administrator',
  email: 'admin@institution.local',
  role: 'School Administrator',
  roleType: 'SCHOOL_ADMIN',
  initials: 'AD',
  schoolName: 'Institution Portal',
  sessionName: 'Session Not Configured',
};

// Purged: All fake dashboard attention alerts removed.
export const mockAttentionItems: AttentionItem[] = [];

// Purged: All fake dashboard KPI metrics reset to clean empty/awaiting data.
export const mockKpis: KpiMetric[] = [
  {
    id: 'kpi-students',
    title: 'Total Students',
    value: '0',
    change: '—',
    isPositive: true,
    timeframe: 'No students enrolled',
    iconName: 'GraduationCap',
  },
  {
    id: 'kpi-teachers',
    title: 'Total Teachers',
    value: '0',
    change: '—',
    isPositive: true,
    timeframe: 'No faculty configured',
    iconName: 'Users',
  },
  {
    id: 'kpi-attendance',
    title: 'Attendance Today',
    value: '—',
    change: '—',
    isPositive: true,
    timeframe: 'Awaiting records',
    iconName: 'CalendarCheck',
  },
  {
    id: 'kpi-classes',
    title: 'Classes / Sections',
    value: '0',
    change: '0 Divisions',
    isPositive: true,
    timeframe: 'No active rosters',
    iconName: 'Layers',
  },
  {
    id: 'kpi-tasks',
    title: 'Pending Tasks',
    value: '0',
    change: 'Queue clear',
    isPositive: true,
    timeframe: 'No tasks pending',
    iconName: 'Clock',
  },
];

// Purged: All fake attendance summaries reset to zero.
export const mockAttendanceSummary: AttendanceSummary = {
  todayPercentage: 0,
  totalEnrolled: 0,
  presentCount: 0,
  absentCount: 0,
  weeklyTrend: [],
};

// Purged: All fake low attendance class alerts removed.
export const mockLowAttendanceClasses: any[] = [];

// Purged: All fake upcoming exam records removed.
export const mockUpcomingExams: UpcomingExamItem[] = [];

// Purged: All fake notices removed.
export const mockRecentNotices: NoticeItem[] = [];

// Purged: All fake activity logs removed.
export const mockRecentActivity: ActivityItem[] = [];

export { initialMockStudents } from './mock-students';

// Purged: All legacy fake student rows removed.
export const mockStudents: StudentRow[] = [];

// Purged: All legacy fake teacher rows removed.
export const mockTeachers: TeacherRow[] = [];

// Purged: All legacy fake class rows removed.
export const mockClasses: ClassDivision[] = [];

// Purged: All legacy fake section details removed.
export const mockSections: SectionDetail[] = [];

// Purged: All legacy fake subject items removed.
export const mockSubjects: SubjectItem[] = [];

// Purged: All legacy fake attendance rows removed.
export const mockAttendanceRows: AttendanceRow[] = [];

// Purged: All legacy fake homework rows removed.
export const mockHomeworkRows: HomeworkRow[] = [];

// Purged: All legacy fake exam rows removed.
export const mockExams: ExamRow[] = [];

// Purged: All legacy fake exam roster rows removed.
export const mockExamRoster: ExamRow[] = [];

// Purged: All legacy fake result periods removed.
export const mockResultPeriods: ResultPeriodRow[] = [];

// Purged: All legacy fake marks entry items removed.
export const mockMarkEntryStudents: Array<{ id: string; admission: string; name: string; marks: number; grade: string }> = [];

// Purged: All legacy fake timetable slots removed.
export const mockTimetableSchedule: TimetableSlot[] = [];

// Purged: All fake notifications removed.
export const mockNotificationsList: SchoolNotification[] = [];

// Purged: All fake academic sessions removed.
export const mockAcademicSessions: AcademicSessionRow[] = [];
