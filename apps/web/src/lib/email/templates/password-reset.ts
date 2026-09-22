export interface PasswordResetEmailProps {
  recipientEmail: string;
  resetUrl: string;
}

export function renderPasswordResetEmail({
  recipientEmail,
  resetUrl,
}: PasswordResetEmailProps) {
  const subject = `Reset your Rivo account password`;

  const text = `
Hello,

We received a request to reset the password for your Rivo account (${recipientEmail}).

To set a new password, click the link below:
${resetUrl}

This link is single-use and will expire in 1 hour. If you did not make this request, you can safely ignore this email; your account remains secure.

Best regards,
The Rivo Security Team
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
    .btn { background: #e11d48; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
    .footer { padding: 24px 32px; background: #f1f5f9; text-align: center; font-size: 13px; color: #64748b; }
    .url-fallback { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px; }
    .warning { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #9f1239; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RIVO</div>
    </div>
    <div class="content">
      <h1 class="title">Password Reset Request</h1>
      <p class="body-text">
        We received a request to reset the password for your Rivo account. Click the button below to choose a new password.
      </p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>
      <div class="warning">
        <strong>Security Notice:</strong> This link is single-use and will expire in 1 hour. If you did not request this password reset, please ignore this email.
      </div>
      <p class="url-fallback">
        Button not working? Copy and paste this URL into your browser:<br>
        ${resetUrl}
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
