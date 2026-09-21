import {
  AcademicSessionStatus,
  EnrollmentStatus,
  ParentRelationship,
  PrismaClient,
  Role,
  SchoolStatus,
  StudentStatus,
  TeacherStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting development database seed...');

  // Dev-only placeholder hash. Note: Never use real or production credentials.
  const devPasswordHash = 'DEV_ONLY_INSECURE_HASH_REPLACE_WITH_BCRYPT_IN_AUTH_STEP';

  // 1. Platform Owner (Super-Admin, platform-level)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@rivo.local' },
    update: {},
    create: {
      email: 'owner@rivo.local',
      firstName: 'Platform',
      lastName: 'Owner',
      passwordHash: devPasswordHash,
      isPlatformOwner: true,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Platform Owner: ${owner.email} (${owner.id})`);

  // 2. Development School Tenant
  const school = await prisma.school.upsert({
    where: { slug: 'greenwood-academy' },
    update: {},
    create: {
      name: 'Greenwood Academy',
      slug: 'greenwood-academy',
      status: SchoolStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded School: ${school.name} [slug: ${school.slug}] (${school.id})`);

  // 3. School Admin User & Membership
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@greenwood.rivo.local' },
    update: {},
    create: {
      email: 'admin@greenwood.rivo.local',
      firstName: 'Alice',
      lastName: 'Admin',
      passwordHash: devPasswordHash,
      isPlatformOwner: false,
      isActive: true,
    },
  });

  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: schoolAdmin.id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      userId: schoolAdmin.id,
      schoolId: school.id,
      role: Role.SCHOOL_ADMIN,
    },
  });
  console.log(`✓ Seeded School Admin: ${schoolAdmin.email} for ${school.name}`);

  // 4. Teacher User, Membership & Teacher Record
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@greenwood.rivo.local' },
    update: {},
    create: {
      email: 'teacher@greenwood.rivo.local',
      firstName: 'Robert',
      lastName: 'Teacher',
      passwordHash: devPasswordHash,
      isPlatformOwner: false,
      isActive: true,
    },
  });

  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: teacherUser.id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      userId: teacherUser.id,
      schoolId: school.id,
      role: Role.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: {
      schoolId_userId: {
        schoolId: school.id,
        userId: teacherUser.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeId: 'TCH-001',
      status: TeacherStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded Teacher Record: ${teacher.id} (Employee: ${teacher.employeeId})`);

  // 5. Parent User, Membership & Parent Record
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@greenwood.rivo.local' },
    update: {},
    create: {
      email: 'parent@greenwood.rivo.local',
      firstName: 'David',
      lastName: 'Doe',
      passwordHash: devPasswordHash,
      isPlatformOwner: false,
      isActive: true,
    },
  });

  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: parentUser.id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      userId: parentUser.id,
      schoolId: school.id,
      role: Role.PARENT,
    },
  });

  const parentId = '00000000-0000-4000-a000-000000000001';
  const parent = await prisma.parent.upsert({
    where: { id: parentId },
    update: {},
    create: {
      id: parentId,
      schoolId: school.id,
      userId: parentUser.id,
      firstName: 'David',
      lastName: 'Doe',
      email: 'parent@greenwood.rivo.local',
      phone: '+1-555-0199',
    },
  });
  console.log(`✓ Seeded Parent Record: ${parent.firstName} ${parent.lastName} (${parent.id})`);

  // 6. Two Students
  const student1 = await prisma.student.upsert({
    where: {
      schoolId_admissionNumber: {
        schoolId: school.id,
        admissionNumber: 'ADM-2026-001',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      admissionNumber: 'ADM-2026-001',
      firstName: 'Alex',
      lastName: 'Doe',
      dateOfBirth: new Date('2011-05-15'),
      status: StudentStatus.ACTIVE,
    },
  });

  const student2 = await prisma.student.upsert({
    where: {
      schoolId_admissionNumber: {
        schoolId: school.id,
        admissionNumber: 'ADM-2026-002',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      admissionNumber: 'ADM-2026-002',
      firstName: 'Sam',
      lastName: 'Doe',
      dateOfBirth: new Date('2013-08-22'),
      status: StudentStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded Students: ${student1.firstName} (${student1.admissionNumber}), ${student2.firstName} (${student2.admissionNumber})`);

  // 7. ParentStudent Relationships (Many-to-Many)
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student1.id,
      relationshipType: ParentRelationship.FATHER,
      isPrimaryContact: true,
    },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student2.id,
      relationshipType: ParentRelationship.FATHER,
      isPrimaryContact: true,
    },
  });
  console.log(`✓ Linked Parent to Students via ParentStudent records`);

  // 8. Academic Session
  const session = await prisma.academicSession.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: '2026-27',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: AcademicSessionStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded Academic Session: ${session.name} (${session.id})`);

  // 9. Class
  const class10 = await prisma.class.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Class 10',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Class 10',
      displayOrder: 10,
    },
  });
  console.log(`✓ Seeded Class: ${class10.name} (${class10.id})`);

  // 10. Section
  const sectionA = await prisma.section.upsert({
    where: {
      classId_name: {
        classId: class10.id,
        name: 'A',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class10.id,
      name: 'A',
    },
  });
  console.log(`✓ Seeded Section: ${sectionA.name} for ${class10.name} (${sectionA.id})`);

  // 11. Subjects
  const mathSubject = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Mathematics',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Mathematics',
      code: 'MATH-10',
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Science',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Science',
      code: 'SCI-10',
    },
  });
  console.log(`✓ Seeded Subjects: ${mathSubject.name}, ${scienceSubject.name}`);

  // 12. Student Enrollments
  await prisma.studentEnrollment.upsert({
    where: {
      studentId_academicSessionId: {
        studentId: student1.id,
        academicSessionId: session.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      studentId: student1.id,
      academicSessionId: session.id,
      classId: class10.id,
      sectionId: sectionA.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  await prisma.studentEnrollment.upsert({
    where: {
      studentId_academicSessionId: {
        studentId: student2.id,
        academicSessionId: session.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      studentId: student2.id,
      academicSessionId: session.id,
      classId: class10.id,
      sectionId: sectionA.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded Student Enrollments for Session ${session.name}`);

  console.log('✅ Development seeding completed successfully and idempotently.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
