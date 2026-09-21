import { HomeworkLifecycle, StudentHomeworkStatus } from '@/features/shared/types';

export interface HomeworkAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface HomeworkStudentSubmission {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  status: StudentHomeworkStatus;
  submittedAt?: string;
  grade?: string;
  feedback?: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  teacherId: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  status: HomeworkLifecycle;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  notifyStudents: boolean;
  attachments: HomeworkAttachment[];
  totalStudents: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  submissions?: HomeworkStudentSubmission[];
  createdAt: string;
}

export interface HomeworkFilterState {
  searchQuery: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  status: string;
  dueDate: string;
}
