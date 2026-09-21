import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully via Prisma');
    } catch (error) {
      this.logger.warn(
        `Database connection could not be established during startup: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Helper to construct a tenant-bound query context.
   * Enforces schoolId scoping on tenant-specific models to prevent
   * accidental cross-tenant data leaks at the application layer.
   */
  forSchool(schoolId: string) {
    if (!schoolId) {
      throw new Error('schoolId is required to construct a tenant-scoped query context');
    }

    return {
      schoolId,
      student: {
        findUnique: (args: { id: string; include?: Prisma.StudentInclude }) =>
          this.student.findFirst({
            where: { id: args.id, schoolId },
            include: args.include,
          }),
        findMany: (args: {
          where?: Prisma.StudentWhereInput;
          include?: Prisma.StudentInclude;
          orderBy?: Prisma.StudentOrderByWithRelationInput;
          take?: number;
          skip?: number;
        } = {}) =>
          this.student.findMany({
            ...args,
            where: { ...args.where, schoolId },
          }),
        count: (args: { where?: Prisma.StudentWhereInput } = {}) =>
          this.student.count({
            ...args,
            where: { ...args.where, schoolId },
          }),
        create: (args: {
          data: Omit<Prisma.StudentUncheckedCreateInput, 'schoolId'>;
          include?: Prisma.StudentInclude;
        }) =>
          this.student.create({
            include: args.include,
            data: { ...args.data, schoolId },
          }),
      },
      class: {
        findUnique: (args: { id: string; include?: Prisma.ClassInclude }) =>
          this.class.findFirst({
            where: { id: args.id, schoolId },
            include: args.include,
          }),
        findMany: (args: { where?: Prisma.ClassWhereInput; include?: Prisma.ClassInclude } = {}) =>
          this.class.findMany({
            ...args,
            where: { ...args.where, schoolId },
          }),
      },
      academicSession: {
        findUnique: (args: { id: string; include?: Prisma.AcademicSessionInclude }) =>
          this.academicSession.findFirst({
            where: { id: args.id, schoolId },
            include: args.include,
          }),
        findMany: (args: {
          where?: Prisma.AcademicSessionWhereInput;
          include?: Prisma.AcademicSessionInclude;
        } = {}) =>
          this.academicSession.findMany({
            ...args,
            where: { ...args.where, schoolId },
          }),
      },
      teacher: {
        findUnique: (args: { id: string; include?: Prisma.TeacherInclude }) =>
          this.teacher.findFirst({
            where: { id: args.id, schoolId },
            include: args.include,
          }),
        findMany: (args: { where?: Prisma.TeacherWhereInput; include?: Prisma.TeacherInclude } = {}) =>
          this.teacher.findMany({
            ...args,
            where: { ...args.where, schoolId },
          }),
      },
      parent: {
        findUnique: (args: { id: string; include?: Prisma.ParentInclude }) =>
          this.parent.findFirst({
            where: { id: args.id, schoolId },
            include: args.include,
          }),
        findMany: (args: { where?: Prisma.ParentWhereInput; include?: Prisma.ParentInclude } = {}) =>
          this.parent.findMany({
            ...args,
            where: { ...args.where, schoolId },
          }),
      },
    };
  }
}

