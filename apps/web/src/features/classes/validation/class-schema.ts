import { ClassItem } from '../types';

export interface ClassValidationErrors {
  className?: string;
  academicSession?: string;
  sections?: string;
  general?: string;
}

export function validateClassForm(
  formData: {
    className: string;
    academicSession: string;
    sections: { name: string }[];
  },
  existingClasses: ClassItem[],
  currentClassId?: string,
): ClassValidationErrors {
  const errors: ClassValidationErrors = {};

  if (!formData.className.trim()) {
    errors.className = 'Class name is required (e.g. Class 10).';
  } else {
    const duplicate = existingClasses.some(
      (c) =>
        c.className.toLowerCase().trim() === formData.className.toLowerCase().trim() &&
        c.academicSession === formData.academicSession &&
        c.id !== currentClassId,
    );
    if (duplicate) {
      errors.className = `Class "${formData.className}" already exists for academic session ${formData.academicSession}.`;
    }
  }

  if (!formData.academicSession) {
    errors.academicSession = 'Academic session is required.';
  }

  if (formData.sections.length === 0) {
    errors.sections = 'At least one section must be configured for this class.';
  } else {
    const names = formData.sections.map((s) => s.name.toUpperCase().trim());
    const unique = new Set(names);
    if (unique.size !== names.length) {
      errors.sections = 'Section identifiers must be unique (e.g. A, B, C).';
    }
  }

  return errors;
}
