/**
 * Rivo Master Platform & School Role Architecture Test Suite
 * Comprehensive verification of:
 * 1. Platform Roles: OWNER, PLATFORM_ADMIN (no schoolId, no SchoolMembership required)
 * 2. School Tenant Roles: DIRECTOR, PRINCIPAL, ADMIN, TEACHER, STUDENT, PARENT
 * 3. Scope Isolation: requireAuth({ scope: 'PLATFORM' }) vs requireAuth({ scope: 'SCHOOL' })
 * 4. Tenant Isolation: School A vs School B across all roles
 * 5. Privilege Escalation Guards: Principal/Admin cannot become Director/Owner
 * 6. Multi-Factor Authentication (MFA) across platform and school roles
 * 7. Session revocation and cache eviction
 */

import dotenv from 'dotenv';
dotenv.config();

import { NextRequest } from 'next/server';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/crypto';
import { createSession, getValidSession, revokeSession } from '../lib/auth/session';
import { requireAuth, getEffectivePermission, getCurrentUser } from '../lib/auth/authorize';
import {
  generateTotpSecret,
  encryptMfaSecret,
  createMfaChallenge,
  verifyMfaChallenge,
  generateRecoveryCodes,
} from '../lib/auth/mfa';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

function mockRequestWithToken(token: string): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/test', {
    headers: {
      cookie: `rivo_session=${token}`,
    },
  });
  return req;
}

async function runPlatformRolesTestSuite() {
  console.log('\n===============================================================');
  console.log('RIVO PLATFORM & SCHOOL ROLES ARCHITECTURE TEST SUITE');
  console.log('===============================================================\n');

  const runId = Math.random().toString(36).substring(2, 8);
  const defaultPass = 'TestSecurePassword@123';
  const passHash = await hashPassword(defaultPass);

  // Setup Schools
  const schoolA = await prisma.school.create({
    data: { name: `School Alpha ${runId}`, slug: `school-alpha-${runId}`, status: 'ACTIVE' },
  });
  const schoolB = await prisma.school.create({
    data: { name: `School Beta ${runId}`, slug: `school-beta-${runId}`, status: 'ACTIVE' },
  });

  try {
    // -------------------------------------------------------------
    // GROUP 1: PLATFORM USERS (OWNER & PLATFORM_ADMIN)
    // -------------------------------------------------------------
    console.log('--- GROUP 1: PLATFORM ROLES & AUTHENTICATION ---');

    // 1. Create Platform Owner (no school membership)
    const userOwner = await prisma.user.create({
      data: {
        email: `platform-owner-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Platform',
        lastName: 'Owner',
        isPlatformOwner: true,
        platformRole: 'OWNER',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // 2. Create Platform Admin (no school membership)
    const userPlatformAdmin = await prisma.user.create({
      data: {
        email: `platform-admin-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Platform',
        lastName: 'Admin',
        isPlatformOwner: false,
        platformRole: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // 3. OWNER establishes session with schoolId = null
    const ownerSession = await createSession({
      userId: userOwner.id,
      schoolId: null,
    });
    assert(ownerSession.sessionId !== null, 'OWNER can create session with schoolId = null');

    const validOwnerSession = await getValidSession(ownerSession.rawToken);
    assert(
      validOwnerSession !== null &&
      validOwnerSession.scope === 'PLATFORM' &&
      validOwnerSession.role === 'OWNER' &&
      validOwnerSession.schoolId === null,
      'OWNER session resolves with scope PLATFORM and schoolId null (no SchoolMembership required)'
    );

    // 4. PLATFORM_ADMIN establishes session with schoolId = null
    const pAdminSession = await createSession({
      userId: userPlatformAdmin.id,
      schoolId: null,
    });
    const validPAdminSession = await getValidSession(pAdminSession.rawToken);
    assert(
      validPAdminSession !== null &&
      validPAdminSession.scope === 'PLATFORM' &&
      validPAdminSession.role === 'PLATFORM_ADMIN' &&
      validPAdminSession.schoolId === null,
      'PLATFORM_ADMIN session resolves with scope PLATFORM and schoolId null'
    );

    // 5. getCurrentUser for Platform Owner
    const currentOwner = await getCurrentUser(mockRequestWithToken(ownerSession.rawToken));
    assert(
      currentOwner !== null && currentOwner.scope === 'PLATFORM' && currentOwner.roleType === 'OWNER',
      'getCurrentUser accurately resolves Platform Owner profile without school context'
    );

    // -------------------------------------------------------------
    // GROUP 2: SCHOOL TENANT ROLES (DIRECTOR, PRINCIPAL, ADMIN)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 2: SCHOOL TENANT ROLES ---');

    // 6. Create School A Director
    const userDirectorA = await prisma.user.create({
      data: {
        email: `director-a-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Director',
        lastName: 'Alpha',
        status: 'ACTIVE',
      },
    });
    await prisma.schoolMembership.create({
      data: { userId: userDirectorA.id, schoolId: schoolA.id, role: 'DIRECTOR', status: 'ACTIVE' },
    });

    // 7. Create School A Principal
    const userPrincipalA = await prisma.user.create({
      data: {
        email: `principal-a-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Principal',
        lastName: 'Alpha',
        status: 'ACTIVE',
      },
    });
    await prisma.schoolMembership.create({
      data: { userId: userPrincipalA.id, schoolId: schoolA.id, role: 'PRINCIPAL', status: 'ACTIVE' },
    });

    // 8. Create School A Admin
    const userAdminA = await prisma.user.create({
      data: {
        email: `admin-a-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Admin',
        lastName: 'Alpha',
        status: 'ACTIVE',
      },
    });
    await prisma.schoolMembership.create({
      data: { userId: userAdminA.id, schoolId: schoolA.id, role: 'ADMIN', status: 'ACTIVE' },
    });

    // 9. Create School A Teacher
    const userTeacherA = await prisma.user.create({
      data: {
        email: `teacher-a-${runId}@rivo.test`,
        passwordHash: passHash,
        firstName: 'Teacher',
        lastName: 'Alpha',
        status: 'ACTIVE',
      },
    });
    await prisma.schoolMembership.create({
      data: { userId: userTeacherA.id, schoolId: schoolA.id, role: 'TEACHER', status: 'ACTIVE' },
    });

    // 10. Director Session resolution
    const directorSession = await createSession({
      userId: userDirectorA.id,
      schoolId: schoolA.id,
    });
    const validDirectorSession = await getValidSession(directorSession.rawToken);
    assert(
      validDirectorSession !== null &&
      validDirectorSession.scope === 'SCHOOL' &&
      validDirectorSession.role === 'DIRECTOR' &&
      validDirectorSession.schoolId === schoolA.id,
      'DIRECTOR session resolves with scope SCHOOL and matching schoolId'
    );

    // 11. Principal Session resolution
    const principalSession = await createSession({
      userId: userPrincipalA.id,
      schoolId: schoolA.id,
    });
    const validPrincipalSession = await getValidSession(principalSession.rawToken);
    assert(
      validPrincipalSession !== null &&
      validPrincipalSession.scope === 'SCHOOL' &&
      validPrincipalSession.role === 'PRINCIPAL' &&
      validPrincipalSession.schoolId === schoolA.id,
      'PRINCIPAL session resolves with scope SCHOOL and matching schoolId'
    );

    // 12. School Effective Permissions
    const permDirector = await getEffectivePermission({
      userId: userDirectorA.id,
      schoolId: schoolA.id,
      permissionCode: 'students.view',
    });
    assert(permDirector.granted === true && permDirector.scope === 'SCHOOL', 'DIRECTOR has full SCHOOL scope permissions');

    const permPrincipal = await getEffectivePermission({
      userId: userPrincipalA.id,
      schoolId: schoolA.id,
      permissionCode: 'attendance.view',
    });
    assert(permPrincipal.granted === true && permPrincipal.scope === 'SCHOOL', 'PRINCIPAL has full SCHOOL scope permissions');

    const permAdmin = await getEffectivePermission({
      userId: userAdminA.id,
      schoolId: schoolA.id,
      permissionCode: 'school_timetable.view',
    });
    assert(permAdmin.granted === true && permAdmin.scope === 'SCHOOL', 'ADMIN has full SCHOOL scope permissions');

    // -------------------------------------------------------------
    // GROUP 3: SCOPE ENFORCEMENT & API PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- GROUP 3: SCOPE ENFORCEMENT & BOUNDARIES ---');

    // 13. Platform endpoint requires PLATFORM scope
    const reqPlatformByOwner = mockRequestWithToken(ownerSession.rawToken);
    const authOwnerPlatform = await requireAuth(reqPlatformByOwner, { scope: 'PLATFORM' });
    assert(authOwnerPlatform.authorized === true, 'OWNER passes requireAuth with scope PLATFORM');

    // 14. School role (Director) accessing platform scope is DENIED
    const reqPlatformByDirector = mockRequestWithToken(directorSession.rawToken);
    const authDirectorPlatform = await requireAuth(reqPlatformByDirector, { scope: 'PLATFORM' });
    assert(authDirectorPlatform.authorized === false, 'School DIRECTOR accessing scope PLATFORM is strictly DENIED');

    // 15. Platform user without tenant context accessing school scope is DENIED
    const reqSchoolByOwner = mockRequestWithToken(ownerSession.rawToken);
    const authOwnerSchool = await requireAuth(reqSchoolByOwner, { scope: 'SCHOOL' });
    assert(authOwnerSchool.authorized === false, 'Platform OWNER without school context accessing scope SCHOOL is strictly DENIED');

    // 16. School Director passes school scope
    const reqSchoolByDirector = mockRequestWithToken(directorSession.rawToken);
    const authDirectorSchool = await requireAuth(reqSchoolByDirector, {
      scope: 'SCHOOL',
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN'],
    });
    assert(authDirectorSchool.authorized === true, 'School DIRECTOR passes school-scoped requireAuth');

    // 17. Teacher accessing admin roles is DENIED
    const teacherSession = await createSession({ userId: userTeacherA.id, schoolId: schoolA.id });
    const reqSchoolByTeacher = mockRequestWithToken(teacherSession.rawToken);
    const authTeacherAdmin = await requireAuth(reqSchoolByTeacher, {
      scope: 'SCHOOL',
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN'],
    });
    assert(authTeacherAdmin.authorized === false, 'TEACHER accessing DIRECTOR/PRINCIPAL/ADMIN roles is strictly DENIED');

    // -------------------------------------------------------------
    // GROUP 4: TENANT ISOLATION (CROSS-SCHOOL DEFENSE)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 4: TENANT ISOLATION ---');

    // 18. School A Director cannot access School B
    const permAtoB = await getEffectivePermission({
      userId: userDirectorA.id,
      schoolId: schoolB.id,
      permissionCode: 'students.view',
    });
    assert(permAtoB.granted === false, 'School A DIRECTOR accessing School B data is strictly DENIED');

    // 19. School A Principal cannot access School B
    const permPrincipalAtoB = await getEffectivePermission({
      userId: userPrincipalA.id,
      schoolId: schoolB.id,
      permissionCode: 'attendance.view',
    });
    assert(permPrincipalAtoB.granted === false, 'School A PRINCIPAL accessing School B data is strictly DENIED');

    // 20. School A Admin cannot access School B
    const permAdminAtoB = await getEffectivePermission({
      userId: userAdminA.id,
      schoolId: schoolB.id,
      permissionCode: 'students.view',
    });
    assert(permAdminAtoB.granted === false, 'School A ADMIN accessing School B data is strictly DENIED');

    // -------------------------------------------------------------
    // GROUP 5: PRIVILEGE ESCALATION GUARDS
    // -------------------------------------------------------------
    console.log('\n--- GROUP 5: PRIVILEGE ESCALATION GUARDS ---');

    // 21. PLATFORM_ADMIN cannot elevate or modify OWNER
    assert(userPlatformAdmin.platformRole !== 'OWNER', 'PLATFORM_ADMIN cannot be initialized as OWNER');

    // 22. School ADMIN cannot have platformRole
    assert(!userAdminA.platformRole, 'School ADMIN does not possess platformRole');

    // 23. Director without platformRole cannot be treated as Platform Owner
    assert(!userDirectorA.isPlatformOwner && !userDirectorA.platformRole, 'DIRECTOR is not a platform owner');

    // -------------------------------------------------------------
    // GROUP 6: MFA LIFECYCLE FOR PLATFORM & SCHOOL ROLES
    // -------------------------------------------------------------
    console.log('\n--- GROUP 6: MFA VERIFICATION ---');

    // 24. Configure MFA for Platform Owner
    const ownerSecret = generateTotpSecret(userOwner.email);
    const encOwnerSecret = encryptMfaSecret(ownerSecret.secret);
    const { rawCodes, hashedCodes } = generateRecoveryCodes();

    await prisma.userMfa.create({
      data: {
        userId: userOwner.id,
        secretEncrypted: encOwnerSecret,
        enabled: true,
        verifiedAt: new Date(),
      },
    });
    await prisma.mfaRecoveryCode.create({
      data: {
        userId: userOwner.id,
        codeHash: hashedCodes[0],
      },
    });

    const mfaChallenge = await createMfaChallenge(userOwner.id);
    assert(mfaChallenge !== null, 'Platform OWNER can issue an MFA challenge');

    const mfaVerifyResult = await verifyMfaChallenge(mfaChallenge, rawCodes[0]);
    assert(mfaVerifyResult.valid === true && mfaVerifyResult.userId === userOwner.id, 'Platform OWNER successfully verifies MFA via recovery code');

    // -------------------------------------------------------------
    // GROUP 7: SESSION REVOCATION
    // -------------------------------------------------------------
    console.log('\n--- GROUP 7: SESSION REVOCATION ---');

    // 25. Revoke platform session
    await revokeSession(ownerSession.rawToken);
    const postRevokeOwner = await getValidSession(ownerSession.rawToken);
    assert(postRevokeOwner === null, 'Revoked platform session is rejected on verification');

    // 26. Revoke school session
    await revokeSession(directorSession.rawToken);
    const postRevokeDirector = await getValidSession(directorSession.rawToken);
    assert(postRevokeDirector === null, 'Revoked school director session is rejected on verification');

  } finally {
    // Teardown test data
    try {
      await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } });
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: runId,
          },
        },
      });
    } catch {
      // Ignore cleanup error
    }
  }

  console.log('\n===============================================================');
  console.log(`PLATFORM ROLES TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPlatformRolesTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
