export type StudentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'ARCHIVED';

export type AdmissionType = 'FIRST_TIME' | 'TRANSFER' | 'RETURNING';

export type DocumentType =
  | 'BIRTH_CERTIFICATE'
  | 'PREVIOUS_MARKSHEET'
  | 'TRANSFER_CERTIFICATE'
  | 'ID_PROOF'
  | 'PASSPORT_PHOTO'
  | 'OTHER';

export type DocumentStatus =
  | 'EMPTY'
  | 'PENDING'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ERROR';

export interface StudentDocument {
  id: string;
  name?: string;
  title?: string;
  type: DocumentType;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  fileUrl?: string;
  isRequired?: boolean;
  isMandatory?: boolean;
  isConditional?: boolean;
  verificationNotes?: string;
  notes?: string;
}

export interface StudentGuardian {
  id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Legal Guardian' | 'Grandparent' | 'Other';
  phone: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  isPrimary?: boolean;
  isEmergencyContact?: boolean;
  emergencyContact?: boolean;
  receiveSMS?: boolean;
  receiveEmail?: boolean;
  allowSchoolCommunication?: boolean;
  parentPortalAccess?: boolean;
}

export interface StudentHealth {
  bloodGroup?: string;
  allergies?: string | string[];
  medicalConditions?: string;
  medications?: string;
  doctorName?: string;
  doctorPhone?: string;
  insurancePolicy?: string;
  emergencyInstructions?: string;
  requiresSpecialAssistance?: boolean;
  hasEmergencyMedicalInstructions?: boolean;
}

export interface StudentTransport {
  usesSchoolTransport: boolean;
  route?: string;
  pickupPoint?: string;
  dropPoint?: string;
  transportNotes?: string;
}

export interface StudentCommunication {
  preferredLanguage: string;
  parentCommunication: {
    announcements: boolean;
    academic: boolean;
    attendance: boolean;
    results: boolean;
  };
}

export interface StudentIdentifiers {
  studentId?: string;
  apaarId?: string;
  nationalId?: string;
  otherId?: string;
}

export interface EnrollmentRecord {
  id: string;
  session: string;
  className: string;
  section: string;
  rollNumber: string;
  status: 'CURRENT' | 'PROMOTED' | 'COMPLETED' | 'TRANSFERRED';
  academicYear: string;
  startDate: string;
  endDate?: string;
}

export interface AttendanceDailyRecord {
  id: string;
  date: string;
  day: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  punchTime?: string;
  markedBy?: string;
  notes?: string;
}

export interface AttendanceMonthlyStat {
  month: string;
  percentage: number;
  workingDays: number;
  presentDays: number;
}

export interface HomeworkAssignmentItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  status: 'COMPLETED' | 'PENDING' | 'OVERDUE' | 'REVIEW';
  score?: string;
  teacherName: string;
}

export interface SubjectPerformanceItem {
  subject: string;
  score: number;
  grade: string;
  teacher: string;
  classAverage: number;
}

export interface PublishedResultItem {
  id: string;
  examName: string;
  term: string;
  academicYear: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  publishedDate: string;
  rank?: number;
}

export interface StudentActivityTimelineItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  actor?: string;
  category: 'RESULT' | 'HOMEWORK' | 'ATTENDANCE' | 'PROFILE' | 'ENROLLMENT' | 'STATUS' | 'DOCUMENT' | 'DRAFT';
}

export interface StudentDetail {
  id: string;
  admissionNumber: string;
  photoUrl?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  displayName?: string;
  className: string;
  section: string;
  rollNumber: string;
  academicSession: string;
  status: StudentStatus;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  nationality?: string;
  motherTongue?: string;
  studentType?: string;
  admissionType: AdmissionType;
  previousSchool?: string;
  previousClass?: string;
  identifiers?: StudentIdentifiers;
  email: string;
  phone: string;
  bloodGroup?: string;
  address: {
    street: string;
    addressLine2?: string;
    city: string;
    district?: string;
    state: string;
    country?: string;
    postalCode: string;
  };
  permanentAddressSameAsCurrent?: boolean;
  permanentAddress?: {
    street: string;
    addressLine2?: string;
    city: string;
    district?: string;
    state: string;
    country?: string;
    postalCode: string;
  };
  guardians: StudentGuardian[];
  primaryGuardian: StudentGuardian;
  secondaryGuardian?: StudentGuardian;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  currentTeacher: string;
  currentCampus: string;
  documents: StudentDocument[];
  health?: StudentHealth;
  transport?: StudentTransport;
  communication?: StudentCommunication;
  customFields?: Record<string, unknown>;
  houseId?: string | null;
  draftProgress?: number;
  lastSavedAt?: string;
  attendancePercentage: number;
  attendanceSummary: {
    overallPercentage: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalWorkingDays: number;
    monthlyTrend: AttendanceMonthlyStat[];
    recentRecords: AttendanceDailyRecord[];
  };
  homeworkCompleted: number;
  homeworkTotal: number;
  homeworkList: HomeworkAssignmentItem[];
  averageMarks: number;
  subjectPerformance: SubjectPerformanceItem[];
  resultsHistory: PublishedResultItem[];
  enrollmentHistory: EnrollmentRecord[];
  activityTimeline: StudentActivityTimelineItem[];
}

export interface StudentFilterState {
  searchQuery: string;
  academicSession: string;
  className: string;
  section: string;
  status: string;
  gender: string;
  attendanceRange: string;
  houseId: string;
}
