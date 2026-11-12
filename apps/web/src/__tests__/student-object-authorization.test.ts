/**
 * RIVO SECURITY AUDIT VERIFICATION — RIVO-SEC-003
 * Student Object-Level Authorization & BOLA/IDOR Prevention Suite
 */

import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../app/api/students/[id]/route';
import { prisma } from '../lib/prisma';
import { hashToken, generateSecureToken } from '../lib/auth/crypto';
import { setCachedSession } from '../lib/auth/session-cache';
import { SESSION_COOKIE_NAME } from '../lib/auth/session';

console.log('\n===============================================================');
console.log('RIVO-SEC-003: STUDENT OBJECT-LEVEL AUTHORIZATION & IDOR TEST SUITE');
console.log('===============================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: TEACHER OBJECT-LEVEL ACCESS CONTROL (ASSIGNED VS UNASSIGNED)
  // ---------------------------------------------------------------------------
  console.log('GROUP 1: TEACHER OBJECT-LEVEL ACCESS CONTROL & FIELD STRIPPING');

  const schoolAId = '00000000-0000-0000-0000-000000000001';
  const schoolBId = '00000000-0000-0000-0000-000000000002';
  const classAId = '00000000-0000-0000-0000-000000000010';
  const sectionAId = '00000000-0000-0000-0000-000000000100';
  const student1Id = '00000000-0000-0000-0000-000000001000';
  const teacherUserId = '00000000-0000-0000-0000-000000010000';
  const teacherProfileId = '00000000-0000-0000-0000-000000100000';
  const adminUserId = '00000000-0000-0000-0000-000000000009';

  async function createAuthenticatedSession(params: {
    userId: string;
    schoolId: string;
    role: any;
    teacherId?: string;
  }) {
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await setCachedSession(tokenHash, {
      session: {
        id: `sess-${params.userId}`,
        userId: params.userId,
        schoolId: params.schoolId,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: new Date(),
        revokedAt: null,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      } as any,
      user: {
        id: params.userId,
        email: `${params.userId}@rivo.school`,
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
        isActive: true,
        isPlatformOwner: false,
        platformRole: null,
      } as any,
      membership: {
        id: `mem-${params.userId}`,
        userId: params.userId,
        schoolId: params.schoolId,
        role: params.role,
        customRoleId: null,
        status: 'ACTIVE',
      } as any,
      teacherProfile: params.teacherId
        ? ({ id: params.teacherId, campusId: null, status: 'ACTIVE' } as any)
        : null,
    });

    return rawToken;
  }

  // Helper to build a mock NextRequest with session cookie
  function createMockRequest(url: string, rawToken: string, method = 'GET', body?: any) {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: {
        'content-type': 'application/json',
        cookie: `${SESSION_COOKIE_NAME}=${rawToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return req;
  }

  // Mock prisma queries for student route
  const originalFindFirst = prisma.student.findFirst;
  const originalTeacherFindFirst = prisma.teacher.findFirst;
  const originalAssignmentFindFirst = prisma.teacherAssignment.findFirst;
  const originalObligationFindMany = prisma.feeObligation.findMany;
  const originalPaymentFindMany = prisma.feePayment.findMany;
  const originalAttendanceFindMany = prisma.attendanceRecord.findMany;
  const originalUserFindUnique = prisma.user.findUnique;
  const originalMembershipFindUnique = prisma.schoolMembership.findUnique;
  const originalPermissionFindUnique = prisma.permission.findUnique;
  const originalOverrideFindUnique = prisma.userPermissionOverride.findUnique;

  try {
    // Setup Mock Student in Class A
    const mockStudent = {
      id: student1Id,
      schoolId: schoolAId,
      firstName: 'Aarav',
      lastName: 'Sharma',
      admissionNumber: 'ADM-2026-001',
      dateOfBirth: new Date('2012-05-15'),
      gender: 'MALE',
      status: 'ACTIVE',
      address: '123 MG Road',
      bloodGroup: 'B_POSITIVE',
      stream: null,
      house: 'Red',
      phone: '9876543210',
      campusId: null,
      campus: null,
      createdAt: new Date(),
      documents: [
        {
          id: 'doc-1',
          documentType: 'PHOTO',
          title: 'Student Photo',
          fileName: 'photo.jpg',
          fileSize: 1024,
          fileUrl: 'https://storage/photo.jpg',
          status: 'VERIFIED',
          uploadedAt: new Date(),
        },
        {
          id: 'doc-2',
          documentType: 'AADHAAR',
          title: 'Aadhaar Card',
          fileName: 'aadhaar.pdf',
          fileSize: 2048,
          fileUrl: 'https://storage/aadhaar.pdf',
          status: 'VERIFIED',
          uploadedAt: new Date(),
        },
      ],
      enrollments: [
        {
          id: 'enr-1',
          studentId: student1Id,
          academicSessionId: 'sess-1',
          classId: classAId,
          sectionId: sectionAId,
          rollNumber: '01',
          rollNumberMode: 'AUTO',
          status: 'ACTIVE',
          enrolledAt: new Date(),
          class: { name: 'Class 10' },
          section: { name: 'A' },
          academicSession: { name: '2026-2027' },
        },
      ],
      parentStudents: [],
    };

    // Pre-configure Prisma mocks
    (prisma.user as any).findUnique = async ({ where }: any) => ({
      id: where.id,
      status: 'ACTIVE',
      isActive: true,
    });

    (prisma.permission as any).findUnique = async ({ where }: any) => ({
      id: 'perm-students-view',
      code: where.code,
    });

    (prisma.userPermissionOverride as any).findUnique = async () => null;

    (prisma.schoolMembership as any).findUnique = async ({ where }: any) => {
      const isTeacher = where.userId_schoolId.userId === teacherUserId;
      return {
        id: `mem-${where.userId_schoolId.userId}`,
        userId: where.userId_schoolId.userId,
        schoolId: where.userId_schoolId.schoolId,
        role: isTeacher ? 'TEACHER' : 'ADMIN',
        status: 'ACTIVE',
        customRole: null,
      };
    };

    // 1. Test: Unassigned Teacher is Rejected with HTTP 403
    await test('Unassigned Teacher requesting Student in Class A is strictly rejected with HTTP 403', async () => {
      const rawToken = await createAuthenticatedSession({
        userId: teacherUserId,
        schoolId: schoolAId,
        role: 'TEACHER',
        teacherId: teacherProfileId,
      });

      (prisma.student as any).findFirst = async () => mockStudent;
      (prisma.teacher as any).findFirst = async () => ({ id: teacherProfileId });
      // Unassigned teacher has no record for classAId
      (prisma.teacherAssignment as any).findFirst = async () => null;

      const req = createMockRequest(`http://localhost:3000/api/students/${student1Id}`, rawToken);
      const res = await GET(req, { params: Promise.resolve({ id: student1Id }) });

      assert.strictEqual(res.status, 403, 'Unassigned teacher must receive HTTP 403');
      const body = await res.json();
      assert.strictEqual(body.message, "Forbidden: You are not assigned to this student's class or section.");
    });

    // 2. Test: Assigned Teacher can view student, but financials are stripped
    await test('Assigned Teacher can view Student, but financialSummary and KYC docs are stripped', async () => {
      const rawToken = await createAuthenticatedSession({
        userId: teacherUserId,
        schoolId: schoolAId,
        role: 'TEACHER',
        teacherId: teacherProfileId,
      });

      (prisma.student as any).findFirst = async () => mockStudent;
      (prisma.teacher as any).findFirst = async () => ({ id: teacherProfileId });
      // Assigned teacher matches classAId
      (prisma.teacherAssignment as any).findFirst = async () => ({
        id: 'assign-1',
        teacherId: teacherProfileId,
        classId: classAId,
      });
      (prisma.attendanceRecord as any).findMany = async () => [];

      const req = createMockRequest(`http://localhost:3000/api/students/${student1Id}`, rawToken);
      const res = await GET(req, { params: Promise.resolve({ id: student1Id }) });

      assert.strictEqual(res.status, 200, 'Assigned teacher should receive HTTP 200');
      const body = await res.json();
      assert.strictEqual(body.student.id, student1Id);
      assert.strictEqual(body.student.firstName, 'Aarav');
      // Verify feesSummary is strictly stripped
      assert.strictEqual(body.student.feesSummary, null, 'Fees summary must be stripped for TEACHER role');
      // Verify KYC document (AADHAAR) is stripped
      assert.strictEqual(body.student.documents.length, 1, 'Sensitive KYC documents must be stripped');
      assert.strictEqual(body.student.documents[0].documentType, 'PHOTO');
    });

    // 3. Test: Admin / School Leadership receives full profile including financials
    await test('School Leadership (ADMIN/PRINCIPAL) receives full profile with financial totals', async () => {
      const rawToken = await createAuthenticatedSession({
        userId: adminUserId,
        schoolId: schoolAId,
        role: 'ADMIN',
      });

      (prisma.student as any).findFirst = async () => mockStudent;
      (prisma.feeObligation as any).findMany = async () => [
        { id: 'ob-1', netAmount: 15000, concessionAmount: 0 },
      ];
      (prisma.feePayment as any).findMany = async () => [
        { id: 'pay-1', amount: 5000 },
      ];
      (prisma.attendanceRecord as any).findMany = async () => [];

      const req = createMockRequest(`http://localhost:3000/api/students/${student1Id}`, rawToken);
      const res = await GET(req, { params: Promise.resolve({ id: student1Id }) });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.notStrictEqual(body.student.feesSummary, null, 'Leadership must receive fee summary');
      assert.strictEqual(body.student.feesSummary.outstandingBalance, 10000);
      assert.strictEqual(body.student.documents.length, 2, 'Leadership must access all documents');
    });

    // 4. Test: Cross-Tenant Isolation (Tenant B accessing Tenant A student gets 404)
    await test('Cross-Tenant Isolation: User from School B requesting Student in School A gets HTTP 404', async () => {
      const rawToken = await createAuthenticatedSession({
        userId: 'user-b',
        schoolId: schoolBId,
        role: 'ADMIN',
      });

      // In real Prisma, where: { id, schoolId: schoolBId } returns null because student belongs to schoolAId
      (prisma.student as any).findFirst = async (args: any) => {
        if (args.where.schoolId === schoolAId) return mockStudent;
        return null;
      };

      const req = createMockRequest(`http://localhost:3000/api/students/${student1Id}`, rawToken);
      const res = await GET(req, { params: Promise.resolve({ id: student1Id }) });

      assert.strictEqual(res.status, 404, 'Cross-tenant request must return HTTP 404 Not Found');
    });

    // 5. Test: Unassigned Teacher attempting to PATCH student receives HTTP 403
    await test('Unassigned Teacher with students.edit attempting to PATCH student receives HTTP 403 assignment rejection', async () => {
      const rawToken = await createAuthenticatedSession({
        userId: teacherUserId,
        schoolId: schoolAId,
        role: 'TEACHER',
        teacherId: teacherProfileId,
      });

      // Grant teacher students.edit permission via override mock
      (prisma.userPermissionOverride as any).findUnique = async () => ({
        id: 'ov-1',
        userId: teacherUserId,
        schoolId: schoolAId,
        isGranted: true,
        scope: 'ASSIGNED',
      });

      (prisma.student as any).findFirst = async () => mockStudent;
      (prisma.teacher as any).findFirst = async () => ({ id: teacherProfileId });
      (prisma.teacherAssignment as any).findFirst = async () => null; // unassigned to student's class

      const req = createMockRequest(
        `http://localhost:3000/api/students/${student1Id}`,
        rawToken,
        'PATCH',
        { firstName: 'Modified' }
      );
      const res = await PATCH(req, { params: Promise.resolve({ id: student1Id }) });

      assert.strictEqual(res.status, 403, 'Unassigned teacher cannot PATCH student');
      const body = await res.json();
      assert.strictEqual(body.message, "Forbidden: You are not assigned to modify this student's records.");
    });
  } finally {
    // Restore mocks
    prisma.student.findFirst = originalFindFirst;
    prisma.teacher.findFirst = originalTeacherFindFirst;
    prisma.teacherAssignment.findFirst = originalAssignmentFindFirst;
    prisma.feeObligation.findMany = originalObligationFindMany;
    prisma.feePayment.findMany = originalPaymentFindMany;
    prisma.attendanceRecord.findMany = originalAttendanceFindMany;
    prisma.user.findUnique = originalUserFindUnique;
    prisma.schoolMembership.findUnique = originalMembershipFindUnique;
    prisma.permission.findUnique = originalPermissionFindUnique;
    prisma.userPermissionOverride.findUnique = originalOverrideFindUnique;
  }

  console.log(`\nAll RIVO-SEC-003 tests completed: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
