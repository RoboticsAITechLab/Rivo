import dotenv from 'dotenv';
dotenv.config();

import {
  AcademicSessionStatus,
  EnrollmentStatus,
  ParentRelationship,
  Role,
  SchoolStatus,
  StudentStatus,
  TeacherStatus,
  PrismaClient,
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
    update: { passwordHash: hashedPassword, platformRole: 'OWNER', isPlatformOwner: true },
    create: {
      email: 'owner@rivo.local',
      firstName: 'Platform',
      lastName: 'Owner',
      passwordHash: hashedPassword,
      isPlatformOwner: true,
      platformRole: 'OWNER',
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
  // 9. Seed Campus
  const mainCampus = await prisma.campus.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Main Campus',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Main Campus',
      code: 'CAMPUS-MAIN',
      isMain: true,
      city: 'Metropolis',
      state: 'NY',
    },
  });
  console.log(`✓ Seeded Campus: ${mainCampus.name}`);

  // 10. Seed System Permissions Catalog
  const permissionDefs = [
    { code: 'attendance.view', module: 'attendance', action: 'view', name: 'View Attendance' },
    { code: 'attendance.take', module: 'attendance', action: 'take', name: 'Take Attendance' },
    { code: 'attendance.edit', module: 'attendance', action: 'edit', name: 'Edit Attendance' },
    { code: 'school_timetable.view', module: 'school_timetable', action: 'view', name: 'View School Timetable' },
    { code: 'school_timetable.create', module: 'school_timetable', action: 'create', name: 'Create Timetable Slots' },
    { code: 'school_timetable.edit', module: 'school_timetable', action: 'edit', name: 'Edit Timetable Slots' },
    { code: 'school_timetable.delete', module: 'school_timetable', action: 'delete', name: 'Delete Timetable Slots' },
    { code: 'exam_timetable.view', module: 'exam_timetable', action: 'view', name: 'View Exam Timetable' },
    { code: 'exam_timetable.create', module: 'exam_timetable', action: 'create', name: 'Create Exam Timetable' },
    { code: 'exam_timetable.edit', module: 'exam_timetable', action: 'edit', name: 'Edit Exam Timetable' },
    { code: 'exam_timetable.delete', module: 'exam_timetable', action: 'delete', name: 'Delete Exam Timetable' },
    { code: 'students.view', module: 'students', action: 'view', name: 'View Students' },
    { code: 'students.create', module: 'students', action: 'create', name: 'Admit Students' },
    { code: 'students.edit', module: 'students', action: 'edit', name: 'Edit Students' },
    { code: 'students.delete', module: 'students', action: 'delete', name: 'Delete Students' },
    { code: 'teachers.view', module: 'teachers', action: 'view', name: 'View Teachers' },
    { code: 'teachers.create', module: 'teachers', action: 'create', name: 'Onboard Teachers' },
    { code: 'teachers.edit', module: 'teachers', action: 'edit', name: 'Edit Teachers' },
    { code: 'teachers.delete', module: 'teachers', action: 'delete', name: 'Deactivate Teachers' },
    { code: 'exams.view', module: 'exams', action: 'view', name: 'View Exams' },
    { code: 'exams.create', module: 'exams', action: 'create', name: 'Create Exams' },
    { code: 'exams.edit', module: 'exams', action: 'edit', name: 'Edit Exams' },
    { code: 'exams.delete', module: 'exams', action: 'delete', name: 'Delete Exams' },
    { code: 'results.view', module: 'results', action: 'view', name: 'View Results' },
    { code: 'results.enter_marks', module: 'results', action: 'enter_marks', name: 'Enter Marks' },
    { code: 'results.publish', module: 'results', action: 'publish', name: 'Publish Results' },
  ];

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module, action: p.action },
      create: {
        code: p.code,
        module: p.module,
        action: p.action,
        name: p.name,
      },
    });
  }
  console.log(`✓ Seeded ${permissionDefs.length} Granular System Permissions`);

  // 11. Seed Teacher B (Timetable Coordinator Example)
  const teacherBUser = await prisma.user.upsert({
    where: { email: 'teacher.timetable@greenwood.edu' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'teacher.timetable@greenwood.edu',
      firstName: 'Rahul',
      lastName: 'Sharma',
      passwordHash: hashedPassword,
      isPlatformOwner: false,
      isActive: true,
    },
  });

  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: teacherBUser.id,
        schoolId: school.id,
      },
    },
    update: { role: Role.TEACHER },
    create: {
      userId: teacherBUser.id,
      schoolId: school.id,
      role: Role.TEACHER,
    },
  });

  const teacherB = await prisma.teacher.upsert({
    where: {
      schoolId_userId: {
        schoolId: school.id,
        userId: teacherBUser.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherBUser.id,
      employeeId: 'TCH-002',
      status: TeacherStatus.ACTIVE,
      department: 'Mathematics',
      designation: 'Senior Faculty & Timetable Incharge',
    },
  });

  // Assign special permissions to Teacher B:
  // Can view, create, edit normal school timetable across SCHOOL
  // Can view exam timetable across SCHOOL
  const permSchoolTtView = await prisma.permission.findUnique({ where: { code: 'school_timetable.view' } });
  const permSchoolTtCreate = await prisma.permission.findUnique({ where: { code: 'school_timetable.create' } });
  const permSchoolTtEdit = await prisma.permission.findUnique({ where: { code: 'school_timetable.edit' } });
  const permExamTtView = await prisma.permission.findUnique({ where: { code: 'exam_timetable.view' } });

  const overridesToSet = [
    { perm: permSchoolTtView, scope: 'SCHOOL' },
    { perm: permSchoolTtCreate, scope: 'SCHOOL' },
    { perm: permSchoolTtEdit, scope: 'SCHOOL' },
    { perm: permExamTtView, scope: 'SCHOOL' },
  ];

  for (const item of overridesToSet) {
    if (item.perm) {
      await prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: {
            userId: teacherBUser.id,
            permissionId: item.perm.id,
          },
        },
        update: { isGranted: true, scope: item.scope as any },
        create: {
          schoolId: school.id,
          userId: teacherBUser.id,
          permissionId: item.perm.id,
          isGranted: true,
          scope: item.scope as any,
        },
      });
    }
  }
  console.log(`✓ Seeded Teacher B (Rahul Sharma) with School Timetable Management Permissions`);

  // 12. Seed Real School Timetable Slots
  await prisma.timetableSlot.upsert({
    where: {
      academicSessionId_classId_sectionId_dayOfWeek_periodNumber: {
        academicSessionId: session.id,
        classId: class10.id,
        sectionId: sectionA.id,
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      academicSessionId: session.id,
      classId: class10.id,
      sectionId: sectionA.id,
      subjectId: mathSubject.id,
      teacherId: teacher.id,
      dayOfWeek: 'MONDAY',
      periodNumber: 1,
      startTime: '08:30',
      endTime: '09:15',
      roomNumber: 'Room 204',
    },
  });

  // 13. Seed Formal Exam Term and Date-sheet
  const examTerm = await prisma.examTerm.upsert({
    where: {
      schoolId_academicSessionId_name: {
        schoolId: school.id,
        academicSessionId: session.id,
        name: 'Mid-Term Examination 2026',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      academicSessionId: session.id,
      name: 'Mid-Term Examination 2026',
      code: 'MID-2026',
      startDate: new Date('2026-10-12'),
      endDate: new Date('2026-10-24'),
      isPublished: true,
    },
  });

  const mathPaper = await prisma.examPaper.upsert({
    where: { id: 'exam-paper-math-10' },
    update: {},
    create: {
      id: 'exam-paper-math-10',
      examTermId: examTerm.id,
      subjectId: mathSubject.id,
      name: 'Mathematics Class 10 Mid-Term',
      maxMarks: 100,
      passingMarks: 35,
    },
  });

  await prisma.examSchedule.upsert({
    where: {
      paperId_classId_sectionId: {
        paperId: mathPaper.id,
        classId: class10.id,
        sectionId: sectionA.id,
      },
    },
    update: {},
    create: {
      paperId: mathPaper.id,
      classId: class10.id,
      sectionId: sectionA.id,
      examDate: new Date('2026-10-14'),
      startTime: '09:00',
      endTime: '12:00',
      roomNumber: 'Examination Hall 1',
    },
  });
  console.log(`✓ Seeded Formal Exam Term, Paper & Schedule for Class 10`);

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
