import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

// GET /api/school/roles/permissions - Get available system permissions grouped by module
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    // Group permissions by module
    const grouped: Record<
      string,
      Array<{
        id: string;
        code: string;
        action: string;
        name: string;
        description: string | null;
      }>
    > = {};

    permissions.forEach((p) => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push({
        id: p.id,
        code: p.code,
        action: p.action,
        name: p.name,
        description: p.description,
      });
    });

    return NextResponse.json({
      success: true,
      permissions,
      grouped,
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
