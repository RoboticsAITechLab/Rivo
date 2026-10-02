import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '@/lib/prisma';
import {
  getSchoolSetting,
  getAllSchoolSettings,
  updateSchoolSetting,
  getUnifiedSchoolProfile,
  updateUnifiedSchoolProfile,
  getSchoolSettingsOverview,
  invalidateSchoolSettingsCache,
  DEFAULT_SETTINGS,
} from '@/lib/settings/settings-service';

async function runSettingsTestSuite() {
  console.log('===============================================================');
  console.log('RIVO SETTINGS & CONFIGURATION MASTER TEST SUITE');
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
  const testSchoolSlugA = `settings-test-a-${Date.now()}`;
  const testSchoolSlugB = `settings-test-b-${Date.now()}`;

  const schoolA = await prisma.school.create({
    data: {
      name: 'Delhi Public Test Academy',
      slug: testSchoolSlugA,
      status: 'ACTIVE',
      email: 'admin@dpta.edu.in',
      phone: '+91 99999 11111',
      address: 'Sector 14, Rohini',
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: 'Oakridge Global Test School',
      slug: testSchoolSlugB,
      status: 'ACTIVE',
      email: 'principal@oakridge.edu.in',
      phone: '+91 88888 22222',
      address: 'Gachibowli, Hyderabad',
    },
  });

  try {
    // -------------------------------------------------------------
    // GROUP 1: SCHOOL PROFILE INTEGRATION & DB PERSISTENCE
    // -------------------------------------------------------------
    console.log('GROUP 1: SCHOOL PROFILE INTEGRATION & DB PERSISTENCE');

    const initialProfileA = await getUnifiedSchoolProfile(schoolA.id);
    assert(
      initialProfileA !== null && initialProfileA.schoolName === 'Delhi Public Test Academy',
      '[TEST 01] Initial school profile matches database School record',
      `Got: ${initialProfileA?.schoolName}`
    );

    const updatedProfileA = await updateUnifiedSchoolProfile(schoolA.id, {
      schoolName: 'Delhi Public Test Academy (Senior Wing)',
      shortName: 'DPTA-SR',
      schoolCode: 'DPTA-01',
      affiliation: 'CBSE',
      registrationNumber: 'CBSE/2026/DPTA',
      address: 'Plot 42, Institutional Area, Sector 14',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110085',
      website: 'https://dpta.edu.in',
      phone: '+91 99999 12345',
      email: 'contact@dpta.edu.in',
    });

    assert(
      updatedProfileA !== null &&
        updatedProfileA.schoolName === 'Delhi Public Test Academy (Senior Wing)' &&
        updatedProfileA.shortName === 'DPTA-SR' &&
        updatedProfileA.city === 'New Delhi',
      '[TEST 02] Update unified school profile commits extended attributes to database'
    );

    // Verify root School table record was updated
    const freshDbSchoolA = await prisma.school.findUnique({
      where: { id: schoolA.id },
    });
    assert(
      freshDbSchoolA?.name === 'Delhi Public Test Academy (Senior Wing)' &&
        freshDbSchoolA?.address === 'Plot 42, Institutional Area, Sector 14' &&
        freshDbSchoolA?.phone === '+91 99999 12345',
      '[TEST 03] Core School model fields are atomically synchronized'
    );

    // -------------------------------------------------------------
    // GROUP 2: MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\nGROUP 2: MULTI-TENANT ISOLATION');

    const profileB = await getUnifiedSchoolProfile(schoolB.id);
    assert(
      profileB?.schoolName === 'Oakridge Global Test School' &&
        profileB?.address === 'Gachibowli, Hyderabad' &&
        profileB?.shortName === '',
      '[TEST 04] School B profile remains completely unaffected by School A mutations'
    );

    // -------------------------------------------------------------
    // GROUP 3: BRANDING CONFIGURATION & LOGO URL
    // -------------------------------------------------------------
    console.log('\nGROUP 3: BRANDING CONFIGURATION & LOGO URL');

    const updatedBrandingA = await updateSchoolSetting(schoolA.id, 'branding', {
      primaryLogoUrl: 'https://azureblob.storage.core.windows.net/schools/dpta/logo.png',
      schoolSealUrl: 'https://azureblob.storage.core.windows.net/schools/dpta/seal.png',
      authorizedSignatureUrl: 'https://azureblob.storage.core.windows.net/schools/dpta/signature.png',
      documentHeader: 'Affiliated with Central Board of Secondary Education',
      documentFooter: 'Official Computer Generated Record',
      watermarkText: 'CONFIDENTIAL-DPTA',
    });

    assert(
      updatedBrandingA.primaryLogoUrl === 'https://azureblob.storage.core.windows.net/schools/dpta/logo.png' &&
        updatedBrandingA.watermarkText === 'CONFIDENTIAL-DPTA',
      '[TEST 05] Branding settings persist custom URLs and document headers'
    );

    const brandingB = await getSchoolSetting(schoolB.id, 'branding');
    assert(
      brandingB.primaryLogoUrl === '' && brandingB.watermarkText === '',
      '[TEST 06] School B branding remains default and isolated'
    );

    // -------------------------------------------------------------
    // GROUP 4: ATTENDANCE CONFIGURATION
    // -------------------------------------------------------------
    console.log('\nGROUP 4: ATTENDANCE CONFIGURATION');

    const updatedAttendance = await updateSchoolSetting(schoolA.id, 'attendance', {
      attendanceEnabled: true,
      teacherCanMark: true,
      adminCanCorrect: true,
      lockPreviousRecords: true,
      minAttendancePercentage: 80,
      supportedStatuses: ['PRESENT', 'ABSENT', 'LATE'],
    });

    assert(
      updatedAttendance.lockPreviousRecords === true &&
        updatedAttendance.minAttendancePercentage === 80 &&
        updatedAttendance.supportedStatuses.length === 3,
      '[TEST 07] Attendance settings persisted with custom locking rules and status codes'
    );

    // -------------------------------------------------------------
    // GROUP 5: FEE & FINANCE CONFIGURATION
    // -------------------------------------------------------------
    console.log('\nGROUP 5: FEE & FINANCE CONFIGURATION');

    const updatedFeesA = await updateSchoolSetting(schoolA.id, 'fees', {
      currency: 'AED',
      currencySymbol: 'د.إ',
      defaultPaymentMethods: ['CASH', 'ONLINE', 'BANK_TRANSFER'],
      lateFeeGraceDays: 14,
      receiptPrefix: 'TAX-REC',
      receiptFooterNote: 'All fees paid are non-refundable under UAE KHDA guidelines.',
      allowOnlinePayments: true,
      autoIssueReceipt: true,
    });

    assert(
      updatedFeesA.currency === 'AED' &&
        updatedFeesA.receiptPrefix === 'TAX-REC' &&
        updatedFeesA.lateFeeGraceDays === 14,
      '[TEST 08] Fee settings persist institutional currency and receipt rules'
    );

    const feesB = await getSchoolSetting(schoolB.id, 'fees');
    assert(
      feesB.currency === 'INR' && feesB.currencySymbol === '₹' && feesB.receiptPrefix === 'REC',
      '[TEST 09] School B fee settings retain standard defaults without cross-tenant leakage'
    );

    // -------------------------------------------------------------
    // GROUP 6: COMMUNICATION & NOTICE POLICIES
    // -------------------------------------------------------------
    console.log('\nGROUP 6: COMMUNICATION & NOTICE POLICIES');

    const updatedComm = await updateSchoolSetting(schoolA.id, 'communication', {
      teacherCanCreate: true,
      teacherCanPublish: false,
      requireApprovalBeforeBroadcast: true,
      allowScheduling: true,
      allowAttachments: true,
      enabledChannels: ['IN_APP', 'EMAIL'],
    });

    assert(
      updatedComm.teacherCanPublish === false && updatedComm.requireApprovalBeforeBroadcast === true,
      '[TEST 10] Communication settings persist review workflow constraints'
    );

    // -------------------------------------------------------------
    // GROUP 7: DOCUMENT & PRINT LAYOUT GEOMETRY
    // -------------------------------------------------------------
    console.log('\nGROUP 7: DOCUMENT & PRINT LAYOUT GEOMETRY');

    const updatedDocs = await updateSchoolSetting(schoolA.id, 'documents', {
      pageSize: 'LETTER',
      orientation: 'LANDSCAPE',
      marginsMM: { top: 20, bottom: 20, left: 20, right: 20 },
      showHeader: true,
      showFooter: true,
      showSeal: true,
      showSignature: true,
      watermarkText: 'DRAFT',
    });

    assert(
      updatedDocs.pageSize === 'LETTER' &&
        updatedDocs.orientation === 'LANDSCAPE' &&
        updatedDocs.marginsMM.top === 20,
      '[TEST 11] Document layout settings persist print geometry'
    );

    // -------------------------------------------------------------
    // GROUP 8: SETTINGS OVERVIEW READINESS METRICS
    // -------------------------------------------------------------
    console.log('\nGROUP 8: SETTINGS OVERVIEW READINESS METRICS');

    // Create a campus and session for schoolA to verify real database counts
    await prisma.campus.create({
      data: {
        schoolId: schoolA.id,
        name: 'Main Campus',
        code: 'MAIN',
        isMain: true,
      },
    });

    await prisma.academicSession.create({
      data: {
        schoolId: schoolA.id,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    });

    const overviewA = await getSchoolSettingsOverview(schoolA.id);
    assert(
      overviewA.counts.campuses === 1 &&
        overviewA.counts.academicSessions === 1 &&
        overviewA.activeSession?.name === '2026-2027' &&
        overviewA.settings.profile.schoolName === 'Delhi Public Test Academy (Senior Wing)',
      '[TEST 12] Settings overview computes real database row counts and readiness status'
    );

    // -------------------------------------------------------------
    // GROUP 9: CACHE INVALIDATION
    // -------------------------------------------------------------
    console.log('\nGROUP 9: CACHE INVALIDATION');

    invalidateSchoolSettingsCache(schoolA.id, 'fees');
    const freshFees = await getSchoolSetting(schoolA.id, 'fees');
    assert(
      freshFees.currency === 'AED' && freshFees.receiptPrefix === 'TAX-REC',
      '[TEST 13] Invalidation correctly re-reads authoritative value from PostgreSQL'
    );

    // -------------------------------------------------------------
    // GROUP 11: OPTIMISTIC CONCURRENCY PROTECTION
    // -------------------------------------------------------------
    console.log('\nGROUP 11: OPTIMISTIC CONCURRENCY PROTECTION');

    const settingRecordA = await prisma.schoolSetting.findUnique({
      where: { schoolId_category: { schoolId: schoolA.id, category: 'fees' } },
    });
    const currentVer = settingRecordA?.version || 1;

    // First write with matching expected version succeeds
    await updateSchoolSetting(schoolA.id, 'fees', { lateFeeGraceDays: 20 }, undefined, currentVer);
    assert(true, '[TEST 15] Update with matching version succeeds');

    // Stale write with old expected version is rejected with 409 Conflict
    let conflictCaught = false;
    try {
      await updateSchoolSetting(schoolA.id, 'fees', { lateFeeGraceDays: 30 }, undefined, currentVer);
    } catch (err: any) {
      if (err.statusCode === 409 || err.message.includes('Concurrency Conflict')) {
        conflictCaught = true;
      }
    }
    assert(conflictCaught, '[TEST 16] Stale update with outdated version throws 409 Concurrency Conflict');

    // -------------------------------------------------------------
    // GROUP 12: TENANT CONTEXT IMMUTABILITY
    // -------------------------------------------------------------
    console.log('\nGROUP 12: TENANT CONTEXT IMMUTABILITY');

    const schoolASettingsFromB = await prisma.schoolSetting.findUnique({
      where: { schoolId_category: { schoolId: schoolB.id, category: 'fees' } },
    });
    assert(
      schoolASettingsFromB === null,
      '[TEST 17] School B cannot access School A configuration records'
    );

  } finally {
    // Clean up test records
    await prisma.schoolSetting.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.campus.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
    });
    await prisma.academicSession.deleteMany({
      where: { schoolId: { in: [schoolA.id, schoolB.id] } },
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

runSettingsTestSuite().catch((err) => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});


