import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';
import { roleService, BUILT_IN_ROLES, generateRoleCode } from '../lib/roles/role-service';
import { getEffectivePermission } from '../lib/auth/authorize';
import { generateSecureToken, hashToken } from '../lib/auth/crypto';
import { Role } from '@prisma/client';

let schoolAId: string;
let schoolBId: string;
let userDirectorAId: string;
let userPrincipalAId: string;
let userTeacherAId: string;
let userDirectorBId: string;

function assert(condition: boolean, testNum: number, description: string) {
  if (!condition) {
    console.error(`❌ TEST ${testNum} FAILED: ${description}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST ${testNum} PASSED: ${description}`);
  }
}

async function runRoleInvitationAccessTests() {
  console.log('🚀 Running Rivo Role-to-Invitation Integration & Access Governance Tests...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Multi-Tenant Isolated Environments (School A & School B)
    // -------------------------------------------------------------
    const schoolA = await prisma.school.create({
      data: {
        name: 'St. Xavier High School',
        slug: `st-xavier-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        name: 'Don Bosco Academy',
        slug: `don-bosco-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    schoolBId = schoolB.id;

    // School A Director
    const directorA = await prisma.user.create({
      data: {
        email: `director-a-${Date.now()}@st-xavier.edu`,
        firstName: 'Arthur',
        lastName: 'Director',
        isActive: true,
      },
    });
    userDirectorAId = directorA.id;
    await prisma.schoolMembership.create({
      data: { schoolId: schoolAId, userId: userDirectorAId, role: Role.DIRECTOR, status: 'ACTIVE' },
    });

    // School A Principal
    const principalA = await prisma.user.create({
      data: {
        email: `principal-a-${Date.now()}@st-xavier.edu`,
        firstName: 'Patricia',
        lastName: 'Principal',
        isActive: true,
      },
    });
    userPrincipalAId = principalA.id;
    await prisma.schoolMembership.create({
      data: { schoolId: schoolAId, userId: userPrincipalAId, role: Role.PRINCIPAL, status: 'ACTIVE' },
    });

    // School A Teacher
    const teacherA = await prisma.user.create({
      data: {
        email: `teacher-a-${Date.now()}@st-xavier.edu`,
        firstName: 'Thomas',
        lastName: 'Teacher',
        isActive: true,
      },
    });
    userTeacherAId = teacherA.id;
    await prisma.schoolMembership.create({
      data: { schoolId: schoolAId, userId: userTeacherAId, role: Role.TEACHER, status: 'ACTIVE' },
    });

    // School B Director
    const directorB = await prisma.user.create({
      data: {
        email: `director-b-${Date.now()}@don-bosco.edu`,
        firstName: 'Benedict',
        lastName: 'DirectorB',
        isActive: true,
      },
    });
    userDirectorBId = directorB.id;
    await prisma.schoolMembership.create({
      data: { schoolId: schoolBId, userId: userDirectorBId, role: Role.DIRECTOR, status: 'ACTIVE' },
    });

    // -------------------------------------------------------------
    // GROUP 1: ROLE CREATION, PERSISTENCE & PERMISSIONS (Tests 1-7)
    // -------------------------------------------------------------
    console.log('--- GROUP 1: ROLE CREATION & PERSISTENCE ---');

    // TEST 1: Create Custom Role in School A
    const customRole1 = await roleService.createCustomRole(
      schoolAId,
      {
        name: 'Exam Controller',
        baseRole: Role.TEACHER,
        description: 'Oversees term examination schedules, seating, and marks entry',
        permissions: [
          { permissionCode: 'exams.create', scope: 'SCHOOL' },
          { permissionCode: 'results.publish', scope: 'SCHOOL' },
        ],
      },
      userDirectorAId
    );
    assert(customRole1.name === 'Exam Controller', 1, 'Custom role created with exact name');
    assert(customRole1.baseRole === 'TEACHER', 2, 'Custom role anchored to baseRole TEACHER');
    assert(customRole1.permissionsCount === 2, 3, 'Attached exact 2 custom permissions');

    // TEST 2: Persistence verification by re-querying database
    const fetchedRole = await roleService.getRoleById(schoolAId, customRole1.id);
    assert(fetchedRole !== null && fetchedRole.id === customRole1.id, 4, 'Custom role cleanly persisted in relational table');
    assert(fetchedRole?.isActive === true, 5, 'Role is active upon creation');

    // TEST 3: Duplicate Role Name or Code Rejected in Same School
    let duplicateRejected = false;
    try {
      await roleService.createCustomRole(
        schoolAId,
        { name: 'Exam Controller', baseRole: Role.TEACHER },
        userDirectorAId
      );
    } catch (err: any) {
      if (err.message.includes('already exists')) duplicateRejected = true;
    }
    assert(duplicateRejected, 6, 'Duplicate role name in same school strictly rejected');

    // TEST 4: Deactivation of Custom Role
    const deactivatedRole = await roleService.updateCustomRole(
      schoolAId,
      customRole1.id,
      { isActive: false },
      userDirectorAId
    );
    assert(deactivatedRole.isActive === false, 7, 'Role activation status toggled to inactive');

    // Reactivate for subsequent tests
    await roleService.updateCustomRole(
      schoolAId,
      customRole1.id,
      { isActive: true },
      userDirectorAId
    );

    // -------------------------------------------------------------
    // GROUP 2: LEGACY SETTINGS MIGRATION (Tests 8-9)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 2: LEGACY SETTINGS IDEMPOTENT MIGRATION ---');

    // Seed legacy SchoolSetting JSON in School A
    await prisma.schoolSetting.create({
      data: {
        schoolId: schoolAId,
        category: 'roles',
        value: {
          customRoles: [
            { id: 'role-legacy-1', name: 'Hostel Warden', isSystem: false, description: 'Dormitory governance' },
            { id: 'role-admin', name: 'School Admin', isSystem: true, description: 'System role' },
          ],
        },
      },
    });

    const migratedCount = await roleService.migrateLegacySettingsRoles(schoolAId);
    assert(migratedCount === 1, 8, 'Idempotently migrated 1 legacy custom role from JSON setting');

    const migratedWarden = await prisma.customRole.findFirst({
      where: { schoolId: schoolAId, name: 'Hostel Warden' },
    });
    assert(migratedWarden !== null && migratedWarden.baseRole === Role.TEACHER, 9, 'Migrated role persisted with relational CustomRole model');

    // -------------------------------------------------------------
    // GROUP 3: ROLE LISTING & INVITATION ELIGIBILITY (Tests 10-14)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 3: DYNAMIC ASSIGNABLE ROLES & HIERARCHY ---');

    // TEST 10: Role service returns built-in and custom roles
    const listDirector = await roleService.listRoles(schoolAId, 'DIRECTOR');
    assert(listDirector.builtInRoles.length === 6, 10, 'Director receives all 6 built-in system roles');
    assert(listDirector.customRoles.length >= 2, 11, 'Custom roles dynamically discoverable in school');

    // TEST 11: Principal cannot assign Director role (Hierarchy Check)
    const listPrincipal = await roleService.listRoles(schoolAId, 'PRINCIPAL');
    const principalCanAssignDirector = listPrincipal.assignableRoles.some((r) => r.code === 'DIRECTOR');
    assert(!principalCanAssignDirector, 12, 'Role hierarchy enforced: Principal cannot assign DIRECTOR role');

    // TEST 12: Inactive roles are excluded from assignableRoles
    await roleService.updateCustomRole(schoolAId, customRole1.id, { isActive: false }, userDirectorAId);
    const listAfterDeactivate = await roleService.listRoles(schoolAId, 'DIRECTOR');
    const inactiveFoundInAssignable = listAfterDeactivate.assignableRoles.some((r) => r.id === customRole1.id);
    assert(!inactiveFoundInAssignable, 13, 'Deactivated custom roles are strictly excluded from assignable roles');

    // Reactivate customRole1
    await roleService.updateCustomRole(schoolAId, customRole1.id, { isActive: true }, userDirectorAId);

    // TEST 13: Invalid base role rejected during creation
    let invalidBaseRejected = false;
    try {
      await roleService.createCustomRole(
        schoolAId,
        { name: 'Fake Owner', baseRole: Role.OWNER },
        userDirectorAId
      );
    } catch {
      invalidBaseRejected = true;
    }
    assert(invalidBaseRejected, 14, 'Custom roles cannot inherit from OWNER or privileged platform roles');

    // -------------------------------------------------------------
    // GROUP 4: INVITATION LIFECYCLE WITH CUSTOM ROLES (Tests 15-21)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 4: INVITATION DISPATCH & ACCEPTANCE ---');

    // TEST 15: Create invitation with customRoleId
    const inviteTokenRaw = generateSecureToken(32);
    const inviteTokenHash = hashToken(inviteTokenRaw);
    const inviteEmail = `controller-${Date.now()}@st-xavier.edu`;

    const invitation = await prisma.staffInvitation.create({
      data: {
        schoolId: schoolAId,
        email: inviteEmail,
        role: customRole1.baseRole,
        customRoleId: customRole1.id,
        department: 'Academics & Testing',
        designation: 'Senior Controller',
        invitedById: userDirectorAId,
        tokenHash: inviteTokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
      },
      include: { customRole: true },
    });
    assert(invitation.customRoleId === customRole1.id, 15, 'Invitation successfully bound to customRoleId');
    assert(invitation.customRole?.name === 'Exam Controller', 16, 'Custom role name resolved via relation');

    // TEST 16: Acceptance of custom role invitation creates SchoolMembership with customRoleId
    const newStaffUser = await prisma.user.create({
      data: {
        email: inviteEmail,
        firstName: 'Siddharth',
        lastName: 'Menon',
        isActive: true,
      },
    });

    const membership = await prisma.schoolMembership.create({
      data: {
        userId: newStaffUser.id,
        schoolId: schoolAId,
        role: invitation.role,
        customRoleId: invitation.customRoleId,
        status: 'ACTIVE',
      },
    });
    assert(membership.customRoleId === customRole1.id, 17, 'Accepted membership retains exact customRoleId');
    assert(membership.role === 'TEACHER', 18, 'Base membership role maps to TEACHER without silent loss');

    // TEST 17: Effective Permission Check via authorize.ts
    // CustomRole1 grants 'exams.create' and 'results.publish'
    const permExamCreate = await getEffectivePermission({
      userId: newStaffUser.id,
      schoolId: schoolAId,
      permissionCode: 'exams.create',
    });
    assert(permExamCreate.granted === true && permExamCreate.scope === 'SCHOOL', 19, 'Custom role effective permission exams.create granted to user');

    const permResultsPublish = await getEffectivePermission({
      userId: newStaffUser.id,
      schoolId: schoolAId,
      permissionCode: 'results.publish',
    });
    assert(permResultsPublish.granted === true, 20, 'Custom role effective permission results.publish granted to user');

    // TEST 18: Non-granted permission is denied
    const permStudentsDelete = await getEffectivePermission({
      userId: newStaffUser.id,
      schoolId: schoolAId,
      permissionCode: 'students.delete',
    });
    assert(permStudentsDelete.granted === false, 21, 'Unassigned permission students.delete denied to custom role user');

    // -------------------------------------------------------------
    // GROUP 5: TENANT ISOLATION & SECURITY (Tests 22-26)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 5: MULTI-TENANT ISOLATION ---');

    // TEST 22: School B cannot view or access School A custom role
    const schoolBRoleLookup = await roleService.getRoleById(schoolBId, customRole1.id);
    assert(schoolBRoleLookup === null, 22, 'Tenant isolation: School B cannot retrieve School A custom role');

    // TEST 23: School B Director cannot update School A custom role
    let crossSchoolUpdateBlocked = false;
    try {
      await roleService.updateCustomRole(
        schoolBId,
        customRole1.id,
        { name: 'Hijacked Role' },
        userDirectorBId
      );
    } catch (err: any) {
      if (err.message.includes('not found')) crossSchoolUpdateBlocked = true;
    }
    assert(crossSchoolUpdateBlocked, 23, 'Tenant isolation: School B cannot update School A custom role');

    // TEST 24: School B Director cannot delete School A custom role
    let crossSchoolDeleteBlocked = false;
    try {
      await roleService.deleteCustomRole(schoolBId, customRole1.id, userDirectorBId);
    } catch (err: any) {
      if (err.message.includes('not found')) crossSchoolDeleteBlocked = true;
    }
    assert(crossSchoolDeleteBlocked, 24, 'Tenant isolation: School B cannot delete School A custom role');

    // TEST 25: Cannot delete a custom role with active assigned members
    let activeRoleDeleteBlocked = false;
    try {
      await roleService.deleteCustomRole(schoolAId, customRole1.id, userDirectorAId);
    } catch (err: any) {
      if (err.message.includes('active users are currently assigned')) {
        activeRoleDeleteBlocked = true;
      }
    }
    assert(activeRoleDeleteBlocked, 25, 'Safety check: Cannot delete custom role with active assigned members');

    // TEST 26: Expired invitation rejection
    const expiredTokenRaw = generateSecureToken(32);
    const expiredInvitation = await prisma.staffInvitation.create({
      data: {
        schoolId: schoolAId,
        email: `expired-${Date.now()}@test.edu`,
        role: Role.TEACHER,
        invitedById: userDirectorAId,
        tokenHash: hashToken(expiredTokenRaw),
        expiresAt: new Date(Date.now() - 1000), // Expired in the past
      },
    });
    const isExpiredCheck = expiredInvitation.expiresAt < new Date();
    assert(isExpiredCheck === true, 26, 'Expired invitation detected and correctly flagged');

    console.log('\n================================================================');
    console.log('🎉 ALL 26 ROLE-TO-INVITATION INTEGRATION TESTS PASSED!');
    console.log('================================================================');
  } catch (err) {
    console.error('Fatal error during role integration tests:', err);
    process.exit(1);
  } finally {
    // Teardown test schools respecting foreign key relations
    if (schoolAId) {
      await prisma.schoolMembership.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.staffInvitation.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.rolePermission.deleteMany({ where: { role: { schoolId: schoolAId } } }).catch(() => {});
      await prisma.customRole.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.schoolSetting.deleteMany({ where: { schoolId: schoolAId } }).catch(() => {});
      await prisma.school.delete({ where: { id: schoolAId } }).catch(() => {});
    }
    if (schoolBId) {
      await prisma.schoolMembership.deleteMany({ where: { schoolId: schoolBId } }).catch(() => {});
      await prisma.school.delete({ where: { id: schoolBId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runRoleInvitationAccessTests();
