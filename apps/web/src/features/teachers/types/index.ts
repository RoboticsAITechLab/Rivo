import { EmploymentType, TeacherStatus } from '@/features/shared/types';

export interface TeachingAssignment {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  streamId?: string | null;
  subjectId: string;
  subjectName: string;
  periodsPerWeek: number;
}

export interface TeacherPersonal {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  phone: string;
  email: string;
  password?: string;
  photoUrl?: string | null;
}

export interface TeacherEmployment {
  employeeId: string;
  joiningDate?: string;
  employmentType: EmploymentType;
  department: string;
  designation: string;
  qualification: string;
  specialization?: string;
  experienceYears: number;
  campusId?: string | null;
  campusName?: string;
}

export interface TeacherAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface TeacherEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface TeacherDocumentItem {
  id: string;
  documentType: string;
  category?: string;
  title: string;
  fileName?: string;
  fileSize?: number | string | null;
  fileUrl: string;
  accessUrl?: string;
  status?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface TeacherTimetableSlotItem {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  periodName?: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  roomName?: string;
  className: string;
  sectionName: string;
  subjectName: string;
}

export interface TeacherDetail {
  id: string;
  personal: TeacherPersonal;
  employment: TeacherEmployment;
  assignments: TeachingAssignment[];
  address: TeacherAddress;
  emergencyContact: TeacherEmergencyContact;
  status: TeacherStatus;
  notes?: string;
  documents?: TeacherDocumentItem[];
  timetableSlots?: TeacherTimetableSlotItem[];
  createdAt: string;
  updatedAt?: string;

  // Derived / Operational Metrics
  weeklyPeriods: number;
  totalClassesCount: number;
  totalStudentsCount: number;
  attendanceRate: number;
}

export interface TeacherFilterState {
  searchQuery: string;
  department: string;
  subject: string;
  className: string;
  status: string;
  employmentType: string;
  campusId: string;
}
