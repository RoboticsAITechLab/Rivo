import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken, validatePasswordPolicy } from '@/lib/auth/crypto';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';
import { getSecuritySettings } from '@/lib/settings/settings-service';
import { isRoleActive } from '@/lib/roles/role-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, fullName, password } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    if (!token || !fullName?.trim() || !password) {
      return NextResponse.json(
        { message: 'Token, full name, and password are required.' },
        { status: 400 }
      );
    }

    // Default password policy check
    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          message: passwordValidation.errors[0] || 'Password does not meet complexity requirements.',
          errors: passwordValidation.errors,
        },
        { status: 422 }
      );
    }

    const tokenHash = hashToken(token);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
      include: {
        school: true,
        customRole: true,
      },
    });

    if (
      !invitation ||
      invitation.revokedAt !== null ||
      invitation.acceptedAt !== null ||
      invitation.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { message: 'This invitation link is invalid, expired, or has already been accepted.' },
        { status: 400 }
      );
    }

    // Revalidate custom role status if one was assigned
    if (invitation.customRoleId) {
      if (!invitation.customRole) {
        return NextResponse.json(
          {
            message:
              'The custom role assigned to this invitation has been deleted. Please request a new invitation from your administrator.',
          },
          { status: 400 }
        );
      }

      if (!isRoleActive(invitation.customRole)) {
        return NextResponse.json(
          {
            message:
              'The custom role assigned to this invitation has been deactivated. Please contact your school administrator.',
          },
          { status: 400 }
        );
      }
    }

    // Enforce Institutional Password Policy if configured
    const securitySettings = await getSecuritySettings(invitation.schoolId);
    if (securitySettings?.passwordPolicy) {
      const institutionalValidation = validatePasswordPolicy(password, securitySettings.passwordPolicy);
      if (!institutionalValidation.isValid) {
        return NextResponse.json(
          {
            message: institutionalValidation.errors[0] || 'Password does not meet institutional security requirements.',
            errors: institutionalValidation.errors,
          },
          { status: 422 }
        );
      }
    }

    // Parse full name
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Staff';
    const lastName = parts.slice(1).join(' ') || 'Member';

    const hashedPassword = await hashPassword(password);

    // Atomic transaction for account activation and membership creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // 2. Create or update User account
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (user) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            passwordHash: hashedPassword,
            status: 'ACTIVE',
            isActive: true,
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            firstName,
            lastName,
            passwordHash: hashedPassword,
            status: 'ACTIVE',
            isActive: true,
            emailVerifiedAt: new Date(),
          },
        });
      }

      // 3. Upsert SchoolMembership with validated role and customRoleId
      const membership = await tx.schoolMembership.upsert({
        where: {
          userId_schoolId: {
            userId: user.id,
            schoolId: invitation.schoolId,
          },
        },
        update: {
          role: invitation.role,
          customRoleId: invitation.customRoleId,
          status: 'ACTIVE',
        },
        create: {
          userId: user.id,
          schoolId: invitation.schoolId,
          role: invitation.role,
          customRoleId: invitation.customRoleId,
          status: 'ACTIVE',
        },
      });

      // 4. If base role is TEACHER, upsert teacher profile
      let teacherProfile = null;
      if (invitation.role === 'TEACHER') {
        const existingTeacher = await tx.teacher.findFirst({
          where: {
            schoolId: invitation.schoolId,
            userId: user.id,
          },
          select: { employeeId: true },
        });

        let assignedEmployeeId = existingTeacher?.employeeId;
        if (!assignedEmployeeId) {
          const { generateNextTeacherId } = await import('@/lib/id-generator');
          assignedEmployeeId = await generateNextTeacherId(invitation.schoolId, tx);
        }

        teacherProfile = await tx.teacher.upsert({
          where: {
            schoolId_userId: {
              schoolId: invitation.schoolId,
              userId: user.id,
            },
          },
          update: {
            campusId: invitation.campusId,
            department: invitation.department,
            designation: invitation.designation,
            employeeId: assignedEmployeeId,
            status: 'ACTIVE',
          },
          create: {
            schoolId: invitation.schoolId,
            userId: user.id,
            campusId: invitation.campusId,
            department: invitation.department,
            designation: invitation.designation,
            employeeId: assignedEmployeeId,
            status: 'ACTIVE',
          },
        });
      }

      return { user, membership, teacherProfile };
    });

    // Create session in database
    const { rawToken } = await createSession({
      userId: result.user.id,
      schoolId: invitation.schoolId,
      rememberMe: true,
      ipAddress: ip,
      userAgent,
    });

    await logSecurityAudit({
      event: 'INVITATION_ACCEPTED',
      userId: result.user.id,
      schoolId: invitation.schoolId,
      ipAddress: ip,
      userAgent,
      details: {
        role: invitation.role,
        customRoleId: invitation.customRoleId,
        customRoleName: invitation.customRole?.name || null,
      },
    });

    const displayRole = invitation.customRole
      ? `${invitation.customRole.name} (${invitation.role})`
      : invitation.role === 'TEACHER' ? 'Teacher' : invitation.role;

    const authUser = {
      id: result.user.id,
      name: `${result.user.firstName} ${result.user.lastName}`.trim(),
      email: result.user.email,
      role: displayRole,
      roleType: invitation.role,
      customRoleId: invitation.customRoleId,
      initials: `${result.user.firstName?.[0] || ''}${result.user.lastName?.[0] || ''}`.toUpperCase() || 'FC',
      schoolId: invitation.school.id,
      schoolName: invitation.school.name,
      schoolSlug: invitation.school.slug,
      teacherId: result.teacherProfile?.id,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account activated successfully.',
      user: authUser,
    });

    setSessionCookie(response, rawToken, true);
    return response;
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
