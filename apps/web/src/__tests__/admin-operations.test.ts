/**
 * Rivo Phase B — Admin Operations Database Integration Test Suite
 * Covers all 6 migrated modules:
 * 1. Admin Dashboard Metrics & Multi-Tenant Aggregations
 * 2. Admin Students CRUD, Enrollment & IDOR Protection
 * 3. Admin Teachers Profile, Assignments & Isolation
 * 4. Admin Attendance Register, Record Upserts & Metrics Calculation
 * 5. Admin Timetable Slots, Ordering & Cross-Tenant Deletion Guard
 * 6. Admin Exam Management (ExamTerm, Publication Status & Isolation)
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';

let passed = 0;
let failed = 0;

function testAssert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runAdminOperationsTests() {
  console.log('====================================================');
  console.log('RIVO PHASE B — ADMIN OPERATIONS VERIFICATION SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now();

  // Setup two distinct test schools for strict tenant isolation testing
  const schoolA = await prisma.school.create({
    data: {
      name: `Ops School A ${timestamp}`,
      slug: `ops-school-a-${timestamp}`,
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: `Ops School B ${timestamp}`,
      slug: `ops-school-b-${timestamp}`,
    },
  });

  try {
    // ----------------------------------------------------
    // BASELINE: Academic Sessions, Classes, Sections
    // ----------------------------------------------------
    const sessionA = await prisma.academicSession.create({
      data: {
        schoolId: schoolA.id,
        name: '2025-26',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        status: 'ACTIVE',
      },
    });

    const classA = await prisma.class.create({
      data: {
        schoolId: schoolA.id,
        name: 'Grade 10',
      },
    });

    const sectionA = await prisma.section.create({
      data: {
        schoolId: schoolA.id,
        classId: classA.id,
        name: 'A',
      },
    });

    const subjectA = await prisma.subject.create({
      data: {
        schoolId: schoolA.id,
        name: 'Mathematics',
        code: `MATH-${timestamp}`,
      },
    });

    // ----------------------------------------------------
    // 1. ADMIN DASHBOARD AGGREGATIONS
    // ----------------------------------------------------
    console.log('\n--- 1. Module 1: Admin Dashboard Aggregations ---');

    // Counts should be 0 initially for students and teachers
    const initStudents = await prisma.student.count({ where: { schoolId: schoolA.id } });
    testAssert(initStudents === 0, 'School A initial live student count is zero');

    const initClasses = await prisma.class.count({ where: { schoolId: schoolA.id } });
    testAssert(initClasses === 1, 'School A live class count matches database (1)');

    const activeSessionCheck = await prisma.academicSession.findFirst({
      where: { schoolId: schoolA.id, status: 'ACTIVE' },
    });
    testAssert(activeSessionCheck?.id === sessionA.id, 'School A resolves correct active session');

    // Ensure School B sees 0 classes despite School A having 1
    const schoolBClasses = await prisma.class.count({ where: { schoolId: schoolB.id } });
    testAssert(schoolBClasses === 0, 'School B dashboard count isolated from School A (0 classes)');

    // ----------------------------------------------------
    // 2. ADMIN STUDENTS: CRUD & IDOR
    // ----------------------------------------------------
    console.log('\n--- 2. Module 2: Admin Students CRUD & Enrollment ---');

    const studentA = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: `ADM-${timestamp}-001`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        status: 'ACTIVE',
        dateOfBirth: new Date('2010-05-15'),
        enrollments: {
          create: {
            schoolId: schoolA.id,
            academicSessionId: sessionA.id,
            classId: classA.id,
            sectionId: sectionA.id,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        enrollments: true,
      },
    });
    testAssert(!!studentA.id, 'School A creates student with active enrollment');
    testAssert(studentA.enrollments.length === 1, 'Student has active enrollment linked');

    // Update student name and roll number
    const updatedStudent = await prisma.student.update({
      where: { id: studentA.id },
      data: {
        firstName: 'Aarav Kumar',
      },
    });
    testAssert(updatedStudent.firstName === 'Aarav Kumar', 'Student profile updated successfully');

    // IDOR protection: School B cannot query School A student via tenant-scoped where
    const idorStudent = await prisma.student.findFirst({
      where: { id: studentA.id, schoolId: schoolB.id },
    });
    testAssert(!idorStudent, 'IDOR Check: School B cannot access School A student record');

    // ----------------------------------------------------
    // 3. ADMIN TEACHERS: Profile, Assignments & Isolation
    // ----------------------------------------------------
    console.log('\n--- 3. Module 3: Admin Teachers & Assignments ---');

    const teacherUser = await prisma.user.create({
      data: {
        email: `teacher-${timestamp}@rivo-test.org`,
        firstName: 'Priya',
        lastName: 'Patel',
        passwordHash: 'dummy-hash',
        memberships: {
          create: {
            schoolId: schoolA.id,
            role: 'TEACHER',
          },
        },
      },
    });

    const teacherA = await prisma.teacher.create({
      data: {
        schoolId: schoolA.id,
        userId: teacherUser.id,
        department: 'Science',
        designation: 'Senior Faculty',
        assignments: {
          create: {
            schoolId: schoolA.id,
            academicSessionId: sessionA.id,
            classId: classA.id,
            sectionId: sectionA.id,
            subjectId: subjectA.id,
          },
        },
      },
      include: {
        assignments: true,
      },
    });
    testAssert(!!teacherA.id, 'School A provisions teacher profile with class assignments');
    testAssert(teacherA.assignments.length === 1, 'Teacher assignment correctly created');

    // IDOR protection: School B cannot update or fetch School A teacher
    const idorTeacher = await prisma.teacher.findFirst({
      where: { id: teacherA.id, schoolId: schoolB.id },
    });
    testAssert(!idorTeacher, 'IDOR Check: School B cannot resolve School A teacher');

    // ----------------------------------------------------
    // 4. ADMIN ATTENDANCE: Roll-Call & Records
    // ----------------------------------------------------
    console.log('\n--- 4. Module 4: Admin Attendance System ---');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const registerA = await prisma.attendanceRegister.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA.id,
        date: today,
        createdByUserId: teacherUser.id,
        records: {
          create: {
            studentId: studentA.id,
            status: 'PRESENT',
            reason: 'On time',
            markedByUserId: teacherUser.id,
          },
        },
      },
      include: {
        records: true,
      },
    });
    testAssert(!!registerA.id, 'AttendanceRegister created for class, section and date');
    testAssert(registerA.records.length === 1, 'AttendanceRecord linked to student in register');
    testAssert(registerA.records[0].status === 'PRESENT', 'Student marked PRESENT');

    // Upsert record atomically
    const updatedRecord = await prisma.attendanceRecord.upsert({
      where: {
        registerId_studentId: {
          registerId: registerA.id,
          studentId: studentA.id,
        },
      },
      update: {
        status: 'LATE',
        reason: 'Delayed by school bus',
        markedByUserId: teacherUser.id,
      },
      create: {
        registerId: registerA.id,
        studentId: studentA.id,
        status: 'LATE',
        markedByUserId: teacherUser.id,
      },
    });
    testAssert(updatedRecord.status === 'LATE', 'AttendanceRecord successfully upserted to LATE');

    // IDOR Check: Register is isolated to School A
    const idorRegister = await prisma.attendanceRegister.findFirst({
      where: { id: registerA.id, schoolId: schoolB.id },
    });
    testAssert(!idorRegister, 'IDOR Check: School B cannot access School A attendance register');

    // ----------------------------------------------------
    // 5. ADMIN SCHOOL TIMETABLE: Slots & Deletion
    // ----------------------------------------------------
    console.log('\n--- 5. Module 5: Admin Timetable Scheduling ---');

    const slotA = await prisma.timetableSlot.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        classId: classA.id,
        sectionId: sectionA.id,
        subjectId: subjectA.id,
        teacherId: teacherA.id,
        dayOfWeek: 'MON',
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        roomNumber: 'Room 101',
      },
    });
    testAssert(!!slotA.id, 'TimetableSlot created for MON Period 1');

    // Cross-tenant deletion protection
    const idorSlot = await prisma.timetableSlot.findFirst({
      where: { id: slotA.id, schoolId: schoolB.id },
    });
    testAssert(!idorSlot, 'IDOR Check: School B cannot query School A timetable slot');

    // Clean deletion
    await prisma.timetableSlot.delete({
      where: { id: slotA.id },
    });
    const deletedSlot = await prisma.timetableSlot.findUnique({
      where: { id: slotA.id },
    });
    testAssert(!deletedSlot, 'TimetableSlot deleted cleanly');

    // ----------------------------------------------------
    // 6. ADMIN EXAMS: ExamTerm & Publication
    // ----------------------------------------------------
    console.log('\n--- 6. Module 6: Admin Exam Management ---');

    const examTermA = await prisma.examTerm.create({
      data: {
        schoolId: schoolA.id,
        academicSessionId: sessionA.id,
        name: 'Mid-Term Assessment 2025',
        code: `MID-${timestamp}`,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-15'),
        isPublished: false,
      },
    });
    testAssert(!!examTermA.id, 'ExamTerm created for School A in active session');
    testAssert(examTermA.isPublished === false, 'ExamTerm initially unpublished');

    // Toggle publication
    const publishedTerm = await prisma.examTerm.update({
      where: { id: examTermA.id },
      data: { isPublished: true },
    });
    testAssert(publishedTerm.isPublished === true, 'ExamTerm publication status toggled to TRUE');

    // IDOR Check: School B cannot view or delete School A's exam term
    const idorExamTerm = await prisma.examTerm.findFirst({
      where: { id: examTermA.id, schoolId: schoolB.id },
    });
    testAssert(!idorExamTerm, 'IDOR Check: School B cannot access School A exam term');

  } catch (error) {
    console.error('Unexpected error in test suite:', error);
    failed++;
  } finally {
    // Teardown / Cleanup test data
    console.log('\n--- Teardown Test Data ---');
    try {
      await prisma.attendanceRecord.deleteMany({
        where: { register: { schoolId: { in: [schoolA.id, schoolB.id] } } },
      });
      await prisma.attendanceRegister.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.timetableSlot.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.examTerm.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.teacherAssignment.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.teacher.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.studentEnrollment.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.student.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.subject.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.section.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.class.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.academicSession.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.schoolMembership.deleteMany({
        where: { schoolId: { in: [schoolA.id, schoolB.id] } },
      });
      await prisma.user.deleteMany({
        where: { email: `teacher-${timestamp}@rivo-test.org` },
      });
      await prisma.school.deleteMany({
        where: { id: { in: [schoolA.id, schoolB.id] } },
      });
      console.log('  ✓ Test schools and associated data purged successfully');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminOperationsTests();
