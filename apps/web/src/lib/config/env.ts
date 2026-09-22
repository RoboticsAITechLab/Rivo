export interface AppEnvConfig {
  databaseUrl: string;
  resendApiKey?: string;
  resendFromEmail: string;
  resendFromName: string;
  appUrl: string;
  redisUrl?: string;
  mfaEncryptionKey?: string;
  infraMode: 'local' | 'production';
}

export function validateEnvConfig(): AppEnvConfig {
  const infraMode = (process.env.AUTH_INFRA_MODE === 'production' || process.env.NODE_ENV === 'production')
    ? 'production'
    : 'local';

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[FATAL_CONFIG] DATABASE_URL is missing.');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@rivo.school';
  const resendFromName = process.env.RESEND_FROM_NAME || 'Rivo School Management';
  const redisUrl = process.env.REDIS_URL;
  const mfaEncryptionKey = process.env.MFA_ENCRYPTION_KEY;

  if (infraMode === 'production') {
    const missing: string[] = [];
    if (!resendApiKey) missing.push('RESEND_API_KEY');
    if (!redisUrl) missing.push('REDIS_URL');
    if (!mfaEncryptionKey || mfaEncryptionKey.length < 32) {
      missing.push('MFA_ENCRYPTION_KEY (must be at least 32 characters)');
    }

    if (missing.length > 0) {
      console.warn(`[PRODUCTION_CONFIG_WARNING] Missing required production infrastructure: ${missing.join(', ')}`);
    }
  }

  return {
    databaseUrl,
    resendApiKey,
    resendFromEmail,
    resendFromName,
    appUrl,
    redisUrl,
    mfaEncryptionKey,
    infraMode,
  };
}
