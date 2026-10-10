import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { logSecurityAudit } from '@/lib/auth/audit';

// GET /api/users - List institutional users with membership roles and statuses
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'PLATFORM_ADMIN'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional context required' }, { status: 400 });
    }

    const memberships = await prisma.schoolMembership.findMany({
      where: {
        schoolId: auth.schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = memberships.map((m) => ({
      id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email || '',
      phone: m.user.phone || '',
      role: m.role,
      status: m.status, // ACTIVE or SUSPENDED
      lastLogin: m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, users: formatted });
  } catch (error: any) {
    console.error('[USERS_GET_ERROR] Failed to fetch users:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users - Update user account membership status (ACTIVE / SUSPENDED)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional context required' }, { status: 400 });
    }

    const body = await req.json();
    const { userId, status, role, name, phone } = body;

    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    const membershipUpdate: any = {};

    if (status) {
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status. Must be ACTIVE or SUSPENDED.' }, { status: 400 });
      }
      // Prevent suspending oneself
      if (userId === auth.userId && status === 'SUSPENDED') {
        return NextResponse.json({ message: 'You cannot suspend your own administrative account.' }, { status: 400 });
      }
      membershipUpdate.status = status;
    }

    if (role) {
      membershipUpdate.role = role.toUpperCase().replace(/\s+/g, '_');
    }

    if (Object.keys(membershipUpdate).length > 0) {
      await prisma.schoolMembership.updateMany({
        where: {
          schoolId: auth.schoolId,
          userId,
        },
        data: membershipUpdate,
      });
    }

    if (name || phone !== undefined) {
      const userUpdate: any = {};
      if (name) {
        const parts = name.trim().split(/\s+/);
        userUpdate.firstName = parts[0] || '';
        userUpdate.lastName = parts.slice(1).join(' ') || '';
      }
      if (phone !== undefined) {
        userUpdate.phone = phone.trim() || null;
      }
      await prisma.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    await logSecurityAudit({
      event: status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : (role ? 'ROLE_CHANGED' : 'ACCOUNT_ENABLED'),
      schoolId: auth.schoolId,
      userId: auth.userId,
      details: { targetUserId: userId, newStatus: status, newRole: role, name, phone },
    });

    return NextResponse.json({ success: true, message: 'User profile updated successfully' });
  } catch (error: any) {
    console.error('[USERS_PATCH_ERROR] Failed to update user:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
