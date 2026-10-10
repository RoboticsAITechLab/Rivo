import { prisma } from '@/lib/prisma';

export interface SchoolSettingMap {
  profile: {
    schoolName: string;
    shortName: string;
    schoolCode: string;
    affiliation: string;
    registrationNumber: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    timezone: string;
  };
  branding: {
    primaryLogoUrl: string;
    secondaryLogoUrl: string;
    schoolSealUrl: string;
    authorizedSignatureUrl: string;
    documentHeader: string;
    documentFooter: string;
    watermarkText: string;
  };
  attendance: {
    attendanceEnabled: boolean;
    teacherCanMark: boolean;
    adminCanCorrect: boolean;
    lockPreviousRecords: boolean;
    minAttendancePercentage: number;
    supportedStatuses: ('PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED')[];
  };
  timetable: {
    workingDays: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
    defaultPeriodDurationMinutes: number;
    teacherConflictDetection: boolean;
    roomConflictDetection: boolean;
    classConflictDetection: boolean;
  };
  homework: {
    teacherCanCreate: boolean;
    attachmentsEnabled: boolean;
    parentVisibility: boolean;
    studentStatusTracking: boolean;
    maxAttachmentSizeMB: number;
    allowLateSubmissions: boolean;
    submissionDeadlineHours: number;
    teacherCanGrade: boolean;
  };
  examinations: {
    multiplePapersPerDay: boolean;
    multipleSessionsPerDay: boolean;
    scheduleConflictDetection: boolean;
    roomConflictDetection: boolean;
    candidateValidationRequired: boolean;
    attendanceRequirementPercentage: number;
    publishResultsImmediately: boolean;
    examInstructions: string;
    gradingSchemes?: any[];
    rooms?: any[];
    timeSlots?: any[];
    examTypes?: any[];
    passingMarksPercentage?: number;
    hallTicketMandatory?: boolean;
    graceMarksAllowance?: number;
    reEvaluationWindowDays?: number;
  };
  results: {
    defaultGradingSchemeId?: string;
    publicationBehavior: 'MANUAL' | 'SCHEDULED' | 'IMMEDIATE';
    resultVisibility: 'ADMIN_ONLY' | 'TEACHERS' | 'STUDENTS_AND_PARENTS';
    lockPublishedResults: boolean;
  };
  fees: {
    currency: string;
    currencySymbol: string;
    defaultPaymentMethods: string[];
    lateFeeGraceDays: number;
    receiptPrefix: string;
    receiptFooterNote: string;
    allowOnlinePayments: boolean;
    autoIssueReceipt: boolean;
  };
  communication: {
    teacherCanCreate: boolean;
    teacherCanPublish: boolean;
    defaultAudience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';
    allowScheduling: boolean;
    allowAttachments: boolean;
    requireApprovalBeforeBroadcast: boolean;
    enabledChannels: ('IN_APP' | 'EMAIL' | 'PUSH')[];
  };
  notifications: {
    eventTriggers: {
      studentAbsence: boolean;
      homeworkAssigned: boolean;
      examSchedulePublished: boolean;
      resultDeclared: boolean;
      feeDueReminder: boolean;
    };
    channels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  documents: {
    pageSize: 'A4' | 'LETTER' | 'LEGAL';
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    marginsMM: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    showHeader: boolean;
    showFooter: boolean;
    showSeal: boolean;
    showSignature: boolean;
    watermarkText: string;
  };
  security: {
    sessionTimeoutMinutes: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
      maxFailedAttempts: number;
      lockoutMinutes: number;
    };
    authentication: {
      passwordLoginEnabled: boolean;
      emailVerificationEnabled: boolean;
      roleAccess: {
        schoolAdmin: boolean;
        teacher: boolean;
        student: boolean;
        parent: boolean;
      };
      sessionTimeoutMinutes: number;
    };
    recovery: {
      allowSelfServiceReset: boolean;
      requireAdminApproval: boolean;
      notifyAdminOnRecovery: boolean;
      resetLinkExpiryHours: number;
    };
  };
  roles: {
    customRoles: any[];
    permissions: Record<string, any>;
  };
  houses: {
    houses: any[];
  };
  rollNumbers: {
    mode: 'CONTINUOUS' | 'PER_SECTION' | 'PER_STREAM';
    prefix: string;
    startIndex: number;
    autoSortAlpha: boolean;
    isLocked: boolean;
    streamRules?: Record<string, { startNumber: number; prefix: string }>;
  };
  streams: {
    customStreams: any[];
  };
}

export type SettingCategory = keyof SchoolSettingMap;

export const DEFAULT_SETTINGS: SchoolSettingMap = {
  profile: {
    schoolName: '',
    shortName: '',
    schoolCode: '',
    affiliation: '',
    registrationNumber: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    timezone: 'Asia/Kolkata',
  },
  branding: {
    primaryLogoUrl: '',
    secondaryLogoUrl: '',
    schoolSealUrl: '',
    authorizedSignatureUrl: '',
    documentHeader: '',
    documentFooter: '',
    watermarkText: '',
  },
  attendance: {
    attendanceEnabled: true,
    teacherCanMark: true,
    adminCanCorrect: true,
    lockPreviousRecords: false,
    minAttendancePercentage: 75,
    supportedStatuses: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
  },
  timetable: {
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    defaultPeriodDurationMinutes: 45,
    teacherConflictDetection: true,
    roomConflictDetection: true,
    classConflictDetection: true,
  },
  homework: {
    teacherCanCreate: true,
    attachmentsEnabled: true,
    parentVisibility: true,
    studentStatusTracking: true,
    maxAttachmentSizeMB: 10,
    allowLateSubmissions: false,
    submissionDeadlineHours: 24,
    teacherCanGrade: true,
  },
  examinations: {
    multiplePapersPerDay: true,
    multipleSessionsPerDay: true,
    scheduleConflictDetection: true,
    roomConflictDetection: true,
    candidateValidationRequired: true,
    attendanceRequirementPercentage: 75,
    publishResultsImmediately: false,
    examInstructions: 'Students must arrive 15 minutes prior to examination. Electronic devices and study materials are strictly prohibited.',
    gradingSchemes: [
      {
        id: 'scheme-default-cbse',
        name: 'CBSE 10-Point Scale',
        code: 'CBSE-10',
        isDefault: true,
        rules: [
          { grade: 'A1', minPercentage: 91, maxPercentage: 100, gradePoints: 10, isPass: true },
          { grade: 'A2', minPercentage: 81, maxPercentage: 90.99, gradePoints: 9, isPass: true },
          { grade: 'B1', minPercentage: 71, maxPercentage: 80.99, gradePoints: 8, isPass: true },
          { grade: 'B2', minPercentage: 61, maxPercentage: 70.99, gradePoints: 7, isPass: true },
          { grade: 'C1', minPercentage: 51, maxPercentage: 60.99, gradePoints: 6, isPass: true },
          { grade: 'C2', minPercentage: 41, maxPercentage: 50.99, gradePoints: 5, isPass: true },
          { grade: 'D', minPercentage: 33, maxPercentage: 40.99, gradePoints: 4, isPass: true },
          { grade: 'E', minPercentage: 0, maxPercentage: 32.99, gradePoints: 0, isPass: false },
        ],
      },
    ],
    rooms: [
      { id: 'room-101', name: 'Examination Hall A', code: 'HALL-A', type: 'EXAM_HALL', building: 'Main Block', floor: '1st', capacity: 60, status: 'ACTIVE' },
      { id: 'room-102', name: 'Examination Hall B', code: 'HALL-B', type: 'EXAM_HALL', building: 'Main Block', floor: '2nd', capacity: 45, status: 'ACTIVE' },
      { id: 'room-103', name: 'Science Auditorium', code: 'AUD-SCI', type: 'AUDITORIUM', building: 'Science Wing', floor: 'Ground', capacity: 120, status: 'ACTIVE' },
    ],
    timeSlots: [
      { id: 'slot-morning', name: 'Morning Shift', startTime: '09:00', endTime: '12:00', status: 'ACTIVE' },
      { id: 'slot-afternoon', name: 'Afternoon Shift', startTime: '13:30', endTime: '16:30', status: 'ACTIVE' },
    ],
    examTypes: [
      { id: 'type-ut1', name: 'Unit Test 1', code: 'UT-1', description: 'Periodic First Unit Assessment', status: 'ACTIVE', sortOrder: 1 },
      { id: 'type-hy', name: 'Half Yearly Examination', code: 'HY-EXAM', description: 'Mid-Session Term Examination', status: 'ACTIVE', sortOrder: 2 },
      { id: 'type-ut2', name: 'Unit Test 2', code: 'UT-2', description: 'Periodic Second Unit Assessment', status: 'ACTIVE', sortOrder: 3 },
      { id: 'type-annual', name: 'Annual Board Examination', code: 'ANNUAL', description: 'Final Cumulative Session Examination', status: 'ACTIVE', sortOrder: 4 },
    ],
    passingMarksPercentage: 33,
    hallTicketMandatory: true,
    graceMarksAllowance: 5,
    reEvaluationWindowDays: 14,
  },
  results: {
    publicationBehavior: 'MANUAL',
    resultVisibility: 'STUDENTS_AND_PARENTS',
    lockPublishedResults: true,
  },
  fees: {
    currency: 'INR',
    currencySymbol: '₹',
    defaultPaymentMethods: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'],
    lateFeeGraceDays: 7,
    receiptPrefix: 'REC',
    receiptFooterNote: 'This is a computer generated official fee receipt. Signature not required.',
    allowOnlinePayments: true,
    autoIssueReceipt: true,
  },
  communication: {
    teacherCanCreate: true,
    teacherCanPublish: false,
    defaultAudience: 'ALL',
    allowScheduling: true,
    allowAttachments: true,
    requireApprovalBeforeBroadcast: false,
    enabledChannels: ['IN_APP', 'EMAIL'],
  },
  notifications: {
    eventTriggers: {
      studentAbsence: true,
      homeworkAssigned: true,
      examSchedulePublished: true,
      resultDeclared: true,
      feeDueReminder: true,
    },
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
  },
  documents: {
    pageSize: 'A4',
    orientation: 'PORTRAIT',
    marginsMM: { top: 15, bottom: 15, left: 15, right: 15 },
    showHeader: true,
    showFooter: true,
    showSeal: true,
    showSignature: true,
    watermarkText: '',
  },
  security: {
    sessionTimeoutMinutes: 1440,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expiryDays: 90,
      maxFailedAttempts: 5,
      lockoutMinutes: 15,
    },
    authentication: {
      passwordLoginEnabled: true,
      emailVerificationEnabled: false,
      roleAccess: {
        schoolAdmin: true,
        teacher: true,
        student: true,
        parent: true,
      },
      sessionTimeoutMinutes: 1440,
    },
    recovery: {
      allowSelfServiceReset: true,
      requireAdminApproval: false,
      notifyAdminOnRecovery: true,
      resetLinkExpiryHours: 24,
    },
  },
  roles: {
    customRoles: [
      { id: 'role-admin', name: 'School Admin', isSystem: true, description: 'Full access to school administrative operations and configuration', userCount: 1 },
      { id: 'role-teacher', name: 'Teacher', isSystem: true, description: 'Access to assigned classes, timetable, attendance and homework', userCount: 0 },
      { id: 'role-student', name: 'Student', isSystem: true, description: 'Access to enrolled courses, timetables, results, and study resources', userCount: 0 },
      { id: 'role-parent', name: 'Parent', isSystem: true, description: 'Access to child attendance, fee invoices, academic reports, and notices', userCount: 0 },
    ],
    permissions: {},
  },
  houses: {
    houses: [
      { id: 'house-red', name: 'Ruby House', code: 'RUBY', color: '#ef4444', motto: 'Valor and Honor', status: 'ACTIVE' },
      { id: 'house-blue', name: 'Sapphire House', code: 'SAPPHIRE', color: '#3b82f6', motto: 'Wisdom and Truth', status: 'ACTIVE' },
      { id: 'house-green', name: 'Emerald House', code: 'EMERALD', color: '#10b981', motto: 'Growth and Harmony', status: 'ACTIVE' },
      { id: 'house-yellow', name: 'Topaz House', code: 'TOPAZ', color: '#f59e0b', motto: 'Radiance and Courage', status: 'ACTIVE' },
    ],
  },
  rollNumbers: {
    mode: 'CONTINUOUS',
    prefix: '',
    startIndex: 1,
    autoSortAlpha: true,
    isLocked: false,
    streamRules: {},
  },
  streams: {
    customStreams: [
      { id: 'stream-sci', name: 'Science', code: 'SCI', description: 'Physics, Chemistry, Mathematics, Biology' },
      { id: 'stream-comm', name: 'Commerce', code: 'COMM', description: 'Accountancy, Business Studies, Economics' },
      { id: 'stream-arts', name: 'Humanities', code: 'HUM', description: 'History, Political Science, Psychology' },
    ],
  },
};

// In-memory cache for ultra-fast lookup with strict invalidation
const settingsMemoryCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute read-through cache

function getCacheKey(schoolId: string, category: string): string {
  return `${schoolId}:${category}`;
}

export function invalidateSchoolSettingsCache(schoolId: string, category?: string) {
  if (category) {
    settingsMemoryCache.delete(getCacheKey(schoolId, category));
  } else {
    for (const key of settingsMemoryCache.keys()) {
      if (key.startsWith(`${schoolId}:`)) {
        settingsMemoryCache.delete(key);
      }
    }
  }
}

/**
 * Helper to deep-merge a category's custom value with defaults
 */
function mergeCategoryWithDefault(category: SettingCategory, customVal: any, defaultVal: any): any {
  if (!customVal || typeof customVal !== 'object') return defaultVal;

  if (category === 'security') {
    return {
      ...defaultVal,
      ...customVal,
      passwordPolicy: { ...defaultVal.passwordPolicy, ...(customVal.passwordPolicy || {}) },
      authentication: { ...defaultVal.authentication, ...(customVal.authentication || {}) },
      recovery: { ...defaultVal.recovery, ...(customVal.recovery || {}) },
    };
  }

  if (category === 'examinations') {
    return {
      ...defaultVal,
      ...customVal,
      gradingSchemes: Array.isArray(customVal.gradingSchemes) ? customVal.gradingSchemes : defaultVal.gradingSchemes,
      rooms: Array.isArray(customVal.rooms) ? customVal.rooms : defaultVal.rooms,
      timeSlots: Array.isArray(customVal.timeSlots) ? customVal.timeSlots : defaultVal.timeSlots,
      examTypes: Array.isArray(customVal.examTypes) ? customVal.examTypes : defaultVal.examTypes,
    };
  }

  if (category === 'roles') {
    return {
      ...defaultVal,
      ...customVal,
      customRoles: Array.isArray(customVal.customRoles) ? customVal.customRoles : defaultVal.customRoles,
      permissions: customVal.permissions && typeof customVal.permissions === 'object' ? customVal.permissions : defaultVal.permissions,
    };
  }

  if (category === 'houses') {
    return {
      ...defaultVal,
      ...customVal,
      houses: Array.isArray(customVal.houses) ? customVal.houses : defaultVal.houses,
    };
  }

  if (category === 'rollNumbers') {
    return {
      ...defaultVal,
      ...customVal,
      streamRules: customVal.streamRules && typeof customVal.streamRules === 'object' ? customVal.streamRules : defaultVal.streamRules,
    };
  }

  if (category === 'streams') {
    return {
      ...defaultVal,
      ...customVal,
      customStreams: Array.isArray(customVal.customStreams) ? customVal.customStreams : defaultVal.customStreams,
    };
  }

  return { ...defaultVal, ...customVal };
}

/**
 * Get a specific configuration category for a school tenant.
 */
export async function getSchoolSetting<K extends SettingCategory>(
  schoolId: string,
  category: K
): Promise<SchoolSettingMap[K]> {
  const cacheKey = getCacheKey(schoolId, category);
  const cached = settingsMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value as SchoolSettingMap[K];
  }

  const record = await prisma.schoolSetting.findUnique({
    where: {
      schoolId_category: {
        schoolId,
        category,
      },
    },
  });

  const defaultVal = DEFAULT_SETTINGS[category];
  const merged = mergeCategoryWithDefault(category, record?.value, defaultVal);

  settingsMemoryCache.set(cacheKey, { value: merged, timestamp: Date.now() });
  return merged as SchoolSettingMap[K];
}

/**
 * Get all school settings aggregated in one call.
 */
export async function getAllSchoolSettings(schoolId: string): Promise<SchoolSettingMap> {
  const records = await prisma.schoolSetting.findMany({
    where: { schoolId },
  });

  const recordMap = new Map<string, any>();
  for (const r of records) {
    recordMap.set(r.category, r.value);
  }

  const result: Partial<SchoolSettingMap> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingCategory[]) {
    const custom = recordMap.get(key);
    result[key] = mergeCategoryWithDefault(key, custom, DEFAULT_SETTINGS[key]);
  }

  return result as SchoolSettingMap;
}

/**
 * Persist or update a school configuration category.
 */
export async function updateSchoolSetting<K extends SettingCategory>(
  schoolId: string,
  category: K,
  value: Partial<SchoolSettingMap[K]>,
  updatedById?: string,
  expectedVersion?: number
): Promise<SchoolSettingMap[K]> {
  const current = await getSchoolSetting(schoolId, category);
  let updatedValue: any;

  if (category === 'security' && typeof current === 'object' && typeof value === 'object') {
    const curSec = current as any;
    const valSec = value as any;
    updatedValue = {
      ...curSec,
      ...valSec,
      passwordPolicy: valSec.passwordPolicy ? { ...curSec.passwordPolicy, ...valSec.passwordPolicy } : curSec.passwordPolicy,
      authentication: valSec.authentication ? { ...curSec.authentication, ...valSec.authentication } : curSec.authentication,
      recovery: valSec.recovery ? { ...curSec.recovery, ...valSec.recovery } : curSec.recovery,
    };
  } else if (category === 'examinations' && typeof current === 'object' && typeof value === 'object') {
    const curEx = current as any;
    const valEx = value as any;
    updatedValue = {
      ...curEx,
      ...valEx,
      gradingSchemes: valEx.gradingSchemes !== undefined ? valEx.gradingSchemes : curEx.gradingSchemes,
      rooms: valEx.rooms !== undefined ? valEx.rooms : curEx.rooms,
      timeSlots: valEx.timeSlots !== undefined ? valEx.timeSlots : curEx.timeSlots,
      examTypes: valEx.examTypes !== undefined ? valEx.examTypes : curEx.examTypes,
    };
  } else if (category === 'roles' && typeof current === 'object' && typeof value === 'object') {
    const curRoles = current as any;
    const valRoles = value as any;
    updatedValue = {
      ...curRoles,
      ...valRoles,
      customRoles: valRoles.customRoles !== undefined ? valRoles.customRoles : curRoles.customRoles,
      permissions: valRoles.permissions !== undefined ? { ...curRoles.permissions, ...valRoles.permissions } : curRoles.permissions,
    };
  } else {
    updatedValue = { ...current, ...value };
  }

  if (expectedVersion !== undefined) {
    const existing = await prisma.schoolSetting.findUnique({
      where: { schoolId_category: { schoolId, category } },
    });
    if (existing && existing.version !== expectedVersion) {
      const error: any = new Error(
        `Concurrency Conflict: Setting was modified by another administrator (Current version: ${existing.version}, Expected: ${expectedVersion}).`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  await prisma.schoolSetting.upsert({
    where: {
      schoolId_category: {
        schoolId,
        category,
      },
    },
    create: {
      schoolId,
      category,
      value: updatedValue,
      version: 1,
      updatedById: updatedById || null,
    },
    update: {
      value: updatedValue,
      version: { increment: 1 },
      updatedById: updatedById || null,
    },
  });

  invalidateSchoolSettingsCache(schoolId, category);
  return updatedValue as SchoolSettingMap[K];
}

// ---------------------------------------------------------------------------
// Typed Authoritative Configuration Resolvers for Operational Modules
// ---------------------------------------------------------------------------

export async function getAttendanceSettings(schoolId: string): Promise<SchoolSettingMap['attendance']> {
  return getSchoolSetting(schoolId, 'attendance');
}

export async function getTimetableSettings(schoolId: string): Promise<SchoolSettingMap['timetable']> {
  return getSchoolSetting(schoolId, 'timetable');
}

export async function getHomeworkSettings(schoolId: string): Promise<SchoolSettingMap['homework']> {
  return getSchoolSetting(schoolId, 'homework');
}

export async function getExamSettings(schoolId: string): Promise<SchoolSettingMap['examinations']> {
  return getSchoolSetting(schoolId, 'examinations');
}

export async function getResultSettings(schoolId: string): Promise<SchoolSettingMap['results']> {
  return getSchoolSetting(schoolId, 'results');
}

export async function getFeeSettings(schoolId: string): Promise<SchoolSettingMap['fees']> {
  return getSchoolSetting(schoolId, 'fees');
}

export async function getCommunicationSettings(schoolId: string): Promise<SchoolSettingMap['communication']> {
  return getSchoolSetting(schoolId, 'communication');
}

export async function getNotificationSettings(schoolId: string): Promise<SchoolSettingMap['notifications']> {
  return getSchoolSetting(schoolId, 'notifications');
}

export async function getDocumentSettings(schoolId: string): Promise<SchoolSettingMap['documents']> {
  return getSchoolSetting(schoolId, 'documents');
}

export async function getSecuritySettings(schoolId: string): Promise<SchoolSettingMap['security']> {
  return getSchoolSetting(schoolId, 'security');
}

export async function getBrandingSettings(schoolId: string): Promise<SchoolSettingMap['branding']> {
  return getSchoolSetting(schoolId, 'branding');
}

export async function getRolesSettings(schoolId: string): Promise<SchoolSettingMap['roles']> {
  return getSchoolSetting(schoolId, 'roles');
}

export async function getHouseSettings(schoolId: string): Promise<SchoolSettingMap['houses']> {
  return getSchoolSetting(schoolId, 'houses');
}

export async function getRollNumberSettings(schoolId: string): Promise<SchoolSettingMap['rollNumbers']> {
  return getSchoolSetting(schoolId, 'rollNumbers');
}

export async function getStreamSettings(schoolId: string): Promise<SchoolSettingMap['streams']> {
  return getSchoolSetting(schoolId, 'streams');
}


/**
 * Get unified School Profile (merged from `School` table and `profile` settings).
 */
export async function getUnifiedSchoolProfile(schoolId: string) {
  const [school, profileSetting] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    getSchoolSetting(schoolId, 'profile'),
  ]);

  if (!school) return null;

  return {
    ...profileSetting,
    schoolName: school.name || profileSetting.schoolName,
    schoolCode: profileSetting.schoolCode || school.slug?.toUpperCase() || '',
    phone: school.phone || profileSetting.phone,
    email: school.email || profileSetting.email,
    website: school.website || profileSetting.website,
    address: school.address || profileSetting.address,
    logoUrl: school.logoUrl || undefined,
    slug: school.slug,
    status: school.status,
  };
}

/**
 * Update unified School Profile. Updates core `School` model and `profile` settings atomically.
 */
export async function updateUnifiedSchoolProfile(
  schoolId: string,
  data: Partial<SchoolSettingMap['profile']> & { logoUrl?: string },
  updatedById?: string
) {
  const { schoolName, phone, email, website, address, logoUrl, ...extraProfile } = data;

  await prisma.$transaction(async (tx) => {
    // 1. Update School table root fields
    const schoolUpdateData: any = {};
    if (schoolName !== undefined && schoolName.trim()) {
      schoolUpdateData.name = schoolName.trim();
    }
    if (phone !== undefined) schoolUpdateData.phone = phone.trim() || null;
    if (email !== undefined) schoolUpdateData.email = email.trim() || null;
    if (website !== undefined) schoolUpdateData.website = website.trim() || null;
    if (address !== undefined) schoolUpdateData.address = address.trim() || null;
    if (logoUrl !== undefined) schoolUpdateData.logoUrl = logoUrl.trim() || null;

    if (Object.keys(schoolUpdateData).length > 0) {
      await tx.school.update({
        where: { id: schoolId },
        data: schoolUpdateData,
      });
    }

    // 2. Persist extended profile attributes in SchoolSetting
    const currentProfile = await getSchoolSetting(schoolId, 'profile');
    const mergedProfile = {
      ...currentProfile,
      ...(schoolName ? { schoolName: schoolName.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(website !== undefined ? { website: website.trim() } : {}),
      ...(address !== undefined ? { address: address.trim() } : {}),
      ...extraProfile,
    };

    await tx.schoolSetting.upsert({
      where: {
        schoolId_category: {
          schoolId,
          category: 'profile',
        },
      },
      create: {
        schoolId,
        category: 'profile',
        value: mergedProfile,
        version: 1,
        updatedById: updatedById || null,
      },
      update: {
        value: mergedProfile,
        version: { increment: 1 },
        updatedById: updatedById || null,
      },
    });
  });

  invalidateSchoolSettingsCache(schoolId, 'profile');
  return getUnifiedSchoolProfile(schoolId);
}

/**
 * Get readiness and entity metrics for the Settings Overview Dashboard.
 */
export async function getSchoolSettingsOverview(schoolId: string) {
  const [
    school,
    campusesCount,
    sessionsCount,
    classesCount,
    subjectsCount,
    usersCount,
    timetableConfigsCount,
    idFormatConfig,
    activeSession,
    settings,
  ] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, logoUrl: true, status: true },
    }),
    prisma.campus.count({ where: { schoolId } }),
    prisma.academicSession.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.schoolMembership.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.timetableConfig.count({ where: { schoolId } }),
    prisma.idFormatConfig.findUnique({ where: { schoolId } }),
    prisma.academicSession.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    getAllSchoolSettings(schoolId),
  ]);

  return {
    school,
    activeSession,
    counts: {
      campuses: campusesCount,
      academicSessions: sessionsCount,
      classes: classesCount,
      subjects: subjectsCount,
      users: usersCount,
      timetableConfigs: timetableConfigsCount,
    },
    hasIdConfig: Boolean(idFormatConfig),
    settings,
  };
}
