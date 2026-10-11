import { prisma } from '@/lib/prisma';
import { authorizeResource } from '@/lib/auth/authorize';
import { createSession } from '@/lib/auth/session';
import { getNavForRole } from '@/config/navigation';
import { NextRequest } from 'next/server';
import { GET as getFeeStats } from '@/app/api/fees/stats/route';
import { GET as getAcademicSessions } from '@/app/api/academic-sessions/route';
import { GET as getCampuses } from '@/app/api/campuses/route';

async function runTests() {
  console.log('\n===============================================================');
  console.log('RIVO FEE MANAGER AUTHORIZATION & DASHBOARD INTEGRATION SUITE');
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

  async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (i === retries - 1) throw err;
        console.log(`  [pool retry ${i + 1}/${retries}] waiting for Neon pooler...`);
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    throw new Error('Database connection failed');
  }

  // Find or create test school with retry
  let school = await withRetry(async () => {
    let s = await prisma.school.findFirst({ where: { status: 'ACTIVE' } });
    if (!s) {
      s = await prisma.school.create({
        data: {
          name: 'Test Academy for Fee Manager',
          slug: `test-fees-${Date.now()}`,
          status: 'ACTIVE',
        },
      });
    }
    return s;
  });

  // Create or retrieve Fee Manager user
  const feeManagerEmail = `feemanager.${Date.now()}@test.edu`;
  const feeManagerUser = await prisma.user.create({
    data: {
      email: feeManagerEmail,
      firstName: 'Rohit',
      lastName: 'Cashier',
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
    include: { memberships: true },
  });

  // Create authoritative session for Fee Manager
  const feeManagerSession = await createSession({
    userId: feeManagerUser.id,
    schoolId: school.id,
  });

  // -------------------------------------------------------------
  // GROUP 1: PERMISSION & CAPABILITY CHECKS FOR FEE_MANAGER
  // -------------------------------------------------------------
  console.log('--- GROUP 1: FEE_MANAGER AUTHORIZATION CAPABILITIES ---');

  const permChecks = [
    'fees.view',
    'fees.payment_record',
    'fees.receipt_view',
    'fees.plan_create',
    'fees.assign',
    'students.view',
    'academic_sessions.view',
    'campuses.view',
    'classes.view',
    'sections.view',
  ];

  for (const perm of permChecks) {
    const res = await authorizeResource({
      userId: feeManagerUser.id,
      schoolId: school.id,
      permissionCode: perm,
    });
    assert(res.authorized === true, `FEE_MANAGER granted '${perm}'`, res.reason);
  }

  // Ensure FEE_MANAGER does NOT have unauthorized sensitive capabilities
  const unauthorizedPerms = ['settings.security', 'teachers.create', 'audit.platform'];
  for (const perm of unauthorizedPerms) {
    const res = await authorizeResource({
      userId: feeManagerUser.id,
      schoolId: school.id,
      permissionCode: perm,
    });
    assert(res.authorized === false, `FEE_MANAGER strictly denied '${perm}'`);
  }

  // -------------------------------------------------------------
  // GROUP 2: API ACCESS VIA requireAuth
  // -------------------------------------------------------------
  console.log('\n--- GROUP 2: API ENDPOINT ACCESS (FEE STATS, SESSIONS, CAMPUSES) ---');

  const cookieHeader = `rivo_session=${feeManagerSession.rawToken}; rivo_active_school_id=${school.id}`;

  // 2.1 Fee Stats API
  const statsReq = new NextRequest('http://localhost:3000/api/fees/stats', {
    headers: {
      cookie: cookieHeader,
    },
  });
  const statsRes = await getFeeStats(statsReq);
  const statsData = await statsRes.json();
  assert(statsRes.status === 200, 'Fee Manager successfully accesses /api/fees/stats (HTTP 200)');
  assert(statsData.summary !== undefined, 'Fee stats response includes summary metrics');
  assert(Array.isArray(statsData.collectionsByMode), 'Fee stats response includes collectionsByMode instrument breakdown');

  // 2.2 Academic Sessions API
  const sessReq = new NextRequest('http://localhost:3000/api/academic-sessions', {
    headers: {
      cookie: cookieHeader,
    },
  });
  const sessRes = await getAcademicSessions(sessReq);
  assert(sessRes.status === 200, 'Fee Manager successfully accesses /api/academic-sessions (HTTP 200)');

  // 2.3 Campuses API
  const campReq = new NextRequest('http://localhost:3000/api/campuses', {
    headers: {
      cookie: cookieHeader,
    },
  });
  const campRes = await getCampuses(campReq);
  assert(campRes.status === 200, 'Fee Manager successfully accesses /api/campuses (HTTP 200)');

  // -------------------------------------------------------------
  // GROUP 3: NAVIGATION CONFIGURATION FOR FEE_MANAGER
  // -------------------------------------------------------------
  console.log('\n--- GROUP 3: NAVIGATION STRUCTURE & FINANCE SHORTCUTS ---');

  const fmNav = getNavForRole('FEE_MANAGER');
  assert(fmNav.length > 0, 'getNavForRole returns configured navigation groups for FEE_MANAGER');

  const financeGroup = fmNav.find((g) => g.group === 'FINANCE');
  assert(financeGroup !== undefined, 'FEE_MANAGER has dedicated FINANCE navigation group');

  const expectedFinanceHrefs = [
    '/school/fees',
    '/school/fees/payments',
    '/school/fees/receipts',
    '/school/fees/plans',
  ];

  for (const href of expectedFinanceHrefs) {
    const item = financeGroup?.items.find((i) => i.href === href);
    assert(item !== undefined, `Finance navigation contains '${href}' (${item?.title})`);
  }

  // -------------------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // -------------------------------------------------------------
  await prisma.session.deleteMany({ where: { userId: feeManagerUser.id } });
  await prisma.schoolMembership.deleteMany({ where: { userId: feeManagerUser.id } });
  await prisma.user.delete({ where: { id: feeManagerUser.id } });

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
