import { prisma } from '../lib/prisma';
import {
  deriveSchoolCode,
  getIdFormatConfig,
  updateIdFormatConfig,
  generateNextStudentId,
  generateNextTeacherId,
  generateNextStaffId,
} from '../lib/id-generator';

async function runIdGeneratorTests() {
  console.log('===============================================================');
  console.log('RUNNING SCHOOL ID GENERATION TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Unit Tests for deriveSchoolCode
  console.log('\n--- GROUP 1: CODE DERIVATION TESTS ---');
  assert(deriveSchoolCode('Greenwood International School') === 'GIS', 'Derives GIS from Greenwood International School');
  assert(deriveSchoolCode('Delhi Public School') === 'DPS', 'Derives DPS from Delhi Public School');
  assert(deriveSchoolCode('Rivo Academy') === 'RA', 'Derives RA from Rivo Academy');
  assert(deriveSchoolCode('Harvard') === 'HARV', 'Derives HARV from single word Harvard');
  assert(deriveSchoolCode('') === 'SCH', 'Derives fallback SCH for empty string');

  // 2. Integration Tests with Test School
  console.log('\n--- GROUP 2: DATABASE PERSISTENCE & FORMAT CONFIG ---');
  const testSchoolSlug = `test-id-school-${Date.now()}`;
  const school = await prisma.school.create({
    data: {
      name: 'Delhi Public School',
      slug: testSchoolSlug,
      status: 'ACTIVE',
    },
  });

  const config = await getIdFormatConfig(school.id);
  assert(config.studentPrefix === 'DPS', `Default student prefix matches school code: ${config.studentPrefix}`);
  assert(config.teacherPrefix === 'TCH', `Default teacher prefix is TCH: ${config.teacherPrefix}`);
  assert(config.staffPrefix === 'STF', `Default staff prefix is STF: ${config.staffPrefix}`);
  assert(config.includeYear === true, 'Default includeYear is true');
  assert(config.studentPadding === 4, 'Default studentPadding is 4');

  // Update config
  const updated = await updateIdFormatConfig(school.id, {
    studentPrefix: 'DPSN',
    teacherPrefix: 'FAC',
    studentPadding: 5,
  });
  assert(updated.studentPrefix === 'DPSN', `Updated prefix to DPSN: ${updated.studentPrefix}`);
  assert(updated.teacherPrefix === 'FAC', `Updated teacher prefix to FAC: ${updated.teacherPrefix}`);
  assert(updated.studentPadding === 5, `Updated padding to 5: ${updated.studentPadding}`);

  // 3. Student ID Generation
  console.log('\n--- GROUP 3: STUDENT ID GENERATION ---');
  const currentYear = new Date().getFullYear();
  const id1 = await generateNextStudentId(school.id, { year: currentYear });
  assert(id1 === `DPSN-${currentYear}-00001`, `First student ID formatted correctly: ${id1}`);

  const id2 = await generateNextStudentId(school.id, { year: currentYear });
  assert(id2 === `DPSN-${currentYear}-00002`, `Second student ID increments sequentially: ${id2}`);

  // 4. Collision Avoidance Test
  console.log('\n--- GROUP 4: COLLISION RESILIENCE ---');
  // Pre-insert a student with admissionNumber DPSN-{year}-00003 manually
  const collisionTarget = `DPSN-${currentYear}-00003`;
  await prisma.student.create({
    data: {
      schoolId: school.id,
      admissionNumber: collisionTarget,
      firstName: 'PreExisting',
      lastName: 'Student',
      status: 'ACTIVE',
    },
  });

  // Next auto-generation should detect collision with 00003 and automatically mint 00004
  const id3 = await generateNextStudentId(school.id, { year: currentYear });
  assert(id3 === `DPSN-${currentYear}-00004`, `Collision with 00003 avoided, auto-advanced to: ${id3}`);

  // 5. Teacher ID Generation
  console.log('\n--- GROUP 5: TEACHER ID GENERATION ---');
  const tId1 = await generateNextTeacherId(school.id);
  assert(tId1 === `DPSN-FAC-0001`, `First teacher ID formatted correctly: ${tId1}`);

  const tId2 = await generateNextTeacherId(school.id);
  assert(tId2 === `DPSN-FAC-0002`, `Second teacher ID increments sequentially: ${tId2}`);

  // 6. Staff ID Generation
  console.log('\n--- GROUP 6: STAFF ID GENERATION ---');
  const sId1 = await generateNextStaffId(school.id);
  assert(sId1 === `DPSN-STF-0001`, `First staff ID formatted correctly: ${sId1}`);

  // Cleanup
  console.log('\n--- CLEANUP ---');
  await prisma.student.deleteMany({ where: { schoolId: school.id } });
  await prisma.idSequence.deleteMany({ where: { schoolId: school.id } });
  await prisma.idFormatConfig.deleteMany({ where: { schoolId: school.id } });
  await prisma.school.delete({ where: { id: school.id } });
  console.log('  ✓ Cleaned up test database fixtures.');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIdGeneratorTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
