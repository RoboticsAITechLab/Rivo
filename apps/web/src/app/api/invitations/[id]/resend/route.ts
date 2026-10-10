import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { logSecurityAudit } from '@/lib/auth/audit';
import { sendStaffInvitationEmail } from '@/lib/email/email-service';

// POST /api/invitations/[id]/resend - Refresh security token and resend invitation email
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'],
    });
    if (!auth.authorized) return auth.response;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';
    const { id } = await context.params;

    const invitation = await prisma.staffInvitation.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        school: { select: { name: true } },
        customRole: { select: { name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found.' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { message: 'Cannot resend an invitation that has already been accepted.' },
        { status: 400 }
      );
    }

    // Generate fresh cryptographic token and extend expiry by 7 days
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000);

    const updated = await prisma.staffInvitation.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt,
        revokedAt: null, // Clear revocation if previously revoked
      },
    });

    await logSecurityAudit({
      event: 'INVITATION_RESENT',
      userId: auth.userId,
      schoolId: auth.schoolId,
      ipAddress: ip,
      userAgent,
      details: { invitationId: id, email: invitation.email, role: invitation.role },
    });

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rivo-web-sand.vercel.app';
    const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;

    const emailResult = await sendStaffInvitationEmail({
      to: invitation.email,
      schoolName: invitation.school?.name || 'Rivo School',
      role: invitation.customRole?.name || invitation.role,
      inviteUrl,
      schoolId: auth.schoolId,
      invitedById: auth.userId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? `Invitation re-dispatched to ${invitation.email}.`
        : `Invitation refreshed. Token active.`,
      emailDelivered: emailResult.success,
      inviteToken: rawToken,
      inviteUrl: `/invite/accept?token=${rawToken}`,
      invitation: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        expiresAt: updated.expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to resend invitation.' },
      { status: 500 }
    );
  }
}
