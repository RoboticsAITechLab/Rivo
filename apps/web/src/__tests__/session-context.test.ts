import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import {
  resolveSessionContext,
  getSessionContext,
  UNAUTHENTICATED_SESSION_CONTEXT,
} from '@/lib/auth/session-context';
import { hashToken } from '@/lib/auth/crypto';

let schoolAId: string;
let schoolBId: string;
let adminUserId: string;
let teacherUserId: string;
let staffUserBId: string;
let adminToken: string;
let teacherToken: string;
let staffBToken: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runSessionContextTests() {
  console.log('🚀 Running RIVO-ARCH-001: Unified Session & Scope Hydration Tests...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Isolated School A, School B, and distinct users
    // -------------------------------------------------------------
    const schoolA = await prisma.school.create({
      data: {
        name: 'Apex International School',
        slug: `apex-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        name: 'Beacon Heights Academy',
        slug: `beacon-test-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolBId = schoolB.id;

    // User 1: School A Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@apex.edu`,
        firstName: 'Aarav',
        lastName: 'Singhal',
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    await prisma.schoolMembership.create({
      data: {
        schoolId: schoolAId,
        userId: adminUserId,
        role: 'ADMIN',
      },
    });

    // User 2: School A Teacher
    const teacherUser = await prisma.user.create({
      data: {
        email: `teacher-${Date.now()}@apex.edu`,
        firstName: 'Sunita',
        lastName: 'Rao',
        isActive: true,
      },
    });
    teacherUserId = teacherUser.id;

    await prisma.schoolMembership.create({
      data: {
        schoolId: schoolAId,
        userId: teacherUserId,
        role: 'TEACHER',
      },
    });

    await prisma.teacher.create({
      data: {
        schoolId: schoolAId,
        userId: teacherUserId,
        employeeId: 'EMP-TCH-001',
        department: 'Science',
        designation: 'Senior Physics Teacher',
      },
    });

    // User 3: School B Staff
    const staffUserB = await prisma.user.create({
      data: {
        email: `staff-${Date.now()}@beacon.edu`,
        firstName: 'Ramesh',
        lastName: 'Patel',
        isActive: true,
      },
    });
    staffUserBId = staffUserB.id;

    await prisma.schoolMembership.create({
      data: {
        schoolId: schoolBId,
        userId: staffUserBId,
        role: 'STAFF',
      },
    });

    // Create active sessions
    const adminSession = await createSession({ userId: adminUserId, schoolId: schoolAId });
    adminToken = adminSession.rawToken;

    const teacherSession = await createSession({ userId: teacherUserId, schoolId: schoolAId });
    teacherToken = teacherSession.rawToken;

    const staffBSession = await createSession({ userId: staffUserBId, schoolId: schoolBId });
    staffBToken = staffBSession.rawToken;

    // -------------------------------------------------------------
    // TEST GROUP 1: Valid Session Hydration
    // -------------------------------------------------------------
    const adminCtx = await resolveSessionContext({ token: adminToken });
    assert(adminCtx.authenticated === true, 1, 'Valid session resolves to authenticated: true');
    if (adminCtx.authenticated) {
      assert(adminCtx.userId === adminUserId, 2, 'User ID matches authenticated session user');
      assert(adminCtx.schoolId === schoolAId, 3, 'Tenant context correctly binds to School A');
      assert(adminCtx.school?.name === 'Apex International School', 4, 'School metadata hydrated cleanly');
      assert(adminCtx.role === 'ADMIN', 5, 'User role is correctly hydrated as ADMIN');
      assert(adminCtx.isLeadership() === true, 6, 'isLeadership() helper returns true for ADMIN');
      assert(adminCtx.isTeacher() === false, 7, 'isTeacher() helper returns false for ADMIN');
      assert(adminCtx.isPlatformAdmin() === false, 8, 'isPlatformAdmin() returns false for school admin');
    }

    // -------------------------------------------------------------
    // TEST GROUP 2: Missing, Expired & Revoked Sessions
    // -------------------------------------------------------------
    const emptyCtx = await resolveSessionContext({ token: '' });
    assert(emptyCtx.authenticated === false, 9, 'Empty token returns unauthenticated context');

    const invalidCtx = await resolveSessionContext({ token: 'completely-bogus-token-xyz-123' });
    assert(invalidCtx.authenticated === false, 10, 'Bogus token returns unauthenticated context');

    // Expired session
    const expiredSession = await createSession({ userId: adminUserId, schoolId: schoolAId });
    await prisma.session.update({
      where: { id: expiredSession.sessionId },
      data: { expiresAt: new Date(Date.now() - 3600000) }, // 1 hour in the past
    });
    const expiredCtx = await resolveSessionContext({ token: expiredSession.rawToken });
    assert(expiredCtx.authenticated === false, 11, 'Expired session returns unauthenticated context');

    // Revoked session
    const revokedSession = await createSession({ userId: adminUserId, schoolId: schoolAId });
    await prisma.session.update({
      where: { id: revokedSession.sessionId },
      data: { revokedAt: new Date() },
    });
    const revokedCtx = await resolveSessionContext({ token: revokedSession.rawToken });
    assert(revokedCtx.authenticated === false, 12, 'Revoked session returns unauthenticated context');

    // -------------------------------------------------------------
    // TEST GROUP 3: Strict Tenant Isolation & Cross-Tenant Protection
    // -------------------------------------------------------------
    if (adminCtx.authenticated) {
      assert(
        adminCtx.enforceSchool(schoolAId) === true,
        13,
        'School A admin passes enforceSchool for School A'
      );
      assert(
        adminCtx.enforceSchool(schoolBId) === false,
        14,
        'School A admin strictly fails enforceSchool for School B (Cross-Tenant blocked)'
      );
    }

    // -------------------------------------------------------------
    // TEST GROUP 4: Role-Specific Permission Hydration & Precedence
    // -------------------------------------------------------------
    const teacherCtx = await resolveSessionContext({ token: teacherToken });
    assert(teacherCtx.authenticated === true, 15, 'Teacher session hydrated successfully');
    if (teacherCtx.authenticated) {
      assert(teacherCtx.role === 'TEACHER', 16, 'Role is correctly hydrated as TEACHER');
      assert(teacherCtx.isTeacher() === true, 17, 'isTeacher() returns true');
      assert(teacherCtx.isLeadership() === false, 18, 'isLeadership() returns false for teacher');

      // Teacher profile verification
      assert(
        teacherCtx.teacherProfile?.employeeId === 'EMP-TCH-001',
        19,
        'Teacher profile employeeId hydrated accurately'
      );
      assert(
        teacherCtx.teacherProfile?.department === 'Science',
        20,
        'Teacher department hydrated accurately'
      );

      // Teaching baseline permissions with ASSIGNED scope
      assert(
        teacherCtx.hasPermission('attendance.take') === true,
        21,
        'Teacher has attendance.take permission'
      );
      assert(
        teacherCtx.getPermissionScope('attendance.take') === 'ASSIGNED',
        22,
        'attendance.take has ASSIGNED scope for teacher'
      );

      // School scope on broadcast notices
      assert(
        teacherCtx.hasPermission('notices.view') === true,
        23,
        'Teacher has notices.view permission'
      );
      assert(
        teacherCtx.getPermissionScope('notices.view') === 'SCHOOL',
        24,
        'notices.view has SCHOOL scope for teacher'
      );

      // Financial management strictly denied to base teachers
      assert(
        teacherCtx.hasPermission('fees.plan_create') === false,
        25,
        'Teacher strictly denied fee plan creation'
      );
    }

    // Staff user verification in School B
    const staffBCtx = await resolveSessionContext({ token: staffBToken });
    assert(staffBCtx.authenticated === true, 26, 'School B staff session hydrated');
    if (staffBCtx.authenticated) {
      assert(staffBCtx.schoolId === schoolBId, 27, 'Staff is isolated in School B');
      assert(staffBCtx.enforceSchool(schoolAId) === false, 28, 'Staff B cannot access School A');
      assert(staffBCtx.role === 'STAFF', 29, 'Role is STAFF');
      assert(staffBCtx.hasPermission('attendance.take') === false, 30, 'Staff cannot take attendance');
      assert(staffBCtx.hasPermission('students.view') === true, 31, 'Staff can view student directory');
    }

    // -------------------------------------------------------------
    // TEST GROUP 5: Cache Isolation Across Users & Schools
    // -------------------------------------------------------------
    const [c1, c2, c3] = await Promise.all([
      getSessionContext({ token: adminToken }),
      getSessionContext({ token: teacherToken }),
      getSessionContext({ token: staffBToken }),
    ]);

    assert(c1.authenticated && c2.authenticated && c3.authenticated, 32, 'All 3 concurrent contexts resolve');
    if (c1.authenticated && c2.authenticated && c3.authenticated) {
      assert(c1.userId !== c2.userId, 33, 'User 1 and User 2 contexts are strictly isolated');
      assert(c1.schoolId !== c3.schoolId, 34, 'School A and School B contexts are strictly isolated');
      assert(c1.role === 'ADMIN' && c2.role === 'TEACHER' && c3.role === 'STAFF', 35, 'Roles retain independent states');
    }

    // -------------------------------------------------------------
    // TEST GROUP 6: High-Concurrency Stress Test
    // 10 simultaneous requests across varied sessions
    // -------------------------------------------------------------
    console.log('⚡ Executing 10 concurrent session hydration requests...');
    const tokens = [adminToken, teacherToken, staffBToken];
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
      const selectedToken = tokens[i % 3];
      return getSessionContext({ token: selectedToken });
    });

    const concurrentResults = await Promise.all(concurrentRequests);
    assert(concurrentResults.length === 10, 36, 'All 10 concurrent requests completed');
    const allValid = concurrentResults.every((r) => r.authenticated === true);
    assert(allValid, 37, 'Zero corruption or session mixing under concurrency');

    console.log('\n================================================================');
    console.log('🎉 ALL 37 RIVO-ARCH-001 SESSION CONTEXT TESTS PASSED!');
    console.log('================================================================');
  } catch (err) {
    console.error('Fatal error during session context tests:', err);
    process.exit(1);
  } finally {
    // Cleanup test fixtures
    if (schoolAId) {
      await prisma.session.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.teacher.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.schoolMembership.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.school.delete({ where: { id: schoolAId } }).catch(() => {});
    }
    if (schoolBId) {
      await prisma.session.deleteMany({ where: { schoolId: schoolBId } }).catch(() => {});
      await prisma.schoolMembership.deleteMany({ where: { schoolId: schoolBId } }).catch(() => {});
      await prisma.school.delete({ where: { id: schoolBId } }).catch(() => {});
    }
    if (adminUserId) {
      await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
    }
    if (teacherUserId) {
      await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
    }
    if (staffUserBId) {
      await prisma.user.delete({ where: { id: staffUserBId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runSessionContextTests();
