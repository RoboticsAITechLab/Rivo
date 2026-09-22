import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/crypto';
import { logSecurityAudit } from '@/lib/auth/audit';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_FALLBACK_KEY = 'rivo-mfa-encryption-key-32bytes-secret!';

function getEncryptionKey(): Buffer {
  const envKey = process.env.MFA_ENCRYPTION_KEY;
  if (envKey && envKey.trim().length >= 32) {
    // Hash key to ensure exact 32 bytes for aes-256
    return crypto.createHash('sha256').update(envKey.trim()).digest();
  }
  if (process.env.AUTH_INFRA_MODE === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('[SECURITY] MFA_ENCRYPTION_KEY must be configured in production with at least 32 characters');
  }
  return crypto.createHash('sha256').update(DEFAULT_FALLBACK_KEY).digest();
}

/**
 * Encrypts MFA TOTP secret at rest with AES-256-GCM
 */
export function encryptMfaSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts MFA TOTP secret using AES-256-GCM
 */
export function decryptMfaSecret(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted MFA secret format');
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a new TOTP secret and standard otpauth URI
 */
export function generateTotpSecret(email: string, issuer = 'Rivo'): { secret: string; uri: string } {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Generates QR Code Data URL for an otpauth URI
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Verifies a 6-digit TOTP code against a base32 secret
 * Allows 1 period (30s) drift tolerance
 */
export function verifyTotpCode(secretBase32: string, token: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Rivo',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    const delta = totp.validate({
      token: token.trim(),
      window: 1, // +/- 1 period
    });

    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Generates 8 single-use cryptographically secure recovery codes
 * Format: XXXX-XXXX (e.g. 8A3F-9B2C)
 */
export function generateRecoveryCodes(count = 8): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${part1}-${part2}`;
    rawCodes.push(code);
    hashedCodes.push(hashToken(code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()));
  }

  return { rawCodes, hashedCodes };
}

/**
 * Verifies and consumes a recovery code for a given user
 */
export async function verifyAndConsumeRecoveryCode(userId: string, inputCode: string): Promise<boolean> {
  const normalized = inputCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const codeHash = hashToken(normalized);

  const recoveryCode = await prisma.mfaRecoveryCode.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
    },
  });

  if (!recoveryCode) {
    return false;
  }

  // Atomically mark code as used
  await prisma.mfaRecoveryCode.update({
    where: { id: recoveryCode.id },
    data: { usedAt: new Date() },
  });

  await logSecurityAudit({
    userId,
    event: 'MFA_RECOVERY_CODE_USED',
    details: { codeId: recoveryCode.id },
  });

  return true;
}

/**
 * Creates a short-lived (5 min) MFA login challenge
 */
export async function createMfaChallenge(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const challengeHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate any previous challenges for this user
  await prisma.mfaChallenge.deleteMany({
    where: { userId },
  });

  await prisma.mfaChallenge.create({
    data: {
      userId,
      challengeHash,
      expiresAt,
    },
  });

  return rawToken;
}

export interface VerifyMfaChallengeResult {
  valid: boolean;
  userId?: string;
  error?: string;
  isRecovery?: boolean;
}

/**
 * Verifies an MFA login challenge with TOTP code or recovery code
 */
export async function verifyMfaChallenge(
  rawChallengeToken: string,
  code: string
): Promise<VerifyMfaChallengeResult> {
  const challengeHash = hashToken(rawChallengeToken);

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { challengeHash },
    include: {
      user: {
        include: {
          mfa: true,
        },
      },
    },
  });

  if (!challenge) {
    return { valid: false, error: 'Invalid or expired challenge.' };
  }

  if (challenge.consumedAt !== null) {
    return { valid: false, error: 'This challenge has already been used.' };
  }

  if (challenge.expiresAt < new Date()) {
    return { valid: false, error: 'Challenge has expired. Please log in again.' };
  }

  // Max 5 attempts per challenge
  if (challenge.attemptCount >= 5) {
    return { valid: false, error: 'Too many failed attempts. Please restart login.' };
  }

  // Increment attempt count
  await prisma.mfaChallenge.update({
    where: { id: challenge.id },
    data: { attemptCount: challenge.attemptCount + 1 },
  });

  const mfa = challenge.user.mfa;
  if (!mfa || !mfa.enabled) {
    return { valid: false, error: 'MFA is not enabled for this user.' };
  }

  const cleanCode = code.trim();

  // 1. Try TOTP code first (6 digits)
  if (/^\d{6}$/.test(cleanCode)) {
    let secret = '';
    try {
      secret = decryptMfaSecret(mfa.secretEncrypted);
    } catch {
      return { valid: false, error: 'Internal security error decrypting MFA configuration.' };
    }

    const isValid = verifyTotpCode(secret, cleanCode);
    if (!isValid) {
      await logSecurityAudit({
        userId: challenge.userId,
        event: 'MFA_VERIFICATION_FAILED',
        details: { method: 'TOTP' },
      });
      return { valid: false, error: 'Invalid verification code.' };
    }

    // Mark challenge consumed
    await prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return { valid: true, userId: challenge.userId, isRecovery: false };
  }

  // 2. Try recovery code
  const isRecoveryValid = await verifyAndConsumeRecoveryCode(challenge.userId, cleanCode);
  if (isRecoveryValid) {
    await prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return { valid: true, userId: challenge.userId, isRecovery: true };
  }

  await logSecurityAudit({
    userId: challenge.userId,
    event: 'MFA_VERIFICATION_FAILED',
    details: { method: 'RECOVERY_CODE' },
  });

  return { valid: false, error: 'Invalid verification or recovery code.' };
}
