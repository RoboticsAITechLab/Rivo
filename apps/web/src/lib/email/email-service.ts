import { getResendClient, getEmailSender } from './resend';
import { renderStaffInvitationEmail } from './templates/staff-invitation';
import { renderPasswordResetEmail } from './templates/password-reset';
import { logSecurityAudit } from '@/lib/auth/audit';

export interface SendInvitationParams {
  to: string;
  schoolName: string;
  role: string;
  inviteUrl: string;
  schoolId?: string;
  invitedById?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SendPasswordResetParams {
  to: string;
  resetUrl: string;
  userId?: string;
  schoolId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Dispatches staff invitation email via Resend (or mock in local dev)
 */
export async function sendStaffInvitationEmail(
  params: SendInvitationParams
): Promise<EmailDeliveryResult> {
  const { to, schoolName, role, inviteUrl, schoolId, invitedById, ipAddress, userAgent } = params;
  const resend = getResendClient();
  const sender = getEmailSender();
  const { subject, text, html } = renderStaffInvitationEmail({
    recipientEmail: to,
    schoolName,
    role,
    inviteUrl,
  });

  if (!resend) {
    // Local / Dev simulated delivery
    console.log(`[EMAIL SIMULATION] Staff Invitation dispatched to: ${to} (School: ${schoolName}, Role: ${role})`);
    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: invitedById || null,
      event: 'EMAIL_INVITATION_SENT',
      ipAddress,
      userAgent,
      details: {
        to,
        role,
        schoolName,
        simulated: true,
      },
    });
    return { success: true, simulated: true };
  }

  try {
    const response = await resend.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: [to],
      subject,
      text,
      html,
    });

    if (response.error) {
      console.error('[EMAIL ERROR] Failed to send staff invitation via Resend:', response.error.message);
      await logSecurityAudit({
        schoolId: schoolId || null,
        userId: invitedById || null,
        event: 'EMAIL_INVITATION_FAILED',
        ipAddress,
        userAgent,
        details: {
          to,
          role,
          errorMessage: response.error.name,
        },
      });
      return { success: false, error: 'Email delivery failed' };
    }

    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: invitedById || null,
      event: 'EMAIL_INVITATION_SENT',
      ipAddress,
      userAgent,
      details: {
        to,
        role,
        messageId: response.data?.id,
      },
    });

    return { success: true, messageId: response.data?.id };
  } catch {
    console.error('[EMAIL ERROR] Unexpected exception during invitation delivery');
    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: invitedById || null,
      event: 'EMAIL_INVITATION_FAILED',
      ipAddress,
      userAgent,
      details: {
        to,
        role,
        error: 'DISPATCH_EXCEPTION',
      },
    });
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Dispatches password reset email via Resend (or mock in local dev)
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetParams
): Promise<EmailDeliveryResult> {
  const { to, resetUrl, userId, schoolId, ipAddress, userAgent } = params;
  const resend = getResendClient();
  const sender = getEmailSender();
  const { subject, text, html } = renderPasswordResetEmail({
    recipientEmail: to,
    resetUrl,
  });

  if (!resend) {
    // Local / Dev simulated delivery
    console.log(`[EMAIL SIMULATION] Password Reset dispatched to: ${to}`);
    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: userId || null,
      event: 'PASSWORD_RESET_EMAIL_SENT',
      ipAddress,
      userAgent,
      details: {
        to,
        simulated: true,
      },
    });
    return { success: true, simulated: true };
  }

  try {
    const response = await resend.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: [to],
      subject,
      text,
      html,
    });

    if (response.error) {
      console.error('[EMAIL ERROR] Failed to send password reset via Resend:', response.error.message);
      await logSecurityAudit({
        schoolId: schoolId || null,
        userId: userId || null,
        event: 'PASSWORD_RESET_EMAIL_FAILED',
        ipAddress,
        userAgent,
        details: {
          to,
          errorMessage: response.error.name,
        },
      });
      return { success: false, error: 'Email delivery failed' };
    }

    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: userId || null,
      event: 'PASSWORD_RESET_EMAIL_SENT',
      ipAddress,
      userAgent,
      details: {
        to,
        messageId: response.data?.id,
      },
    });

    return { success: true, messageId: response.data?.id };
  } catch {
    console.error('[EMAIL ERROR] Unexpected exception during reset email delivery');
    await logSecurityAudit({
      schoolId: schoolId || null,
      userId: userId || null,
      event: 'PASSWORD_RESET_EMAIL_FAILED',
      ipAddress,
      userAgent,
      details: {
        to,
        error: 'DISPATCH_EXCEPTION',
      },
    });
    return { success: false, error: 'Email service error' };
  }
}
