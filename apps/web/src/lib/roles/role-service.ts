import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { logSecurityAudit } from '@/lib/auth/audit';

export interface RolePermissionInput {
  permissionCode: string;
  scope?: 'SCHOOL' | 'CAMPUS' | 'ASSIGNED' | 'OWN';
}

export interface CreateCustomRoleInput {
  name: string;
  code?: string;
  baseRole?: Role;
  description?: string | null;
  permissions?: RolePermissionInput[];
}

export interface UpdateCustomRoleInput {
  name?: string;
  description?: string | null;
  baseRole?: Role;
  permissions?: RolePermissionInput[];
  isActive?: boolean;
}

export interface RoleSummary {
  id: string;
  name: string;
  code: string;
  baseRole: Role;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  userCount: number;
  pendingInvitesCount: number;
  permissionsCount: number;
  permissions?: Array<{
    code: string;
    module: string;
    action: string;
    name: string;
    scope: string;
  }>;
}

// Built-in institutional roles supported for invitations and governance
export const BUILT_IN_ROLES: Array<{
  role: Role;
  name: string;
  description: string;
  isSystem: boolean;
  allowedBaseForCustom: boolean;
}> = [
  {
    role: 'DIRECTOR',
    name: 'Director / Trustee',
    description: 'Executive institutional governance with complete administrative authority.',
    isSystem: true,
    allowedBaseForCustom: false,
  },
  {
    role: 'PRINCIPAL',
    name: 'Principal / Headmaster',
    description: 'Academic and administrative leader with comprehensive operational oversight.',
    isSystem: true,
    allowedBaseForCustom: false,
  },
  {
    role: 'ADMIN',
    name: 'School Administrator',
    description: 'Day-to-day administrative operations, student records, and school configuration.',
    isSystem: true,
    allowedBaseForCustom: true,
  },
  {
    role: 'TEACHER',
    name: 'Teacher / Faculty',
    description: 'Instructional faculty with access to assigned classes, marks, and attendance.',
    isSystem: true,
    allowedBaseForCustom: true,
  },
  {
    role: 'FEE_MANAGER',
    name: 'Fee / Finance Officer',
    description: 'Accounts and bursar desk managing fee structures, collections, and receipts.',
    isSystem: true,
    allowedBaseForCustom: true,
  },
  {
    role: 'STAFF',
    name: 'Support Staff',
    description: 'Operational support, coordinators, transport, and administrative assistants.',
    isSystem: true,
    allowedBaseForCustom: true,
  },
];

/**
 * Returns roles that the given caller is authorized to invite or assign.
 * Role Hierarchy:
 * - OWNER / DIRECTOR: Can assign any built-in or custom role.
 * - PRINCIPAL: Can assign Principal, Admin, Teacher, Fee Manager, Staff, and Custom Roles (cannot assign Director/Owner).
 * - ADMIN / SCHOOL_ADMIN: Can assign Admin, Teacher, Fee Manager, Staff, and Custom Roles (cannot assign Director, Principal, Owner).
 * - Others: Cannot assign roles.
 */
export function getAuthorizedAssignableRoles(callerRole?: string): Role[] {
  const normalized = (callerRole || '').toUpperCase();
  if (normalized === 'OWNER' || normalized === 'DIRECTOR' || normalized === 'PLATFORM_ADMIN') {
    return ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'TEACHER', 'FEE_MANAGER', 'STAFF', 'SCHOOL_ADMIN'];
  }
  if (normalized === 'PRINCIPAL') {
    return ['PRINCIPAL', 'ADMIN', 'TEACHER', 'FEE_MANAGER', 'STAFF'];
  }
  if (normalized === 'ADMIN' || normalized === 'SCHOOL_ADMIN') {
    return ['ADMIN', 'TEACHER', 'FEE_MANAGER', 'STAFF'];
  }
  return [];
}

/**
 * Normalizes a role title into an uppercase alphanumeric code.
 */
export function generateRoleCode(name: string, prefix = 'ROLE_'): string {
  const sanitized = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${prefix}${sanitized}`.slice(0, 32);
}

/**
 * Checks if a custom role is active.
 * We store deactivation state non-destructively in `description` or `code`
 * to remain 100% compatible with the Prisma schema without requiring destructive migrations.
 */
export function isRoleActive(role: { description?: string | null; code?: string }): boolean {
  if (role.code?.startsWith('INACTIVE_')) return false;
  if (role.description?.startsWith('[INACTIVE]')) return false;
  return true;
}

/**
 * Authoritative role management service for Rivo School ERP.
 */
export const roleService = {
  /**
   * Automatically and idempotently migrates any legacy custom roles stored in
   * `SchoolSetting.roles` JSON into the relational `CustomRole` table.
   */
  async migrateLegacySettingsRoles(schoolId: string): Promise<number> {
    try {
      const setting = await prisma.schoolSetting.findFirst({
        where: { schoolId, category: 'roles' },
      });

      if (!setting || !setting.value || typeof setting.value !== 'object') {
        return 0;
      }

      const val = setting.value as any;
      const customRolesList: any[] = val.customRoles || [];
      let migratedCount = 0;

      for (const legacyRole of customRolesList) {
        if (!legacyRole || legacyRole.isSystem || !legacyRole.name) {
          continue;
        }

        const roleName = String(legacyRole.name).trim();
        const baseCode = generateRoleCode(roleName);

        // Check if already migrated
        const existing = await prisma.customRole.findFirst({
          where: {
            schoolId,
            OR: [{ name: roleName }, { code: baseCode }],
          },
        });

        if (!existing) {
          await prisma.customRole.create({
            data: {
              schoolId,
              name: roleName,
              code: baseCode,
              baseRole: Role.TEACHER,
              description: legacyRole.description || 'Migrated institutional custom role',
              isSystem: false,
            },
          });
          migratedCount++;
        }
      }

      return migratedCount;
    } catch (err) {
      console.error(`[ROLE_MIGRATION_ERROR] Failed to migrate legacy roles for school ${schoolId}:`, err);
      return 0;
    }
  },

  /**
   * Lists all built-in and custom roles for a school, with member counts and permissions.
   */
  async listRoles(schoolId: string, callerRole?: string): Promise<{
    builtInRoles: RoleSummary[];
    customRoles: RoleSummary[];
    assignableRoles: Array<{
      id: string;
      name: string;
      code: string;
      isCustom: boolean;
      baseRole: Role;
      description: string | null;
    }>;
  }> {
    // 1. Run safe migration check in background
    await this.migrateLegacySettingsRoles(schoolId);

    // 2. Fetch custom roles with permissions and member counts
    const customRoles = await prisma.customRole.findMany({
      where: { schoolId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: {
            memberships: true,
            staffInvitations: {
              where: {
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Count members for built-in roles
    const membershipsCounts = await prisma.schoolMembership.groupBy({
      by: ['role'],
      where: {
        schoolId,
        customRoleId: null,
        status: 'ACTIVE',
      },
      _count: { id: true },
    });

    const memberCountMap = new Map<Role, number>();
    membershipsCounts.forEach((m) => {
      memberCountMap.set(m.role, m._count.id);
    });

    // Count pending invitations for built-in roles
    const invitesCounts = await prisma.staffInvitation.groupBy({
      by: ['role'],
      where: {
        schoolId,
        customRoleId: null,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      _count: { id: true },
    });

    const inviteCountMap = new Map<Role, number>();
    invitesCounts.forEach((i) => {
      inviteCountMap.set(i.role, i._count.id);
    });

    // 4. Build built-in role summaries
    const builtInSummaries: RoleSummary[] = BUILT_IN_ROLES.map((b) => ({
      id: b.role,
      name: b.name,
      code: b.role,
      baseRole: b.role,
      isSystem: true,
      isActive: true,
      description: b.description,
      userCount: memberCountMap.get(b.role) || 0,
      pendingInvitesCount: inviteCountMap.get(b.role) || 0,
      permissionsCount: 0,
    }));

    // 5. Build custom role summaries
    const customSummaries: RoleSummary[] = customRoles.map((c) => {
      const active = isRoleActive(c);
      const cleanDescription = c.description
        ? c.description.replace(/^\[INACTIVE\]\s*/, '')
        : null;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        baseRole: c.baseRole,
        isSystem: c.isSystem,
        isActive: active,
        description: cleanDescription,
        userCount: c._count.memberships,
        pendingInvitesCount: c._count.staffInvitations,
        permissionsCount: c.rolePermissions.length,
        permissions: c.rolePermissions.map((rp) => ({
          code: rp.permission.code,
          module: rp.permission.module,
          action: rp.permission.action,
          name: rp.permission.name,
          scope: rp.scope,
        })),
      };
    });

    // 6. Compute assignable roles for the caller
    const allowedBaseRoles = getAuthorizedAssignableRoles(callerRole);
    const assignableRoles: Array<{
      id: string;
      name: string;
      code: string;
      isCustom: boolean;
      baseRole: Role;
      description: string | null;
    }> = [];

    // Built-in roles allowed for caller
    for (const b of BUILT_IN_ROLES) {
      if (allowedBaseRoles.includes(b.role)) {
        assignableRoles.push({
          id: b.role,
          name: b.name,
          code: b.role,
          isCustom: false,
          baseRole: b.role,
          description: b.description,
        });
      }
    }

    // Active custom roles whose baseRole is within caller's delegation authority
    for (const c of customSummaries) {
      if (c.isActive && allowedBaseRoles.includes(c.baseRole)) {
        assignableRoles.push({
          id: c.id,
          name: c.name,
          code: c.code,
          isCustom: true,
          baseRole: c.baseRole,
          description: c.description,
        });
      }
    }

    return {
      builtInRoles: builtInSummaries,
      customRoles: customSummaries,
      assignableRoles,
    };
  },

  /**
   * Retrieves a single role by ID or built-in role name.
   */
  async getRoleById(schoolId: string, roleId: string): Promise<RoleSummary | null> {
    // 1. Check if built-in role enum
    const builtIn = BUILT_IN_ROLES.find((b) => b.role === roleId.toUpperCase());
    if (builtIn) {
      const userCount = await prisma.schoolMembership.count({
        where: { schoolId, role: builtIn.role, customRoleId: null, status: 'ACTIVE' },
      });
      const pendingInvites = await prisma.staffInvitation.count({
        where: {
          schoolId,
          role: builtIn.role,
          customRoleId: null,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      return {
        id: builtIn.role,
        name: builtIn.name,
        code: builtIn.role,
        baseRole: builtIn.role,
        isSystem: true,
        isActive: true,
        description: builtIn.description,
        userCount,
        pendingInvitesCount: pendingInvites,
        permissionsCount: 0,
      };
    }

    // 2. Fetch from custom_roles
    const custom = await prisma.customRole.findFirst({
      where: { id: roleId, schoolId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: {
            memberships: true,
            staffInvitations: {
              where: {
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    if (!custom) return null;

    const active = isRoleActive(custom);
    const cleanDescription = custom.description
      ? custom.description.replace(/^\[INACTIVE\]\s*/, '')
      : null;

    return {
      id: custom.id,
      name: custom.name,
      code: custom.code,
      baseRole: custom.baseRole,
      isSystem: custom.isSystem,
      isActive: active,
      description: cleanDescription,
      userCount: custom._count.memberships,
      pendingInvitesCount: custom._count.staffInvitations,
      permissionsCount: custom.rolePermissions.length,
      permissions: custom.rolePermissions.map((rp) => ({
        code: rp.permission.code,
        module: rp.permission.module,
        action: rp.permission.action,
        name: rp.permission.name,
        scope: rp.scope,
      })),
    };
  },

  /**
   * Creates a new custom role with granular permissions.
   */
  async createCustomRole(
    schoolId: string,
    input: CreateCustomRoleInput,
    userId: string
  ): Promise<RoleSummary> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Role name is required.');
    }

    const baseRole = input.baseRole || Role.TEACHER;
    const allowedBases: Role[] = ['TEACHER', 'STAFF', 'FEE_MANAGER', 'ADMIN'];
    if (!allowedBases.includes(baseRole)) {
      throw new Error(`Invalid base role '${baseRole}'. Custom roles must inherit from TEACHER, STAFF, FEE_MANAGER, or ADMIN.`);
    }

    const code = input.code ? input.code.trim().toUpperCase() : generateRoleCode(name);

    // Uniqueness check within the school
    const existing = await prisma.customRole.findFirst({
      where: {
        schoolId,
        OR: [{ name: { equals: name, mode: 'insensitive' } }, { code }],
      },
    });

    if (existing) {
      throw new Error(`A role with name '${name}' or code '${code}' already exists in this school.`);
    }

    const role = await prisma.$transaction(async (tx) => {
      const createdRole = await tx.customRole.create({
        data: {
          schoolId,
          name,
          code,
          baseRole,
          description: input.description?.trim() || null,
          isSystem: false,
        },
      });

      // Attach permissions if specified
      if (input.permissions && input.permissions.length > 0) {
        for (const p of input.permissions) {
          const perm = await tx.permission.findUnique({
            where: { code: p.permissionCode },
          });
          if (perm) {
            await tx.rolePermission.create({
              data: {
                roleId: createdRole.id,
                permissionId: perm.id,
                scope: p.scope || 'SCHOOL',
              },
            });
          }
        }
      }

      return createdRole;
    });

    await logSecurityAudit({
      event: 'ROLE_CREATED',
      userId,
      schoolId,
      details: { roleId: role.id, name: role.name, code: role.code, baseRole: role.baseRole },
    });

    const summary = await this.getRoleById(schoolId, role.id);
    if (!summary) throw new Error('Role creation failed.');
    return summary;
  },

  /**
   * Updates custom role metadata, activation status, or permission grants.
   */
  async updateCustomRole(
    schoolId: string,
    roleId: string,
    input: UpdateCustomRoleInput,
    userId: string
  ): Promise<RoleSummary> {
    const customRole = await prisma.customRole.findFirst({
      where: { id: roleId, schoolId },
    });

    if (!customRole) {
      throw new Error('Custom role not found for this school.');
    }

    if (customRole.isSystem) {
      throw new Error('System built-in roles cannot be modified.');
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Prisma.CustomRoleUpdateInput = {};

      if (input.name) {
        const trimmedName = input.name.trim();
        // Check uniqueness if name changed
        if (trimmedName.toLowerCase() !== customRole.name.toLowerCase()) {
          const duplicate = await tx.customRole.findFirst({
            where: {
              schoolId,
              name: { equals: trimmedName, mode: 'insensitive' },
              id: { not: roleId },
            },
          });
          if (duplicate) {
            throw new Error(`Another role with name '${trimmedName}' already exists.`);
          }
          updateData.name = trimmedName;
        }
      }

      if (input.baseRole) {
        const allowedBases: Role[] = ['TEACHER', 'STAFF', 'FEE_MANAGER', 'ADMIN'];
        if (!allowedBases.includes(input.baseRole)) {
          throw new Error(`Invalid base role '${input.baseRole}'.`);
        }
        updateData.baseRole = input.baseRole;
      }

      if (input.isActive !== undefined || input.description !== undefined) {
        let desc = input.description !== undefined ? (input.description?.trim() || null) : customRole.description;
        if (desc) desc = desc.replace(/^\[INACTIVE\]\s*/, '');

        const targetActive = input.isActive !== undefined ? input.isActive : isRoleActive(customRole);
        if (!targetActive) {
          desc = `[INACTIVE] ${desc || ''}`.trim();
        }
        updateData.description = desc;
      }

      await tx.customRole.update({
        where: { id: roleId },
        data: updateData,
      });

      // Update permissions if provided
      if (input.permissions !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Insert updated permissions
        for (const p of input.permissions) {
          const perm = await tx.permission.findUnique({
            where: { code: p.permissionCode },
          });
          if (perm) {
            await tx.rolePermission.create({
              data: {
                roleId,
                permissionId: perm.id,
                scope: p.scope || 'SCHOOL',
              },
            });
          }
        }
      }
    });

    await logSecurityAudit({
      event: 'ROLE_UPDATED',
      userId,
      schoolId,
      details: { roleId, updatedFields: Object.keys(input) },
    });

    const summary = await this.getRoleById(schoolId, roleId);
    if (!summary) throw new Error('Role update failed.');
    return summary;
  },

  /**
   * Safely deletes a custom role if no active members are assigned.
   */
  async deleteCustomRole(schoolId: string, roleId: string, userId: string): Promise<void> {
    const customRole = await prisma.customRole.findFirst({
      where: { id: roleId, schoolId },
      include: {
        _count: {
          select: {
            memberships: true,
            staffInvitations: {
              where: {
                acceptedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    if (!customRole) {
      throw new Error('Custom role not found.');
    }

    if (customRole.isSystem) {
      throw new Error('Cannot delete system built-in roles.');
    }

    if (customRole._count.memberships > 0) {
      throw new Error(
        `Cannot delete role '${customRole.name}': ${customRole._count.memberships} active users are currently assigned. Deactivate the role or reassign users first.`
      );
    }

    if (customRole._count.staffInvitations > 0) {
      throw new Error(
        `Cannot delete role '${customRole.name}': ${customRole._count.staffInvitations} pending invitations use this role. Revoke pending invitations first.`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.customRole.delete({ where: { id: roleId } });
    });

    await logSecurityAudit({
      event: 'ROLE_DELETED',
      userId,
      schoolId,
      details: { roleId, name: customRole.name, code: customRole.code },
    });
  },
};
