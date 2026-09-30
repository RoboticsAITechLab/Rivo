import { prisma } from '@/lib/prisma';

export interface IdFormatConfigData {
  schoolId: string;
  studentPrefix: string;
  teacherPrefix: string;
  staffPrefix: string;
  includeYear: boolean;
  studentPadding: number;
  teacherPadding: number;
  staffPadding: number;
}

/**
 * Derives a clean uppercase 3-4 letter code from a school name or slug.
 * E.g., "Greenwood International School" -> "GIS"
 * "Delhi Public School" -> "DPS"
 * "Rivo Academy" -> "RIVO"
 */
export function deriveSchoolCode(schoolNameOrSlug: string): string {
  if (!schoolNameOrSlug) return 'SCH';
  const clean = schoolNameOrSlug.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join('').toUpperCase();
    if (initials.length >= 2 && initials.length <= 5) {
      return initials;
    }
  }
  const slugAlpha = clean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return slugAlpha.slice(0, 4) || 'SCH';
}

import { getRedisClient, isRedisHealthy } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';

const localIdConfigCache = new Map<string, { data: IdFormatConfigData; expiresAt: number }>();
const LOCAL_ID_CONFIG_TTL_MS = 60 * 1000; // 1 minute local in-memory cache
const REDIS_ID_CONFIG_TTL_SEC = 300; // 5 minutes Redis cache

/**
 * Invalidates the cached ID format configuration for a school across local memory and Redis
 */
export async function invalidateIdFormatConfigCache(schoolId: string): Promise<void> {
  localIdConfigCache.delete(schoolId);
  const redis = getRedisClient();
  if (redis && isRedisHealthy()) {
    try {
      await redis.del(RedisKeys.idFormatConfig(schoolId));
    } catch {
      // Ignore cache eviction failures to preserve correctness
    }
  }
}

/**
 * Retrieves the ID format configuration for a school, creating default settings if not yet stored.
 * Implements two-tier caching: Local memory -> Redis -> PostgreSQL.
 */
export async function getIdFormatConfig(
  schoolId: string,
  client: any = prisma
): Promise<IdFormatConfigData> {
  const now = Date.now();

  // Tier 1: Process-local in-memory cache
  const localCached = localIdConfigCache.get(schoolId);
  if (localCached && localCached.expiresAt > now) {
    return localCached.data;
  }

  // Tier 2: Redis cache
  const redis = getRedisClient();
  if (redis && isRedisHealthy()) {
    try {
      const cached = await redis.get(RedisKeys.idFormatConfig(schoolId));
      if (cached) {
        const parsed = JSON.parse(cached) as IdFormatConfigData;
        localIdConfigCache.set(schoolId, { data: parsed, expiresAt: now + LOCAL_ID_CONFIG_TTL_MS });
        return parsed;
      }
    } catch {
      // Safe fallback to PostgreSQL on Redis error
    }
  }

  // Tier 3: PostgreSQL query (Authoritative Source of Truth)
  const existing = await client.idFormatConfig.findUnique({
    where: { schoolId },
  });

  if (existing) {
    const data: IdFormatConfigData = {
      schoolId: existing.schoolId,
      studentPrefix: existing.studentPrefix,
      teacherPrefix: existing.teacherPrefix,
      staffPrefix: existing.staffPrefix,
      includeYear: existing.includeYear,
      studentPadding: existing.studentPadding,
      teacherPadding: existing.teacherPadding,
      staffPadding: existing.staffPadding,
    };

    localIdConfigCache.set(schoolId, { data, expiresAt: now + LOCAL_ID_CONFIG_TTL_MS });
    if (redis && isRedisHealthy()) {
      try {
        await redis.setex(RedisKeys.idFormatConfig(schoolId), REDIS_ID_CONFIG_TTL_SEC, JSON.stringify(data));
      } catch {
        // Safe ignore
      }
    }
    return data;
  }

  // Derive initial prefix from School
  const school = await client.school.findUnique({
    where: { id: schoolId },
    select: { name: true, slug: true },
  });

  const defaultPrefix = deriveSchoolCode(school?.name || school?.slug || 'SCH');

  const created = await client.idFormatConfig.create({
    data: {
      schoolId,
      studentPrefix: defaultPrefix,
      teacherPrefix: 'TCH',
      staffPrefix: 'STF',
      includeYear: true,
      studentPadding: 4,
      teacherPadding: 4,
      staffPadding: 4,
    },
  });

  const configData: IdFormatConfigData = {
    schoolId: created.schoolId,
    studentPrefix: created.studentPrefix,
    teacherPrefix: created.teacherPrefix,
    staffPrefix: created.staffPrefix,
    includeYear: created.includeYear,
    studentPadding: created.studentPadding,
    teacherPadding: created.teacherPadding,
    staffPadding: created.staffPadding,
  };

  localIdConfigCache.set(schoolId, { data: configData, expiresAt: now + LOCAL_ID_CONFIG_TTL_MS });
  if (redis && isRedisHealthy()) {
    try {
      await redis.setex(RedisKeys.idFormatConfig(schoolId), REDIS_ID_CONFIG_TTL_SEC, JSON.stringify(configData));
    } catch {
      // Safe ignore
    }
  }

  return configData;
}

/**
 * Updates or creates the ID format configuration for a school.
 * Explicitly invalidates local cache and Redis to prevent stale reads.
 */
export async function updateIdFormatConfig(
  schoolId: string,
  data: Partial<{
    studentPrefix: string;
    teacherPrefix: string;
    staffPrefix: string;
    includeYear: boolean;
    studentPadding: number;
    teacherPadding: number;
    staffPadding: number;
  }>,
  client: any = prisma
): Promise<IdFormatConfigData> {
  const sanitizedStudentPrefix = (data.studentPrefix || 'STD').trim().toUpperCase();
  const sanitizedTeacherPrefix = (data.teacherPrefix || 'TCH').trim().toUpperCase();
  const sanitizedStaffPrefix = (data.staffPrefix || 'STF').trim().toUpperCase();
  const studentPadding = Math.max(3, Math.min(6, data.studentPadding ?? 4));
  const teacherPadding = Math.max(3, Math.min(6, data.teacherPadding ?? 4));
  const staffPadding = Math.max(3, Math.min(6, data.staffPadding ?? 4));
  const includeYear = data.includeYear !== undefined ? Boolean(data.includeYear) : true;

  const updated = await client.idFormatConfig.upsert({
    where: { schoolId },
    update: {
      studentPrefix: sanitizedStudentPrefix,
      teacherPrefix: sanitizedTeacherPrefix,
      staffPrefix: sanitizedStaffPrefix,
      includeYear,
      studentPadding,
      teacherPadding,
      staffPadding,
    },
    create: {
      schoolId,
      studentPrefix: sanitizedStudentPrefix,
      teacherPrefix: sanitizedTeacherPrefix,
      staffPrefix: sanitizedStaffPrefix,
      includeYear,
      studentPadding,
      teacherPadding,
      staffPadding,
    },
  });

  const result: IdFormatConfigData = {
    schoolId: updated.schoolId,
    studentPrefix: updated.studentPrefix,
    teacherPrefix: updated.teacherPrefix,
    staffPrefix: updated.staffPrefix,
    includeYear: updated.includeYear,
    studentPadding: updated.studentPadding,
    teacherPadding: updated.teacherPadding,
    staffPadding: updated.staffPadding,
  };

  // Explicit invalidation across tiers
  await invalidateIdFormatConfigCache(schoolId);

  return result;
}

/**
 * Atomically generates the next admission number for a student.
 * Format: {PREFIX}-{YEAR}-{SEQUENCE} (e.g. GIS-2026-0001) or {PREFIX}-{SEQUENCE}
 * Scoped by school and year. Safe against race conditions and collisions.
 */
export async function generateNextStudentId(
  schoolId: string,
  options?: { year?: number; tx?: any }
): Promise<string> {
  const client = options?.tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const currentYear = options?.year || new Date().getFullYear();
  const yearKey = config.includeYear ? currentYear : 0;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    // Atomic increment sequence
    const seq = await client.idSequence.upsert({
      where: {
        schoolId_entityType_year: {
          schoolId,
          entityType: 'STUDENT',
          year: yearKey,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        schoolId,
        entityType: 'STUDENT',
        year: yearKey,
        lastNumber: 1,
      },
    });

    const paddedNumber = String(seq.lastNumber).padStart(config.studentPadding, '0');
    const generatedId = config.includeYear
      ? `${config.studentPrefix}-${currentYear}-${paddedNumber}`
      : `${config.studentPrefix}-${paddedNumber}`;

    // Collision check: verify no student already holds this admission number
    const existing = await client.student.findFirst({
      where: {
        schoolId,
        admissionNumber: generatedId,
      },
      select: { id: true },
    });

    if (!existing) {
      return generatedId;
    }
  }

  // Fallback with timestamp suffix in extreme collision edge cases
  return `${config.studentPrefix}-${currentYear}-${Date.now().toString().slice(-4)}`;
}

/**
 * Atomically generates the next employee ID for a teacher.
 * Format: {PREFIX}-{TEACHER_PREFIX}-{SEQUENCE} (e.g. GIS-TCH-0001)
 * Continuous sequence per school.
 */
export async function generateNextTeacherId(
  schoolId: string,
  tx?: any
): Promise<string> {
  const client = tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const yearKey = 0; // Continuous numbering across years

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    const seq = await client.idSequence.upsert({
      where: {
        schoolId_entityType_year: {
          schoolId,
          entityType: 'TEACHER',
          year: yearKey,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        schoolId,
        entityType: 'TEACHER',
        year: yearKey,
        lastNumber: 1,
      },
    });

    const paddedNumber = String(seq.lastNumber).padStart(config.teacherPadding, '0');
    const generatedId = `${config.studentPrefix}-${config.teacherPrefix}-${paddedNumber}`;

    // Collision check
    const existing = await client.teacher.findFirst({
      where: {
        schoolId,
        employeeId: generatedId,
      },
      select: { id: true },
    });

    if (!existing) {
      return generatedId;
    }
  }

  return `${config.studentPrefix}-${config.teacherPrefix}-${Date.now().toString().slice(-4)}`;
}

/**
 * Previews the next upcoming employee ID for a teacher without incrementing the sequence.
 */
export async function getNextTeacherIdPreview(
  schoolId: string,
  client: any = prisma
): Promise<string> {
  const config = await getIdFormatConfig(schoolId, client);
  const seq = await client.idSequence.findUnique({
    where: {
      schoolId_entityType_year: {
        schoolId,
        entityType: 'TEACHER',
        year: 0,
      },
    },
  });
  const nextNum = (seq?.lastNumber || 0) + 1;
  const paddedNumber = String(nextNum).padStart(config.teacherPadding, '0');
  return `${config.studentPrefix}-${config.teacherPrefix}-${paddedNumber}`;
}

/**
 * Atomically generates the next ID for non-teaching staff.
 * Format: {PREFIX}-{STAFF_PREFIX}-{SEQUENCE} (e.g. GIS-STF-0001)
 */
export async function generateNextStaffId(
  schoolId: string,
  tx?: any
): Promise<string> {
  const client = tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const yearKey = 0;

  const seq = await client.idSequence.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId,
        entityType: 'STAFF',
        year: yearKey,
      },
    },
    update: {
      lastNumber: { increment: 1 },
    },
    create: {
      schoolId,
      entityType: 'STAFF',
      year: yearKey,
      lastNumber: 1,
    },
  });

  const paddedNumber = String(seq.lastNumber).padStart(config.staffPadding, '0');
  return `${config.studentPrefix}-${config.staffPrefix}-${paddedNumber}`;
}

/**
 * Atomically generates the next receipt number for a school fee payment.
 * Format: {PREFIX}-RCT-{YEAR}-{SEQUENCE} (e.g. GIS-RCT-2026-0001)
 * Scoped by school and year. Safe against race conditions and collisions.
 */
export async function generateNextReceiptNumber(
  schoolId: string,
  options?: { year?: number; tx?: any }
): Promise<string> {
  const client = options?.tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const currentYear = options?.year || new Date().getFullYear();
  const yearKey = currentYear;
  const padding = 4;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    const seq = await client.idSequence.upsert({
      where: {
        schoolId_entityType_year: {
          schoolId,
          entityType: 'RECEIPT',
          year: yearKey,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        schoolId,
        entityType: 'RECEIPT',
        year: yearKey,
        lastNumber: 1,
      },
    });

    const paddedNumber = String(seq.lastNumber).padStart(padding, '0');
    const generatedId = `${config.studentPrefix}-RCT-${currentYear}-${paddedNumber}`;

    // Collision check
    const existing = await client.feeReceipt.findFirst({
      where: {
        schoolId,
        receiptNumber: generatedId,
      },
      select: { id: true },
    });

    if (!existing) {
      return generatedId;
    }
  }

  return `${config.studentPrefix}-RCT-${currentYear}-${Date.now().toString().slice(-4)}`;
}

/**
 * Atomically generates the next payment tracking number for a school fee payment.
 * Format: {PREFIX}-PAY-{YEAR}-{SEQUENCE} (e.g. GIS-PAY-2026-0001)
 * Scoped by school and year. Safe against race conditions and collisions.
 */
export async function generateNextPaymentNumber(
  schoolId: string,
  options?: { year?: number; tx?: any }
): Promise<string> {
  const client = options?.tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const currentYear = options?.year || new Date().getFullYear();
  const yearKey = currentYear;
  const padding = 4;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    const seq = await client.idSequence.upsert({
      where: {
        schoolId_entityType_year: {
          schoolId,
          entityType: 'PAYMENT',
          year: yearKey,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        schoolId,
        entityType: 'PAYMENT',
        year: yearKey,
        lastNumber: 1,
      },
    });

    const paddedNumber = String(seq.lastNumber).padStart(padding, '0');
    const generatedId = `${config.studentPrefix}-PAY-${currentYear}-${paddedNumber}`;

    // Collision check
    const existing = await client.feePayment.findFirst({
      where: {
        schoolId,
        paymentNumber: generatedId,
      },
      select: { id: true },
    });

    if (!existing) {
      return generatedId;
    }
  }

  return `${config.studentPrefix}-PAY-${currentYear}-${Date.now().toString().slice(-4)}`;
}

/**
 * Generates an optional public human-readable code for a fee plan.
 * Format: {PREFIX}-FP-{CLASS}-{STREAM?}-{YEAR} (e.g. GIS-FP-CLS10-SCI-2026)
 */
export async function generateNextFeePlanCode(
  schoolId: string,
  classIdentifier: string,
  streamIdentifier?: string | null,
  options?: { year?: number; tx?: any }
): Promise<string> {
  const client = options?.tx || prisma;
  const config = await getIdFormatConfig(schoolId, client);
  const currentYear = options?.year || new Date().getFullYear();
  const cleanClass = classIdentifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanStream = streamIdentifier ? streamIdentifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) : null;

  const baseCode = cleanStream
    ? `${config.studentPrefix}-FP-${cleanClass}-${cleanStream}-${currentYear}`
    : `${config.studentPrefix}-FP-${cleanClass}-${currentYear}`;

  const existing = await client.feePlan.findFirst({
    where: { schoolId, code: baseCode },
    select: { id: true },
  });

  if (!existing) {
    return baseCode;
  }

  // If already exists for this school/class/stream/year, append sequence
  const seq = await client.idSequence.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId,
        entityType: 'FEE_PLAN',
        year: currentYear,
      },
    },
    update: { lastNumber: { increment: 1 } },
    create: { schoolId, entityType: 'FEE_PLAN', year: currentYear, lastNumber: 1 },
  });

  return `${baseCode}-V${seq.lastNumber}`;
}
