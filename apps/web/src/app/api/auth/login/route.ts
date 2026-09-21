import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        memberships: {
          include: {
            school: true,
          },
        },
        teachers: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 2. Verify password with secure scrypt
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Resolve school membership & role
    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      return NextResponse.json(
        { message: 'No school membership found for this user.' },
        { status: 403 }
      );
    }

    const school = primaryMembership.school;
    const role = primaryMembership.role; // e.g. SCHOOL_ADMIN, TEACHER
    const teacherProfile = user.teachers[0];

    // If role is TEACHER, verify teacher profile is active
    if (role === 'TEACHER') {
      if (!teacherProfile || teacherProfile.status !== 'ACTIVE') {
        return NextResponse.json(
          { message: 'Your teacher account is currently inactive. Contact school admin.' },
          { status: 403 }
        );
      }
    }

    // 4. Create signed session token
    const token = signToken(
      {
        userId: user.id,
        email: user.email,
        role: role,
        schoolId: school.id,
        teacherId: teacherProfile?.id,
      },
      rememberMe ? 86400 * 30 : 86400 * 7
    );

    const authUser = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: role === 'SCHOOL_ADMIN' ? 'School Administrator' : role === 'TEACHER' ? 'Teacher' : role,
      roleType: role,
      initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'US',
      schoolId: school.id,
      schoolName: school.name,
      schoolSlug: school.slug,
      teacherId: teacherProfile?.id,
    };

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    // 5. Set HttpOnly Cookie for secure session handling
    response.cookies.set('rivo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 86400 * 30 : 86400 * 7,
    });

    return response;
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
