import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { roleService } from '@/lib/roles/role-service';

// GET /api/school/roles - Fetch all built-in and custom roles, plus assignable roles
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'TEACHER', 'FEE_MANAGER', 'STAFF'],
    });
    if (!auth.authorized) return auth.response;

    const data = await roleService.listRoles(auth.schoolId, auth.role);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/school/roles - Create a new custom role
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'OWNER', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN'],
    });
    if (!auth.authorized) return auth.response;

    // Only Directors and Owners can manage security roles, or Admins if permitted
    const callerRole = (auth.role || '').toUpperCase();
    const canManageRoles = ['DIRECTOR', 'OWNER', 'PLATFORM_ADMIN'].includes(callerRole);
    if (!canManageRoles) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Creating custom roles requires School Director authority.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const role = await roleService.createCustomRole(
      auth.schoolId,
      {
        name: body.name,
        code: body.code,
        baseRole: body.baseRole,
        description: body.description,
        permissions: body.permissions,
      },
      auth.userId
    );

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom role:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create custom role' },
      { status: 400 }
    );
  }
}
