export interface StaffInvitationEmailProps {
  recipientEmail: string;
  schoolName: string;
  role: string;
  inviteUrl: string;
}

export function renderStaffInvitationEmail({
  recipientEmail,
  schoolName,
  role,
  inviteUrl,
}: StaffInvitationEmailProps) {
  const subject = `Invitation to join ${schoolName} on Rivo`;

  const text = `
Hello (${recipientEmail}),

You have been invited to join ${schoolName} on Rivo School Management as a ${role}.

To accept this invitation and set up your account password, click the link below:
${inviteUrl}

This invitation link is valid for 7 days. If you were not expecting this invitation, please disregard this message.

Best regards,
${schoolName} & The Rivo Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 32px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px; }
    .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .body-text { font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { background: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
    .footer { padding: 24px 32px; background: #f1f5f9; text-align: center; font-size: 13px; color: #64748b; }
    .url-fallback { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RIVO</div>
    </div>
    <div class="content">
      <h1 class="title">You're Invited!</h1>
      <p class="body-text">
        You have been invited to join <strong>${schoolName}</strong> on Rivo School Management as a <strong>${role}</strong>.
      </p>
      <div class="btn-container">
        <a href="${inviteUrl}" class="btn" target="_blank">Accept Invitation & Set Password</a>
      </div>
      <p class="body-text">
        This invitation link is valid for 7 days. If you did not expect this invitation, you can safely ignore this email.
      </p>
      <p class="url-fallback">
        Button not working? Copy and paste this URL into your browser:<br>
        ${inviteUrl}
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Rivo School Management SaaS. All rights reserved.
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
}
