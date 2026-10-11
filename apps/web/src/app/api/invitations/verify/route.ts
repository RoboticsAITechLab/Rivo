import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/crypto';

// GET /api/invitations/verify?token=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, code: 'MISSING_TOKEN', message: 'Missing invitation security token in link.' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
      include: {
        school: {
          select: { name: true, slug: true },
        },
        customRole: {
          select: { id: true, name: true, code: true, baseRole: true, description: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, code: 'INVALID_TOKEN', message: 'This invitation link is invalid or does not exist.' },
        { status: 400 }
      );
    }

    if (invitation.revokedAt !== null) {
      return NextResponse.json(
        { valid: false, code: 'REVOKED', message: 'This invitation has been revoked by the school administrator.' },
        { status: 400 }
      );
    }

    if (invitation.acceptedAt !== null) {
      return NextResponse.json(
        { valid: false, code: 'ALREADY_ACCEPTED', message: 'This invitation has already been accepted. Please sign in with your email and password.' },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, code: 'EXPIRED', message: 'This invitation link has expired. Please contact your administrator for a new invitation.' },
        { status: 400 }
      );
    }

    const displayRole = invitation.customRole
      ? `${invitation.customRole.name} (${invitation.role})`
      : invitation.role;

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        customRoleId: invitation.customRoleId,
        customRoleName: invitation.customRole?.name || null,
        displayRole,
        department: invitation.department,
        designation: invitation.designation,
        schoolName: invitation.school.name,
        schoolSlug: invitation.school.slug,
      },
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
  }
}
