import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordPolicy } from '@/lib/auth/crypto';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { logSecurityAudit } from '@/lib/auth/audit';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'school'}-${Math.random().toString(36).substring(2, 7)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { administrator, school, agreedToTerms } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    if (!administrator || !school || !agreedToTerms) {
      return NextResponse.json(
        { message: 'Administrator details, school details, and terms agreement are required.' },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password } = administrator;
    const { name: schoolName } = school;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { message: 'First name, last name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (!schoolName?.trim()) {
      return NextResponse.json(
        { message: 'School name is required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const schoolSlug = generateSlug(schoolName);

    // Atomic transaction creating Tenant + Admin User + Membership + Initial Campus + Academic Session
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create School Tenant
      const newSchool = await tx.school.create({
        data: {
          name: schoolName.trim(),
          slug: schoolSlug,
          status: 'ACTIVE',
        },
      });

      // 2. Create User
      const newUser = await tx.user.create({
        data: {
          email: trimmedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          passwordHash: hashedPassword,
          status: 'ACTIVE',
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      // 3. Create SchoolMembership
      const membership = await tx.schoolMembership.create({
        data: {
          userId: newUser.id,
          schoolId: newSchool.id,
          role: 'SCHOOL_ADMIN',
          status: 'ACTIVE',
        },
      });

      // 4. Create Main Campus
      const campus = await tx.campus.create({
        data: {
          schoolId: newSchool.id,
          name: 'Main Campus',
          code: 'MAIN',
          isMain: true,
          city: school.city?.trim() || null,
          state: school.state?.trim() || null,
          phone: school.phone?.trim() || null,
          email: school.officialEmail?.trim() || null,
        },
      });

      // 5. Create default Academic Session
      const currentYear = new Date().getFullYear();
      await tx.academicSession.create({
        data: {
          schoolId: newSchool.id,
          name: `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
          startDate: new Date(`${currentYear}-04-01`),
          endDate: new Date(`${currentYear + 1}-03-31`),
          status: 'ACTIVE',
        },
      });

      return {
        user: newUser,
        school: newSchool,
        membership,
        campus,
      };
    });

    // Create session in database
    const { rawToken } = await createSession({
      userId: result.user.id,
      schoolId: result.school.id,
      rememberMe: true,
      ipAddress: ip,
      userAgent,
    });

    await logSecurityAudit({
      event: 'LOGIN_SUCCESS',
      userId: result.user.id,
      schoolId: result.school.id,
      ipAddress: ip,
      userAgent,
      details: { signup: true, role: 'SCHOOL_ADMIN' },
    });

    const authUser = {
      id: result.user.id,
      name: `${result.user.firstName} ${result.user.lastName}`.trim(),
      email: result.user.email,
      phone: result.user.phone || undefined,
      role: 'School Administrator',
      roleType: 'SCHOOL_ADMIN',
      initials: `${result.user.firstName?.[0] || ''}${result.user.lastName?.[0] || ''}`.toUpperCase() || 'SA',
      schoolId: result.school.id,
      schoolName: result.school.name,
      schoolSlug: result.school.slug,
      campusId: result.campus.id,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: authUser,
    });

    setSessionCookie(response, rawToken, true);
    return response;
  } catch (error) {
    console.error('Error in /api/auth/signup/admin:', error);
    return NextResponse.json(
      { message: 'Unable to create your account. Please try again.' },
      { status: 500 }
    );
  }
}
