export interface SchoolProfile {
  schoolName: string;
  shortName: string;
  schoolCode: string;
  affiliation: string;
  registrationNumber: string;
  logoUrl?: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface SchoolBranding {
  primaryLogoUrl?: string;
  secondaryLogoUrl?: string;
  schoolSealUrl?: string;
  authorizedSignatureUrl?: string;
  documentHeader?: string;
  documentFooter?: string;
}

export interface AttendanceSettings {
  attendanceEnabled: boolean;
  teacherCanMark: boolean;
  adminCanCorrect: boolean;
  lockPreviousRecords: boolean;
  supportedStatuses: ('PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED')[];
}

export interface TimetableSettings {
  workingDays: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  teacherConflictDetection: boolean;
  roomConflictDetection: boolean;
  classConflictDetection: boolean;
}

export interface HomeworkSettings {
  teacherCanCreate: boolean;
  attachmentsEnabled: boolean;
  parentVisibility: boolean;
  studentStatusTracking: boolean;
  maxAttachmentSizeMB: number;
}

export interface ExamTypeConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
}

export interface ExamTimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GradeRule {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoints: number;
  isPass: boolean;
}

export interface GradingScheme {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  rules: GradeRule[];
}

export interface ExamRulesConfig {
  multiplePapersPerDay: boolean;
  multipleSessionsPerDay: boolean;
  scheduleConflictDetection: boolean;
  roomConflictDetection: boolean;
  candidateValidationRequired: boolean;
  attendanceRequirementPercentage: number;
  publishResultsImmediately: boolean;
}

export interface ResultSettings {
  defaultGradingSchemeId?: string;
  publicationBehavior: 'MANUAL' | 'SCHEDULED' | 'IMMEDIATE';
  resultVisibility: 'ADMIN_ONLY' | 'TEACHERS' | 'STUDENTS_AND_PARENTS';
  lockPublishedResults: boolean;
}

export type SystemRole = 'School Admin' | 'Teacher' | 'Student' | 'Parent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  campusId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  mfaEnabled: boolean;
  createdAt: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  isSystem: boolean;
  description: string;
  userCount: number;
}

export type PermissionAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'PUBLISH' | 'EXPORT';
export type PermissionScope = 'OWN' | 'ASSIGNED' | 'SCHOOL';

export interface PermissionMatrixRow {
  module: string;
  label: string;
  actions: Record<PermissionAction, boolean>;
  scope: PermissionScope;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  campusId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface AuthSettings {
  passwordLoginEnabled: boolean;
  emailVerificationEnabled: boolean;
  roleAccess: {
    schoolAdmin: boolean;
    teacher: boolean;
    student: boolean;
    parent: boolean;
  };
  sessionTimeoutMinutes: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber?: boolean;
  requireNumbers?: boolean;
  requireSpecialChar?: boolean;
  requireSpecialChars?: boolean;
  expiryDays?: number;
  maxFailedAttempts?: number;
  lockoutMinutes?: number;
}

export interface ActiveUserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export type ActiveSession = ActiveUserSession;

export interface MFASettings {
  mfaAvailable?: boolean;
  requireForAdmin?: boolean;
  requireForSensitiveActions?: boolean;
  enforcement?: 'OPTIONAL' | 'REQUIRED_FOR_ADMINS' | 'REQUIRED_FOR_ALL';
  supportedMethods?: ('TOTP' | 'SMS' | 'EMAIL')[];
}

export interface AccountRecoverySettings {
  forgotPasswordEnabled?: boolean;
  emailRecoveryEnabled?: boolean;
  tokenExpiryHours?: number;
  notifyOnRecovery?: boolean;
  allowSelfServiceReset?: boolean;
  requireAdminApproval?: boolean;
  notifyAdminOnRecovery?: boolean;
  resetLinkExpiryHours?: number;
}

export interface NoticeSettings {
  teacherCanCreate?: boolean;
  teacherCanPublish?: boolean;
  defaultAudience?: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';
  allowScheduling?: boolean;
  allowAttachments?: boolean;
  adminOnlyPublish?: boolean;
  allowTeacherDrafts?: boolean;
  targetAudienceScope?: ('ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS')[];
  requireApprovalBeforeBroadcast?: boolean;
}

export interface NotificationSettings {
  events?: {
    homeworkAssigned: { inApp: boolean; email: boolean; push: boolean };
    attendanceAlert: { inApp: boolean; email: boolean; push: boolean };
    resultPublished: { inApp: boolean; email: boolean; push: boolean };
    noticePublished: { inApp: boolean; email: boolean; push: boolean };
    examUpdate: { inApp: boolean; email: boolean; push: boolean };
  };
  channels?: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  eventTriggers?: {
    studentAbsence: boolean;
    homeworkAssigned: boolean;
    examSchedulePublished: boolean;
    resultDeclared: boolean;
    feeDueReminder: boolean;
  };
}

export interface DocumentTemplate {
  id: string;
  type: 'STUDENT_DOC' | 'EXAM_TIMETABLE' | 'ADMIT_CARD' | 'MARKSHEET' | 'RESULT_SUMMARY' | 'NOTICE';
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PrintSettings {
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  paperSize?: 'A4' | 'LETTER' | 'LEGAL';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginsMM?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  showHeader?: boolean;
  showFooter?: boolean;
  showSeal?: boolean;
  showSignature?: boolean;
  showAuthorizedSignature?: boolean;
  showSchoolSeal?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
}

export interface ImportLog {
  id: string;
  entityType: string;
  fileName: string;
  rowCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  timestamp: string;
}

export interface ExportLog {
  id: string;
  entityType: string;
  format: 'CSV' | 'EXCEL' | 'JSON';
  filterDescription: string;
  timestamp: string;
}
