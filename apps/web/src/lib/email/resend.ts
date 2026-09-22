import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 're_placeholder') {
    return null;
  }

  if (!resendInstance) {
    resendInstance = new Resend(apiKey.trim());
  }

  return resendInstance;
}

export function getEmailSender(): { email: string; name: string } {
  const email = process.env.RESEND_FROM_EMAIL || 'no-reply@rivo.school';
  const name = process.env.RESEND_FROM_NAME || 'Rivo School Management';
  return { email, name };
}

export function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
