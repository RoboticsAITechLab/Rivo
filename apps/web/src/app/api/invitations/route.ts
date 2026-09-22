import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { invitationRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';
import { sendStaffInvitationEmail } from '@/lib/email/email-service';

// POST /api/invitations - Admin sends an invitation to a teacher or staff member
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    // Rate limit check
    const rateLimit = await invitationRateLimiter.consume(`${auth.schoolId}:${auth.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many invitations issued. Please wait before creating more.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, role, customRoleId, campusId, department, designation } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email address is required.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Check if user already exists as an active member in this school
    const existingMembership = await prisma.schoolMembership.findFirst({
      where: {
        schoolId: auth.schoolId,
        user: { email: trimmedEmail },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'A user with this email is already a member of this school.' },
        { status: 409 }
      );
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000); // 7 days

    // Revoke any prior pending invitations for this email in this school
    await prisma.staffInvitation.updateMany({
      where: {
        schoolId: auth.schoolId,
        email: trimmedEmail,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const invitation = await prisma.staffInvitation.create({
      data: {
        schoolId: auth.schoolId,
        email: trimmedEmail,
        role: role === 'STAFF' ? 'STAFF' : 'TEACHER',
        customRoleId: customRoleId || null,
        campusId: campusId || null,
        department: department || null,
        designation: designation || null,
        invitedById: auth.userId,
        tokenHash,
        expiresAt,
      },
      include: {
        school: { select: { name: true } },
      },
    });

    await logSecurityAudit({
      event: 'INVITATION_CREATED',
      userId: auth.userId,
      schoolId: auth.schoolId,
      ipAddress: ip,
      userAgent,
      details: { email: trimmedEmail, role: invitation.role },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;

    await sendStaffInvitationEmail({
      to: trimmedEmail,
      schoolName: invitation.school?.name || 'Rivo School',
      role: invitation.role,
      inviteUrl,
      schoolId: auth.schoolId,
      invitedById: auth.userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation created successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      inviteToken: rawToken,
      inviteUrl: `/invite/accept?token=${rawToken}`,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/invitations - List pending invitations for the school tenant
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const invitations = await prisma.staffInvitation.findMany({
      where: {
        schoolId: auth.schoolId,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
