import { StudentDetail, StudentGuardian } from '@/types/student';

/**
 * Builds a valid StudentDetail record from form inputs with empty/default fields for new admissions
 */
export function buildStudentDetail(input: any): StudentDetail {
  const id = input.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const firstName = input.firstName || '';
  const lastName = input.lastName || '';
  const name = input.name || `${firstName} ${lastName}`.trim() || 'Unnamed Student';
  const admissionNumber = input.admissionNumber || `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateOfBirth = input.dateOfBirth || input.dob || '';
  const gender = input.gender || 'Male';
  const className = input.className || '';
  const section = input.section || '';
  const rollNumber = input.rollNumber ? String(input.rollNumber) : '';
  const academicSession = input.academicSession || '2026-2027';
  const status = input.status || 'ACTIVE';
  const email = input.email || '';
  const phone = input.phone || '';

  const address = input.address || {
    street: input.street || '',
    addressLine2: input.addressLine2,
    city: input.city || '',
    district: input.district,
    state: input.state || '',
    country: input.country || 'India',
    postalCode: input.postalCode || '',
  };

  const primaryGuardian: StudentGuardian = input.primaryGuardian || {
    id: `grd-${Date.now()}-1`,
    name: input.guardianName?.replace(/\s*\([^)]*\)/, '') || '',
    relationship: (input.guardianRelation as any) || 'Father',
    phone: input.guardianPhone || '',
    email: input.guardianEmail || undefined,
    occupation: input.guardianOccupation || '',
    isPrimary: true,
    isEmergencyContact: true,
    allowSchoolCommunication: true,
  };

  const secondaryGuardian: StudentGuardian | undefined = input.secondaryGuardian || (input.secGuardianName ? {
    id: `grd-${Date.now()}-2`,
    name: input.secGuardianName,
    relationship: (input.secGuardianRelation as any) || 'Mother',
    phone: input.secGuardianPhone || '',
    isPrimary: false,
    isEmergencyContact: true,
  } : undefined);

  const guardians: StudentGuardian[] = input.guardians || [
    primaryGuardian,
    ...(secondaryGuardian ? [secondaryGuardian] : []),
  ];

  return {
    id,
    admissionNumber,
    photoUrl: input.photoUrl,
    firstName,
    middleName: input.middleName,
    lastName,
    name,
    displayName: input.displayName || name,
    className,
    section,
    rollNumber,
    academicSession,
    status,
    gender,
    dateOfBirth,
    nationality: input.nationality || 'Indian',
    motherTongue: input.motherTongue || 'English',
    studentType: input.studentType || 'REGULAR',
    admissionType: input.admissionType || 'FIRST_TIME',
    previousSchool: input.previousSchool,
    previousClass: input.previousClass,
    identifiers: input.identifiers || {
      studentId: admissionNumber,
      apaarId: input.apaarId,
      nationalId: input.nationalId,
    },
    email,
    phone,
    bloodGroup: input.bloodGroup || 'B+',
    address,
    permanentAddressSameAsCurrent: input.permanentAddressSameAsCurrent ?? true,
    permanentAddress: input.permanentAddress,
    guardians,
    primaryGuardian,
    secondaryGuardian,
    guardianName: input.guardianName || `${primaryGuardian.name} (${primaryGuardian.relationship})`,
    guardianPhone: input.guardianPhone || primaryGuardian.phone,
    enrollmentDate: input.enrollmentDate || input.enrollDate || new Date().toISOString().split('T')[0],
    currentTeacher: input.currentTeacher || input.teacher || '',
    currentCampus: input.currentCampus || '',
    documents: input.documents || [],
    health: input.health || {
      bloodGroup: input.bloodGroup || 'B+',
    },
    transport: input.transport || {
      usesSchoolTransport: false,
    },
    communication: input.communication || {
      preferredLanguage: 'English',
      parentCommunication: {
        announcements: true,
        academic: true,
        attendance: true,
        results: true,
      },
    },
    customFields: input.customFields,
    houseId: input.houseId || null,
    draftProgress: input.draftProgress,
    lastSavedAt: input.lastSavedAt,
    attendancePercentage: 0,
    attendanceSummary: {
      overallPercentage: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalWorkingDays: 0,
      monthlyTrend: [],
      recentRecords: [],
    },
    homeworkCompleted: 0,
    homeworkTotal: 0,
    homeworkList: [],
    averageMarks: 0,
    subjectPerformance: [],
    resultsHistory: [],
    enrollmentHistory: [],
    activityTimeline: [],
  };
}
