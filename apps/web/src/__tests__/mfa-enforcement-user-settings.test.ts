import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import { GET as getUsers, PATCH as patchUser } from '@/app/api/users/route';

async function runTests() {
  console.log('\n===============================================================');
  console.log('RIVO MFA ENFORCEMENT & USER STAFF ID INTEGRATION SUITE');
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

  // 1. Find or create test school
  let school = await prisma.school.findFirst({ where: { status: 'ACTIVE' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Test Academy for MFA Settings',
        slug: `test-mfa-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
  }

  // 2. Create Director user to perform admin operations
  const directorEmail = `director.mfa.${Date.now()}@test.edu`;
  const directorUser = await prisma.user.create({
    data: {
      email: directorEmail,
      firstName: 'Director',
      lastName: 'Admin',
      status: 'ACTIVE',
      isActive: true,
      memberships: {
        create: {
          schoolId: school.id,
          role: 'DIRECTOR',
          status: 'ACTIVE',
        },
      },
    },
  });

  const directorSession = await createSession({
    userId: directorUser.id,
    schoolId: school.id,
  });

  // 3. Create target Fee Manager user
  const targetEmail = `feemanager.mfa.${Date.now()}@test.edu`;
  const targetUser = await prisma.user.create({
    data: {
      email: targetEmail,
      firstName: 'Rina',
      lastName: 'Kumari',
      phone: '9876543210',
      status: 'ACTIVE',
      isActive: true,
      memberships: {
        create: {
          schoolId: school.id,
          role: 'FEE_MANAGER',
          status: 'ACTIVE',
        },
      },
    },
  });

  const cookieHeader = `rivo_session=${directorSession.rawToken}; rivo_active_school_id=${school.id}`;

  // -------------------------------------------------------------
  // TEST 1: GET /api/users returns staffId and initial mfaEnabled
  // -------------------------------------------------------------
  console.log('--- TEST 1: USER DIRECTORY FIELDS (STAFF ID & MFA STATUS) ---');

  const getReq1 = new NextRequest('http://localhost:3000/api/users', {
    headers: { cookie: cookieHeader },
  });
  const getRes1 = await getUsers(getReq1);
  const getData1 = await getRes1.json();

  assert(getRes1.status === 200, 'Director can fetch /api/users (HTTP 200)');
  const foundUser1 = getData1.users?.find((u: any) => u.id === targetUser.id);
  assert(foundUser1 !== undefined, 'Target user found in directory listing');
  assert(foundUser1.mfaEnabled === false, 'Target user initially has mfaEnabled = false');
  assert(typeof foundUser1.staffId === 'string' && foundUser1.staffId.startsWith('STF-'), 'Target user has formatted Staff ID (STF-...) instead of raw UUID');

  // -------------------------------------------------------------
  // TEST 2: PATCH /api/users with mfaEnabled = true persists to database
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: ENFORCE MFA VIA PATCH /api/users ---');

  const patchReq1 = new NextRequest('http://localhost:3000/api/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      userId: targetUser.id,
      mfaEnabled: true,
    }),
  });
  const patchRes1 = await patchUser(patchReq1);
  assert(patchRes1.status === 200, 'Director successfully enforces MFA (HTTP 200)');

  // Verify in Prisma DB directly
  const dbMfa1 = await prisma.userMfa.findUnique({ where: { userId: targetUser.id } });
  assert(dbMfa1 !== null && dbMfa1.type === 'ENFORCED', 'UserMfa record created with type ENFORCED in database');
  assert(dbMfa1.verifiedAt === null, 'verifiedAt is null (NOT auto-verified or auto-setup!)');
  assert(dbMfa1.enabled === false, 'enabled is false (Pending user QR scan and code verification)');

  // -------------------------------------------------------------
  // TEST 3: Subsequent GET /api/users reflects mfaEnabled = true (No toggle off on refresh!)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: REFRESH INTEGRITY (NO TOGGLE OFF ON RELOAD) ---');

  const getReq2 = new NextRequest('http://localhost:3000/api/users', {
    headers: { cookie: cookieHeader },
  });
  const getRes2 = await getUsers(getReq2);
  const getData2 = await getRes2.json();
  const foundUser2 = getData2.users?.find((u: any) => u.id === targetUser.id);
  assert(foundUser2.mfaEnabled === true, 'Subsequent GET /api/users retains mfaEnabled = true after refresh');
  assert(foundUser2.mfaEnforced === true, 'mfaEnforced is true');
  assert(foundUser2.mfaVerified === false, 'mfaVerified is false (pending setup by user)');

  // -------------------------------------------------------------
  // TEST 4: PATCH /api/users with mfaEnabled = false persists disablement
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: DISABLE MFA VIA PATCH /api/users ---');

  const patchReq2 = new NextRequest('http://localhost:3000/api/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      userId: targetUser.id,
      mfaEnabled: false,
    }),
  });
  const patchRes2 = await patchUser(patchReq2);
  assert(patchRes2.status === 200, 'Director successfully disables MFA (HTTP 200)');

  const dbMfa2 = await prisma.userMfa.findUnique({ where: { userId: targetUser.id } });
  assert(dbMfa2 === null || dbMfa2.type !== 'ENFORCED', 'UserMfa record un-enforced or removed in database');

  const getReq3 = new NextRequest('http://localhost:3000/api/users', {
    headers: { cookie: cookieHeader },
  });
  const getRes3 = await getUsers(getReq3);
  const getData3 = await getRes3.json();
  const foundUser3 = getData3.users?.find((u: any) => u.id === targetUser.id);
  assert(foundUser3.mfaEnabled === false, 'Subsequent GET /api/users retains mfaEnabled = false');

  // -------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------
  await prisma.userMfa.deleteMany({ where: { userId: targetUser.id } });
  await prisma.session.deleteMany({ where: { userId: { in: [directorUser.id, targetUser.id] } } });
  await prisma.schoolMembership.deleteMany({ where: { userId: { in: [directorUser.id, targetUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [directorUser.id, targetUser.id] } } });

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
