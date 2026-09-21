import { SchoolStoreState } from '../mock-store/school-store';
import { Teacher, Subject, SchoolClass, Room, House } from '../types';

export interface DuplicateDetectionResult<T> {
  isDuplicate: boolean;
  match?: T;
  field: string;
  message: string;
}

export function detectTeacherDuplicate(
  state: SchoolStoreState,
  candidate: { firstName: string; lastName: string; employeeId?: string; email?: string },
  excludeId?: string
): DuplicateDetectionResult<Teacher> | null {
  const normFirst = candidate.firstName.trim().toLowerCase();
  const normLast = candidate.lastName.trim().toLowerCase();
  const normEmp = candidate.employeeId?.trim().toLowerCase();
  const normEmail = candidate.email?.trim().toLowerCase();

  for (const t of state.teachers) {
    if (excludeId && t.id === excludeId) continue;

    if (normEmp && t.employment.employeeId.toLowerCase() === normEmp) {
      return {
        isDuplicate: true,
        match: t,
        field: 'employeeId',
        message: `A faculty member with Employee ID "${t.employment.employeeId}" already exists (${t.personal.firstName} ${t.personal.lastName}).`,
      };
    }

    if (normEmail && t.personal.email.toLowerCase() === normEmail) {
      return {
        isDuplicate: true,
        match: t,
        field: 'email',
        message: `A faculty member with email "${t.personal.email}" already exists (${t.personal.firstName} ${t.personal.lastName}).`,
      };
    }

    if (
      t.personal.firstName.toLowerCase() === normFirst &&
      t.personal.lastName.toLowerCase() === normLast
    ) {
      return {
        isDuplicate: true,
        match: t,
        field: 'name',
        message: `Faculty member "${t.personal.firstName} ${t.personal.lastName}" (${t.employment.employeeId}) already exists.`,
      };
    }
  }

  return null;
}

export function detectSubjectDuplicate(
  state: SchoolStoreState,
  candidate: { name: string; code: string },
  excludeId?: string
): DuplicateDetectionResult<Subject> | null {
  const normName = candidate.name.trim().toLowerCase();
  const normCode = candidate.code.trim().toLowerCase();

  for (const s of state.subjects) {
    if (excludeId && s.id === excludeId) continue;

    if (s.code.toLowerCase() === normCode) {
      return {
        isDuplicate: true,
        match: s,
        field: 'code',
        message: `Subject with code "${s.code}" already exists (${s.name}).`,
      };
    }

    if (s.name.toLowerCase() === normName) {
      return {
        isDuplicate: true,
        match: s,
        field: 'name',
        message: `Subject "${s.name}" (${s.code}) already exists.`,
      };
    }
  }

  return null;
}

export function detectClassDuplicate(
  state: SchoolStoreState,
  candidate: { className: string },
  excludeId?: string
): DuplicateDetectionResult<SchoolClass> | null {
  const normName = candidate.className.trim().toLowerCase();

  for (const c of state.classes) {
    if (excludeId && c.id === excludeId) continue;

    if (c.className.toLowerCase() === normName) {
      return {
        isDuplicate: true,
        match: c,
        field: 'className',
        message: `Class "${c.className}" already exists in the academic directory.`,
      };
    }
  }

  return null;
}

export function detectSectionDuplicate(
  state: SchoolStoreState,
  classId: string,
  sectionName: string,
  excludeId?: string
): boolean {
  const schoolClass = state.classes.find((c) => c.id === classId);
  if (!schoolClass) return false;

  const norm = sectionName.trim().toUpperCase();
  return schoolClass.sections.some(
    (s) => s.id !== excludeId && s.name.toUpperCase() === norm
  );
}

export function detectRoomDuplicate(
  state: SchoolStoreState,
  candidate: { name: string; code?: string },
  excludeId?: string
): DuplicateDetectionResult<Room> | null {
  const normName = candidate.name.trim().toLowerCase();
  const normCode = candidate.code?.trim().toLowerCase();

  for (const r of state.rooms) {
    if (excludeId && r.id === excludeId) continue;

    if (normCode && r.code.toLowerCase() === normCode) {
      return {
        isDuplicate: true,
        match: r,
        field: 'code',
        message: `Room with code "${r.code}" already exists (${r.name}).`,
      };
    }

    if (r.name.toLowerCase() === normName) {
      return {
        isDuplicate: true,
        match: r,
        field: 'name',
        message: `Room "${r.name}" already exists.`,
      };
    }
  }

  return null;
}

export function detectHouseDuplicate(
  state: SchoolStoreState,
  candidate: { name: string },
  excludeId?: string
): DuplicateDetectionResult<House> | null {
  const normName = candidate.name.trim().toLowerCase();

  for (const h of state.houses) {
    if (excludeId && h.id === excludeId) continue;

    if (h.name.toLowerCase() === normName) {
      return {
        isDuplicate: true,
        match: h,
        field: 'name',
        message: `House "${h.name}" already exists.`,
      };
    }
  }

  return null;
}
