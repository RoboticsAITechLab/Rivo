import { StudentDetail, StudentGuardian } from '@/types/student';

/**
 * Builds a valid StudentDetail record from form inputs with empty/default fields for new admissions
 */
export function buildStudentDetail(input: Record<string, unknown>): StudentDetail {
  const id = (input.id as string) || `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const firstName = (input.firstName as string) || '';
  const lastName = (input.lastName as string) || '';
  const name = (input.name as string) || `${firstName} ${lastName}`.trim() || 'Unnamed Student';
  const admissionNumber = (input.admissionNumber as string) || `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateOfBirth = (input.dateOfBirth as string) || (input.dob as string) || '';
  const gender = (input.gender as 'Male' | 'Female' | 'Other') || 'Male';
  const className = (input.className as string) || '';
  const section = (input.section as string) || '';
  const rollNumber = input.rollNumber ? String(input.rollNumber) : '';
  const academicSession = (input.academicSession as string) || '2026-2027';
  const status = (input.status as StudentDetail['status']) || 'ACTIVE';
  const email = (input.email as string) || '';
  const phone = (input.phone as string) || '';

  const address = (input.address as StudentDetail['address']) || {
    street: (input.street as string) || '',
    addressLine2: input.addressLine2 as string | undefined,
    city: (input.city as string) || '',
    district: input.district as string | undefined,
    state: (input.state as string) || '',
    country: (input.country as string) || 'India',
    postalCode: (input.postalCode as string) || '',
  };

  const primaryGuardian: StudentGuardian = (input.primaryGuardian as StudentGuardian) || {
    id: `grd-${Date.now()}-1`,
    name: (input.guardianName as string)?.replace(/\s*\([^)]*\)/, '') || '',
    relationship: (input.guardianRelation as StudentGuardian['relationship']) || 'Father',
    phone: (input.guardianPhone as string) || '',
    email: (input.guardianEmail as string) || undefined,
    occupation: (input.guardianOccupation as string) || '',
    isPrimary: true,
    isEmergencyContact: true,
    allowSchoolCommunication: true,
  };

  const secondaryGuardian: StudentGuardian | undefined = (input.secondaryGuardian as StudentGuardian) || (input.secGuardianName ? {
    id: `grd-${Date.now()}-2`,
    name: input.secGuardianName as string,
    relationship: (input.secGuardianRelation as StudentGuardian['relationship']) || 'Mother',
    phone: (input.secGuardianPhone as string) || '',
    isPrimary: false,
    isEmergencyContact: true,
  } : undefined);

  const guardians: StudentGuardian[] = (input.guardians as StudentGuardian[]) || [
    primaryGuardian,
    ...(secondaryGuardian ? [secondaryGuardian] : []),
  ];

  return {
    id,
    admissionNumber,
    photoUrl: input.photoUrl as string | undefined,
    firstName,
    middleName: input.middleName as string | undefined,
    lastName,
    name,
    displayName: (input.displayName as string) || name,
    className,
    section,
    rollNumber,
    academicSession,
    status,
    gender,
    dateOfBirth,
    nationality: (input.nationality as string) || 'Indian',
    motherTongue: (input.motherTongue as string) || 'English',
    studentType: (input.studentType as string) || 'REGULAR',
    admissionType: (input.admissionType as StudentDetail['admissionType']) || 'FIRST_TIME',
    previousSchool: input.previousSchool as string | undefined,
    previousClass: input.previousClass as string | undefined,
    identifiers: (input.identifiers as StudentDetail['identifiers']) || {
      studentId: admissionNumber,
      apaarId: input.apaarId as string | undefined,
      nationalId: input.nationalId as string | undefined,
    },
    email,
    phone,
    bloodGroup: (input.bloodGroup as string) || 'B+',
    address,
    permanentAddressSameAsCurrent: input.permanentAddressSameAsCurrent !== false,
    permanentAddress: input.permanentAddress as StudentDetail['permanentAddress'],
    guardians,
    primaryGuardian,
    secondaryGuardian,
    guardianName: (input.guardianName as string) || `${primaryGuardian.name} (${primaryGuardian.relationship})`,
    guardianPhone: (input.guardianPhone as string) || primaryGuardian.phone,
    enrollmentDate: (input.enrollmentDate as string) || (input.enrollDate as string) || new Date().toISOString().split('T')[0],
    currentTeacher: (input.currentTeacher as string) || (input.teacher as string) || '',
    currentCampus: (input.currentCampus as string) || '',
    documents: (input.documents as StudentDetail['documents']) || [],
    health: (input.health as StudentDetail['health']) || {
      bloodGroup: (input.bloodGroup as string) || 'B+',
    },
    transport: (input.transport as StudentDetail['transport']) || {
      usesSchoolTransport: false,
    },
    communication: (input.communication as StudentDetail['communication']) || {
      preferredLanguage: 'English',
      parentCommunication: {
        announcements: true,
        academic: true,
        attendance: true,
        results: true,
      },
    },
    customFields: input.customFields as Record<string, unknown> | undefined,
    houseId: (input.houseId as string) || null,
    draftProgress: input.draftProgress as number | undefined,
    lastSavedAt: input.lastSavedAt as string | undefined,
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
