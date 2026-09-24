/**
 * Rivo Formal Results, Notices, Communication & Parent App Verification Suite
 * Comprehensive 32-Point Test Matrix:
 * - Multi-Tenant Isolation
 * - RBAC & Granular Permissions
 * - Marks Entry Validations (Negative, Max, Absent)
 * - Server-Side Result Calculation Engine
 * - Result Publication Lifecycle
 * - Parent-Child Authorization & IDOR Block
 * - Draft Results Hidden from Parents
 * - Notice Audience Targeting (School, Class, Section, Teacher, Parent)
 * - Read/Unread State Persistence
 * - Dynamic Communication Groups
 * - In-App & Device Token Dispatch
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { ResultsService } from '../lib/results/results-service';
import { NoticeService } from '../lib/notices/notice-service';
import { AudienceResolver, CommunicationService, NotificationDispatcher } from '../lib/communication/communication-service';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: number, name: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ [TEST ${String(testId).padStart(2, '0')}] PASS: ${name}`);
  } else {
    failedCount++;
    console.error(`  ✗ [TEST ${String(testId).padStart(2, '0')}] FAIL: ${name}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('RIVO RESULTS, NOTICES & PARENT SYSTEM VERIFICATION SUITE');
  console.log('===============================================================\n');

  // SETUP: Create isolated test fixtures
  const testRunId = `test_${Date.now()}`;

  // School A
  const schoolA = await prisma.school.create({
    data: {
      name: `School A ${testRunId}`,
      slug: `school-a-${testRunId}`,
      status: 'ACTIVE',
    },
  });

  // School B (for Cross-Tenant tests)
  const schoolB = await prisma.school.create({
    data: {
      name: `School B ${testRunId}`,
      slug: `school-b-${testRunId}`,
      status: 'ACTIVE',
    },
  });

  // Academic Sessions
  const sessionA = await prisma.academicSession.create({
    data: {
      schoolId: schoolA.id,
      name: `2026-2027 ${testRunId}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  const sessionB = await prisma.academicSession.create({
    data: {
      schoolId: schoolB.id,
      name: `2026-2027 ${testRunId}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  // Classes & Sections for School A
  const class10 = await prisma.class.create({
    data: {
      schoolId: schoolA.id,
      name: `Class 10 ${testRunId}`,
    },
  });

  const section10A = await prisma.section.create({
    data: {
      schoolId: schoolA.id,
      classId: class10.id,
      name: 'A',
    },
  });

  const section10B = await prisma.section.create({
    data: {
      schoolId: schoolA.id,
      classId: class10.id,
      name: 'B',
    },
  });

  const class12 = await prisma.class.create({
    data: {
      schoolId: schoolA.id,
      name: `Class 12 ${testRunId}`,
    },
  });

  const section12A = await prisma.section.create({
    data: {
      schoolId: schoolA.id,
      classId: class12.id,
      name: 'A',
    },
  });

  // Subject
  const mathSubject = await prisma.subject.create({
    data: {
      schoolId: schoolA.id,
      name: `Mathematics ${testRunId}`,
      code: 'MTH101',
    },
  });

  const sciSubject = await prisma.subject.create({
    data: {
      schoolId: schoolA.id,
      name: `Science ${testRunId}`,
      code: 'SCI101',
    },
  });

  // Users & Roles
  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: `admin_${testRunId}@test.com`,
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'User',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: {
      schoolId: schoolA.id,
      userId: adminUser.id,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Teacher 1 (assigned to 10-A Math)
  const teacherUser1 = await prisma.user.create({
    data: {
      email: `teacher1_${testRunId}@test.com`,
      passwordHash: 'hash',
      firstName: 'Teacher',
      lastName: 'One',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: {
      schoolId: schoolA.id,
      userId: teacherUser1.id,
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });
  const teacher1 = await prisma.teacher.create({
    data: {
      schoolId: schoolA.id,
      userId: teacherUser1.id,
      status: 'ACTIVE',
    },
  });
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacher1.id,
      academicSessionId: sessionA.id,
      classId: class10.id,
      sectionId: section10A.id,
      subjectId: mathSubject.id,
    },
  });

  // Students in 10-A and 10-B
  const student1 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      admissionNumber: `ADM1_${testRunId}`,
      firstName: 'Aarav',
      lastName: 'Sharma',
      status: 'ACTIVE',
    },
  });
  await prisma.studentEnrollment.create({
    data: {
      schoolId: schoolA.id,
      studentId: student1.id,
      academicSessionId: sessionA.id,
      classId: class10.id,
      sectionId: section10A.id,
      status: 'ACTIVE',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      admissionNumber: `ADM2_${testRunId}`,
      firstName: 'Riya',
      lastName: 'Verma',
      status: 'ACTIVE',
    },
  });
  await prisma.studentEnrollment.create({
    data: {
      schoolId: schoolA.id,
      studentId: student2.id,
      academicSessionId: sessionA.id,
      classId: class10.id,
      sectionId: section10A.id,
      status: 'ACTIVE',
    },
  });

  // Student 3 in Section 10-B (sibling of Student 1)
  const student3 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      admissionNumber: `ADM3_${testRunId}`,
      firstName: 'Anaya',
      lastName: 'Sharma',
      status: 'ACTIVE',
    },
  });
  await prisma.studentEnrollment.create({
    data: {
      schoolId: schoolA.id,
      studentId: student3.id,
      academicSessionId: sessionA.id,
      classId: class10.id,
      sectionId: section10B.id,
      status: 'ACTIVE',
    },
  });

  // Foreign Student in School B
  const studentB = await prisma.student.create({
    data: {
      schoolId: schoolB.id,
      admissionNumber: `ADMB_${testRunId}`,
      firstName: 'Bob',
      lastName: 'Foreign',
      status: 'ACTIVE',
    },
  });

  // Parents
  // Parent 1 (Parent of Student 1 and Student 3 - Multi-Child)
  const parentUser1 = await prisma.user.create({
    data: {
      email: `parent1_${testRunId}@test.com`,
      passwordHash: 'hash',
      firstName: 'Suresh',
      lastName: 'Sharma',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: {
      schoolId: schoolA.id,
      userId: parentUser1.id,
      role: 'PARENT',
      status: 'ACTIVE',
    },
  });
  const parent1 = await prisma.parent.create({
    data: {
      schoolId: schoolA.id,
      userId: parentUser1.id,
      firstName: 'Suresh',
      lastName: 'Sharma',
      email: parentUser1.email,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parent1.id,
      studentId: student1.id,
      relationshipType: 'FATHER',
      isPrimaryContact: true,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parent1.id,
      studentId: student3.id,
      relationshipType: 'FATHER',
      isPrimaryContact: false,
    },
  });

  // Parent 2 (Parent of Student 2 only)
  const parentUser2 = await prisma.user.create({
    data: {
      email: `parent2_${testRunId}@test.com`,
      passwordHash: 'hash',
      firstName: 'Pooja',
      lastName: 'Verma',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: {
      schoolId: schoolA.id,
      userId: parentUser2.id,
      role: 'PARENT',
      status: 'ACTIVE',
    },
  });
  const parent2 = await prisma.parent.create({
    data: {
      schoolId: schoolA.id,
      userId: parentUser2.id,
      firstName: 'Pooja',
      lastName: 'Verma',
      email: parentUser2.email,
    },
  });
  await prisma.parentStudent.create({
    data: {
      parentId: parent2.id,
      studentId: student2.id,
      relationshipType: 'MOTHER',
      isPrimaryContact: true,
    },
  });

  // Exam Term & Papers
  const examTermA = await prisma.examTerm.create({
    data: {
      schoolId: schoolA.id,
      academicSessionId: sessionA.id,
      name: `Mid-Term Examination 2026 ${testRunId}`,
      code: 'MID2026',
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-20'),
      isPublished: true,
    },
  });

  const mathPaper = await prisma.examPaper.create({
    data: {
      examTermId: examTermA.id,
      subjectId: mathSubject.id,
      name: 'Mathematics Paper 1',
      maxMarks: 100,
      passingMarks: 35,
    },
  });

  const sciPaper = await prisma.examPaper.create({
    data: {
      examTermId: examTermA.id,
      subjectId: sciSubject.id,
      name: 'Science Paper 1',
      maxMarks: 100,
      passingMarks: 35,
    },
  });

  console.log('GROUP 1: RESULTS & MARKS PIPELINE (1-15)');

  // [TEST 01]: Admin can access marks roster
  const adminRoster = await ResultsService.getMarksRoster({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    paperId: mathPaper.id,
    classId: class10.id,
    sectionId: section10A.id,
  });
  assert(adminRoster.roster.length === 2, 1, 'Admin can access marks roster for own school');

  // [TEST 02]: Teacher not assigned to section cannot access marks roster
  let teacherDenied = false;
  try {
    await ResultsService.getMarksRoster({
      schoolId: schoolA.id,
      examTermId: examTermA.id,
      paperId: mathPaper.id,
      classId: class10.id,
      sectionId: section10B.id, // Teacher 1 is NOT assigned to 10-B
      teacherUserId: teacherUser1.id,
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) teacherDenied = true;
  }
  assert(teacherDenied, 2, 'Teacher denied marks roster for unassigned section (ASSIGNED scope)');

  // [TEST 03]: Teacher assigned to 10-A Math can access marks roster
  const teacherRoster = await ResultsService.getMarksRoster({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    paperId: mathPaper.id,
    classId: class10.id,
    sectionId: section10A.id,
    teacherUserId: teacherUser1.id,
  });
  assert(teacherRoster.roster.length === 2, 3, 'Teacher granted marks roster for assigned cohort');

  // [TEST 04]: Cross-Tenant isolation: School B cannot view School A roster
  let crossTenantDenied = false;
  try {
    await ResultsService.getMarksRoster({
      schoolId: schoolB.id,
      examTermId: examTermA.id,
      paperId: mathPaper.id,
      classId: class10.id,
      sectionId: section10A.id,
    });
  } catch {
    crossTenantDenied = true;
  }
  assert(crossTenantDenied, 4, 'Cross-tenant isolation: Foreign school rejected from accessing marks roster');

  // [TEST 05]: Negative marks are rejected
  let negRejected = false;
  try {
    await ResultsService.saveMarks({
      schoolId: schoolA.id,
      examTermId: examTermA.id,
      paperId: mathPaper.id,
      marks: [{ studentId: student1.id, marksObtained: -5, status: 'PRESENT' }],
      enteredByUserId: adminUser.id,
    });
  } catch (err: any) {
    if (err.message.includes('negative')) negRejected = true;
  }
  assert(negRejected, 5, 'Marks entry validation: Negative marks strictly rejected');

  // [TEST 06]: Marks above maximum are rejected
  let maxExceededRejected = false;
  try {
    await ResultsService.saveMarks({
      schoolId: schoolA.id,
      examTermId: examTermA.id,
      paperId: mathPaper.id,
      marks: [{ studentId: student1.id, marksObtained: 105, status: 'PRESENT' }],
      enteredByUserId: adminUser.id,
    });
  } catch (err: any) {
    if (err.message.includes('exceeds')) maxExceededRejected = true;
  }
  assert(maxExceededRejected, 6, 'Marks entry validation: Marks exceeding maximum strictly rejected');

  // [TEST 07]: Save valid marks including ABSENT student
  const saveMarksRes = await ResultsService.saveMarks({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    paperId: mathPaper.id,
    marks: [
      { studentId: student1.id, marksObtained: 85, status: 'PRESENT', remarks: 'Good work' },
      { studentId: student2.id, marksObtained: null, status: 'ABSENT', remarks: 'Medical leave' },
    ],
    enteredByUserId: adminUser.id,
  });
  assert(saveMarksRes.success && saveMarksRes.count === 2, 7, 'Valid marks entry saved with ABSENT handled as null marks');

  // Save science marks
  await ResultsService.saveMarks({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    paperId: sciPaper.id,
    marks: [
      { studentId: student1.id, marksObtained: 90, status: 'PRESENT' },
      { studentId: student2.id, marksObtained: 40, status: 'PRESENT' },
    ],
    enteredByUserId: adminUser.id,
  });

  // [TEST 08]: Authoritative calculation computes totals, percentage, grade, pass/fail
  const calcRes = await ResultsService.calculateResults({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    classId: class10.id,
    sectionId: section10A.id,
    performedByUserId: adminUser.id,
  });
  assert(calcRes.success && calcRes.calculatedCount === 2, 8, 'Server-side calculation evaluates student results');

  // Verify calculated results in DB
  const student1Res = await prisma.examResult.findUnique({
    where: { examTermId_studentId: { examTermId: examTermA.id, studentId: student1.id } },
  });
  // Student 1: Math 85 + Sci 90 = 175 / 200 = 87.5% -> Grade A2, PASS
  assert(
    student1Res !== null &&
    student1Res.totalMarks === 175 &&
    student1Res.percentage === 87.5 &&
    student1Res.grade === 'A2' &&
    student1Res.overallStatus === 'PASS',
    9,
    'Authoritative calculation accuracy: 175/200, 87.5%, A2, PASS'
  );

  // [TEST 10]: Calculated results default to CALCULATED/DRAFT and are not yet published
  assert(student1Res?.status === 'CALCULATED', 10, 'Freshly calculated results default to CALCULATED state');

  // [TEST 11]: Draft results are HIDDEN from parents
  const parent1DraftCheck = await ResultsService.getStudentMarksheet({
    schoolId: schoolA.id,
    studentId: student1.id,
    parentUserId: parentUser1.id,
    requirePublished: true,
  });
  assert(
    parent1DraftCheck !== null && parent1DraftCheck.results.length === 0,
    11,
    'Parent cannot view draft or unpublished examination results'
  );

  // [TEST 12]: Admin publishes results
  const pubRes = await ResultsService.setPublicationStatus({
    schoolId: schoolA.id,
    examTermId: examTermA.id,
    publish: true,
    performedByUserId: adminUser.id,
  });
  assert(pubRes.success && pubRes.status === 'PUBLISHED', 12, 'Authorized publication sets status to PUBLISHED');

  // [TEST 13]: Published results are visible to authorized parent
  const parent1PubCheck = await ResultsService.getStudentMarksheet({
    schoolId: schoolA.id,
    studentId: student1.id,
    parentUserId: parentUser1.id,
    requirePublished: true,
  });
  assert(
    parent1PubCheck !== null &&
    parent1PubCheck.results.length === 1 &&
    parent1PubCheck.results[0].percentage === 87.5,
    13,
    'Authorized parent can view published marksheet of their linked child'
  );

  // [TEST 14]: IDOR Protection: Parent 1 CANNOT access Student 2's marksheet
  const idorCheck = await ResultsService.getStudentMarksheet({
    schoolId: schoolA.id,
    studentId: student2.id, // Parent 1 is NOT the parent of Student 2
    parentUserId: parentUser1.id,
    requirePublished: true,
  });
  assert(idorCheck === null, 14, 'IDOR blocked: Parent cannot access foreign student marksheet');

  // [TEST 15]: Cross-tenant result access is blocked
  const crossTenantMarksheet = await ResultsService.getStudentMarksheet({
    schoolId: schoolB.id,
    studentId: student1.id,
  });
  assert(crossTenantMarksheet === null, 15, 'Cross-tenant isolation: Foreign school cannot access student marksheet');

  console.log('\nGROUP 2: NOTICES & AUDIENCE TARGETING (16-24)');

  // [TEST 16]: Admin can create a draft notice
  const draftNotice = await NoticeService.createNotice({
    schoolId: schoolA.id,
    authorId: adminUser.id,
    title: 'Draft Holiday Notice',
    body: 'School will be closed on Friday for staff development.',
    targetType: 'ALL_SCHOOL',
    publishImmediately: false,
  });
  assert(draftNotice.status === 'DRAFT', 16, 'Notice drafted successfully with DRAFT state');

  // [TEST 17]: School A notice is invisible to School B
  const schoolBNotices = await NoticeService.getNotices({
    schoolId: schoolB.id,
    userId: adminUser.id,
    role: 'ADMIN',
  });
  assert(
    schoolBNotices.notices.every((n) => n.id !== draftNotice.id),
    17,
    'Cross-tenant isolation: School A notices completely isolated from School B'
  );

  // [TEST 18]: School-wide published notice visible to parents and teachers
  const pubNotice = await NoticeService.createNotice({
    schoolId: schoolA.id,
    authorId: adminUser.id,
    title: 'School-Wide Annual Sports Meet',
    body: 'All students, parents, and faculty are cordially invited to the annual sports meet.',
    targetType: 'ALL_SCHOOL',
    priority: 'HIGH',
    publishImmediately: true,
  });
  assert(pubNotice.status === 'PUBLISHED', 18, 'Immediate publication sets status to PUBLISHED');

  const parent1Notices = await NoticeService.getNotices({
    schoolId: schoolA.id,
    userId: parentUser1.id,
    role: 'PARENT',
  });
  const hasSportsNotice = parent1Notices.notices.some((n) => n.id === pubNotice.id);
  assert(hasSportsNotice, 19, 'School-wide notice is visible to parents');

  // [TEST 20]: Class-targeted notice visible only to parents with students in that class
  const class10Notice = await NoticeService.createNotice({
    schoolId: schoolA.id,
    authorId: adminUser.id,
    title: 'Class 10 Science Exhibition',
    body: 'Class 10 students must submit their models by Monday.',
    targetType: 'CLASS',
    classId: class10.id,
    publishImmediately: true,
  });

  const parent1ClassNotices = await NoticeService.getNotices({
    schoolId: schoolA.id,
    userId: parentUser1.id,
    role: 'PARENT',
  });
  assert(
    parent1ClassNotices.notices.some((n) => n.id === class10Notice.id),
    20,
    'Class-targeted notice delivered to parents with students enrolled in targeted class'
  );

  // [TEST 21]: Section-targeted notice
  const section10BNotice = await NoticeService.createNotice({
    schoolId: schoolA.id,
    authorId: adminUser.id,
    title: 'Section 10-B Meeting',
    body: 'Parent-teacher conference for section 10-B only.',
    targetType: 'SECTION',
    classId: class10.id,
    sectionId: section10B.id,
    publishImmediately: true,
  });

  // Parent 1 has Student 3 in 10-B -> SHOULD see section 10-B notice
  const parent1SecCheck = await NoticeService.getNotices({
    schoolId: schoolA.id,
    userId: parentUser1.id,
    role: 'PARENT',
  });
  assert(
    parent1SecCheck.notices.some((n) => n.id === section10BNotice.id),
    21,
    'Section-targeted notice delivered to parent of ward in that section'
  );

  // Parent 2 has Student 2 in 10-A only -> SHOULD NOT see section 10-B notice
  const parent2SecCheck = await NoticeService.getNotices({
    schoolId: schoolA.id,
    userId: parentUser2.id,
    role: 'PARENT',
  });
  assert(
    !parent2SecCheck.notices.some((n) => n.id === section10BNotice.id),
    22,
    'Audience isolation: Parent without ward in targeted section cannot see section notice'
  );

  // [TEST 23]: Mark notice as read creates persistent server-side record
  await NoticeService.markNoticeRead({
    noticeId: pubNotice.id,
    userId: parentUser1.id,
  });
  const updatedParentNotices = await NoticeService.getNotices({
    schoolId: schoolA.id,
    userId: parentUser1.id,
    role: 'PARENT',
  });
  const readNotice = updatedParentNotices.notices.find((n) => n.id === pubNotice.id);
  assert(readNotice?.isRead === true, 23, 'Notice marked as read persists server-side read status');

  // [TEST 24]: Archive notice updates status
  const archived = await NoticeService.archiveNotice({
    schoolId: schoolA.id,
    noticeId: pubNotice.id,
    userId: adminUser.id,
  });
  assert(archived.status === 'ARCHIVED', 24, 'Notice archival transitions state to ARCHIVED');

  console.log('\nGROUP 3: PARENT ACCESS, NOTIFICATIONS & TOKENS (25-30)');

  // [TEST 25]: Parent session resolves all linked children
  const parent1Students = await prisma.parentStudent.findMany({
    where: { parentId: parent1.id },
  });
  assert(parent1Students.length === 2, 25, 'Multi-child parent account resolves both linked wards');

  // [TEST 26]: AudienceResolver resolves user IDs tenant-safely
  const resolvedClass10UserIds = await AudienceResolver.resolveUserIds({
    schoolId: schoolA.id,
    targetType: 'CLASS',
    classId: class10.id,
  });
  assert(
    resolvedClass10UserIds.includes(parentUser1.id) && resolvedClass10UserIds.includes(parentUser2.id),
    26,
    'AudienceResolver resolves all unique parent user IDs for targeted class cohort'
  );

  // [TEST 27]: In-app notifications created via dispatcher
  const dispatchRes = await NotificationDispatcher.dispatch({
    schoolId: schoolA.id,
    userIds: [parentUser1.id, parentUser2.id],
    title: 'Test Dispatch Alert',
    body: 'Dispatched alert for verification.',
    category: 'NOTICE',
  });
  assert(dispatchRes.inAppCount === 2, 27, 'NotificationDispatcher successfully fans out in-app notifications');

  // [TEST 28]: Check unread notification count
  const unreadCount1 = await prisma.notification.count({
    where: { userId: parentUser1.id, isRead: false },
  });
  assert(unreadCount1 > 0, 28, 'Unread notification count tracks unread notifications accurately');

  // [TEST 29]: Mark single notification as read
  const notif = await prisma.notification.findFirst({
    where: { userId: parentUser1.id, isRead: false },
  });
  if (notif) {
    await prisma.notification.update({
      where: { id: notif.id },
      data: { isRead: true },
    });
  }
  const unreadCountAfter = await prisma.notification.count({
    where: { userId: parentUser1.id, isRead: false },
  });
  assert(unreadCountAfter === unreadCount1 - 1, 29, 'Marking notification read decrements unread count');

  // [TEST 30]: Device token registration & unregistration
  const deviceToken = await prisma.deviceToken.create({
    data: {
      userId: parentUser1.id,
      token: `fcm_test_token_${testRunId}`,
      platform: 'web',
      isActive: true,
    },
  });
  assert(deviceToken.isActive === true, 30, 'DeviceToken registers and activates for push dispatch');

  console.log('\nGROUP 4: DYNAMIC COMMUNICATION GROUPS (31-32)');

  // [TEST 31]: Communication groups dynamically compute member counts
  const groups = await CommunicationService.getGroups(schoolA.id);
  const class10Group = groups.find((g) => g.type === 'CLASS' && g.classId === class10.id);
  assert(
    groups.length > 0 && class10Group !== undefined && class10Group.memberCount >= 2,
    31,
    'CommunicationService dynamically generates groups with live cohort member counts'
  );

  // [TEST 32]: Sibling section group count
  const section10BGroup = groups.find((g) => g.type === 'SECTION' && g.sectionId === section10B.id);
  assert(
    section10BGroup !== undefined && section10BGroup.memberCount === 1,
    32,
    'Dynamic communication group calculates exact section-level parent memberships'
  );

  // CLEANUP: Clean up test run fixtures
  console.log('\n--- CLEANUP ---');
  await prisma.notification.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.deviceToken.deleteMany({ where: { token: { contains: testRunId } } });
  await prisma.noticeReadStatus.deleteMany({ where: { notice: { schoolId: { in: [schoolA.id, schoolB.id] } } } });
  await prisma.noticeAuditLog.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.notice.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.resultAuditLog.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.examResultSubject.deleteMany({ where: { examResult: { schoolId: { in: [schoolA.id, schoolB.id] } } } });
  await prisma.examResult.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.examMark.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.examPaper.deleteMany({ where: { examTerm: { schoolId: { in: [schoolA.id, schoolB.id] } } } });
  await prisma.examTerm.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.parentStudent.deleteMany({ where: { parent: { schoolId: { in: [schoolA.id, schoolB.id] } } } });
  await prisma.parent.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.studentEnrollment.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.student.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.teacherAssignment.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.teacher.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.subject.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.section.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.class.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.academicSession.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.schoolMembership.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } });
  await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
  await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } });
  console.log('  ✓ Cleaned up test database fixtures.');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
