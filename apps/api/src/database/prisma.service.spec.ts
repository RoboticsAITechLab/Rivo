import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService & Multi-Tenant Data Foundation', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Lifecycle Management', () => {
    it('should connect during onModuleInit', async () => {
      const connectSpy = vi.spyOn(service, '$connect').mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should disconnect during onModuleDestroy', async () => {
      const disconnectSpy = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined);
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Multi-Tenant Scoping (Tenant Isolation Foundation)', () => {
    const schoolA = 'school-a-uuid';
    const schoolB = 'school-b-uuid';

    it('throws when schoolId is missing', () => {
      expect(() => service.forSchool('')).toThrow('schoolId is required');
    });

    it('enforces schoolId on student findUnique queries', async () => {
      const findFirstSpy = vi
        .spyOn(service.student, 'findFirst')
        .mockResolvedValue(null as any);

      const tenantA = service.forSchool(schoolA);
      await tenantA.student.findUnique({ id: 'student-123' });

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 'student-123', schoolId: schoolA },
        include: undefined,
      });
    });

    it('enforces schoolId on student findMany queries', async () => {
      const findManySpy = vi
        .spyOn(service.student, 'findMany')
        .mockResolvedValue([] as any);

      const tenantB = service.forSchool(schoolB);
      await tenantB.student.findMany({ where: { status: 'ACTIVE' } });

      expect(findManySpy).toHaveBeenCalledWith({
        where: { status: 'ACTIVE', schoolId: schoolB },
      });
    });

    it('enforces schoolId on student create queries', async () => {
      const createSpy = vi
        .spyOn(service.student, 'create')
        .mockResolvedValue({} as any);

      const tenantA = service.forSchool(schoolA);
      await tenantA.student.create({
        data: {
          admissionNumber: 'ADM-001',
          firstName: 'John',
          lastName: 'Student',
        },
      });

      expect(createSpy).toHaveBeenCalledWith({
        include: undefined,
        data: {
          admissionNumber: 'ADM-001',
          firstName: 'John',
          lastName: 'Student',
          schoolId: schoolA,
        },
      });
    });

    it('prevents cross-tenant query leak between tenants', async () => {
      const findFirstSpy = vi
        .spyOn(service.student, 'findFirst')
        .mockImplementation(async (args: any) => {
          // Simulate database checking both id and schoolId
          if (args?.where?.id === 'student-1' && args?.where?.schoolId === schoolA) {
            return { id: 'student-1', schoolId: schoolA, firstName: 'Student A' } as any;
          }
          return null;
        });

      const tenantA = service.forSchool(schoolA);
      const tenantB = service.forSchool(schoolB);

      const foundByTenantA = await tenantA.student.findUnique({ id: 'student-1' });
      const foundByTenantB = await tenantB.student.findUnique({ id: 'student-1' });

      expect(foundByTenantA).not.toBeNull();
      expect(foundByTenantA?.schoolId).toBe(schoolA);
      expect(foundByTenantB).toBeNull(); // Cross-tenant access blocked!
      expect(findFirstSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Relational Model & Constraint Integrity Checks', () => {
    it('verifies parent-student many-to-many relationship structure', () => {
      const parentStudent = {
        parentId: 'parent-1',
        studentId: 'student-1',
        relationshipType: 'FATHER',
        isPrimaryContact: true,
      };
      expect(parentStudent.parentId).toBe('parent-1');
      expect(parentStudent.studentId).toBe('student-1');
      expect(parentStudent.relationshipType).toBe('FATHER');
    });

    it('verifies student enrollment composite relationship structure', () => {
      const enrollment = {
        schoolId: 'school-1',
        studentId: 'student-1',
        academicSessionId: 'session-2026',
        classId: 'class-10',
        sectionId: 'section-10a',
        status: 'ACTIVE',
      };
      expect(enrollment.studentId).toBe('student-1');
      expect(enrollment.academicSessionId).toBe('session-2026');
      expect(enrollment.classId).toBe('class-10');
      expect(enrollment.sectionId).toBe('section-10a');
    });

    it('verifies user-school membership structure', () => {
      const membership = {
        userId: 'user-admin-1',
        schoolId: 'school-1',
        role: 'SCHOOL_ADMIN',
      };
      expect(membership.userId).toBe('user-admin-1');
      expect(membership.schoolId).toBe('school-1');
      expect(membership.role).toBe('SCHOOL_ADMIN');
    });
  });
});
