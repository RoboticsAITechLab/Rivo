import { EmploymentType, TeacherStatus } from '@/features/shared/types';

export interface TeachingAssignment {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  periodsPerWeek: number;
}

export interface TeacherPersonal {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  phone: string;
  email: string;
  photoUrl?: string;
}

export interface TeacherEmployment {
  employeeId: string;
  joiningDate: string;
  employmentType: EmploymentType;
  department: string;
  designation: string;
  qualification: string;
  experienceYears: number;
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

export interface TeacherDetail {
  id: string;
  personal: TeacherPersonal;
  employment: TeacherEmployment;
  assignments: TeachingAssignment[];
  address: TeacherAddress;
  emergencyContact: TeacherEmergencyContact;
  status: TeacherStatus;
  notes?: string;
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
}
