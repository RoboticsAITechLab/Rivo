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
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('🌱 Starting Rivo database seed...');

  // Standard secure password for testing
  const defaultPassword = 'Password@123';
  const hashedPassword = await hashPassword(defaultPassword);

  // 1. Platform Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@rivo.local' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'owner@rivo.local',
      firstName: 'Platform',
      lastName: 'Owner',
      passwordHash: hashedPassword,
      isPlatformOwner: true,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Platform Owner: ${owner.email}`);

  // 2. School Tenant
  const school = await prisma.school.upsert({
    where: { slug: 'greenwood-academy' },
    update: {},
    create: {
      name: 'Greenwood International School',
      slug: 'greenwood-academy',
      status: SchoolStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded School: ${school.name} (id: ${school.id})`);

  // 3. School Admin User & Membership
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@greenwood.edu' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@greenwood.edu',
      firstName: 'Alice',
      lastName: 'Administrator',
      passwordHash: hashedPassword,
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
    update: { role: Role.SCHOOL_ADMIN },
    create: {
      userId: schoolAdmin.id,
      schoolId: school.id,
      role: Role.SCHOOL_ADMIN,
    },
  });
  console.log(`✓ Seeded School Admin: ${schoolAdmin.email} (Password: ${defaultPassword})`);

  // 4. Academic Session
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
  console.log(`✓ Seeded Academic Session: ${session.name}`);

  // 5. Classes & Sections
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

  const sectionB = await prisma.section.upsert({
    where: {
      classId_name: {
        classId: class10.id,
        name: 'B',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class10.id,
      name: 'B',
    },
  });

  // 6. Subjects
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

  // 7. Teacher User, Profile, & Class Assignment
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@greenwood.edu' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'teacher@greenwood.edu',
      firstName: 'Robert',
      lastName: 'Sharma',
      passwordHash: hashedPassword,
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
    update: { role: Role.TEACHER },
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

  // Assign Teacher to Class 10-A for Mathematics
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_academicSessionId_classId_sectionId_subjectId: {
        teacherId: teacher.id,
        academicSessionId: session.id,
        classId: class10.id,
        sectionId: sectionA.id,
        subjectId: mathSubject.id,
      },
    },
    update: { isClassTeacher: true },
    create: {
      schoolId: school.id,
      teacherId: teacher.id,
      academicSessionId: session.id,
      classId: class10.id,
      sectionId: sectionA.id,
      subjectId: mathSubject.id,
      isClassTeacher: true,
    },
  });
  console.log(`✓ Seeded Teacher: ${teacherUser.email} (Password: ${defaultPassword})`);
  console.log(`  Assigned to: ${class10.name} - Section ${sectionA.name} (${mathSubject.name})`);

  // 8. Students in Class 10-A
  const studentsData = [
    { adm: 'ADM-2026-001', first: 'Aarav', last: 'Patel', dob: '2011-04-12' },
    { adm: 'ADM-2026-002', first: 'Diya', last: 'Sharma', dob: '2011-08-19' },
    { adm: 'ADM-2026-003', first: 'Ishaan', last: 'Verma', dob: '2011-02-05' },
    { adm: 'ADM-2026-004', first: 'Ananya', last: 'Gupta', dob: '2011-11-23' },
    { adm: 'ADM-2026-005', first: 'Rohan', last: 'Mehta', dob: '2011-06-30' },
  ];

  for (const s of studentsData) {
    const student = await prisma.student.upsert({
      where: {
        schoolId_admissionNumber: {
          schoolId: school.id,
          admissionNumber: s.adm,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        admissionNumber: s.adm,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: new Date(s.dob),
        status: StudentStatus.ACTIVE,
      },
    });

    await prisma.studentEnrollment.upsert({
      where: {
        studentId_academicSessionId: {
          studentId: student.id,
          academicSessionId: session.id,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        studentId: student.id,
        academicSessionId: session.id,
        classId: class10.id,
        sectionId: sectionA.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  }
  console.log(`✓ Seeded ${studentsData.length} students enrolled in ${class10.name}-${sectionA.name}`);

  console.log('\n=========================================');
  console.log('✅ SEEDING COMPLETE - LOGIN CREDENTIALS:');
  console.log('=========================================');
  console.log(`1. School Admin:`);
  console.log(`   Email:    admin@greenwood.edu`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     SCHOOL_ADMIN -> /school`);
  console.log(`\n2. Teacher:`);
  console.log(`   Email:    teacher@greenwood.edu`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     TEACHER -> /teacher/dashboard`);
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
