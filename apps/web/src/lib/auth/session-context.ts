import { cache } from 'react';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/crypto';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { PermissionScope } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  isActive: boolean;
  isPlatformOwner: boolean;
  platformRole: 'OWNER' | 'PLATFORM_ADMIN' | null;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoUrl?: string | null;
}

export interface TeacherProfileContext {
  id: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  campusId: string | null;
}

export interface BaseSessionContext {
  authenticated: boolean;
}

export interface UnauthenticatedSessionContext extends BaseSessionContext {
  authenticated: false;
  sessionId: null;
  userId: null;
  email: null;
  scope: null;
  schoolId: null;
  school: null;
  user: null;
  membership: null;
  teacherProfile: null;
  role: null;
  permissions: ReadonlySet<string>;
  hasPermission: (code: string) => false;
  getPermissionScope: (code: string) => null;
  isLeadership: () => false;
  isTeacher: () => false;
  isFeeManager: () => false;
  isPlatformAdmin: () => false;
  enforceSchool: (targetSchoolId: string) => false;
}

export interface AuthenticatedSessionContext extends BaseSessionContext {
  authenticated: true;
  sessionId: string;
  userId: string;
  email: string | null;
  scope: 'PLATFORM' | 'SCHOOL';
  schoolId: string | null;
  school: TenantContext | null;
  user: AuthenticatedUser;
  membership: {
    id: string;
    role: string;
    status: string;
    customRoleId: string | null;
  } | null;
  teacherProfile: TeacherProfileContext | null;
  role: string;
  permissions: ReadonlySet<string>;
  hasPermission: (code: string) => boolean;
  getPermissionScope: (code: string) => PermissionScope | null;
  isLeadership: () => boolean;
  isTeacher: () => boolean;
  isFeeManager: () => boolean;
  isPlatformAdmin: () => boolean;
  enforceSchool: (targetSchoolId: string) => boolean;
}

export type SessionContext = AuthenticatedSessionContext | UnauthenticatedSessionContext;

export interface SessionContextOptions {
  token?: string | null;
  req?: NextRequest | null;
}

export const UNAUTHENTICATED_SESSION_CONTEXT: UnauthenticatedSessionContext = Object.freeze({
  authenticated: false,
  sessionId: null,
  userId: null,
  email: null,
  scope: null,
  schoolId: null,
  school: null,
  user: null,
  membership: null,
  teacherProfile: null,
  role: null,
  permissions: new Set<string>(),
  hasPermission: () => false,
  getPermissionScope: () => null,
  isLeadership: () => false,
  isTeacher: () => false,
  isFeeManager: () => false,
  isPlatformAdmin: () => false,
  enforceSchool: () => false,
});

/**
 * Extracts raw session token from explicit arguments or incoming cookies in Server Components.
 */
async function extractRawToken(options?: SessionContextOptions): Promise<string | null> {
  if (options?.token) {
    return options.token.trim() || null;
  }

  if (options?.req) {
    const cookieToken = options.req.cookies?.get(SESSION_COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;

    const authHeader = options.req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim() || null;
    }
  }

  // Next.js App Router Server Component context (reading cookies from next/headers)
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    // Return null outside RSC or in standalone testing contexts
    return null;
  }
}

/**
 * Resolves permissions and scopes deterministically according to Rivo RBAC Precedence:
 * 1. Director / Owner -> Full SCHOOL scope on all permissions
 * 2. Principal / Admin / School Admin -> Full SCHOOL scope, except institutional roles & security policy management
 * 3. Custom Role Permissions -> Scoped by role definitions
 * 4. System Role Defaults -> Teacher, Fee Manager, Staff defaults
 * 5. UserPermissionOverrides -> Explicit ALLOW / DENY overrides
 */
function resolveEffectivePermissions(
  role: string,
  schoolId: string,
  membershipCustomRole: any,
  userOverrides: any[]
): { permissions: Set<string>; permissionScopes: Map<string, PermissionScope> } {
  const permissions = new Set<string>();
  const permissionScopes = new Map<string, PermissionScope>();

  // Helper to add permission
  const grant = (code: string, scope: PermissionScope = 'SCHOOL') => {
    permissions.add(code);
    permissionScopes.set(code, scope);
  };

  // Helper to revoke permission
  const revoke = (code: string) => {
    permissions.delete(code);
    permissionScopes.delete(code);
  };

  // 1. Director & Owner
  if (role === 'DIRECTOR' || role === 'OWNER') {
    // All known permissions granted with SCHOOL scope
    grant('*', 'SCHOOL');
    return { permissions, permissionScopes };
  }

  // 2. Principal, Admin, School Admin
  if (role === 'PRINCIPAL' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') {
    grant('*', 'SCHOOL');
    // Institutional roles & security policies strictly restricted to Director/Owner
    revoke('roles.edit');
    revoke('roles.manage');
    revoke('roles.delete');
    revoke('security.view');
    revoke('security.manage');
    return { permissions, permissionScopes };
  }

  // 3. CustomRole Permissions if assigned
  if (membershipCustomRole?.rolePermissions) {
    for (const rp of membershipCustomRole.rolePermissions) {
      if (rp.permission?.code) {
        grant(rp.permission.code, rp.scope);
      }
    }
  }

  // 4. System Role Baseline Defaults
  if (role === 'TEACHER') {
    grant('attendance.view', 'ASSIGNED');
    grant('attendance.take', 'ASSIGNED');
    grant('students.view', 'ASSIGNED');
    grant('results.view', 'ASSIGNED');
    grant('results.enter_marks', 'ASSIGNED');
    grant('school_timetable.view', 'ASSIGNED');
    grant('notices.view', 'SCHOOL');
    grant('subjects.view', 'SCHOOL');
  } else if (role === 'FEE_MANAGER') {
    grant('fees.view', 'SCHOOL');
    grant('fees.plan_view', 'SCHOOL');
    grant('fees.plan_create', 'SCHOOL');
    grant('fees.payment_record', 'SCHOOL');
    grant('fees.receipt_view', 'SCHOOL');
    grant('fees.concession_apply', 'SCHOOL');
    grant('fees.concession_reverse', 'SCHOOL');
    grant('fees.stats_view', 'SCHOOL');
    grant('students.view', 'SCHOOL');
    grant('notices.view', 'SCHOOL');
    grant('academic_sessions.view', 'SCHOOL');
    grant('campuses.view', 'SCHOOL');
    grant('classes.view', 'SCHOOL');
    grant('sections.view', 'SCHOOL');
    grant('reports.view', 'SCHOOL');
  } else if (role === 'STAFF') {
    grant('students.view', 'SCHOOL');
    grant('school_timetable.view', 'SCHOOL');
  }

  // 5. UserPermissionOverrides (Explicit DENY / ALLOW override role defaults)
  if (Array.isArray(userOverrides)) {
    for (const ov of userOverrides) {
      if (ov.schoolId === schoolId && ov.permission?.code) {
        if (!ov.isGranted) {
          revoke(ov.permission.code);
        } else {
          grant(ov.permission.code, ov.scope);
        }
      }
    }
  }

  return { permissions, permissionScopes };
}

/**
 * Resolves session and hydrations directly from database without ambient React context.
 * Used internally and by API routes/tests where request-level execution is needed.
 */
export async function resolveSessionContext(options?: SessionContextOptions): Promise<SessionContext> {
  const rawToken = await extractRawToken(options);
  if (!rawToken) {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  const tokenHash = hashToken(rawToken);

  // Single consolidated query resolving session, user, school, active membership, custom role & overrides
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: 'ACTIVE' },
            include: {
              customRole: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
          teachers: true,
          userPermissionOverrides: {
            include: { permission: true },
          },
        },
      },
      school: true,
    },
  });

  if (!session) {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  // Check revocation and expiration
  const now = new Date();
  if (session.revokedAt !== null || session.expiresAt < now) {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  // Check user account status
  if (session.user.status !== 'ACTIVE' || !session.user.isActive) {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  const userContext: AuthenticatedUser = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    fullName: `${session.user.firstName} ${session.user.lastName}`.trim(),
    status: session.user.status,
    isActive: session.user.isActive,
    isPlatformOwner: session.user.isPlatformOwner,
    platformRole: (session.user.platformRole as any) || (session.user.isPlatformOwner ? 'OWNER' : null),
  };

  // Case A: Platform User Session (schoolId === null)
  if (!session.schoolId) {
    const platformRole = userContext.platformRole;
    if (!platformRole) {
      return UNAUTHENTICATED_SESSION_CONTEXT;
    }

    const platformPermissions = new Set<string>(['*']);
    const platformScopes = new Map<string, PermissionScope>([['*', 'SCHOOL']]);

    return {
      authenticated: true,
      sessionId: session.id,
      userId: userContext.id,
      email: userContext.email,
      scope: 'PLATFORM',
      schoolId: null,
      school: null,
      user: userContext,
      membership: null,
      teacherProfile: null,
      role: platformRole,
      permissions: platformPermissions,
      hasPermission: () => true,
      getPermissionScope: () => 'SCHOOL',
      isLeadership: () => false,
      isTeacher: () => false,
      isFeeManager: () => false,
      isPlatformAdmin: () => true,
      enforceSchool: () => false, // Platform session is not bound to a school tenant
    };
  }

  // Case B: School Tenant Session (schoolId !== null)
  const schoolId = session.schoolId;

  // Verify school exists and is ACTIVE
  if (!session.school || session.school.id !== schoolId || session.school.status !== 'ACTIVE') {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  // Find active membership in this specific school
  const activeMembership = session.user.memberships.find((m) => m.schoolId === schoolId);
  if (!activeMembership) {
    return UNAUTHENTICATED_SESSION_CONTEXT;
  }

  // Resolve teacher profile if present in this school
  const teacherRecord = session.user.teachers.find((t) => t.schoolId === schoolId);
  const teacherProfile: TeacherProfileContext | null = teacherRecord
    ? {
        id: teacherRecord.id,
        employeeId: teacherRecord.employeeId,
        department: teacherRecord.department,
        designation: teacherRecord.designation,
        campusId: teacherRecord.campusId,
      }
    : null;

  const role = activeMembership.role;

  // Resolve effective permissions and scopes
  const { permissions, permissionScopes } = resolveEffectivePermissions(
    role,
    schoolId,
    activeMembership.customRole,
    session.user.userPermissionOverrides
  );

  const hasPermission = (code: string): boolean => {
    if (permissions.has('*')) {
      // Check for restricted management permissions for non-owners
      if (
        (role === 'PRINCIPAL' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') &&
        (code.startsWith('roles.') || code.startsWith('security.'))
      ) {
        return false;
      }
      return true;
    }
    return permissions.has(code);
  };

  const getPermissionScope = (code: string): PermissionScope | null => {
    if (permissions.has('*')) {
      if (
        (role === 'PRINCIPAL' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') &&
        (code.startsWith('roles.') || code.startsWith('security.'))
      ) {
        return null;
      }
      return 'SCHOOL';
    }
    return permissionScopes.get(code) || null;
  };

  const isLeadership = (): boolean => {
    return ['OWNER', 'DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN'].includes(role);
  };

  const isTeacher = (): boolean => role === 'TEACHER';
  const isFeeManager = (): boolean => role === 'FEE_MANAGER' || isLeadership();
  const isPlatformAdmin = (): boolean => false;

  const enforceSchool = (targetSchoolId: string): boolean => {
    return schoolId === targetSchoolId;
  };

  return {
    authenticated: true,
    sessionId: session.id,
    userId: userContext.id,
    email: userContext.email,
    scope: 'SCHOOL',
    schoolId,
    school: {
      id: session.school.id,
      name: session.school.name,
      slug: session.school.slug,
      status: session.school.status,
      logoUrl: session.school.logoUrl,
    },
    user: userContext,
    membership: {
      id: activeMembership.id,
      role: activeMembership.role,
      status: activeMembership.status,
      customRoleId: activeMembership.customRoleId,
    },
    teacherProfile,
    role,
    permissions,
    hasPermission,
    getPermissionScope,
    isLeadership,
    isTeacher,
    isFeeManager,
    isPlatformAdmin,
    enforceSchool,
  };
}

/**
 * Request-scoped session context hydration for Next.js App Router Server Components.
 * Wrapped with React's `cache()` so that repeated invocations within the same request
 * (e.g. layout -> page -> sidebar -> navbar) execute the database resolution exactly ONCE.
 */
export const getSessionContext = cache(async (options?: SessionContextOptions): Promise<SessionContext> => {
  return resolveSessionContext(options);
});
