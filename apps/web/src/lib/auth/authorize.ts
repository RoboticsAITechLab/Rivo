import { prisma } from '@/lib/prisma';
import { PermissionScope } from '@/generated/prisma';

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  scope?: PermissionScope;
}

export interface TeacherResourceTarget {
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  campusId?: string;
}

/**
 * Resolves effective permission for a user within a school tenant.
 * Hierarchy:
 * 1. Explicit UserPermissionOverride (if exists) takes top precedence.
 * 2. CustomRole permissions (if membership has customRoleId).
 * 3. Base Role system defaults (OWNER/ADMIN/SCHOOL_ADMIN have full SCHOOL scope).
 */
export async function getEffectivePermission(params: {
  userId: string;
  schoolId: string;
  permissionCode: string;
}): Promise<{ granted: boolean; scope: PermissionScope }> {
  const { userId, schoolId, permissionCode } = params;

  // Check SchoolMembership
  const membership = await prisma.schoolMembership.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId,
      },
    },
    include: {
      customRole: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!membership) {
    return { granted: false, scope: 'OWN' };
  }

  // School Owners and Admins have root access across all modules in their school
  if (
    membership.role === 'OWNER' ||
    membership.role === 'ADMIN' ||
    membership.role === 'SCHOOL_ADMIN'
  ) {
    return { granted: true, scope: 'SCHOOL' };
  }

  // 1. Check individual user override
  const perm = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });

  if (perm) {
    const override = await prisma.userPermissionOverride.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: perm.id,
        },
      },
    });

    if (override && override.schoolId === schoolId) {
      return {
        granted: override.isGranted,
        scope: override.scope,
      };
    }
  }

  // 2. Check CustomRole permissions if assigned
  if (membership.customRole && perm) {
    const rolePerm = membership.customRole.rolePermissions.find(
      (rp) => rp.permissionId === perm.id
    );
    if (rolePerm) {
      return {
        granted: true,
        scope: rolePerm.scope,
      };
    }
  }

  // 3. System Defaults for Base TEACHER Role
  if (membership.role === 'TEACHER') {
    // Default teacher capabilities
    if (
      permissionCode === 'attendance.view' ||
      permissionCode === 'attendance.take' ||
      permissionCode === 'students.view' ||
      permissionCode === 'results.view' ||
      permissionCode === 'results.enter_marks' ||
      permissionCode === 'school_timetable.view'
    ) {
      return { granted: true, scope: 'ASSIGNED' };
    }
  }

  return { granted: false, scope: 'OWN' };
}

/**
 * Validates whether a user is authorized to perform an action on a specific institutional resource.
 * Enforces Tenant Isolation, Granular Permission Code, and Resource Scoping.
 */
export async function authorizeResource(params: {
  userId: string;
  schoolId: string;
  permissionCode: string;
  resource?: TeacherResourceTarget;
}): Promise<AuthorizationResult> {
  const { userId, schoolId, permissionCode, resource } = params;

  // 1. Resolve permission and scope
  const perm = await getEffectivePermission({ userId, schoolId, permissionCode });
  if (!perm.granted) {
    return {
      authorized: false,
      reason: `Permission denied: Missing '${permissionCode}' capability.`,
    };
  }

  // 2. Evaluate Scope
  if (perm.scope === 'SCHOOL') {
    return { authorized: true, scope: perm.scope };
  }

  if (perm.scope === 'CAMPUS') {
    if (!resource?.campusId) {
      return { authorized: true, scope: perm.scope };
    }
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
      select: { campusId: true },
    });
    if (teacher?.campusId && teacher.campusId === resource.campusId) {
      return { authorized: true, scope: perm.scope };
    }
    return {
      authorized: false,
      reason: 'Unauthorized: Resource is outside your assigned campus.',
      scope: perm.scope,
    };
  }

  if (perm.scope === 'ASSIGNED') {
    // If no specific class or section was targeted (e.g. browsing overview), allow
    if (!resource?.classId && !resource?.sectionId) {
      return { authorized: true, scope: perm.scope };
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });
    if (!teacher) {
      return {
        authorized: false,
        reason: 'Teacher record not found for assigned scope validation.',
      };
    }

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        schoolId,
        teacherId: teacher.id,
        ...(resource.classId ? { classId: resource.classId } : {}),
        ...(resource.sectionId ? { sectionId: resource.sectionId } : {}),
        ...(resource.subjectId ? { subjectId: resource.subjectId } : {}),
      },
    });

    if (!assignment) {
      return {
        authorized: false,
        reason: 'Forbidden: You are not assigned to this class, section, or subject.',
        scope: perm.scope,
      };
    }

    return { authorized: true, scope: perm.scope };
  }

  return { authorized: false, reason: 'Unauthorized: Scope evaluation failed.' };
}
