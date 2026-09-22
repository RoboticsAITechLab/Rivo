import { TeacherDetail } from '../types';

export interface TeacherValidationErrors {
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  email?: string;
  password?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  general?: string;
}

export function validateTeacherForm(
  formData: {
    personal: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      password?: string;
    };
    employment: {
      employeeId: string;
      department: string;
      designation: string;
      joiningDate: string;
    };
  },
  existingTeachers: TeacherDetail[],
  currentTeacherId?: string,
): TeacherValidationErrors {
  const errors: TeacherValidationErrors = {};

  // First Name
  if (!formData.personal.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  // Last Name
  if (!formData.personal.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }

  // Password (required for new teacher accounts, minimum 6 characters)
  if (!currentTeacherId) {
    if (!formData.personal.password || !formData.personal.password.trim()) {
      errors.password = 'Login password is required for new teacher account.';
    } else if (formData.personal.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
  }

  // Employee ID (optional / AUTO for system-generated sequence)
  const empId = formData.employment.employeeId?.trim();
  if (empId && empId.toUpperCase() !== 'AUTO') {
    const isDuplicate = existingTeachers.some(
      (t) =>
        t.employment.employeeId.toLowerCase() === empId.toLowerCase() &&
        t.id !== currentTeacherId,
    );
    if (isDuplicate) {
      errors.employeeId = `Employee ID "${empId}" is already assigned to another educator.`;
    }
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.personal.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(formData.personal.email.trim())) {
    errors.email = 'Please provide a valid email format (e.g. name@school.edu).';
  } else {
    const isDuplicateEmail = existingTeachers.some(
      (t) =>
        t.personal.email.toLowerCase() === formData.personal.email.toLowerCase().trim() &&
        t.id !== currentTeacherId,
    );
    if (isDuplicateEmail) {
      errors.email = 'This email address is already registered in the faculty directory.';
    }
  }

  // Phone
  if (!formData.personal.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (formData.personal.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Phone number must be at least 10 digits.';
  }

  // Department & Designation
  if (!formData.employment.department) {
    errors.department = 'Academic department is required.';
  }
  if (!formData.employment.designation.trim()) {
    errors.designation = 'Academic designation is required.';
  }

  // Joining Date
  if (!formData.employment.joiningDate) {
    errors.joiningDate = 'Institutional joining date is required.';
  }

  return errors;
}
