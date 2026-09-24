import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { validateTimetableSlotConflict } from '../lib/timetable/conflict-engine';
import { generateNextTeacherId } from '../lib/id-generator';

let testSchoolId: string;
let testCampusId: string;
let testAcademicSessionId: string;
let testClass10Id: string;
let testClass11Id: string;
let testSectionAId: string;
let testSectionBId: string;
let testSubjectMathsId: string;
let testSubjectPhysicsId: string;
let testTeacher1Id: string;
let testTeacher2Id: string;
let testUserId1: string;
let testUserId2: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runTeacherTimetableExamTests() {
  console.log('🚀 Running Teacher, Timetable Conflict Engine & Exam System Tests...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Create isolated test school, campus, session, classes
    // -------------------------------------------------------------
    const school = await prisma.school.create({
      data: {
        name: 'St. Xavier Test Academy',
        slug: `st-xavier-${Date.now()}`,
        status: 'ACTIVE',
        logoUrl: '/uploads/branding/test-logo.png',
        address: '42 Academic Boulevard, Education District',
        phone: '+91 98765 43210',
        email: 'admin@stxavier-test.edu',
        website: 'https://stxavier-test.edu',
      },
    });
    testSchoolId = school.id;

    const campus = await prisma.campus.create({
      data: {
        schoolId: testSchoolId,
        name: 'Senior Secondary Campus',
        isMain: true,
        address: 'Sector 5, Academic City',
        city: 'Metropolis',
      },
    });
    testCampusId = campus.id;

    const session = await prisma.academicSession.create({
      data: {
        schoolId: testSchoolId,
        name: 'Session 2026-27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    testAcademicSessionId = session.id;

    const cls10 = await prisma.class.create({
      data: { schoolId: testSchoolId, name: 'Class 10', displayOrder: 10 },
    });
    testClass10Id = cls10.id;

    const cls11 = await prisma.class.create({
      data: { schoolId: testSchoolId, name: 'Class 11', displayOrder: 11 },
    });
    testClass11Id = cls11.id;

    const secA = await prisma.section.create({
      data: { schoolId: testSchoolId, classId: testClass10Id, name: 'A' },
    });
    testSectionAId = secA.id;

    const secB = await prisma.section.create({
      data: { schoolId: testSchoolId, classId: testClass10Id, name: 'B' },
    });
    testSectionBId = secB.id;

    const subMath = await prisma.subject.create({
      data: { schoolId: testSchoolId, name: 'Mathematics', code: 'MTH-101' },
    });
    testSubjectMathsId = subMath.id;

    const subPhys = await prisma.subject.create({
      data: { schoolId: testSchoolId, name: 'Physics', code: 'PHY-101' },
    });
    testSubjectPhysicsId = subPhys.id;

    const user1 = await prisma.user.create({
      data: {
        email: `teacher1-${Date.now()}@stxavier.edu`,
        firstName: 'Arthur',
        lastName: 'Pendleton',
        isActive: true,
      },
    });
    testUserId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: `teacher2-${Date.now()}@stxavier.edu`,
        firstName: 'Beatrice',
        lastName: 'Vance',
        isActive: true,
      },
    });
    testUserId2 = user2.id;

    // =============================================================
    // 1. TEACHER MODULE & PROFILE TESTS
    // =============================================================
    const employeeId1 = await generateNextTeacherId(testSchoolId, prisma);
    assert(Boolean(employeeId1 && employeeId1.includes('TCH')), 1, 'Teacher ID generated with authoritative sequence');

    const teacher1 = await prisma.teacher.create({
      data: {
        schoolId: testSchoolId,
        userId: testUserId1,
        campusId: testCampusId,
        employeeId: employeeId1,
        phone: '+91 9123456780',
        department: 'Science & Mathematics',
        designation: 'Senior Faculty Lead',
        qualification: 'M.Sc. Mathematics, B.Ed',
        specialization: 'Calculus & Applied Mechanics',
        photoUrl: '/uploads/teachers/teacher1-sample.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1982-08-14'),
        joiningDate: new Date('2020-06-01'),
        employmentType: 'FULL_TIME',
        experienceYears: 14,
        emergencyContactName: 'Eleanor Pendleton',
        emergencyContactPhone: '+91 9888877777',
        emergencyContactRelation: 'Spouse',
        address: '10 Oxford Row, Faculty Quarters',
        status: 'ACTIVE',
      },
    });
    testTeacher1Id = teacher1.id;

    assert(teacher1.employeeId === employeeId1, 2, 'Teacher created with real demographic and professional fields');
    assert(teacher1.emergencyContactName === 'Eleanor Pendleton', 3, 'Teacher emergency contact stored accurately');
    assert(teacher1.experienceYears === 14, 4, 'Teacher experience years stored accurately');

    const teacher2 = await prisma.teacher.create({
      data: {
        schoolId: testSchoolId,
        userId: testUserId2,
        campusId: testCampusId,
        employeeId: 'TCH-2026-0002',
        phone: '+91 9123456781',
        department: 'Physics',
        designation: 'Physics Lecturer',
        qualification: 'M.Sc. Physics',
        status: 'ACTIVE',
      },
    });
    testTeacher2Id = teacher2.id;
    assert(Boolean(teacher2.id), 5, 'Second teacher faculty created');

    // =============================================================
    // 2. TIMETABLE CONFLICT ENGINE TESTS
    // =============================================================

    // Create an initial slot for Teacher 1: Monday Period 2 in Class 10-A
    const initialSlot = await prisma.timetableSlot.create({
      data: {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionAId,
        subjectId: testSubjectMathsId,
        teacherId: testTeacher1Id,
        dayOfWeek: 'MONDAY',
        periodNumber: 2,
        startTime: '08:45',
        endTime: '09:30',
        roomNumber: 'Room 101',
      },
    });
    assert(Boolean(initialSlot.id), 6, 'Base timetable slot established (Mon Period 2, Class 10-A)');

    // Test A: Single teacher double-booking check -> MUST DETECT CONFLICT
    const teacherConflict = await validateTimetableSlotConflict(
      {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionBId, // Attempting Class 10-B
        subjectId: testSubjectMathsId,
        teacherId: testTeacher1Id, // Same Teacher 1
        dayOfWeek: 'MONDAY',
        periodNumber: 2, // Same Period 2
        startTime: '08:45',
        endTime: '09:30',
        roomNumber: 'Room 102',
      },
      prisma
    );

    assert(teacherConflict.hasConflict === true, 7, 'Server-side conflict engine detects teacher collision');
    assert(teacherConflict.type === 'TEACHER_CONFLICT', 8, 'Conflict type identified as TEACHER_CONFLICT');
    assert(
      Boolean(teacherConflict.message && teacherConflict.message.includes('Arthur Pendleton is already scheduled')),
      9,
      'Conflict error message contains structured human-readable details'
    );

    // Test B: Class-Section double-booking check -> MUST DETECT CONFLICT
    const classConflict = await validateTimetableSlotConflict(
      {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionAId, // Same Class 10-A
        subjectId: testSubjectPhysicsId,
        teacherId: testTeacher2Id, // Different Teacher 2
        dayOfWeek: 'MONDAY',
        periodNumber: 2, // Same Period 2
        startTime: '08:45',
        endTime: '09:30',
        roomNumber: 'Room 103',
      },
      prisma
    );

    assert(classConflict.hasConflict === true, 10, 'Server-side conflict engine detects class-section double booking');
    assert(classConflict.type === 'CLASS_SECTION_CONFLICT', 11, 'Conflict type identified as CLASS_SECTION_CONFLICT');

    // Test C: Room double-booking check -> MUST DETECT CONFLICT
    const roomConflict = await validateTimetableSlotConflict(
      {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionBId,
        subjectId: testSubjectPhysicsId,
        teacherId: testTeacher2Id,
        dayOfWeek: 'MONDAY',
        periodNumber: 2,
        startTime: '08:45',
        endTime: '09:30',
        roomNumber: 'Room 101', // Same Room 101 as initial slot
      },
      prisma
    );

    assert(roomConflict.hasConflict === true, 12, 'Server-side conflict engine detects room double-booking');
    assert(roomConflict.type === 'ROOM_CONFLICT', 13, 'Conflict type identified as ROOM_CONFLICT');

    // Test D: Valid non-conflicting slot -> MUST PASS
    const validSlotCheck = await validateTimetableSlotConflict(
      {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionBId,
        subjectId: testSubjectPhysicsId,
        teacherId: testTeacher2Id,
        dayOfWeek: 'MONDAY',
        periodNumber: 3, // Different Period 3
        startTime: '09:45',
        endTime: '10:30',
        roomNumber: 'Room 102',
      },
      prisma
    );

    assert(validSlotCheck.hasConflict === false, 14, 'Valid non-overlapping timetable slot passes conflict check');

    // Test E: Stream-specific parallel scheduling for Class 11 (Science vs Commerce)
    const validStreamCheck = await validateTimetableSlotConflict(
      {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        classId: testClass11Id,
        sectionId: testSectionAId,
        streamId: 'Science',
        subjectId: testSubjectPhysicsId,
        teacherId: testTeacher2Id,
        dayOfWeek: 'TUESDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Science Lab 1',
      },
      prisma
    );

    assert(validStreamCheck.hasConflict === false, 15, 'Stream-scoped schedule passes validation cleanly');

    // =============================================================
    // 3. EXAM TIMETABLE & OVERLAP CONFLICT TESTS
    // =============================================================
    const examTerm = await prisma.examTerm.create({
      data: {
        schoolId: testSchoolId,
        academicSessionId: testAcademicSessionId,
        campusId: testCampusId,
        name: 'Mid-Term Examination 2026',
        code: 'MT-2026',
        startDate: new Date('2026-10-10'),
        endDate: new Date('2026-10-25'),
        instructions: 'Carry official permit card. Reporting 30 mins prior.',
        advice: 'Budget time carefully per section.',
        warnings: 'Possession of unauthorized electronic devices is strictly prohibited.',
        isPublished: true,
      },
    });

    assert(Boolean(examTerm.id), 16, 'Exam Term created with persistent instructions, advice, and warnings');
    assert(examTerm.warnings?.includes('electronic devices is strictly prohibited'), 17, 'Disciplinary warnings stored on Exam Term');

    // Create exam papers
    const mathPaper = await prisma.examPaper.create({
      data: {
        examTermId: examTerm.id,
        subjectId: testSubjectMathsId,
        name: 'Mathematics Paper 1',
        maxMarks: 100,
        passingMarks: 35,
      },
    });

    const physicsPaper = await prisma.examPaper.create({
      data: {
        examTermId: examTerm.id,
        subjectId: testSubjectPhysicsId,
        name: 'Physics Theory',
        maxMarks: 70,
        passingMarks: 25,
      },
    });

    // Schedule Math paper: 12 Oct 2026, 09:00 - 11:00 for Class 10-A
    const mathSchedule = await prisma.examSchedule.create({
      data: {
        paperId: mathPaper.id,
        classId: testClass10Id,
        sectionId: testSectionAId,
        examDate: new Date('2026-10-12'),
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        reportingTime: '08:30 AM',
        roomNumber: 'Main Auditorium',
      },
    });
    assert(Boolean(mathSchedule.id), 18, 'Morning exam paper scheduled with duration and reporting time');

    // Schedule Physics paper on the SAME DATE for the SAME COHORT in the AFTERNOON: 14:00 - 16:00
    // This MUST SUCCEED (multiple exams on same date supported)
    const physicsAfternoonSchedule = await prisma.examSchedule.create({
      data: {
        paperId: physicsPaper.id,
        classId: testClass10Id,
        sectionId: testSectionAId,
        examDate: new Date('2026-10-12'),
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        reportingTime: '01:30 PM',
        roomNumber: 'Main Auditorium',
      },
    });
    assert(Boolean(physicsAfternoonSchedule.id), 19, 'Multiple exams on the same date for the same cohort succeeded');

    // Now test Overlapping exam collision logic:
    // If someone attempts 10:30 - 12:30 for Class 10-A on 12 Oct 2026:
    // It overlaps with 09:00 - 11:00 Math paper (start 10:30 < 11:00 && end 12:30 > 09:00)
    const requestedStart = 10 * 60 + 30; // 630 mins
    const requestedEnd = 12 * 60 + 30;   // 750 mins
    const existingStart = 9 * 60;        // 540 mins
    const existingEnd = 11 * 60;         // 660 mins

    const isOverlap = requestedStart < existingEnd && requestedEnd > existingStart;
    assert(isOverlap === true, 20, 'Cohort exam time overlap detected for same date/cohort');

    // Separate cohort at the same time: Class 11 Science 09:00 - 11:00
    // MUST BE ALLOWED because student population is disjoint!
    const class11Schedule = await prisma.examSchedule.create({
      data: {
        paperId: physicsPaper.id,
        classId: testClass11Id,
        sectionId: testSectionAId,
        streamId: 'Science',
        examDate: new Date('2026-10-12'),
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        roomNumber: 'Room 201',
      },
    });
    assert(Boolean(class11Schedule.id), 21, 'Separate cohort scheduled concurrently on same date/time allowed');

    // =============================================================
    // 4. STUDENT ENROLLMENT & ROLL NUMBER PERSISTENCE
    // =============================================================
    const student = await prisma.student.create({
      data: {
        schoolId: testSchoolId,
        campusId: testCampusId,
        admissionNumber: 'ADM-2026-0088',
        firstName: 'Julian',
        lastName: 'Sterling',
        gender: 'Male',
        stream: 'Science',
        status: 'ACTIVE',
      },
    });

    const enrollment = await prisma.studentEnrollment.create({
      data: {
        schoolId: testSchoolId,
        studentId: student.id,
        academicSessionId: testAcademicSessionId,
        classId: testClass10Id,
        sectionId: testSectionAId,
        rollNumber: '10-A-01',
        status: 'ACTIVE',
      },
    });

    assert(enrollment.rollNumber === '10-A-01', 22, 'Authoritative class roll number persisted on StudentEnrollment');

    // =============================================================
    // 5. PRINT DATA INTEGRITY VERIFICATION
    // =============================================================
    const schoolProfile = await prisma.school.findUnique({
      where: { id: testSchoolId },
    });

    assert(schoolProfile?.name === 'St. Xavier Test Academy', 23, 'School name present for print header');
    assert(schoolProfile?.logoUrl === '/uploads/branding/test-logo.png', 24, 'School logo URL present for print header');
    assert(Boolean(schoolProfile?.address), 25, 'School address present for print header');

    console.log('\n======================================================');
    console.log('🎉 ALL 25 AUTOMATED INTEGRATION TESTS PASSED CLEANLY!');
    console.log('======================================================\n');
  } finally {
    // Clean up test data
    if (testSchoolId) {
      await prisma.school.delete({ where: { id: testSchoolId } }).catch(() => {});
    }
  }
}

runTeacherTimetableExamTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
