import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken, validatePasswordPolicy } from '@/lib/auth/crypto';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

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

    // Password policy check
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

    // Parse name
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Faculty';
    const lastName = parts.slice(1).join(' ') || 'Member';

    const hashedPassword = await hashPassword(password);

    // Atomic transaction for account activation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // 2. Create or update User
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

      // 3. Upsert SchoolMembership
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

      // 4. If TEACHER, upsert Teacher record
      let teacherProfile = null;
      if (invitation.role === 'TEACHER') {
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
            status: 'ACTIVE',
          },
          create: {
            schoolId: invitation.schoolId,
            userId: user.id,
            campusId: invitation.campusId,
            department: invitation.department,
            designation: invitation.designation,
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
      details: { role: invitation.role },
    });

    const authUser = {
      id: result.user.id,
      name: `${result.user.firstName} ${result.user.lastName}`.trim(),
      email: result.user.email,
      role: invitation.role === 'TEACHER' ? 'Teacher' : invitation.role,
      roleType: invitation.role,
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
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
