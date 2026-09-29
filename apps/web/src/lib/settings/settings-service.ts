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
  const merged = record && typeof record.value === 'object' && record.value !== null
    ? { ...defaultVal, ...(record.value as object) }
    : defaultVal;

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
    result[key] = custom && typeof custom === 'object'
      ? { ...DEFAULT_SETTINGS[key], ...custom }
      : DEFAULT_SETTINGS[key];
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
  const updatedValue = { ...current, ...value };

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
