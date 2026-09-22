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

/**
 * Retrieves the ID format configuration for a school, creating default settings if not yet stored.
 */
export async function getIdFormatConfig(
  schoolId: string,
  client: any = prisma
): Promise<IdFormatConfigData> {
  const existing = await client.idFormatConfig.findUnique({
    where: { schoolId },
  });

  if (existing) {
    return {
      schoolId: existing.schoolId,
      studentPrefix: existing.studentPrefix,
      teacherPrefix: existing.teacherPrefix,
      staffPrefix: existing.staffPrefix,
      includeYear: existing.includeYear,
      studentPadding: existing.studentPadding,
      teacherPadding: existing.teacherPadding,
      staffPadding: existing.staffPadding,
    };
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

  return {
    schoolId: created.schoolId,
    studentPrefix: created.studentPrefix,
    teacherPrefix: created.teacherPrefix,
    staffPrefix: created.staffPrefix,
    includeYear: created.includeYear,
    studentPadding: created.studentPadding,
    teacherPadding: created.teacherPadding,
    staffPadding: created.staffPadding,
  };
}

/**
 * Updates or creates the ID format configuration for a school.
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

  return {
    schoolId: updated.schoolId,
    studentPrefix: updated.studentPrefix,
    teacherPrefix: updated.teacherPrefix,
    staffPrefix: updated.staffPrefix,
    includeYear: updated.includeYear,
    studentPadding: updated.studentPadding,
    teacherPadding: updated.teacherPadding,
    staffPadding: updated.staffPadding,
  };
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
