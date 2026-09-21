import { SubjectDetail } from '../types';

export interface SubjectValidationErrors {
  name?: string;
  code?: string;
  type?: string;
  department?: string;
  classes?: string;
  weeklyPeriods?: string;
  general?: string;
}

export function validateSubjectForm(
  formData: {
    name: string;
    code: string;
    type: string;
    department: string;
    applicableClassIds: string[];
    weeklyPeriods: number;
  },
  existingSubjects: SubjectDetail[],
  currentSubjectId?: string,
): SubjectValidationErrors {
  const errors: SubjectValidationErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'Subject name is required.';
  } else {
    const isDuplicate = existingSubjects.some(
      (s) =>
        s.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
        s.id !== currentSubjectId,
    );
    if (isDuplicate) {
      errors.name = `Subject "${formData.name}" already exists in the institutional curriculum.`;
    }
  }

  if (!formData.code.trim()) {
    errors.code = 'Subject code is required (e.g. MAT101).';
  } else {
    const isDuplicateCode = existingSubjects.some(
      (s) =>
        s.code.toUpperCase().trim() === formData.code.toUpperCase().trim() &&
        s.id !== currentSubjectId,
    );
    if (isDuplicateCode) {
      errors.code = `Subject code "${formData.code.toUpperCase()}" is already assigned to another course.`;
    }
  }

  if (!formData.type) {
    errors.type = 'Subject type classification is required.';
  }

  if (!formData.department) {
    errors.department = 'Academic department is required.';
  }

  if (formData.applicableClassIds.length === 0) {
    errors.classes = 'Select at least one applicable academic class.';
  }

  if (!formData.weeklyPeriods || formData.weeklyPeriods < 1 || formData.weeklyPeriods > 20) {
    errors.weeklyPeriods = 'Weekly periods must be between 1 and 20 periods.';
  }

  return errors;
}
