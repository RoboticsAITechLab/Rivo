import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { logSecurityAudit } from '@/lib/auth/audit';

// POST /api/invitations/[id]/revoke - Revoke a pending invitation
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;

    const invitation = await prisma.staffInvitation.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found.' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { message: 'Cannot revoke an invitation that has already been accepted.' },
        { status: 400 }
      );
    }

    if (invitation.revokedAt) {
      return NextResponse.json(
        { message: 'This invitation has already been revoked.' },
        { status: 400 }
      );
    }

    const updated = await prisma.staffInvitation.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await logSecurityAudit({
      event: 'INVITATION_REVOKED',
      userId: auth.userId,
      schoolId: auth.schoolId,
      details: { invitationId: id, email: invitation.email, role: invitation.role },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${invitation.email} has been revoked.`,
      invitation: updated,
    });
  } catch (error: any) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to revoke invitation.' },
      { status: 500 }
    );
  }
}
