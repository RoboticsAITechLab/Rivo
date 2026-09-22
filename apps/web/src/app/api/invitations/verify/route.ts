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
        { valid: false, message: 'Invitation token is missing.' },
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
      },
    });

    if (
      !invitation ||
      invitation.revokedAt !== null ||
      invitation.acceptedAt !== null ||
      invitation.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { valid: false, message: 'This invitation link is invalid, expired, or has already been used.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
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
