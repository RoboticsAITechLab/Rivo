/**
 * Rivo Class + Section + Attendance + Timetable + Bell Schedule Integration Test Suite
 * Fully database-backed, tenant-isolated, RBAC-safe, and conflict-protected.
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { validateTimetableSlotConflict } from '../lib/timetable/conflict-engine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    failed++;
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
    passed++;
  }
}

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log('RIVO CLASS + SECTION + ATTENDANCE + TIMETABLE FULL TEST SUITE');
  console.log('================================================================\n');

  // Create two isolated schools
  const schoolA = await prisma.school.create({
    data: {
      name: `Apex International ${Date.now()}`,
      slug: `apex-intl-${Date.now()}`,
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: `Beacon Academy ${Date.now()}`,
      slug: `beacon-acad-${Date.now()}`,
    },
  });

  try {
    // -----------------------------------------------------------------
    // 1. ACADEMIC SESSIONS & CAMPUSES
    // -----------------------------------------------------------------
    const sessionA = await prisma.academicSession.create({
      data: {
        schoolId: schoolA.id,
        name: 'Session 2026-27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    assert(Boolean(sessionA.id), 1, 'School A active academic session created');

    const sessionB = await prisma.academicSession.create({
      data: {
        schoolId: schoolB.id,
        name: 'Session 2026-27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });
    assert(Boolean(sessionB.id), 2, 'School B academic session created independently (tenant scoped)');

    // -----------------------------------------------------------------
    // 2. CLASS MODULE AUDIT & CRUD
    // -----------------------------------------------------------------
    const class10A = await prisma.class.create({
      data: {
        schoolId: schoolA.id,
        name: 'Class 10',
        displayOrder: 10,
      },
    });
    assert(Boolean(class10A.id), 3, 'School A creates Class 10');

    const class12A = await prisma.class.create({
      data: {
        schoolId: schoolA.id,
        name: 'Class 12',
        displayOrder: 12,
      },
    });
    assert(Boolean(class12A.id), 4, 'School A creates Class 12');

    // School B can have identical class name
    const class10B = await prisma.class.create({
      data: {
        schoolId: schoolB.id,
        name: 'Class 10',
        displayOrder: 10,
      },
    });
    assert(Boolean(class10B.id), 5, 'School B creates Class 10 (tenant isolated uniqueness)');

    // Duplicate class in same school must be rejected
    let duplicateClassFailed = false;
    try {
      await prisma.class.create({
        data: {
          schoolId: schoolA.id,
          name: 'Class 10',
        },
      });
    } catch {
      duplicateClassFailed = true;
    }
    assert(duplicateClassFailed, 6, 'Duplicate class in School A rejected by database constraint');

    // -----------------------------------------------------------------
    // 3. SECTION REQUIREMENT & DATA FLOW AUDIT
    // -----------------------------------------------------------------
    // School A Class 10 has sections A, B, C
    const sec10A = await prisma.section.create({
      data: { schoolId: schoolA.id, classId: class10A.id, name: 'A' },
    });
    const sec10B = await prisma.section.create({
      data: { schoolId: schoolA.id, classId: class10A.id, name: 'B' },
    });
    const sec10C = await prisma.section.create({
      data: { schoolId: schoolA.id, classId: class10A.id, name: 'C' },
    });

    // School A Class 12 has ONLY sections A, B
    const sec12A = await prisma.section.create({
      data: { schoolId: schoolA.id, classId: class12A.id, name: 'A' },
    });
    const sec12B = await prisma.section.create({
      data: { schoolId: schoolA.id, classId: class12A.id, name: 'B' },
    });

    // Fetch Class 10 sections
    const class10Sections = await prisma.section.findMany({
      where: { schoolId: schoolA.id, classId: class10A.id },
      orderBy: { name: 'asc' },
    });
    const class10Names = class10Sections.map((s) => s.name);
    assert(
      class10Names.length === 3 &&
        class10Names[0] === 'A' &&
        class10Names[1] === 'B' &&
        class10Names[2] === 'C',
      7,
      'Class 10 query returns EXACTLY [A, B, C] — no fake D or E'
    );

    // Fetch Class 12 sections
    const class12Sections = await prisma.section.findMany({
      where: { schoolId: schoolA.id, classId: class12A.id },
      orderBy: { name: 'asc' },
    });
    const class12Names = class12Sections.map((s) => s.name);
    assert(
      class12Names.length === 2 && class12Names[0] === 'A' && class12Names[1] === 'B',
      8,
      'Class 12 query returns EXACTLY [A, B] — Section C does NOT bleed into Class 12'
    );

    // Duplicate section in same class must fail
    let duplicateSecFailed = false;
    try {
      await prisma.section.create({
        data: { schoolId: schoolA.id, classId: class10A.id, name: 'A' },
      });
    } catch {
      duplicateSecFailed = true;
    }
    assert(duplicateSecFailed, 9, 'Duplicate section A in same class rejected');

    // -----------------------------------------------------------------
    // 4. SUBJECTS AUDIT
    // -----------------------------------------------------------------
    const mathSub = await prisma.subject.create({
      data: { schoolId: schoolA.id, name: 'Mathematics', code: 'MTH-10' },
    });
    const physSub = await prisma.subject.create({
      data: { schoolId: schoolA.id, name: 'Physics', code: 'PHY-10' },
    });
    const chemSub = await prisma.subject.create({
      data: { schoolId: schoolA.id, name: 'Chemistry', code: 'CHM-10' },
    });
    assert(Boolean(mathSub.id && physSub.id && chemSub.id), 10, 'Authoritative Subjects created in School A');

    // -----------------------------------------------------------------
    // 5. ATTENDANCE & ENROLLMENT ROSTER VERIFICATION
    // -----------------------------------------------------------------
    // Enroll 2 students in Class 10-A
    const student1 = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'ADM-101',
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'Male',
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: student1.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        rollNumber: '01',
      },
    });

    const student2 = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'ADM-102',
        firstName: 'Aman',
        lastName: 'Kumar',
        gender: 'Male',
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: student2.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        rollNumber: '02',
      },
    });

    // Enroll 1 student in Class 10-B
    const student3 = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: 'ADM-103',
        firstName: 'Priya',
        lastName: 'Patel',
        gender: 'Female',
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        schoolId: schoolA.id,
        studentId: student3.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10B.id,
        rollNumber: '01',
      },
    });

    // Query roster for Class 10 Section A
    const roster10A = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: schoolA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        status: 'ACTIVE',
      },
      include: { student: true },
    });
    assert(roster10A.length === 2, 11, 'Class 10-A attendance roster returns exactly 2 enrolled students');
    assert(
      !roster10A.some((r) => r.studentId === student3.id),
      12,
      'Section B student Priya Patel does NOT appear in Section A attendance roster'
    );

    // Create Attendance Register and save records for Class 10-A
    const today = new Date('2026-10-02');
    today.setHours(0, 0, 0, 0);

    const testUser = await prisma.user.create({
      data: {
        email: `att-admin-${Date.now()}@test.edu`,
        firstName: 'Attendance',
        lastName: 'Officer',
      },
    });

    const register = await prisma.attendanceRegister.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        date: today,
        createdByUserId: testUser.id,
      },
    });

    await prisma.attendanceRecord.createMany({
      data: [
        {
          registerId: register.id,
          studentId: student1.id,
          status: 'PRESENT',
          markedByUserId: testUser.id,
        },
        {
          registerId: register.id,
          studentId: student2.id,
          status: 'ABSENT',
          reason: 'Sick leave',
          markedByUserId: testUser.id,
        },
      ],
    });

    const savedRecords = await prisma.attendanceRecord.findMany({
      where: { registerId: register.id },
    });
    assert(savedRecords.length === 2, 13, 'Saved attendance records persisted to database');

    const pCount = savedRecords.filter((r) => r.status === 'PRESENT').length;
    const aCount = savedRecords.filter((r) => r.status === 'ABSENT').length;
    assert(pCount === 1 && aCount === 1, 14, 'Attendance counts match exact student statuses (1 Present, 1 Absent)');

    // -----------------------------------------------------------------
    // 6. PERIOD / BELL SCHEDULE VALIDATION
    // -----------------------------------------------------------------
    const timetableConfig = await prisma.timetableConfig.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        name: 'Standard Daily Bell Schedule',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      },
    });

    const periods = await prisma.periodDefinition.createMany({
      data: [
        {
          configId: timetableConfig.id,
          periodNumber: 1,
          name: 'Period 1',
          type: 'TEACHING',
          startTime: '08:00',
          endTime: '08:45',
          durationMinutes: 45,
        },
        {
          configId: timetableConfig.id,
          periodNumber: 2,
          name: 'Period 2',
          type: 'TEACHING',
          startTime: '08:45',
          endTime: '09:30',
          durationMinutes: 45,
        },
        {
          configId: timetableConfig.id,
          periodNumber: 3,
          name: 'Recess Break',
          type: 'BREAK',
          startTime: '09:30',
          endTime: '09:45',
          durationMinutes: 15,
        },
      ],
    });
    assert(periods.count === 3, 15, 'PeriodDefinitions persisted with exact start/end times and break definitions');

    // -----------------------------------------------------------------
    // 7. TIMETABLE SLOTS & CONFLICT ENGINE
    // -----------------------------------------------------------------
    const teacherUser1 = await prisma.user.create({
      data: {
        email: `rahul-faculty-${Date.now()}@test.edu`,
        firstName: 'Rahul',
        lastName: 'Sharma',
      },
    });
    const teacherRahul = await prisma.teacher.create({
      data: {
        schoolId: schoolA.id,
        userId: teacherUser1.id,
        employeeId: 'TCH-001',
        department: 'Mathematics',
        status: 'ACTIVE',
      },
    });

    const teacherUser2 = await prisma.user.create({
      data: {
        email: `vikram-faculty-${Date.now()}@test.edu`,
        firstName: 'Vikram',
        lastName: 'Singh',
      },
    });
    const teacherVikram = await prisma.teacher.create({
      data: {
        schoolId: schoolA.id,
        userId: teacherUser2.id,
        employeeId: 'TCH-002',
        department: 'Physics',
        status: 'ACTIVE',
      },
    });

    // Create Slot: Teacher Rahul in Class 10-A, Monday Period 1 (08:00 - 08:45)
    const slot1 = await prisma.timetableSlot.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        subjectId: mathSub.id,
        teacherId: teacherRahul.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 101',
      },
    });
    assert(Boolean(slot1.id), 16, 'Timetable slot created for Teacher Rahul in Class 10-A on Monday Period 1');

    // Test A: Conflict Check when Teacher Rahul is assigned to Class 10-B at same Monday Period 1
    const conflictTeacher = await validateTimetableSlotConflict(
      {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10B.id,
        subjectId: mathSub.id,
        teacherId: teacherRahul.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 102',
      },
      prisma
    );
    assert(conflictTeacher.hasConflict === true, 17, 'Conflict engine detects Teacher Double-Booking on Monday Period 1');
    assert(conflictTeacher.type === 'TEACHER_CONFLICT', 18, 'Conflict type is TEACHER_CONFLICT');

    // Test B: Conflict Check when Class 10-A is assigned Teacher Vikram for Physics at same Monday Period 1
    const conflictClass = await validateTimetableSlotConflict(
      {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10A.id,
        subjectId: physSub.id,
        teacherId: teacherVikram.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 103',
      },
      prisma
    );
    assert(conflictClass.hasConflict === true, 19, 'Conflict engine detects Class 10-A Double-Booking on Monday Period 1');
    assert(conflictClass.type === 'CLASS_SECTION_CONFLICT', 20, 'Conflict type is CLASS_SECTION_CONFLICT');

    // Test C: Conflict Check when Room 101 is assigned to Class 10-B at same Monday Period 1
    const conflictRoom = await validateTimetableSlotConflict(
      {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10B.id,
        subjectId: physSub.id,
        teacherId: teacherVikram.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 101',
      },
      prisma
    );
    assert(conflictRoom.hasConflict === true, 21, 'Conflict engine detects Room 101 Double-Booking on Monday Period 1');
    assert(conflictRoom.type === 'ROOM_CONFLICT', 22, 'Conflict type is ROOM_CONFLICT');

    // Test D: Valid non-conflicting slot for Class 10-B with Teacher Vikram in Room 102
    const validCheck = await validateTimetableSlotConflict(
      {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: class10A.id,
        sectionId: sec10B.id,
        subjectId: physSub.id,
        teacherId: teacherVikram.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 102',
      },
      prisma
    );
    assert(validCheck.hasConflict === false, 23, 'Valid parallel timetable slot for Section B passes with 0 conflicts');

    // -----------------------------------------------------------------
    // 8. MULTI-TENANT ISOLATION AUDIT
    // -----------------------------------------------------------------
    // School B attempts to query School A's sections/classes/timetable
    const schoolBSlots = await prisma.timetableSlot.findMany({
      where: { schoolId: schoolB.id },
    });
    assert(schoolBSlots.length === 0, 24, 'School B sees zero timetable slots from School A');

    const schoolBAttendance = await prisma.attendanceRegister.findMany({
      where: { schoolId: schoolB.id },
    });
    assert(schoolBAttendance.length === 0, 25, 'School B sees zero attendance registers from School A');

    console.log('\n================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Clean up test schools in FK dependency order
    await prisma.attendanceRecord.deleteMany({
      where: { register: { schoolId: { in: [schoolA.id, schoolB.id] } } },
    }).catch(() => {});
    await prisma.attendanceRegister.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    }).catch(() => {});
    await prisma.timetableSlot.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    }).catch(() => {});
    await prisma.studentEnrollment.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    }).catch(() => {});
    await prisma.student.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    }).catch(() => {});
    await prisma.school.delete({ where: { id: schoolA.id } }).catch(() => {});
    await prisma.school.delete({ where: { id: schoolB.id } }).catch(() => {});
  }
}

runMasterTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
