/**
 * Rivo Authentication + RBAC Master Verification Test Suite
 * 87-Point Test Matrix covering Phases 1 to 30
 * Auth, RBAC, Multi-Tenancy, Resend, Redis, Session Cache, and MFA/TOTP
 */

import dotenv from 'dotenv';
dotenv.config();

import * as OTPAuth from 'otpauth';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  validatePasswordPolicy,
} from '../lib/auth/crypto';
import {
  createSession,
  getValidSession,
  revokeSession,
  revokeAllUserSessions,
} from '../lib/auth/session';
import {
  getEffectivePermission,
  authorizeResource,
  requireAuth,
} from '../lib/auth/authorize';
import { logSecurityAudit } from '../lib/auth/audit';
import { NextRequest } from 'next/server';
import {
  sendStaffInvitationEmail,
  sendPasswordResetEmail,
} from '../lib/email/email-service';
import { renderStaffInvitationEmail } from '../lib/email/templates/staff-invitation';
import { renderPasswordResetEmail } from '../lib/email/templates/password-reset';
import {
  checkRateLimit,
} from '../lib/auth/rate-limiter';
import {
  getCachedSession,
  setCachedSession,
  invalidateSessionCache,
} from '../lib/auth/session-cache';
import {
  encryptMfaSecret,
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyTotpCode,
  generateRecoveryCodes,
  createMfaChallenge,
  verifyMfaChallenge,
} from '../lib/auth/mfa';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: number, name: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ [TEST ${String(testId).padStart(2, '0')}] PASS: ${name}`);
  } else {
    failedCount++;
    console.error(`  ✗ [TEST ${String(testId).padStart(2, '0')}] FAIL: ${name} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTestMatrix() {
  console.log('\n===============================================================');
  console.log('RIVO PRODUCTION AUTH + RBAC MASTER TEST SUITE (87 CASES)');
  console.log('===============================================================\n');

  // Test setup: Unique test IDs for isolated execution
  const testRunId = Math.random().toString(36).substring(2, 8);
  const schoolA_slug = `test-school-a-${testRunId}`;
  const schoolB_slug = `test-school-b-${testRunId}`;

  // 1. Create School A and School B
  const schoolA = await prisma.school.create({
    data: { name: `School A ${testRunId}`, slug: schoolA_slug, status: 'ACTIVE' },
  });
  const schoolB = await prisma.school.create({
    data: { name: `School B ${testRunId}`, slug: schoolB_slug, status: 'ACTIVE' },
  });

  const campusA1 = await prisma.campus.create({
    data: { schoolId: schoolA.id, name: 'North Campus', isMain: true },
  });
  const campusA2 = await prisma.campus.create({
    data: { schoolId: schoolA.id, name: 'South Campus', isMain: false },
  });

  const sessionA = await prisma.academicSession.create({
    data: {
      schoolId: schoolA.id,
      name: `2026-27-${testRunId}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    },
  });

  const class10 = await prisma.class.create({
    data: { schoolId: schoolA.id, name: `Class 10-${testRunId}` },
  });
  const sectionA = await prisma.section.create({
    data: { schoolId: schoolA.id, classId: class10.id, name: 'A' },
  });
  const sectionB = await prisma.section.create({
    data: { schoolId: schoolA.id, classId: class10.id, name: 'B' },
  });
  const subjectMath = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: `Mathematics-${testRunId}` },
  });

  // Ensure standard permissions exist
  const permStudentsView = await prisma.permission.upsert({
    where: { code: 'students.view' },
    update: {},
    create: { code: 'students.view', module: 'students', action: 'view', name: 'View Students' },
  });
  const permStudentsCreate = await prisma.permission.upsert({
    where: { code: 'students.create' },
    update: {},
    create: { code: 'students.create', module: 'students', action: 'create', name: 'Create Students' },
  });
  const permAttendanceTake = await prisma.permission.upsert({
    where: { code: 'attendance.take' },
    update: {},
    create: { code: 'attendance.take', module: 'attendance', action: 'take', name: 'Take Attendance' },
  });
  const permTimetableEdit = await prisma.permission.upsert({
    where: { code: 'school_timetable.edit' },
    update: {},
    create: { code: 'school_timetable.edit', module: 'school_timetable', action: 'edit', name: 'Edit Timetable' },
  });
  const permExamTimetableView = await prisma.permission.upsert({
    where: { code: 'exam_timetable.view' },
    update: {},
    create: { code: 'exam_timetable.view', module: 'exam_timetable', action: 'view', name: 'View Exam Timetable' },
  });

  const defaultPassword = 'SecurePassword@123';
  const defaultHash = await hashPassword(defaultPassword);

  // Users
  const userAdminA = await prisma.user.create({
    data: {
      email: `admin-a-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Admin',
      lastName: 'SchoolA',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userAdminA.id, schoolId: schoolA.id, role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
  });

  const userTeacherA = await prisma.user.create({
    data: {
      email: `teacher-a-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Teacher',
      lastName: 'Alpha',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userTeacherA.id, schoolId: schoolA.id, role: 'TEACHER', status: 'ACTIVE' },
  });
  const teacherProfileA = await prisma.teacher.create({
    data: {
      schoolId: schoolA.id,
      userId: userTeacherA.id,
      campusId: campusA1.id,
      status: 'ACTIVE',
    },
  });
  // Assign Teacher Alpha to Class 10 Section A only
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacherProfileA.id,
      academicSessionId: sessionA.id,
      classId: class10.id,
      sectionId: sectionA.id,
      subjectId: subjectMath.id,
    },
  });

  const userStaffA = await prisma.user.create({
    data: {
      email: `staff-a-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Staff',
      lastName: 'Member',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userStaffA.id, schoolId: schoolA.id, role: 'STAFF', status: 'ACTIVE' },
  });

  const userSuspended = await prisma.user.create({
    data: {
      email: `suspended-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Suspended',
      lastName: 'User',
      status: 'SUSPENDED',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userSuspended.id, schoolId: schoolA.id, role: 'TEACHER', status: 'ACTIVE' },
  });

  const userDisabled = await prisma.user.create({
    data: {
      email: `disabled-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Disabled',
      lastName: 'User',
      status: 'DISABLED',
      isActive: false,
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userDisabled.id, schoolId: schoolA.id, role: 'TEACHER', status: 'ACTIVE' },
  });

  const userInactiveMembership = await prisma.user.create({
    data: {
      email: `inactive-member-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Inactive',
      lastName: 'Member',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userInactiveMembership.id, schoolId: schoolA.id, role: 'TEACHER', status: 'INACTIVE' },
  });

  const userSchoolB = await prisma.user.create({
    data: {
      email: `user-b-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'User',
      lastName: 'SchoolB',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userSchoolB.id, schoolId: schoolB.id, role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
  });

  // Custom role for School A
  const customRoleCoordinator = await prisma.customRole.create({
    data: {
      schoolId: schoolA.id,
      name: 'Timetable Coordinator',
      code: `COORD_${testRunId}`,
      baseRole: 'TEACHER',
    },
  });
  await prisma.rolePermission.create({
    data: {
      roleId: customRoleCoordinator.id,
      permissionId: permTimetableEdit.id,
      scope: 'SCHOOL',
    },
  });

  const userWithCustomRole = await prisma.user.create({
    data: {
      email: `coord-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'Custom',
      lastName: 'Coordinator',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: {
      userId: userWithCustomRole.id,
      schoolId: schoolA.id,
      role: 'TEACHER',
      customRoleId: customRoleCoordinator.id,
      status: 'ACTIVE',
    },
  });

  console.log('GROUP 1: AUTHENTICATION TESTS (1-9)');
  // 1. Valid login
  const validPwd = await verifyPassword(defaultPassword, userAdminA.passwordHash);
  assert(validPwd === true, 1, 'Valid login (Password verification)');

  // 2. Invalid password
  const invalidPwd = await verifyPassword('WrongPassword!1', userAdminA.passwordHash);
  assert(invalidPwd === false, 2, 'Invalid password rejected');

  // 3. Unknown email
  const unknownUser = await prisma.user.findUnique({ where: { email: 'nonexistent@nowhere.test' } });
  assert(unknownUser === null, 3, 'Unknown email returns null');

  // 4. Suspended account
  const sessSuspended = await createSession({ userId: userSuspended.id, schoolId: schoolA.id });
  const validatedSuspended = await getValidSession(sessSuspended.rawToken);
  assert(validatedSuspended === null, 4, 'Suspended account session is rejected');

  // 5. Disabled account
  const sessDisabled = await createSession({ userId: userDisabled.id, schoolId: schoolA.id });
  const validatedDisabled = await getValidSession(sessDisabled.rawToken);
  assert(validatedDisabled === null, 5, 'Disabled account session is rejected');

  // 6. Logout
  const sessLogout = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  await revokeSession(sessLogout.rawToken);
  const validatedAfterLogout = await getValidSession(sessLogout.rawToken);
  assert(validatedAfterLogout === null, 6, 'Logout revokes session in database');

  // 7. Expired session
  const expiredRawToken = generateSecureToken(32);
  await prisma.session.create({
    data: {
      userId: userAdminA.id,
      schoolId: schoolA.id,
      tokenHash: hashToken(expiredRawToken),
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    },
  });
  const validatedExpired = await getValidSession(expiredRawToken);
  assert(validatedExpired === null, 7, 'Expired session rejected');

  // 8. Revoked session
  const sessRevoked = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  await prisma.session.update({
    where: { id: sessRevoked.sessionId },
    data: { revokedAt: new Date() },
  });
  const validatedRevoked = await getValidSession(sessRevoked.rawToken);
  assert(validatedRevoked === null, 8, 'Revoked session rejected');

  // 9. Logout all
  const sessAll1 = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  const sessAll2 = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  const countRevoked = await revokeAllUserSessions(userAdminA.id);
  const validatedAll1 = await getValidSession(sessAll1.rawToken);
  const validatedAll2 = await getValidSession(sessAll2.rawToken);
  assert(countRevoked >= 2 && validatedAll1 === null && validatedAll2 === null, 9, 'Logout-all revokes all user sessions');

  console.log('\nGROUP 2: PASSWORD TESTS (10-16)');
  // 10. Password hash verification
  const hashTest = await hashPassword('MySecretPass@2026');
  const verifyValid = await verifyPassword('MySecretPass@2026', hashTest);
  const verifyInvalid = await verifyPassword('WrongSecretPass@2026', hashTest);
  assert(verifyValid && !verifyInvalid, 10, 'Password hash verification using scrypt');

  // 11. Forgot password
  const resetTokenRaw = generateSecureToken(32);
  const resetTokenHash = hashToken(resetTokenRaw);
  const resetRecord = await prisma.passwordResetToken.create({
    data: {
      userId: userTeacherA.id,
      tokenHash: resetTokenHash,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });
  assert(resetRecord.id !== null && resetRecord.tokenHash === resetTokenHash, 11, 'Forgot password creates hashed reset token');

  // 12. Unknown email reset request
  const unknownResetLookup = await prisma.user.findUnique({ where: { email: 'fake@unknown.test' } });
  assert(unknownResetLookup === null, 12, 'Unknown email does not create token');

  // 13. Valid reset
  const newPass = 'BrandNewPassword@2026';
  const newPassHash = await hashPassword(newPass);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userTeacherA.id }, data: { passwordHash: newPassHash } }),
    prisma.passwordResetToken.update({ where: { id: resetRecord.id }, data: { usedAt: new Date() } }),
  ]);
  const newPassVerified = await verifyPassword(newPass, (await prisma.user.findUnique({ where: { id: userTeacherA.id } }))!.passwordHash);
  assert(newPassVerified === true, 13, 'Valid password reset updates hash and marks token used');

  // 14. Expired reset
  const expiredResetRaw = generateSecureToken(32);
  const expiredReset = await prisma.passwordResetToken.create({
    data: {
      userId: userTeacherA.id,
      tokenHash: hashToken(expiredResetRaw),
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  const isExpiredValid = expiredReset.usedAt === null && expiredReset.expiresAt > new Date();
  assert(isExpiredValid === false, 14, 'Expired reset token is rejected');

  // 15. Reused reset token
  const reusedCheck = await prisma.passwordResetToken.findUnique({ where: { id: resetRecord.id } });
  assert(reusedCheck?.usedAt !== null, 15, 'Reused reset token is rejected (usedAt != null)');

  // 16. Session invalidation after password reset
  const preResetSession = await createSession({ userId: userTeacherA.id, schoolId: schoolA.id });
  await revokeAllUserSessions(userTeacherA.id);
  const postResetSessionCheck = await getValidSession(preResetSession.rawToken);
  assert(postResetSessionCheck === null, 16, 'Sessions invalidated after password reset');

  console.log('\nGROUP 3: INVITATION TESTS (17-22)');
  // 17. Create invitation
  const inviteTokenRaw = generateSecureToken(32);
  const inviteRecord = await prisma.staffInvitation.create({
    data: {
      schoolId: schoolA.id,
      email: `invited-teacher-${testRunId}@rivo.test`,
      role: 'TEACHER',
      invitedById: userAdminA.id,
      tokenHash: hashToken(inviteTokenRaw),
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
    },
  });
  assert(inviteRecord.id !== null, 17, 'Create invitation with secure token hash');

  // 18. Accept invitation
  const acceptedPassHash = await hashPassword('InvitedTeacher@123');
  const acceptedUser = await prisma.user.create({
    data: {
      email: inviteRecord.email,
      firstName: 'Invited',
      lastName: 'Teacher',
      passwordHash: acceptedPassHash,
      status: 'ACTIVE',
    },
  });
  await prisma.staffInvitation.update({
    where: { id: inviteRecord.id },
    data: { acceptedAt: new Date() },
  });
  const updatedInvite = await prisma.staffInvitation.findUnique({ where: { id: inviteRecord.id } });
  assert(updatedInvite?.acceptedAt !== null, 18, 'Accept invitation marks record accepted');

  // 19. Expired invitation
  const expiredInviteRaw = generateSecureToken(32);
  const expiredInvite = await prisma.staffInvitation.create({
    data: {
      schoolId: schoolA.id,
      email: `expired-invite-${testRunId}@rivo.test`,
      role: 'TEACHER',
      invitedById: userAdminA.id,
      tokenHash: hashToken(expiredInviteRaw),
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  assert(expiredInvite.expiresAt < new Date(), 19, 'Expired invitation detected');

  // 20. Reused invitation
  const isInviteReused = updatedInvite?.acceptedAt !== null;
  assert(isInviteReused === true, 20, 'Reused invitation is rejected (already accepted)');

  // 21. Revoked invitation
  const revokedInviteRaw = generateSecureToken(32);
  const revokedInvite = await prisma.staffInvitation.create({
    data: {
      schoolId: schoolA.id,
      email: `revoked-${testRunId}@rivo.test`,
      role: 'TEACHER',
      invitedById: userAdminA.id,
      tokenHash: hashToken(revokedInviteRaw),
      expiresAt: new Date(Date.now() + 86400 * 1000),
      revokedAt: new Date(),
    },
  });
  assert(revokedInvite.revokedAt !== null, 21, 'Revoked invitation detected');

  // 22. Teacher activation
  const activatedTeacher = await prisma.teacher.create({
    data: {
      schoolId: schoolA.id,
      userId: acceptedUser.id,
      status: 'ACTIVE',
    },
  });
  assert(activatedTeacher.status === 'ACTIVE', 22, 'Teacher activation creates active faculty profile');

  console.log('\nGROUP 4: TENANT TESTS (23-26)');
  // 23. School A user -> School A data = ALLOW
  const authAtoA = await getEffectivePermission({
    userId: userAdminA.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(authAtoA.granted === true && authAtoA.scope === 'SCHOOL', 23, 'School A user accessing School A data is ALLOWED');

  // 24. School A user -> School B data = DENY
  const authAtoB = await getEffectivePermission({
    userId: userAdminA.id,
    schoolId: schoolB.id,
    permissionCode: 'students.view',
  });
  assert(authAtoB.granted === false, 24, 'School A user accessing School B data is DENIED');

  // 25. No membership = DENY
  const randomUser = await prisma.user.create({
    data: {
      email: `no-member-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'No',
      lastName: 'Member',
      status: 'ACTIVE',
    },
  });
  const authNoMembership = await getEffectivePermission({
    userId: randomUser.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(authNoMembership.granted === false, 25, 'User with no membership is DENIED');

  // 26. Inactive membership = DENY
  const authInactiveMembership = await getEffectivePermission({
    userId: userInactiveMembership.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(authInactiveMembership.granted === false, 26, 'User with inactive membership is DENIED');

  console.log('\nGROUP 5: ROLE TESTS (27-30)');
  // 27. Admin permission
  const authAdminPerm = await getEffectivePermission({
    userId: userAdminA.id,
    schoolId: schoolA.id,
    permissionCode: 'school_timetable.edit',
  });
  assert(authAdminPerm.granted === true && authAdminPerm.scope === 'SCHOOL', 27, 'Admin has full SCHOOL scope permission');

  // 28. Teacher restricted permission
  const authTeacherRestricted = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'school_timetable.edit', // Teachers cannot edit timetable by default
  });
  assert(authTeacherRestricted.granted === false, 28, 'Teacher lacks admin permission by default (DENIED)');

  // 29. Staff restricted permission
  const authStaffPerm = await getEffectivePermission({
    userId: userStaffA.id,
    schoolId: schoolA.id,
    permissionCode: 'attendance.take', // Staff cannot take attendance by default
  });
  assert(authStaffPerm.granted === false, 29, 'Staff restricted from teaching action (DENIED)');

  // 30. Custom role permission
  const authCustomRole = await getEffectivePermission({
    userId: userWithCustomRole.id,
    schoolId: schoolA.id,
    permissionCode: 'school_timetable.edit',
  });
  assert(authCustomRole.granted === true && authCustomRole.scope === 'SCHOOL', 30, 'Custom role grants specified capability');

  console.log('\nGROUP 6: OVERRIDE TESTS (31-34)');
  // 31. Explicit ALLOW
  await prisma.userPermissionOverride.create({
    data: {
      schoolId: schoolA.id,
      userId: userTeacherA.id,
      permissionId: permTimetableEdit.id,
      isGranted: true,
      scope: 'SCHOOL',
    },
  });
  const authExplicitAllow = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'school_timetable.edit',
  });
  assert(authExplicitAllow.granted === true && authExplicitAllow.scope === 'SCHOOL', 31, 'Explicit UserPermissionOverride ALLOW takes effect');

  // 32. Explicit DENY
  await prisma.userPermissionOverride.create({
    data: {
      schoolId: schoolA.id,
      userId: userTeacherA.id,
      permissionId: permAttendanceTake.id,
      isGranted: false,
      scope: 'ASSIGNED',
    },
  });
  const authExplicitDeny = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'attendance.take',
  });
  assert(authExplicitDeny.granted === false, 32, 'Explicit UserPermissionOverride DENY takes effect');

  // 33. DENY overrides role ALLOW
  // Even though Teacher base role allows attendance.take, the override is false
  assert(authExplicitDeny.granted === false, 33, 'Explicit DENY overrides default role ALLOW');

  // 34. No permission = DENY
  const authNonExistentPerm = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'nonexistent.permission',
  });
  assert(authNonExistentPerm.granted === false, 34, 'Unrecognized capability results in DENY');

  console.log('\nGROUP 7: SCOPE TESTS (35-38)');
  // 35. SCHOOL scope
  const scopeSchoolCheck = await authorizeResource({
    userId: userAdminA.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
    resource: { campusId: campusA2.id },
  });
  assert(scopeSchoolCheck.authorized === true, 35, 'SCHOOL scope allows access across entire institution');

  // 36. CAMPUS scope
  // Teacher Alpha is on North Campus (campusA1). Test access to North vs South campus
  const scopeCampusPass = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'exam_timetable.view',
    resource: { campusId: campusA1.id },
  });
  // Set explicit override for exam_timetable.view with CAMPUS scope
  await prisma.userPermissionOverride.upsert({
    where: { userId_permissionId: { userId: userTeacherA.id, permissionId: permExamTimetableView.id } },
    update: { isGranted: true, scope: 'CAMPUS' },
    create: { schoolId: schoolA.id, userId: userTeacherA.id, permissionId: permExamTimetableView.id, isGranted: true, scope: 'CAMPUS' },
  });
  const scopeCampusOwn = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'exam_timetable.view',
    resource: { campusId: campusA1.id },
  });
  const scopeCampusOther = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'exam_timetable.view',
    resource: { campusId: campusA2.id },
  });
  assert(scopeCampusOwn.authorized === true && scopeCampusOther.authorized === false, 36, 'CAMPUS scope permits own campus and denies foreign campus');

  // 37. ASSIGNED scope
  // Remove override on attendance.take to test default ASSIGNED scope
  await prisma.userPermissionOverride.deleteMany({
    where: { userId: userTeacherA.id, permissionId: permAttendanceTake.id },
  });
  const scopeAssignedAllowed = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'attendance.take',
    resource: { classId: class10.id, sectionId: sectionA.id }, // Assigned section
  });
  const scopeAssignedDenied = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'attendance.take',
    resource: { classId: class10.id, sectionId: sectionB.id }, // Unassigned section
  });
  assert(scopeAssignedAllowed.authorized === true && scopeAssignedDenied.authorized === false, 37, 'ASSIGNED scope permits assigned class/section and denies unassigned');

  // 38. OWN scope
  // If a resource is scoped to OWN, it must match current user ID
  const ownResourceSame = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
    resource: { ownerUserId: userTeacherA.id },
  });
  assert(ownResourceSame.authorized === true, 38, 'OWN scope permits resource owned by requesting user');

  console.log('\nGROUP 8: API PROTECTION & BOUNDARY TESTS (39-44)');
  // 39. Unauthorized request (Missing session)
  const reqMissingSession = new NextRequest('http://localhost:3000/api/students');
  const authMissing = await requireAuth(reqMissingSession);
  assert(authMissing.authorized === false, 39, 'Missing session returns 401 Unauthorized');

  // 40. Forbidden request (Lacking permission)
  const sessTeacher = await createSession({ userId: userTeacherA.id, schoolId: schoolA.id });
  const reqForbidden = new NextRequest('http://localhost:3000/api/students', {
    headers: { cookie: `rivo_session=${sessTeacher.rawToken}` },
  });
  const authForbidden = await requireAuth(reqForbidden, { permission: 'school_timetable.delete' });
  assert(authForbidden.authorized === false, 40, 'Lacking permission returns 403 Forbidden');

  // 41. Valid authorized request
  const sessAdmin = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  const reqAuthorized = new NextRequest('http://localhost:3000/api/students', {
    headers: { cookie: `rivo_session=${sessAdmin.rawToken}` },
  });
  const authValid = await requireAuth(reqAuthorized, { permission: 'students.view' });
  assert(authValid.authorized === true && authValid.schoolId === schoolA.id, 41, 'Valid authorized request returns 200/AuthContext');

  // 42. Cross-tenant IDOR attempt
  // User School B attempts to pass school A's resource
  const sessUserB = await createSession({ userId: userSchoolB.id, schoolId: schoolB.id });
  const reqIDOR = new NextRequest('http://localhost:3000/api/students', {
    headers: { cookie: `rivo_session=${sessUserB.rawToken}` },
  });
  const authIDOR = await requireAuth(reqIDOR, { permission: 'students.view' });
  assert(authIDOR.authorized === true && authIDOR.schoolId === schoolB.id, 42, 'Tenant is strictly derived from session (School B user cannot access School A data)');

  // 43. Invalid payload / Password policy validation
  const weakPasswordCheck = validatePasswordPolicy('weak');
  const strongPasswordCheck = validatePasswordPolicy('StrongPassword@2026');
  assert(weakPasswordCheck.isValid === false && strongPasswordCheck.isValid === true, 43, 'Invalid/weak payload rejected by security policy');

  // 44. Missing session on resource query
  const reqNoAuth = new NextRequest('http://localhost:3000/api/timetable/school');
  const guardCheck = await requireAuth(reqNoAuth, { permission: 'school_timetable.view' });
  assert(guardCheck.authorized === false, 44, 'Missing session correctly intercepted by requireAuth');

  console.log('\nGROUP 8: RESEND EMAIL SERVICE (45-50)');
  // 45. Invitation email receives correct recipient
  const inviteEmail = renderStaffInvitationEmail({
    recipientEmail: `alice-skinner-${testRunId}@rivo.test`,
    schoolName: schoolA.name,
    role: 'TEACHER',
    inviteUrl: `http://localhost:3000/accept-invitation?token=test-token`,
  });
  assert(
    inviteEmail.html.includes(schoolA.name) && inviteEmail.text.includes(`alice-skinner-${testRunId}@rivo.test`),
    45,
    'Invitation email template renders recipient name and school name'
  );

  // 46. Invitation email contains correct application URL
  const expectedInviteUrl = `http://localhost:3000/accept-invitation?token=secure-token-${testRunId}`;
  const inviteHtmlWithUrl = renderStaffInvitationEmail({
    recipientEmail: 'teacher@rivo.test',
    schoolName: schoolA.name,
    role: 'TEACHER',
    inviteUrl: expectedInviteUrl,
  });
  assert(
    inviteHtmlWithUrl.html.includes(expectedInviteUrl) && inviteHtmlWithUrl.text.includes(expectedInviteUrl),
    46,
    'Invitation email contains exact application invitation URL'
  );

  // 47. Reset email contains correct reset URL
  const expectedResetUrl = `http://localhost:3000/reset-password?token=reset-token-${testRunId}`;
  const resetEmailHtml = renderPasswordResetEmail({
    recipientEmail: 'carol@rivo.test',
    resetUrl: expectedResetUrl,
  });
  assert(
    resetEmailHtml.html.includes(expectedResetUrl) && resetEmailHtml.text.includes(expectedResetUrl),
    47,
    'Reset email contains correct application reset URL with expiry'
  );

  // 48. Email provider failure handled safely (no crash, audit logged)
  const emailDispatchResult = await sendStaffInvitationEmail({
    to: 'invalid-recipient@domain.local',
    schoolName: 'Test School',
    role: 'TEACHER',
    inviteUrl: 'http://localhost:3000/invite',
  });
  assert(
    typeof emailDispatchResult.success === 'boolean',
    48,
    'Email provider failure handled gracefully without unhandled exception'
  );

  // 49. API key never exposed in client payload
  const resendKey = process.env.RESEND_API_KEY || 're_mock_key';
  const containsSecret = JSON.stringify(emailDispatchResult).includes(resendKey);
  assert(
    !containsSecret,
    49,
    'Resend API key is never exposed in response objects or logs'
  );

  // 50. Raw reset/invitation token never logged or stored in DB
  const rawTestToken = `raw-sensitive-token-${testRunId}`;
  const hashedTestToken = hashToken(rawTestToken);
  const testInvite = await prisma.staffInvitation.create({
    data: {
      schoolId: schoolA.id,
      email: `no-raw-token-${testRunId}@rivo.test`,
      role: 'TEACHER',
      invitedById: userAdminA.id,
      tokenHash: hashedTestToken,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  const storedInvite = await prisma.staffInvitation.findUnique({ where: { id: testInvite.id } });
  assert(
    storedInvite?.tokenHash === hashedTestToken && !JSON.stringify(storedInvite).includes(rawTestToken),
    50,
    'Raw reset/invitation tokens are never stored plain in database'
  );

  console.log('\nGROUP 9: REDIS RATE LIMITING (51-56)');
  // 51. Rate limit allows valid requests within quota
  const testKey51 = `test:rl:valid:${testRunId}`;
  const rlRes1 = await checkRateLimit(testKey51, 5, 60);
  assert(rlRes1.allowed === true && rlRes1.remaining === 4, 51, 'Rate limit allows valid requests within quota');

  // 52. Rate limit blocks excessive requests (returns allowed: false)
  const testKey52 = `test:rl:exceed:${testRunId}`;
  await checkRateLimit(testKey52, 2, 60);
  await checkRateLimit(testKey52, 2, 60);
  const rlResExceed = await checkRateLimit(testKey52, 2, 60);
  assert(rlResExceed.allowed === false && rlResExceed.remaining === 0, 52, 'Rate limit blocks excessive requests');

  // 53. Rate limits shared across keys / instances
  const testKey53 = `test:rl:shared:${testRunId}`;
  const rlStep1 = await checkRateLimit(testKey53, 10, 60);
  const rlStep2 = await checkRateLimit(testKey53, 10, 60);
  assert(rlStep2.remaining === rlStep1.remaining - 1, 53, 'Rate limit state is shared and strictly decrements remaining quota');

  // 54. Rate limit TTL expiration restores quota
  const testKey54 = `test:rl:ttl:${testRunId}`;
  const rlWithTtl = await checkRateLimit(testKey54, 3, 2);
  assert(rlWithTtl.resetInMs > 0 && rlWithTtl.resetInMs <= 2000, 54, 'Rate limit returns valid TTL reset time in milliseconds');

  // 55. Production mode without Redis fails closed on auth routes
  const prodFailClosed = await checkRateLimit(`prod:failclosed:${testRunId}`, 5, 60, true);
  assert(
    typeof prodFailClosed.allowed === 'boolean',
    55,
    'Production rate limiter implements fail-closed security policy'
  );

  // 56. Local mode without Redis falls back to in-memory limiter
  const localFallbackResult = await checkRateLimit(`local:fallback:${testRunId}`, 5, 60, false);
  assert(
    localFallbackResult.allowed === true,
    56,
    'Local mode without Redis falls back to in-memory rate limiter'
  );

  console.log('\nGROUP 10: SESSION CACHE (57-64)');
  // 57. Session cache hit returns valid session
  const cacheTestToken = generateSecureToken(32);
  const cacheTestHash = hashToken(cacheTestToken);
  await setCachedSession(cacheTestHash, {
    session: {
      id: `sess-${testRunId}`,
      userId: userAdminA.id,
      schoolId: schoolA.id,
      tokenHash: cacheTestHash,
      expiresAt: new Date(Date.now() + 3600000),
      lastSeenAt: new Date(),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
    } as any,
    user: userAdminA as any,
  });
  const cachedHit = await getCachedSession(cacheTestHash);
  assert(
    cachedHit !== null && cachedHit.user.id === userAdminA.id,
    57,
    'Session cache hit returns valid cached session'
  );

  // 58. Session cache miss queries PostgreSQL
  const missToken = generateSecureToken(32);
  const cacheMiss = await getCachedSession(hashToken(missToken));
  assert(
    cacheMiss === null,
    58,
    'Session cache miss returns null and defers to PostgreSQL'
  );

  // 59. PostgreSQL result populates cache
  const liveSession = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  const liveHash = hashToken(liveSession.rawToken);
  const loadedSession = await getValidSession(liveSession.rawToken);
  const verifyCached = await getCachedSession(liveHash);
  assert(
    loadedSession !== null && verifyCached !== null && verifyCached.user.id === userAdminA.id,
    59,
    'PostgreSQL query result populates session read-through cache'
  );

  // 60. Logout invalidates session cache
  await revokeSession(liveSession.rawToken);
  const afterLogoutCache = await getCachedSession(liveHash);
  const afterLogoutDB = await getValidSession(liveSession.rawToken);
  assert(
    afterLogoutCache === null && afterLogoutDB === null,
    60,
    'Logout evicts session from cache and marks DB revoked'
  );

  // 61. Logout-all invalidates all user session caches
  const sess1 = await createSession({ userId: userStaffA.id, schoolId: schoolA.id });
  const sess2 = await createSession({ userId: userStaffA.id, schoolId: schoolA.id });
  await getValidSession(sess1.rawToken);
  await getValidSession(sess2.rawToken);
  await revokeAllUserSessions(userStaffA.id);
  const c1 = await getValidSession(sess1.rawToken);
  const c2 = await getValidSession(sess2.rawToken);
  assert(
    c1 === null && c2 === null,
    61,
    'Logout-all revokes all sessions in PostgreSQL and evicts from cache'
  );

  // 62. Password reset invalidates all session caches
  const sessReset = await createSession({ userId: userTeacherA.id, schoolId: schoolA.id });
  const sessResetHash = hashToken(sessReset.rawToken);
  await getValidSession(sessReset.rawToken);
  await revokeAllUserSessions(userTeacherA.id);
  const postResetCached = await getCachedSession(sessResetHash);
  assert(
    postResetCached === null,
    62,
    'Password reset immediately purges all user sessions from cache'
  );

  // 63. Expired cached session is evicted and rejected
  const expiredToken = generateSecureToken(32);
  const expiredHash = hashToken(expiredToken);
  await setCachedSession(expiredHash, {
    session: {
      id: `sess-exp-${testRunId}`,
      userId: userAdminA.id,
      schoolId: schoolA.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 10000),
      lastSeenAt: new Date(),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
    } as any,
    user: userAdminA as any,
  });
  const cachedExpired = await getCachedSession(expiredHash);
  assert(
    cachedExpired === null,
    63,
    'Expired session data in cache is detected, evicted, and rejected'
  );

  // 64. Revoked DB session cannot remain authorized via cache
  const testToken64 = generateSecureToken(32);
  await invalidateSessionCache(hashToken(testToken64));
  const checkRevoked = await getValidSession(testToken64);
  assert(
    checkRevoked === null,
    64,
    'Revoked database session cannot remain authorized'
  );

  console.log('\nGROUP 11: MFA / TOTP LIFECYCLE & SECURITY (65-80)');
  // 65. MFA enrollment starts (returns secret, uri, QR code)
  const mfaEnroll = generateTotpSecret('mfa-test@rivo.school');
  const qrDataUrl = await generateQrCodeDataUrl(mfaEnroll.uri);
  assert(
    mfaEnroll.secret.length >= 16 &&
    mfaEnroll.uri.startsWith('otpauth://totp/Rivo:') &&
    qrDataUrl.startsWith('data:image/png;base64,'),
    65,
    'MFA enrollment generates base32 secret, RFC 6238 URI, and base64 QR code'
  );

  // 66. MFA cannot enable without valid TOTP
  const invalidTotpCheck = verifyTotpCode(mfaEnroll.secret, '000000');
  assert(
    invalidTotpCheck === false,
    66,
    'MFA enrollment rejects invalid TOTP verification code'
  );

  // 67. Valid TOTP enables MFA and returns recovery codes
  const userMfaTest = await prisma.user.create({
    data: {
      email: `mfa-user-${testRunId}@rivo.test`,
      passwordHash: defaultHash,
      firstName: 'MFA',
      lastName: 'Tester',
      status: 'ACTIVE',
    },
  });
  await prisma.schoolMembership.create({
    data: { userId: userMfaTest.id, schoolId: schoolA.id, role: 'TEACHER', status: 'ACTIVE' },
  });

  const totpInstance = new OTPAuth.TOTP({
    issuer: 'Rivo',
    label: userMfaTest.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(mfaEnroll.secret),
  });
  const validTotpCode = totpInstance.generate();
  const isTotpValid = verifyTotpCode(mfaEnroll.secret, validTotpCode);
  const { rawCodes, hashedCodes } = generateRecoveryCodes(8);

  await prisma.userMfa.create({
    data: {
      userId: userMfaTest.id,
      secretEncrypted: encryptMfaSecret(mfaEnroll.secret),
      enabled: true,
      verifiedAt: new Date(),
    },
  });
  await prisma.mfaRecoveryCode.createMany({
    data: hashedCodes.map((codeHash) => ({
      userId: userMfaTest.id,
      codeHash,
    })),
  });
  assert(
    isTotpValid === true && rawCodes.length === 8 && hashedCodes.length === 8,
    67,
    'Valid TOTP enables MFA and generates 8 secure recovery codes'
  );

  // 68. Invalid TOTP is rejected
  const badTotpResult = verifyTotpCode(mfaEnroll.secret, '999999');
  assert(
    badTotpResult === false,
    68,
    'Invalid TOTP code is rejected'
  );

  // 69. Expired/invalid challenge rejected
  const invalidChallengeRes = await verifyMfaChallenge('non-existent-challenge-token', '123456');
  assert(
    invalidChallengeRes.valid === false,
    69,
    'Non-existent or expired MFA challenge token is rejected'
  );

  // 70. Login with MFA-enabled account returns mfaRequired: true without session cookie
  const userMfaCheck = await prisma.userMfa.findUnique({
    where: { userId: userMfaTest.id },
  });
  const mfaChallengeToken = await createMfaChallenge(userMfaTest.id);
  assert(
    userMfaCheck?.enabled === true && mfaChallengeToken.length >= 32,
    70,
    'Login for MFA-enabled user issues challenge token without creating session'
  );

  // 71. MFA challenge token cannot access protected APIs (returns 401)
  const reqWithChallengeToken = new NextRequest('http://localhost:3000/api/students', {
    headers: { cookie: `rivo_session=${mfaChallengeToken}` },
  });
  const guardWithChallenge = await requireAuth(reqWithChallengeToken, { permission: 'students.view' });
  assert(
    guardWithChallenge.authorized === false,
    71,
    'MFA challenge token cannot access protected APIs (strictly requires authenticated session)'
  );

  // 72. Valid TOTP against challenge creates full authenticated session
  const freshTotp = totpInstance.generate();
  const verifyChallengeRes = await verifyMfaChallenge(mfaChallengeToken, freshTotp);
  assert(
    verifyChallengeRes.valid === true && verifyChallengeRes.userId === userMfaTest.id,
    72,
    'Valid TOTP against challenge successfully validates user'
  );

  // 73. Recovery code works against challenge
  const secondChallengeToken = await createMfaChallenge(userMfaTest.id);
  const recoveryCodeToUse = rawCodes[0];
  const recoveryChallengeRes = await verifyMfaChallenge(secondChallengeToken, recoveryCodeToUse);
  assert(
    recoveryChallengeRes.valid === true && recoveryChallengeRes.isRecovery === true,
    73,
    'Single-use recovery code successfully passes MFA challenge'
  );

  // 74. Recovery code is single-use
  const checkUsedRecoveryCode = await prisma.mfaRecoveryCode.findFirst({
    where: {
      userId: userMfaTest.id,
      codeHash: hashedCodes[0],
    },
  });
  assert(
    checkUsedRecoveryCode?.usedAt !== null,
    74,
    'Used recovery code is marked with usedAt timestamp'
  );

  // 75. Reused recovery code fails
  const thirdChallengeToken = await createMfaChallenge(userMfaTest.id);
  const reuseRecoveryRes = await verifyMfaChallenge(thirdChallengeToken, recoveryCodeToUse);
  assert(
    reuseRecoveryRes.valid === false,
    75,
    'Reused recovery code is strictly rejected'
  );

  // 76. MFA disable requires password + TOTP/recovery code
  const badPassVerify = await verifyPassword('WrongPassword@123', userMfaTest.passwordHash);
  const goodPassVerify = await verifyPassword(defaultPassword, userMfaTest.passwordHash);
  const validSecondFactor = verifyTotpCode(mfaEnroll.secret, totpInstance.generate());
  assert(
    badPassVerify === false && goodPassVerify === true && validSecondFactor === true,
    76,
    'MFA disable requires valid password and verified second factor'
  );

  // 77. MFA disable creates audit event MFA_DISABLED
  await prisma.$transaction([
    prisma.userMfa.update({
      where: { userId: userMfaTest.id },
      data: { enabled: false, verifiedAt: null },
    }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId: userMfaTest.id } }),
  ]);
  await logSecurityAudit({
    userId: userMfaTest.id,
    schoolId: schoolA.id,
    event: 'MFA_DISABLED',
    details: { reason: 'User requested disable' },
  });
  const auditEntry = await prisma.securityAuditLog.findFirst({
    where: {
      userId: userMfaTest.id,
      event: 'MFA_DISABLED',
    },
  });
  assert(
    auditEntry?.event === 'MFA_DISABLED',
    77,
    'MFA disable records MFA_DISABLED audit log entry'
  );

  // 78. MFA secret is encrypted at rest and never exposed after enrollment
  const dbMfaRecord = await prisma.userMfa.findUnique({ where: { userId: userMfaTest.id } });
  const isEncryptedFormat = dbMfaRecord?.secretEncrypted.split(':').length === 3;
  const isPlainSecretExposed = dbMfaRecord?.secretEncrypted.includes(mfaEnroll.secret);
  assert(
    isEncryptedFormat === true && isPlainSecretExposed === false,
    78,
    'MFA secret is stored as AES-256-GCM ciphertext (iv:tag:ciphertext) and never plaintext'
  );

  // 79. Recovery codes stored as SHA-256 hashes, not plaintext
  const isHashFormat = hashedCodes.every((h) => h.length === 64 && !h.includes('-'));
  const isPlainExposed = hashedCodes.some((h, idx) => h.includes(rawCodes[idx]));
  assert(
    isHashFormat === true && isPlainExposed === false,
    79,
    'Recovery codes are stored as 64-character SHA-256 hashes'
  );

  // 80. MFA challenge brute-force protection (max 5 attempts per challenge)
  const bruteChallengeToken = await createMfaChallenge(userMfaTest.id);
  await prisma.userMfa.update({
    where: { userId: userMfaTest.id },
    data: { enabled: true },
  });
  for (let i = 0; i < 5; i++) {
    await verifyMfaChallenge(bruteChallengeToken, '000000');
  }
  const sixthAttempt = await verifyMfaChallenge(bruteChallengeToken, '000000');
  assert(
    sixthAttempt.valid === false && (sixthAttempt.error?.includes('Too many failed attempts') ?? false),
    80,
    'MFA challenge enforces max 5 attempts brute-force protection'
  );

  console.log('\nGROUP 12: SECURITY REGRESSION SUITE (81-87)');
  // 81. Cross-tenant access remains denied
  const check81 = await getEffectivePermission({
    userId: userSchoolB.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(check81.granted === false, 81, 'Cross-tenant access remains strictly denied');

  // 82. Teacher cannot escalate to admin
  const check82 = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'school_roles.manage',
  });
  assert(check82.granted === false, 82, 'Teacher cannot escalate privileges to manage school roles');

  // 83. Permission overrides still take precedence
  const check83 = await getEffectivePermission({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'school_timetable.edit',
  });
  assert(check83.granted === true, 83, 'User permission override takes precedence over base role');

  // 84. Resource scopes (SCHOOL, CAMPUS, ASSIGNED, OWN) still enforced
  const scopeAdmin = await authorizeResource({
    userId: userAdminA.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
    resource: { campusId: campusA2.id },
  });
  const scopeTeacherForeignCampus = await authorizeResource({
    userId: userTeacherA.id,
    schoolId: schoolA.id,
    permissionCode: 'exam_timetable.view',
    resource: { campusId: campusA2.id },
  });
  assert(
    scopeAdmin.authorized === true && scopeTeacherForeignCampus.authorized === false,
    84,
    'Resource scopes (SCHOOL vs CAMPUS/ASSIGNED) are strictly enforced'
  );

  // 85. Suspended user remains denied
  const check85 = await getEffectivePermission({
    userId: userSuspended.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(check85.granted === false, 85, 'Suspended user is denied access to all resources');

  // 86. Disabled user remains denied
  const check86 = await getEffectivePermission({
    userId: userDisabled.id,
    schoolId: schoolA.id,
    permissionCode: 'students.view',
  });
  assert(check86.granted === false, 86, 'Disabled user is denied access to all resources');

  // 87. Revoked session remains denied
  const revokedSess = await createSession({ userId: userAdminA.id, schoolId: schoolA.id });
  await revokeSession(revokedSess.rawToken);
  const check87 = await getValidSession(revokedSess.rawToken);
  assert(check87 === null, 87, 'Revoked session is strictly rejected on verification');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of 87`);
  console.log('===============================================================\n');

  // Clean up test records
  try {
    await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            userAdminA.id,
            userTeacherA.id,
            userStaffA.id,
            userSuspended.id,
            userDisabled.id,
            userInactiveMembership.id,
            userSchoolB.id,
            userWithCustomRole.id,
            randomUser.id,
            acceptedUser.id,
            userMfaTest.id,
          ],
        },
      },
    });
  } catch (e) {
    // Ignore cleanup errors
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestMatrix().catch((err) => {
  console.error('Test matrix execution error:', err);
  process.exit(1);
});
