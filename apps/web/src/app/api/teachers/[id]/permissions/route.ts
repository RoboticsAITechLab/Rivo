import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/session';
import { SYSTEM_PERMISSIONS } from '@/lib/auth/permissions-catalog';

// GET /api/teachers/[id]/permissions - Get teacher details and all effective permissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    if (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: teacherId } = await params;

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId: session.schoolId },
      include: {
        user: true,
        campus: true,
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Get all overrides for this teacher's user
    const overrides = await prisma.userPermissionOverride.findMany({
      where: {
        userId: teacher.userId,
        schoolId: session.schoolId,
      },
      include: { permission: true },
    });

    const overridesMap = new Map(overrides.map((o) => [o.permission.code, o]));

    // Resolve matrix against standard SYSTEM_PERMISSIONS catalog
    const permissionsMatrix = SYSTEM_PERMISSIONS.map((p) => {
      const override = overridesMap.get(p.code);
      let granted = false;
      let scope = 'ASSIGNED';

      if (override) {
        granted = override.isGranted;
        scope = override.scope;
      } else {
        // Base teacher role defaults
        if (
          p.code === 'attendance.view' ||
          p.code === 'attendance.take' ||
          p.code === 'students.view' ||
          p.code === 'results.view' ||
          p.code === 'results.enter_marks' ||
          p.code === 'school_timetable.view'
        ) {
          granted = true;
          scope = 'ASSIGNED';
        }
      }

      return {
        code: p.code,
        module: p.module,
        action: p.action,
        name: p.name,
        description: p.description,
        granted,
        scope,
        isCustomized: !!override,
      };
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        employeeId: teacher.employeeId || 'TCH-000',
        department: teacher.department || 'General',
        designation: teacher.designation || 'Faculty Member',
        campusName: teacher.campus?.name || 'Main Campus',
        assignedClasses: teacher.assignments.map(
          (a) => `${a.class.name}-${a.section.name} (${a.subject?.name || 'Class Teacher'})`
        ),
      },
      permissions: permissionsMatrix,
    });
  } catch (error) {
    console.error('Error fetching teacher permissions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers/[id]/permissions - Save teacher permissions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    if (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: teacherId } = await params;
    const body = await req.json();
    const { permissions } = body; // Array of { code: string, granted: boolean, scope: 'SCHOOL' | 'CAMPUS' | 'ASSIGNED' | 'OWN' }

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ message: 'Permissions array required' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId: session.schoolId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Save individual permission overrides
    for (const item of permissions) {
      const perm = await prisma.permission.findUnique({
        where: { code: item.code },
      });

      if (!perm) continue;

      await prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: {
            userId: teacher.userId,
            permissionId: perm.id,
          },
        },
        update: {
          isGranted: !!item.granted,
          scope: item.scope || 'ASSIGNED',
        },
        create: {
          schoolId: session.schoolId,
          userId: teacher.userId,
          permissionId: perm.id,
          isGranted: !!item.granted,
          scope: item.scope || 'ASSIGNED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher permissions updated successfully.',
    });
  } catch (error) {
    console.error('Error updating teacher permissions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
