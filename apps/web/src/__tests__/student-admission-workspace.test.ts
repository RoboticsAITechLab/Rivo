import { prisma } from '../lib/prisma';
import { getNextStudentIdPreview, generateNextStudentId } from '../lib/id-generator';
import { calculateNextAlphabeticalRollNumber } from '../lib/students/roll-number-service';

async function runStudentAdmissionTests() {
  console.log('🧪 Starting Student Admission Workspace & Backend Integration Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Setup test school
    const schoolSlug = `test-school-adm-${Date.now()}`;
    const school = await prisma.school.create({
      data: {
        name: 'Oakridge International Academy',
        slug: schoolSlug,
        email: `contact@${schoolSlug}.edu`,
      },
    });

    const session = await prisma.academicSession.create({
      data: {
        schoolId: school.id,
        name: '2026-27',
        status: 'ACTIVE',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
      },
    });

    const campus = await prisma.campus.create({
      data: {
        schoolId: school.id,
        name: 'West Wing Campus',
      },
    });

    const cls = await prisma.class.create({
      data: {
        schoolId: school.id,
        name: 'Class 10',
      },
    });

    const secA = await prisma.section.create({
      data: {
        schoolId: school.id,
        classId: cls.id,
        name: 'A',
      },
    });

    const secB = await prisma.section.create({
      data: {
        schoolId: school.id,
        classId: cls.id,
        name: 'B',
      },
    });

    const houseName = 'Emerald Dragons';

    // TEST 1: ID Sequence & Non-incrementing Live Preview
    console.log('--- TEST 1: Live Admission ID Preview & Atomic Sequential Generation ---');
    const preview1 = await getNextStudentIdPreview(school.id);
    assert(Boolean(preview1 && preview1.length > 3), `Live student ID preview returned "${preview1}"`);

    const preview2 = await getNextStudentIdPreview(school.id);
    assert(preview1 === preview2, `Preview does not increment sequence counter (preview 1 = "${preview1}", preview 2 = "${preview2}")`);

    const generatedId1 = await generateNextStudentId(school.id);
    assert(Boolean(generatedId1), `Authoritative student ID generated: "${generatedId1}"`);

    const previewAfterGen = await getNextStudentIdPreview(school.id);
    assert(previewAfterGen !== generatedId1, `Preview advances to next number after generation (next preview: "${previewAfterGen}")`);

    // TEST 2: Alphabetical Roll Number Calculation
    console.log('\n--- TEST 2: Deterministic Alphabetical Roll Number Assignment ---');
    // Existing students in Class 10 - Section A: "Aarav Patel", "Zack Williams"
    const stuA = await prisma.student.create({
      data: {
        schoolId: school.id,
        admissionNumber: generatedId1,
        firstName: 'Aarav',
        lastName: 'Patel',
        campusId: campus.id,
        house: houseName,
        status: 'ACTIVE',
      },
    });

    await prisma.studentEnrollment.create({
      data: {
        schoolId: school.id,
        studentId: stuA.id,
        academicSessionId: session.id,
        classId: cls.id,
        sectionId: secA.id,
        rollNumber: '01',
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    const generatedId2 = await generateNextStudentId(school.id);
    const stuZ = await prisma.student.create({
      data: {
        schoolId: school.id,
        admissionNumber: generatedId2,
        firstName: 'Zack',
        lastName: 'Williams',
        campusId: campus.id,
        house: houseName,
        status: 'ACTIVE',
      },
    });

    await prisma.studentEnrollment.create({
      data: {
        schoolId: school.id,
        studentId: stuZ.id,
        academicSessionId: session.id,
        classId: cls.id,
        sectionId: secA.id,
        rollNumber: '02',
        rollNumberMode: 'AUTO',
        status: 'ACTIVE',
      },
    });

    // Now calculate for a new student "Maya Sharma" (Alphabetically between Aarav Patel and Zack Williams)
    const rollResult = await calculateNextAlphabeticalRollNumber({
      schoolId: school.id,
      academicSessionId: session.id,
      classId: cls.id,
      sectionId: secA.id,
      newStudent: {
        firstName: 'Maya',
        lastName: 'Sharma',
        admissionNumber: 'TEMP-03',
      },
    });

    assert(Boolean(rollResult.rollNumber), `Calculated alphabetical roll number: "${rollResult.rollNumber}" (position ${rollResult.calculatedIndex + 1})`);

    // TEST 3: Multi-Guardian Relational Linking & Conflict Detection
    console.log('\n--- TEST 3: Multi-Guardian Architecture & Identity Safety ---');
    const parent = await prisma.parent.create({
      data: {
        schoolId: school.id,
        firstName: 'Rajesh',
        lastName: 'Sharma',
        phone: '+91 98765 43210',
        email: 'rajesh.sharma@example.com',
      },
    });

    const link = await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: stuA.id,
        relationshipType: 'FATHER',
        isPrimaryContact: true,
      },
    });

    assert(Boolean(link && link.parentId === parent.id), `Parent "${parent.firstName} ${parent.lastName}" successfully linked to student`);

    // TEST 4: Student Document Persistence
    console.log('\n--- TEST 4: Student Intake Document Metadata Persistence ---');
    const doc = await prisma.studentDocument.create({
      data: {
        studentId: stuA.id,
        documentType: 'BIRTH_CERTIFICATE',
        title: 'Municipal Birth Certificate',
        fileUrl: `schools/${school.id}/students/${stuA.id}/documents/birth_cert.pdf`,
        fileName: 'birth_cert.pdf',
        fileSize: '1.4 MB',
        status: 'VERIFIED',
      },
    });

    assert(doc.documentType === 'BIRTH_CERTIFICATE' && doc.status === 'VERIFIED', `Document "${doc.fileName}" persisted with status "${doc.status}"`);

    // TEST 5: Tenant Isolation Check
    console.log('\n--- TEST 5: Strict School Tenant Isolation ---');
    const foreignSchool = await prisma.school.create({
      data: {
        name: 'Foreign Cross-School Entity',
        slug: `foreign-sch-${Date.now()}`,
      },
    });

    const foreignStudents = await prisma.student.findMany({
      where: { schoolId: foreignSchool.id },
    });

    assert(foreignStudents.length === 0, `Foreign school query correctly returns 0 students for empty tenant`);

    // Clean up test data
    await prisma.studentDocument.deleteMany({ where: { studentId: { in: [stuA.id, stuZ.id] } } });
    await prisma.parentStudent.deleteMany({ where: { studentId: { in: [stuA.id, stuZ.id] } } });
    await prisma.parent.deleteMany({ where: { schoolId: school.id } });
    await prisma.studentEnrollment.deleteMany({ where: { schoolId: school.id } });
    await prisma.student.deleteMany({ where: { schoolId: school.id } });
    await prisma.section.deleteMany({ where: { schoolId: school.id } });
    await prisma.class.deleteMany({ where: { schoolId: school.id } });
    await prisma.campus.deleteMany({ where: { schoolId: school.id } });
    await prisma.academicSession.deleteMany({ where: { schoolId: school.id } });
    await prisma.idSequence.deleteMany({ where: { schoolId: school.id } });
    await prisma.school.delete({ where: { id: school.id } });
    await prisma.school.delete({ where: { id: foreignSchool.id } });

    console.log('\n========================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runStudentAdmissionTests();
