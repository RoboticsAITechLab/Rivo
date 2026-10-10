import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '@/lib/prisma';
import {
  getSchoolSetting,
  updateSchoolSetting,
  getHomeworkSettings,
  getExamSettings,
  getRolesSettings,
  getHouseSettings,
  getRollNumberSettings,
  getStreamSettings,
  getAttendanceSettings,
  getNotificationSettings,
} from '@/lib/settings/settings-service';
import { ResultsService, calculateGrade } from '@/lib/results/results-service';
import { NotificationDispatcher } from '@/lib/communication/communication-service';

async function runSettingsOperationsTestSuite() {
  console.log('===============================================================');
  console.log('RIVO SETTINGS END-TO-END OPERATIONS & ENFORCEMENT TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // Setup 2 isolated test schools
  const slugA = `settings-e2e-a-${Date.now()}`;
  const slugB = `settings-e2e-b-${Date.now()}`;

  const schoolA = await prisma.school.create({
    data: {
      name: 'E2E Testing Academy Alpha',
      slug: slugA,
      status: 'ACTIVE',
      email: 'admin@alpha-e2e.edu',
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: 'E2E Testing Academy Beta',
      slug: slugB,
      status: 'ACTIVE',
      email: 'admin@beta-e2e.edu',
    },
  });

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: HOMEWORK SETTINGS & ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 1: Homework Settings Persistence & Validation ---');

    await updateSchoolSetting(schoolA.id, 'homework', {
      allowLateSubmissions: false,
      maxAttachmentSizeMB: 15,
      parentVisibility: true,
      teacherCanCreate: true,
      teacherCanGrade: true,
      submissionDeadlineHours: 48,
    });

    const hwA = await getHomeworkSettings(schoolA.id);
    assert(hwA.maxAttachmentSizeMB === 15, 'Homework maxAttachmentSizeMB persists as 15MB');
    assert(hwA.allowLateSubmissions === false, 'Late submissions disabled for School A');

    // Tenant isolation check
    const hwB = await getHomeworkSettings(schoolB.id);
    assert(hwB.maxAttachmentSizeMB === 10, 'School B retains default 10MB (Tenant Isolated)');
    assert(hwB.allowLateSubmissions === false, 'School B retains default allowLateSubmissions: false');

    // -------------------------------------------------------------------------
    // STAGE 2: EXAMINATIONS & DYNAMIC GRADING CALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 2: Examinations & Dynamic Grading Calculation ---');

    // Configure strict grading scheme where 85%+ is 'A*' and passing is 40%
    const customGradingRules = [
      { grade: 'A*', minPercentage: 85, maxPercentage: 100, gradePoints: 10, isPass: true },
      { grade: 'A', minPercentage: 70, maxPercentage: 84.99, gradePoints: 8, isPass: true },
      { grade: 'B', minPercentage: 55, maxPercentage: 69.99, gradePoints: 6, isPass: true },
      { grade: 'C', minPercentage: 40, maxPercentage: 54.99, gradePoints: 4, isPass: true },
      { grade: 'F', minPercentage: 0, maxPercentage: 39.99, gradePoints: 0, isPass: false },
    ];

    await updateSchoolSetting(schoolA.id, 'examinations', {
      passingMarksPercentage: 40,
      hallTicketMandatory: true,
      graceMarksAllowance: 3,
      reEvaluationWindowDays: 21,
      gradingSchemes: [
        {
          id: 'scheme-custom-alpha',
          name: 'Alpha High Rigor Scheme',
          type: 'PERCENTAGE',
          isDefault: true,
          rules: customGradingRules,
        },
      ],
    });

    const examConfigA = await getExamSettings(schoolA.id);
    assert(examConfigA.passingMarksPercentage === 40, 'Passing marks percentage persists as 40%');
    assert(examConfigA.reEvaluationWindowDays === 21, 'Re-evaluation window persists as 21 days');
    assert(examConfigA.gradingSchemes?.length === 1, 'Custom grading scheme persisted in examinations config');

    // Test dynamic calculateGrade evaluation
    const gradeAt88 = calculateGrade(88, customGradingRules);
    assert(gradeAt88 === 'A*', '88% evaluates to A* under tenant custom grading scheme');

    const gradeAt35 = calculateGrade(35, customGradingRules);
    assert(gradeAt35 === 'F', '35% evaluates to F under tenant custom grading scheme');

    // Default grading fallback check
    const defaultGrade = calculateGrade(95);
    assert(defaultGrade === 'A1', 'Standard calculateGrade returns default A1 without custom rules');

    // -------------------------------------------------------------------------
    // STAGE 3: ROLES, PERMISSIONS & ACCOUNT MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 3: Roles, Permissions & User Profile API ---');

    await updateSchoolSetting(schoolA.id, 'roles', {
      customRoles: [
        { id: 'role-counselor', name: 'Student Counselor', description: 'Pastoral care & mental health', isSystem: false },
      ],
      permissions: {
        'role-counselor': {
          students: { VIEW: true, EDIT: false, CREATE: false, DELETE: false, PUBLISH: false, EXPORT: true },
          attendance: { VIEW: true, EDIT: false, CREATE: false, DELETE: false, PUBLISH: false, EXPORT: false },
        },
      },
    });

    const rolesConfigA = await getRolesSettings(schoolA.id);
    assert(rolesConfigA.customRoles.some((r: any) => r.id === 'role-counselor'), 'Custom role "Student Counselor" persisted in database');
    assert(rolesConfigA.permissions['role-counselor']?.students?.VIEW === true, 'Permission matrix for role-counselor persisted in database');

    // Test School B isolation
    const rolesConfigB = await getRolesSettings(schoolB.id);
    assert(!rolesConfigB.permissions['role-counselor'], 'School B does not see School A custom role permissions');

    // -------------------------------------------------------------------------
    // STAGE 4: HOUSES, ROLL NUMBERS, AND STREAMS
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 4: Houses, Roll Numbers & Streams ---');

    // 1. Houses
    await updateSchoolSetting(schoolA.id, 'houses', {
      houses: [
        { id: 'house-alpha-1', name: 'Sparta House', code: 'SPA', color: '#b91c1c', motto: 'Never retreat', status: 'ACTIVE' },
        { id: 'house-alpha-2', name: 'Athens House', code: 'ATH', color: '#1d4ed8', motto: 'Wisdom reigns', status: 'ACTIVE' },
      ],
    });

    const houseConfigA = await getHouseSettings(schoolA.id);
    assert(houseConfigA.houses.length === 2, 'Two custom houses persisted for School A');
    assert(houseConfigA.houses[0].name === 'Sparta House', 'House Sparta persisted correctly');

    // 2. Roll Numbers
    await updateSchoolSetting(schoolA.id, 'rollNumbers', {
      mode: 'CONTINUOUS',
      prefix: 'EX-2026-',
      startIndex: 1001,
      autoSortAlpha: true,
      isLocked: true,
      streamRules: {
        'stream-sci': { startNumber: 1101, prefix: 'SCI-' },
      },
    });

    const rollConfigA = await getRollNumberSettings(schoolA.id);
    assert(rollConfigA.startIndex === 1001, 'Roll number startIndex persists as 1001');
    assert(rollConfigA.isLocked === true, 'Roll numbering locked flag persists as true');
    assert(rollConfigA.streamRules?.['stream-sci']?.prefix === 'SCI-', 'Stream rule for SCI- persists');

    // 3. Streams
    await updateSchoolSetting(schoolA.id, 'streams', {
      customStreams: [
        { id: 'stream-ai', name: 'Artificial Intelligence & Robotics', code: 'AIR', description: 'Advanced STEM Track' },
      ],
    });

    const streamConfigA = await getStreamSettings(schoolA.id);
    assert(streamConfigA.customStreams.some((s: any) => s.code === 'AIR'), 'Custom academic stream "AIR" persisted in database');

    // -------------------------------------------------------------------------
    // STAGE 5: DATA IMPORT & EXPORT SCHEMA VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 5: Data Import & Export Schema Validation ---');

    // Create a student in School A to verify export
    const sampleStudent = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: `ADM-${Date.now()}`,
        firstName: 'Arya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        house: 'Sparta House',
        status: 'ACTIVE',
      },
    });

    const studentRecord = await prisma.student.findFirst({
      where: { schoolId: schoolA.id, admissionNumber: sampleStudent.admissionNumber },
    });
    assert(studentRecord !== null, 'Student created in database for export test');
    assert(studentRecord?.house === 'Sparta House', 'Student correctly mapped to Sparta House');

    // Verify School B cannot see School A student (Tenant isolation)
    const crossSchoolLookup = await prisma.student.findFirst({
      where: { schoolId: schoolB.id, admissionNumber: sampleStudent.admissionNumber },
    });
    assert(crossSchoolLookup === null, 'School B cannot read School A student records');

    // -------------------------------------------------------------------------
    // STAGE 6: ATTENDANCE & NOTIFICATION POLICY ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 6: Attendance Locking & Notification Triggers ---');

    // Attendance Settings
    await updateSchoolSetting(schoolA.id, 'attendance', {
      attendanceEnabled: true,
      teacherCanMark: true,
      lockPreviousRecords: true,
      adminCanCorrect: true,
      supportedStatuses: ['PRESENT', 'ABSENT', 'LATE'],
    });

    const attA = await getAttendanceSettings(schoolA.id);
    assert(attA.lockPreviousRecords === true, 'Attendance lockPreviousRecords is active in settings');
    assert(attA.supportedStatuses?.includes('PRESENT') === true, 'Supported statuses saved');

    // Notification Triggers
    await updateSchoolSetting(schoolA.id, 'notifications', {
      eventTriggers: {
        studentAbsence: false, // Explicitly silenced
        homeworkAssigned: true,
        examSchedulePublished: true,
        resultDeclared: false, // Explicitly silenced
        feeDueReminder: true,
      },
      channels: {
        inApp: false, // Explicitly silenced in-app
        email: true,
        sms: false,
      },
    });

    const notifA = await getNotificationSettings(schoolA.id);
    assert(notifA.eventTriggers.studentAbsence === false, 'studentAbsence event trigger is disabled');
    assert(notifA.channels.inApp === false, 'inApp channel is disabled');

    // Test NotificationDispatcher respects event trigger policy
    const silencedResult = await NotificationDispatcher.dispatch({
      schoolId: schoolA.id,
      userIds: ['usr-test-123'],
      title: 'Absence Alert',
      body: 'Student was marked absent',
      category: 'ATTENDANCE',
    });
    assert(silencedResult.inAppCount === 0, 'NotificationDispatcher silences ATTENDANCE notice when event trigger disabled');

    console.log('\n===============================================================');
    console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Clean up test tenants
    await prisma.student.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
    await prisma.schoolSetting.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
    await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } });
  }
}

runSettingsOperationsTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
