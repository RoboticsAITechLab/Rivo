import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { roleService } from '@/lib/roles/role-service';

// GET /api/school/roles/[id] - Get details of a single role
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const role = await roleService.getRoleById(auth.schoolId, id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/school/roles/[id] - Update custom role name, description, active status, or permissions
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const body = await req.json();

    const role = await roleService.updateCustomRole(
      auth.schoolId,
      id,
      {
        name: body.name,
        description: body.description,
        baseRole: body.baseRole,
        permissions: body.permissions,
        isActive: body.isActive,
      },
      auth.userId
    );

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update custom role' },
      { status: 400 }
    );
  }
}

// DELETE /api/school/roles/[id] - Delete a custom role
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    await roleService.deleteCustomRole(auth.schoolId, id, auth.userId);

    return NextResponse.json({ success: true, message: 'Custom role deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete custom role' },
      { status: 400 }
    );
  }
}
