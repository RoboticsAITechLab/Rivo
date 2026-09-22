import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PermissionScope, Role } from '@/generated/prisma';
import { getValidSession, ActiveSessionContext } from '@/lib/auth/session';

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
  ownerUserId?: string;
}

/**
 * Resolves effective permission for a user within a school tenant.
 *
 * Deterministic Precedence (Phase 6):
 * 1. No user or inactive/suspended user -> DENY
 * 2. No active school membership -> DENY
 * 3. Explicit UserPermissionOverride:
 *    - isGranted == false -> DENY (Explicit DENY overrides role ALLOW)
 *    - isGranted == true -> ALLOW (Explicit ALLOW with override scope)
 * 4. CustomRole permissions (if membership has customRoleId) -> ALLOW with role scope
 * 5. System Role defaults:
 *    - OWNER, ADMIN, SCHOOL_ADMIN -> ALLOW (SCHOOL scope)
 *    - TEACHER -> Baseline teaching permissions with ASSIGNED scope
 *    - STAFF -> Restricted operational access
 * 6. Otherwise -> DENY
 */
export async function getEffectivePermission(params: {
  userId: string;
  schoolId: string;
  permissionCode: string;
}): Promise<{ granted: boolean; scope: PermissionScope; reason?: string }> {
  const { userId, schoolId, permissionCode } = params;

  // 1. Verify User exists and is ACTIVE
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, isActive: true },
  });

  if (!user || user.status !== 'ACTIVE' || !user.isActive) {
    return { granted: false, scope: 'OWN', reason: 'Account is inactive, suspended, or disabled.' };
  }

  // 2. Verify SchoolMembership exists and is ACTIVE
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

  if (!membership || membership.status !== 'ACTIVE') {
    return { granted: false, scope: 'OWN', reason: 'No active school membership found for this tenant.' };
  }

  // 3. School Owners, Admins, and School Admins have full SCHOOL scope across all features
  if (
    membership.role === 'OWNER' ||
    membership.role === 'ADMIN' ||
    membership.role === 'SCHOOL_ADMIN'
  ) {
    return { granted: true, scope: 'SCHOOL' };
  }

  // 4. Check explicit UserPermissionOverride (takes precedence over roles)
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
      if (!override.isGranted) {
        // Explicit DENY
        return {
          granted: false,
          scope: override.scope,
          reason: `Permission denied: Explicit override denies '${permissionCode}'.`,
        };
      }
      // Explicit ALLOW
      return {
        granted: true,
        scope: override.scope,
      };
    }
  }

  // 5. Check CustomRole permissions if assigned
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

  // 6. System Defaults for Base TEACHER Role
  if (membership.role === 'TEACHER') {
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

  // 7. System Defaults for Base STAFF Role
  if (membership.role === 'STAFF') {
    if (
      permissionCode === 'students.view' ||
      permissionCode === 'school_timetable.view'
    ) {
      return { granted: true, scope: 'SCHOOL' };
    }
  }

  return {
    granted: false,
    scope: 'OWN',
    reason: `Permission denied: Missing '${permissionCode}' capability.`,
  };
}

/**
 * Validates whether a user is authorized to perform an action on a specific institutional resource.
 * Enforces Tenant Isolation, Granular Permission Code, and Resource Scoping (Phase 7).
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
      reason: perm.reason || `Permission denied: Missing '${permissionCode}' capability.`,
      scope: perm.scope,
    };
  }

  // 2. Evaluate Scope
  // SCHOOL scope: allowed across all campuses, classes, and sections in the school tenant
  if (perm.scope === 'SCHOOL') {
    return { authorized: true, scope: perm.scope };
  }

  // CAMPUS scope: user may access only resources matching their assigned campus
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

  // ASSIGNED scope: teacher may access only assigned classes/sections/subjects
  if (perm.scope === 'ASSIGNED') {
    // If no specific class or section was targeted (e.g. general overview), allow
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
        scope: perm.scope,
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

  // OWN scope: user may access only their own records
  if (perm.scope === 'OWN') {
    if (resource?.ownerUserId && resource.ownerUserId !== userId) {
      return {
        authorized: false,
        reason: 'Forbidden: You can only access your own personal records.',
        scope: perm.scope,
      };
    }
    return { authorized: true, scope: perm.scope };
  }

  return { authorized: false, reason: 'Unauthorized: Scope evaluation failed.' };
}

export interface AuthContextResult {
  authorized: true;
  session: ActiveSessionContext;
  userId: string;
  schoolId: string;
  role: string;
  teacherId?: string;
  scope?: PermissionScope;
}

export interface AuthFailureResult {
  authorized: false;
  response: NextResponse;
}

export type RequireAuthResponse = AuthContextResult | AuthFailureResult;

/**
 * Standard backend security guard for API route handlers (Phase 20 & 21).
 *
 * Enforces:
 * 1. Valid session from secure HttpOnly cookie
 * 2. Active User account (not suspended or disabled)
 * 3. Active School Membership (derives tenant schoolId securely)
 * 4. Optional Role restriction
 * 5. Optional Granular Permission check
 * 6. Optional Resource Scope validation
 */
export async function requireAuth(
  req: NextRequest,
  options?: {
    permission?: string;
    resource?: TeacherResourceTarget;
    roles?: Role[];
  }
): Promise<RequireAuthResponse> {
  // 1. Session verification
  const session = await getValidSession(req);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  // 2. Role restriction check (if specific roles are required)
  if (options?.roles && options.roles.length > 0) {
    if (!options.roles.includes(session.role as Role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { message: 'Forbidden: Insufficient role permissions.' },
          { status: 403 }
        ),
      };
    }
  }

  // 3. Permission & Scope check (if specific capability is required)
  if (options?.permission) {
    const auth = await authorizeResource({
      userId: session.userId,
      schoolId: session.schoolId,
      permissionCode: options.permission,
      resource: options.resource,
    });

    if (!auth.authorized) {
      return {
        authorized: false,
        response: NextResponse.json(
          { message: auth.reason || 'Forbidden' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      session,
      userId: session.userId,
      schoolId: session.schoolId,
      role: session.role,
      teacherId: session.teacherId,
      scope: auth.scope,
    };
  }

  return {
    authorized: true,
    session,
    userId: session.userId,
    schoolId: session.schoolId,
    role: session.role,
    teacherId: session.teacherId,
  };
}

/**
 * Server-side source of truth for the authenticated current user (Phase 11).
 * Resolves user profile, active school membership, role, and effective permissions.
 */
export async function getCurrentUser(reqOrToken: NextRequest | string) {
  const session = await getValidSession(reqOrToken);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        where: { schoolId: session.schoolId, status: 'ACTIVE' },
        include: {
          school: true,
          customRole: true,
        },
      },
      teachers: {
        where: { schoolId: session.schoolId },
      },
      mfa: {
        select: {
          enabled: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE' || !user.isActive) {
    return null;
  }

  const membership = user.memberships[0];
  if (!membership) return null;

  const school = membership.school;
  const teacher = user.teachers[0];

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone || undefined,
    role: membership.role === 'SCHOOL_ADMIN'
      ? 'School Administrator'
      : membership.role === 'TEACHER'
      ? 'Teacher'
      : membership.role,
    roleType: membership.role,
    customRoleName: membership.customRole?.name,
    initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'US',
    schoolId: school.id,
    schoolName: school.name,
    schoolSlug: school.slug,
    teacherId: teacher?.id,
    status: user.status,
    mfaEnabled: !!user.mfa?.enabled,
  };
}
