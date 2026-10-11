import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { getCanonicalAppUrl } from '@/lib/email/resend';
import { NextRequest } from 'next/server';
import { GET as verifyInvite } from '@/app/api/invitations/verify/route';
import { POST as acceptInvite } from '@/app/api/invitations/accept/route';

async function runTests() {
  console.log('\n===============================================================');
  console.log('RIVO STAFF INVITATION & EMAIL DELIVERY END-TO-END SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  // Find or create test school
  let testSchool = await prisma.school.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (!testSchool) {
    testSchool = await prisma.school.create({
      data: {
        name: 'Test Academy for Invitations',
        slug: `test-invitations-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
  }

  // Find a school admin/director to act as inviter
  let inviter = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (!inviter) {
    inviter = await prisma.user.create({
      data: {
        email: `inviter-${Date.now()}@test.edu`,
        firstName: 'Test',
        lastName: 'Director',
        status: 'ACTIVE',
      },
    });
  }

  // -------------------------------------------------------------
  // GROUP 1: INVITATION TOKEN GENERATION & HASHING
  // -------------------------------------------------------------
  console.log('--- GROUP 1: TOKEN GENERATION & HASH INTEGRITY ---');

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  assert(rawToken.length === 64, 'Raw token is 64 characters hex (32 secure bytes)');
  assert(tokenHash.length === 64, 'Token hash is 64 characters SHA-256');
  assert(rawToken !== tokenHash, 'Raw token does not equal token hash');

  const canonicalUrl = getCanonicalAppUrl();
  assert(typeof canonicalUrl === 'string' && canonicalUrl.length > 0, 'Canonical App URL resolves properly');

  const testEmail = `staff.invite.${Date.now()}@test.edu`;
  const expiresAt = new Date(Date.now() + 7 * 86400 * 1000);

  const invitation = await prisma.staffInvitation.create({
    data: {
      schoolId: testSchool.id,
      email: testEmail,
      role: 'TEACHER',
      invitedById: inviter.id,
      tokenHash,
      expiresAt,
    },
    include: { school: true },
  });

  assert(invitation.id !== null, 'Invitation record created in database');
  assert(invitation.tokenHash === tokenHash, 'Database securely stores SHA-256 token hash');

  const dbCheck = await prisma.staffInvitation.findUnique({
    where: { id: invitation.id },
  });
  assert(dbCheck !== null && !('rawToken' in dbCheck), 'Raw token is NEVER persisted in database schema');

  // -------------------------------------------------------------
  // GROUP 2: INVITATION VERIFICATION ENDPOINT
  // -------------------------------------------------------------
  console.log('\n--- GROUP 2: VERIFICATION ENDPOINT & DISTINCT ERROR CODES ---');

  // 2.1 Missing Token
  const missingTokenReq = new NextRequest('http://localhost:3000/api/invitations/verify');
  const missingTokenRes = await verifyInvite(missingTokenReq);
  const missingData = await missingTokenRes.json();
  assert(missingTokenRes.status === 400 && missingData.code === 'MISSING_TOKEN', 'Missing token returns code MISSING_TOKEN');

  // 2.2 Invalid Token
  const invalidTokenReq = new NextRequest('http://localhost:3000/api/invitations/verify?token=non_existent_token_123');
  const invalidTokenRes = await verifyInvite(invalidTokenReq);
  const invalidData = await invalidTokenRes.json();
  assert(invalidTokenRes.status === 400 && invalidData.code === 'INVALID_TOKEN', 'Non-existent token returns code INVALID_TOKEN');

  // 2.3 Valid Token
  const validTokenReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${rawToken}`);
  const validTokenRes = await verifyInvite(validTokenReq);
  const validData = await validTokenRes.json();
  assert(validTokenRes.status === 200 && validData.valid === true, 'Valid token resolves successfully');
  assert(validData.invitation?.email === testEmail, 'Resolved invitation matches invitee email');
  assert(validData.invitation?.schoolName === testSchool.name, 'Resolved invitation contains correct school name');

  // 2.4 Revoked Token
  const revokedToken = generateSecureToken(32);
  const revokedHash = hashToken(revokedToken);
  const revokedInvite = await prisma.staffInvitation.create({
    data: {
      schoolId: testSchool.id,
      email: `revoked.${Date.now()}@test.edu`,
      role: 'TEACHER',
      invitedById: inviter.id,
      tokenHash: revokedHash,
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    },
  });

  const revokedReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${revokedToken}`);
  const revokedRes = await verifyInvite(revokedReq);
  const revokedData = await revokedRes.json();
  assert(revokedRes.status === 400 && revokedData.code === 'REVOKED', 'Revoked invitation returns code REVOKED');

  // 2.5 Expired Token
  const expiredToken = generateSecureToken(32);
  const expiredHash = hashToken(expiredToken);
  await prisma.staffInvitation.create({
    data: {
      schoolId: testSchool.id,
      email: `expired.${Date.now()}@test.edu`,
      role: 'TEACHER',
      invitedById: inviter.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 10000), // Expired in the past
    },
  });

  const expiredReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${expiredToken}`);
  const expiredRes = await verifyInvite(expiredReq);
  const expiredData = await expiredRes.json();
  assert(expiredRes.status === 400 && expiredData.code === 'EXPIRED', 'Expired invitation returns code EXPIRED');

  // -------------------------------------------------------------
  // GROUP 3: TOKEN ROTATION & COPY LINK (WITHOUT SPAM)
  // -------------------------------------------------------------
  console.log('\n--- GROUP 3: TOKEN ROTATION & COPY LINK REFRESH ---');

  // Simulate rotation on the original invitation
  const freshRawToken = generateSecureToken(32);
  const freshHash = hashToken(freshRawToken);

  const rotatedInvite = await prisma.staffInvitation.update({
    where: { id: invitation.id },
    data: {
      tokenHash: freshHash,
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
    },
  });

  // Verify that OLD token is now invalid
  const oldVerifyReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${rawToken}`);
  const oldVerifyRes = await verifyInvite(oldVerifyReq);
  const oldVerifyData = await oldVerifyRes.json();
  assert(oldVerifyRes.status === 400 && oldVerifyData.code === 'INVALID_TOKEN', 'Previous token is strictly INVALID after rotation');

  // Verify that NEW rotated token works
  const freshVerifyReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${freshRawToken}`);
  const freshVerifyRes = await verifyInvite(freshVerifyReq);
  const freshVerifyData = await freshVerifyRes.json();
  assert(freshVerifyRes.status === 200 && freshVerifyData.valid === true, 'Fresh rotated token verifies successfully');

  // -------------------------------------------------------------
  // GROUP 4: SECURE INVITATION ACCEPTANCE & MEMBERSHIP
  // -------------------------------------------------------------
  console.log('\n--- GROUP 4: ATOMIC ACCEPTANCE & ACCOUNT ACTIVATION ---');

  // 4.1 Weak Password Rejected
  const weakPasswordReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({
      token: freshRawToken,
      fullName: 'Alice Johnson',
      password: 'short', // less than 8 chars
    }),
  });
  const weakPasswordRes = await acceptInvite(weakPasswordReq);
  assert(weakPasswordRes.status === 422, 'Weak password (<8 chars) is rejected with 422');

  // 4.2 Valid Acceptance
  const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({
      token: freshRawToken,
      fullName: 'Alice Johnson',
      password: 'StrongPassword123!',
    }),
  });
  const acceptRes = await acceptInvite(acceptReq);
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200 && acceptData.success === true, 'Invitation accepted successfully');
  assert(acceptData.user?.email === testEmail, 'Activated user email matches invitation');
  assert(acceptData.user?.roleType === 'TEACHER', 'Activated user role maps accurately');

  // 4.3 Database state verification
  const activatedUser = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { memberships: true },
  });
  assert(activatedUser !== null && activatedUser.status === 'ACTIVE', 'User record created in database with ACTIVE status');
  assert(activatedUser.memberships.length === 1, 'School membership created atomically');
  assert(activatedUser.memberships[0].role === 'TEACHER', 'Membership role strictly matches invitation role');
  assert(activatedUser.memberships[0].schoolId === testSchool.id, 'Membership belongs to target school');

  // 4.4 Invitation status updated in DB
  const acceptedInviteInDb = await prisma.staffInvitation.findUnique({
    where: { id: invitation.id },
  });
  assert(acceptedInviteInDb?.acceptedAt !== null, 'Invitation marked with acceptedAt timestamp');

  // 4.5 Single-use enforcement: Attempting to accept again is REJECTED
  const duplicateAcceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({
      token: freshRawToken,
      fullName: 'Alice Johnson Duplicate',
      password: 'StrongPassword123!',
    }),
  });
  const duplicateAcceptRes = await acceptInvite(duplicateAcceptReq);
  assert(duplicateAcceptRes.status === 400, 'Duplicate acceptance of used token is strictly DENIED');

  // 4.6 Verification of already accepted token
  const usedVerifyReq = new NextRequest(`http://localhost:3000/api/invitations/verify?token=${freshRawToken}`);
  const usedVerifyRes = await verifyInvite(usedVerifyReq);
  const usedVerifyData = await usedVerifyRes.json();
  assert(usedVerifyRes.status === 400 && usedVerifyData.code === 'ALREADY_ACCEPTED', 'Used token returns code ALREADY_ACCEPTED');

  // -------------------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // -------------------------------------------------------------
  await prisma.staffInvitation.deleteMany({
    where: { id: { in: [invitation.id, revokedInvite.id] } },
  });
  if (activatedUser) {
    await prisma.schoolMembership.deleteMany({ where: { userId: activatedUser.id } });
    await prisma.teacher.deleteMany({ where: { userId: activatedUser.id } });
    await prisma.session.deleteMany({ where: { userId: activatedUser.id } });
    await prisma.user.delete({ where: { id: activatedUser.id } });
  }

  console.log('\n===============================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
