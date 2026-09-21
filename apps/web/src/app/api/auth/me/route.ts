import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/crypto';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('rivo_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = verifyToken(sessionCookie);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          where: { schoolId: payload.schoolId },
          include: { school: true },
        },
        teachers: {
          where: { schoolId: payload.schoolId },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const school = membership.school;
    const role = membership.role;
    const teacherProfile = user.teachers[0];

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

    return NextResponse.json({ user: authUser });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
