import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { hashPassword, generateSecureToken, hashToken } from '../lib/auth/crypto';
import {
  createSession,
  getValidSession,
  revokeSessionById,
  revokeOtherUserSessions,
  listUserActiveSessions,
} from '../lib/auth/session';
import {
  getSchoolSetting,
  updateSchoolSetting,
  invalidateSchoolSettingsCache,
  DEFAULT_SETTINGS,
} from '../lib/settings/settings-service';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { POST as forgotPasswordHandler } from '../app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '../app/api/auth/reset-password/route';
import { GET as sessionsGetHandler, DELETE as sessionsDeleteHandler } from '../app/api/auth/sessions/route';

async function runSecurityP0TestSuite() {
  console.log('===============================================================');
  console.log('RIVO SETTINGS P0 SECURITY & DATA-INTEGRITY MASTER TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [${testId}] PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [${testId}] FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  const runId = Math.random().toString(36).substring(2, 8);
  const testPassword = 'Password@123';
  const testPasswordHash = await hashPassword(testPassword);

  // 1. Setup isolated test schools
  const schoolA = await prisma.school.create({
    data: {
      name: `Security Test School A ${runId}`,
      slug: `sec-test-a-${runId}`,
      status: 'ACTIVE',
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: `Security Test School B ${runId}`,
      slug: `sec-test-b-${runId}`,
      status: 'ACTIVE',
    },
  });

  // 2. Setup users for School A
  const directorA = await prisma.user.create({
    data: {
      email: `director-a-${runId}@rivo-test.edu`,
      passwordHash: testPasswordHash,
      firstName: 'Director',
      lastName: 'Alpha',
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: new Date(),
      memberships: {
        create: {
          schoolId: schoolA.id,
          role: 'DIRECTOR',
          status: 'ACTIVE',
        },
      },
    },
  });

  const teacherA = await prisma.user.create({
    data: {
      email: `teacher-a-${runId}@rivo-test.edu`,
      passwordHash: testPasswordHash,
      firstName: 'Teacher',
      lastName: 'Alpha',
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: new Date(),
      memberships: {
        create: {
          schoolId: schoolA.id,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      },
    },
  });

  const unverifiedTeacherA = await prisma.user.create({
    data: {
      email: `unverified-a-${runId}@rivo-test.edu`,
      passwordHash: testPasswordHash,
      firstName: 'Unverified',
      lastName: 'Teacher',
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: null, // Not verified
      memberships: {
        create: {
          schoolId: schoolA.id,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      },
    },
  });

  // 3. Setup users for School B
  const teacherB = await prisma.user.create({
    data: {
      email: `teacher-b-${runId}@rivo-test.edu`,
      passwordHash: testPasswordHash,
      firstName: 'Teacher',
      lastName: 'Beta',
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: new Date(),
      memberships: {
        create: {
          schoolId: schoolB.id,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      },
    },
  });

  try {
    // -------------------------------------------------------------
    // GROUP 1: SETTINGS PERSISTENCE, DEEP MERGING & TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('GROUP 1: SETTINGS PERSISTENCE, DEEP MERGING & TENANT ISOLATION');

    // Update School A's authentication and recovery settings
    await updateSchoolSetting(schoolA.id, 'security', {
      authentication: {
        passwordLoginEnabled: false,
        emailVerificationEnabled: true,
        roleAccess: {
          schoolAdmin: true,
          teacher: true,
          student: false,
          parent: false,
        },
        sessionTimeoutMinutes: 120,
      },
      recovery: {
        allowSelfServiceReset: false,
        requireAdminApproval: true,
        notifyAdminOnRecovery: true,
        resetLinkExpiryHours: 6,
      },
    });

    // Invalidate cache and reload directly from database
    invalidateSchoolSettingsCache(schoolA.id, 'security');
    const freshSecA = await getSchoolSetting(schoolA.id, 'security');

    assert(
      freshSecA.authentication.passwordLoginEnabled === false &&
      freshSecA.authentication.emailVerificationEnabled === true &&
      freshSecA.recovery.allowSelfServiceReset === false &&
      freshSecA.recovery.resetLinkExpiryHours === 6,
      'P0-01',
      'Security authentication and recovery settings persist and reload from PostgreSQL'
    );

    assert(
      freshSecA.passwordPolicy.minLength === 8 &&
      freshSecA.passwordPolicy.requireUppercase === true,
      'P0-02',
      'Deep merging preserves passwordPolicy when updating authentication/recovery'
    );

    const secB = await getSchoolSetting(schoolB.id, 'security');
    assert(
      secB.authentication.passwordLoginEnabled === true &&
      secB.recovery.allowSelfServiceReset === true,
      'P0-03',
      'School B security settings retain defaults without cross-tenant mutation leakage'
    );

    // -------------------------------------------------------------
    // GROUP 2: SERVER-SIDE ENFORCEMENT IN LOGIN API
    // -------------------------------------------------------------
    console.log('\nGROUP 2: SERVER-SIDE ENFORCEMENT IN LOGIN API');

    // Test 2A: passwordLoginEnabled: false on School A rejects password login
    const reqLoginDisabled = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherA.email,
        password: testPassword,
      }),
    });
    const resLoginDisabled = await loginHandler(reqLoginDisabled);
    assert(
      resLoginDisabled.status === 403,
      'P0-04',
      'Disabling passwordLoginEnabled on School A returns 403 Forbidden for teacher',
      `Got status: ${resLoginDisabled.status}`
    );

    // Test 2B: School B teacher still can log in with password
    const reqLoginB = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherB.email,
        password: testPassword,
      }),
    });
    const resLoginB = await loginHandler(reqLoginB);
    assert(
      resLoginB.status === 200,
      'P0-05',
      'School B teacher successfully logs in (tenant policy isolation verified)',
      `Got status: ${resLoginB.status}`
    );

    // Re-enable password login on School A for subsequent tests
    await updateSchoolSetting(schoolA.id, 'security', {
      authentication: {
        passwordLoginEnabled: true,
        emailVerificationEnabled: true,
        roleAccess: {
          schoolAdmin: true,
          teacher: true,
          student: false,
          parent: false,
        },
        sessionTimeoutMinutes: 120,
      },
    });
    invalidateSchoolSettingsCache(schoolA.id, 'security');

    // Test 2C: emailVerificationEnabled: true rejects unverified email
    const reqLoginUnverified = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unverifiedTeacherA.email,
        password: testPassword,
      }),
    });
    const resLoginUnverified = await loginHandler(reqLoginUnverified);
    assert(
      resLoginUnverified.status === 403,
      'P0-06',
      'Mandatory email verification blocks unverified user from logging in',
      `Got status: ${resLoginUnverified.status}`
    );

    // Test 2D: roleAccess.teacher: false restricts teacher portal entry
    await updateSchoolSetting(schoolA.id, 'security', {
      authentication: {
        passwordLoginEnabled: true,
        emailVerificationEnabled: true,
        roleAccess: {
          schoolAdmin: true,
          teacher: false, // Restrict teachers
          student: false,
          parent: false,
        },
        sessionTimeoutMinutes: 120,
      },
    });
    invalidateSchoolSettingsCache(schoolA.id, 'security');

    const reqLoginRoleRestricted = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherA.email,
        password: testPassword,
      }),
    });
    const resLoginRoleRestricted = await loginHandler(reqLoginRoleRestricted);
    assert(
      resLoginRoleRestricted.status === 403,
      'P0-07',
      'Restricting roleAccess for TEACHER blocks teacher login with 403',
      `Got status: ${resLoginRoleRestricted.status}`
    );

    // Test 2E: Director role is exempt from lockout and can log in
    const reqLoginDirector = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: directorA.email,
        password: testPassword,
      }),
    });
    const resLoginDirector = await loginHandler(reqLoginDirector);
    assert(
      resLoginDirector.status === 200,
      'P0-08',
      'Director is exempt from lockout and logs in successfully to administer settings'
    );

    // -------------------------------------------------------------
    // GROUP 3: SERVER-SIDE ENFORCEMENT IN FORGOT & RESET PASSWORD
    // -------------------------------------------------------------
    console.log('\nGROUP 3: SERVER-SIDE ENFORCEMENT IN FORGOT & RESET PASSWORD');

    // Test 3A: allowSelfServiceReset: false rejects forgot-password request
    const reqForgotA = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherA.email }),
    });
    const resForgotA = await forgotPasswordHandler(reqForgotA);
    assert(
      resForgotA.status === 403,
      'P0-09',
      'Disabling allowSelfServiceReset rejects password reset requests with 403',
      `Got status: ${resForgotA.status}`
    );

    // Test 3B: School B user can request password reset
    const reqForgotB = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherB.email }),
    });
    const resForgotB = await forgotPasswordHandler(reqForgotB);
    assert(
      resForgotB.status === 200,
      'P0-10',
      'School B user successfully requests password reset (tenant isolation verified)'
    );

    // Re-enable self-service reset on School A with resetLinkExpiryHours = 6
    await updateSchoolSetting(schoolA.id, 'security', {
      recovery: {
        allowSelfServiceReset: true,
        resetLinkExpiryHours: 6,
      },
    });
    invalidateSchoolSettingsCache(schoolA.id, 'security');

    // Test 3C: Reset link is issued and reflects configured expiry
    const reqForgotA2 = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherA.email }),
    });
    const resForgotA2 = await forgotPasswordHandler(reqForgotA2);
    assert(
      resForgotA2.status === 200,
      'P0-11',
      'Password reset request succeeds once allowSelfServiceReset is re-enabled',
      `Got status: ${resForgotA2.status}`
    );

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: teacherA.id },
      orderBy: { createdAt: 'desc' },
    });
    const now = Date.now();
    const tokenLifespanHours = tokenRecord ? (tokenRecord.expiresAt.getTime() - now) / 3600000 : 0;
    assert(
      tokenRecord !== null && tokenLifespanHours > 5.5 && tokenLifespanHours <= 6.1,
      'P0-12',
      'Reset token validity duration respects configured resetLinkExpiryHours (6 hours)'
    );

    // Test 3D: Custom password complexity policy enforced during reset
    await updateSchoolSetting(schoolA.id, 'security', {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        maxFailedAttempts: 5,
        lockoutMinutes: 15,
      },
    });
    invalidateSchoolSettingsCache(schoolA.id, 'security');

    // Create a known raw token for reset
    const rawResetToken = generateSecureToken(32);
    const resetTokenHash = hashToken(rawResetToken);
    await prisma.passwordResetToken.create({
      data: {
        userId: teacherA.id,
        tokenHash: resetTokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Attempt reset with weak 8-character password
    const reqResetWeak = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        newPassword: 'Short@1',
      }),
    });
    const resResetWeak = await resetPasswordHandler(reqResetWeak);
    assert(
      resResetWeak.status === 422,
      'P0-13',
      'Password reset rejected with 422 when password fails school custom complexity policy (minLength 12)'
    );

    // Attempt reset with compliant 14-character password
    const reqResetStrong = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        newPassword: 'SuperStrong@Pass2026',
      }),
    });
    const resResetStrong = await resetPasswordHandler(reqResetStrong);
    assert(
      resResetStrong.status === 200,
      'P0-14',
      'Password reset succeeds with compliant password matching tenant complexity policy'
    );

    // -------------------------------------------------------------
    // GROUP 4: DATABASE-BACKED SESSION LISTING & REVOCATION
    // -------------------------------------------------------------
    console.log('\nGROUP 4: DATABASE-BACKED SESSION LISTING & REVOCATION');

    // Create 3 active sessions in PostgreSQL for teacherA
    const session1 = await createSession({
      userId: teacherA.id,
      schoolId: schoolA.id,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      ipAddress: '192.168.1.10',
    });

    const session2 = await createSession({
      userId: teacherA.id,
      schoolId: schoolA.id,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1',
      ipAddress: '10.0.0.5',
    });

    const session3 = await createSession({
      userId: teacherA.id,
      schoolId: schoolA.id,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/122.0',
      ipAddress: '172.16.0.22',
    });

    // Test 4A: List sessions via GET /api/auth/sessions
    const reqListSessions = new NextRequest('http://localhost:3000/api/auth/sessions', {
      method: 'GET',
      headers: {
        Cookie: `rivo_session=${session1.rawToken}`,
      },
    });
    const resListSessions = await sessionsGetHandler(reqListSessions);
    const jsonSessions = await resListSessions.json();

    assert(
      resListSessions.status === 200 &&
      Array.isArray(jsonSessions.sessions) &&
      jsonSessions.sessions.length >= 3,
      'P0-15',
      'GET /api/auth/sessions returns active PostgreSQL sessions'
    );

    const currentSessionInList = jsonSessions.sessions.find((s: any) => s.id === session1.sessionId);
    const otherSessionInList = jsonSessions.sessions.find((s: any) => s.id === session2.sessionId);
    assert(
      currentSessionInList?.isCurrent === true &&
      currentSessionInList?.device === 'Windows PC' &&
      otherSessionInList?.isCurrent === false &&
      otherSessionInList?.device === 'Apple iPhone',
      'P0-16',
      'Session metadata parses device/browser and flags isCurrent accurately'
    );

    // Test 4B: Revoke specific session (session2)
    const reqRevokeSingle = new NextRequest(`http://localhost:3000/api/auth/sessions?id=${session2.sessionId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `rivo_session=${session1.rawToken}`,
      },
    });
    const resRevokeSingle = await sessionsDeleteHandler(reqRevokeSingle);
    assert(
      resRevokeSingle.status === 200,
      'P0-17',
      'DELETE /api/auth/sessions?id=... successfully revokes target session'
    );

    const checkRevoked = await getValidSession(session2.rawToken);
    assert(
      checkRevoked === null,
      'P0-18',
      'Revoked session token is immediately rejected by getValidSession'
    );

    const checkCurrentStillActive = await getValidSession(session1.rawToken);
    assert(
      checkCurrentStillActive !== null && checkCurrentStillActive.sessionId === session1.sessionId,
      'P0-19',
      'Current session remains active after revoking sibling session'
    );

    // Test 4C: Revoke all other sessions (terminate others)
    const reqRevokeOthers = new NextRequest('http://localhost:3000/api/auth/sessions?allOthers=true', {
      method: 'DELETE',
      headers: {
        Cookie: `rivo_session=${session1.rawToken}`,
      },
    });
    const resRevokeOthers = await sessionsDeleteHandler(reqRevokeOthers);
    const jsonRevokeOthers = await resRevokeOthers.json();

    assert(
      resRevokeOthers.status === 200 && jsonRevokeOthers.terminatedCount >= 1,
      'P0-20',
      'DELETE /api/auth/sessions?allOthers=true terminates all concurrent sessions'
    );

    const checkSession3Revoked = await getValidSession(session3.rawToken);
    assert(
      checkSession3Revoked === null,
      'P0-21',
      'Session 3 is revoked by terminate-all-others sweep'
    );

    const checkCurrentAfterSweep = await getValidSession(session1.rawToken);
    assert(
      checkCurrentAfterSweep !== null,
      'P0-22',
      'Current session survives the terminate-all-others sweep intact'
    );

    // Test 4D: Self-termination guard prevents deleting current session via /sessions?id
    const reqSelfRevoke = new NextRequest(`http://localhost:3000/api/auth/sessions?id=${session1.sessionId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `rivo_session=${session1.rawToken}`,
      },
    });
    const resSelfRevoke = await sessionsDeleteHandler(reqSelfRevoke);
    assert(
      resSelfRevoke.status === 400,
      'P0-23',
      'Prevent self-termination: attempting to revoke current session via ?id returns 400'
    );

    // -------------------------------------------------------------
    // GROUP 5: SECURITY AUDIT LOGGING VERIFICATION
    // -------------------------------------------------------------
    console.log('\nGROUP 5: SECURITY AUDIT LOGGING VERIFICATION');

    const auditLogs = await prisma.securityAuditLog.findMany({
      where: {
        userId: { in: [teacherA.id, unverifiedTeacherA.id] },
      },
      select: { event: true, details: true },
    });

    const eventsSet = new Set(auditLogs.map((l) => l.event));
    assert(
      eventsSet.has('LOGIN_FAILURE') &&
      eventsSet.has('PASSWORD_RESET_REQUEST') &&
      eventsSet.has('SESSION_REVOKED') &&
      eventsSet.has('LOGOUT_ALL'),
      'P0-24',
      'Security audit logs record LOGIN_FAILURE, PASSWORD_RESET_REQUEST, SESSION_REVOKED, and LOGOUT_ALL'
    );

  } finally {
    // Teardown test fixtures
    await prisma.session.deleteMany({
      where: { userId: { in: [directorA.id, teacherA.id, unverifiedTeacherA.id, teacherB.id] } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: [directorA.id, teacherA.id, unverifiedTeacherA.id, teacherB.id] } },
    });
    await prisma.securityAuditLog.deleteMany({
      where: { userId: { in: [directorA.id, teacherA.id, unverifiedTeacherA.id, teacherB.id] } },
    });
    await prisma.schoolMembership.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.schoolSetting.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [directorA.id, teacherA.id, unverifiedTeacherA.id, teacherB.id] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [schoolA.id, schoolB.id] } },
    });
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityP0TestSuite().catch((err) => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});
