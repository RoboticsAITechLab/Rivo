import { AttendanceStatus } from '@/features/shared/types';

export interface AttendanceRegisterItem {
  id: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  rollNumber: string;
  gender: string;
  status: AttendanceStatus;
  punchTime?: string;
  markedBy: string;
  reason?: string;
}

export interface ClassAttendanceSummary {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  date: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  excusedCount: number;
  ratePercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface AttendanceAttentionItem {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  rate: number;
  consecutiveAbsences: number;
  alertType: 'LOW_ATTENDANCE' | 'CONSECUTIVE_ABSENT' | 'CLASS_BELOW_AVG';
  description: string;
}

export interface StudentAttendanceHistory {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  ratePercentage: number;
  monthlyTrend: {
    month: string;
    percentage: number;
    workingDays: number;
    presentDays: number;
  }[];
}
