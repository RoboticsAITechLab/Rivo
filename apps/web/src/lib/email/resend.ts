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
  const email = process.env.RESEND_FROM_EMAIL || 'no-reply@homyhaven.app';
  const name = process.env.RESEND_FROM_NAME || 'Rivo School Management';
  return { email, name };
}

export function getCanonicalAppUrl(): string {
  const rawUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const isProd = process.env.NODE_ENV === 'production' && process.env.AUTH_INFRA_MODE !== 'local';

  if (rawUrl && rawUrl.trim() !== '') {
    const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
    if (isProd && !cleanUrl.startsWith('https://')) {
      throw new Error('[SECURITY_ERROR] Production APP_URL must use HTTPS protocol.');
    }
    return cleanUrl;
  }

  if (isProd) {
    throw new Error('[SECURITY_ERROR] Production APP_URL is missing. Cannot construct secure invitation link.');
  }

  return 'http://localhost:3000';
}

export function getAppUrl(): string {
  return getCanonicalAppUrl();
}

