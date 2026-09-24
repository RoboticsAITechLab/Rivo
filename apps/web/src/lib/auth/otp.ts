import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/crypto';
import { logSecurityAudit } from '@/lib/auth/audit';

// In-memory test OTP registry for automated test suite verification (only active in test environment)
const testOtpStore = new Map<string, string>();

export function getLatestTestOtp(identifier: string): string | undefined {
  if (process.env.NODE_ENV === 'test' || process.env.TEST_RUNNER === 'true') {
    return testOtpStore.get(identifier);
  }
  return undefined;
}

export interface RequestOtpParams {
  identifier: string; // Normalized phone (+91...) or email
  type: 'PHONE' | 'EMAIL';
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  error?: string;
}

export interface VerifyOtpParams {
  identifier: string;
  type: 'PHONE' | 'EMAIL';
  code: string;
  ipAddress?: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
  attemptsRemaining?: number;
}

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Generates and stores a secure, one-time OTP for an identifier.
 */
export async function requestOtp({
  identifier,
  type,
  ipAddress,
  userAgent,
}: RequestOtpParams): Promise<RequestOtpResult> {
  const now = new Date();

  // 1. Check Resend Cooldown
  const recentOtp = await prisma.authOtp.findFirst({
    where: {
      identifier,
      type,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const elapsedSeconds = Math.floor((now.getTime() - recentOtp.createdAt.getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS && !recentOtp.consumedAt) {
      const waitSeconds = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        cooldownSeconds: waitSeconds,
        error: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
      };
    }
  }

  // 2. Generate 6-digit cryptographically secure OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashToken(rawOtp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 3. Persist hashed OTP
  await prisma.authOtp.create({
    data: {
      identifier,
      type,
      codeHash,
      expiresAt,
      attemptCount: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      ipAddress: ipAddress || null,
    },
  });

  // Store for automated test assertions if in test mode
  if (process.env.NODE_ENV === 'test' || process.env.TEST_RUNNER === 'true') {
    testOtpStore.set(identifier, rawOtp);
  }

  // 4. Dispatch through non-paid channel
  try {
    if (type === 'EMAIL') {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.EMAIL_FROM || 'Rivo Security <onboarding@resend.dev>';
        await resend.emails.send({
          from: fromEmail,
          to: identifier,
          subject: 'Your Rivo Parent Verification Code',
          text: `Your Rivo verification code is: ${rawOtp}. This code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-bottom: 16px;">Rivo Parent Verification</h2>
              <p style="color: #475569; font-size: 14px;">Use the verification code below to complete your login:</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${rawOtp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px;">This code is valid for ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
      }
    } else {
      // PHONE dispatch: SMS channel is in abstract mode (no paid provider provisioned)
      // Log delivery intent safely without exposing raw secrets in production logs
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV OTP DISPATCH] Phone OTP generated for ${identifier}: ${rawOtp}`);
      }
    }
  } catch (dispatchError) {
    console.error(`[OTP Dispatch Error] Failed delivering ${type} OTP to ${identifier}:`, dispatchError);
    // Graceful continuation: do not fail request if email sandbox is active
  }

  await logSecurityAudit({
    event: 'OTP_REQUESTED',
    ipAddress,
    userAgent,
    details: { identifier: identifier.slice(0, 4) + '***', type },
  });

  return {
    success: true,
    message: 'If an account exists, a verification code has been sent.',
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verifies an OTP against the stored hash. Enforces expiration, attempt limits, and single-use.
 */
export async function verifyOtp({
  identifier,
  type,
  code,
  ipAddress,
}: VerifyOtpParams): Promise<VerifyOtpResult> {
  const cleanCode = code.trim();
  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { valid: false, error: 'Verification code must be 6 digits.' };
  }

  const now = new Date();

  // Find latest active OTP record
  const otpRecord = await prisma.authOtp.findFirst({
    where: {
      identifier,
      type,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }

  // Check if already consumed
  if (otpRecord.consumedAt !== null) {
    return { valid: false, error: 'This verification code has already been used. Please request a new one.' };
  }

  // Check expiry
  if (otpRecord.expiresAt < now) {
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpRecord.attemptCount >= otpRecord.maxAttempts) {
    return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  // Verify hash
  const inputHash = hashToken(cleanCode);
  const isMatch = inputHash === otpRecord.codeHash;

  if (!isMatch) {
    const updatedCount = otpRecord.attemptCount + 1;
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { attemptCount: updatedCount },
    });

    const attemptsRemaining = Math.max(0, otpRecord.maxAttempts - updatedCount);

    await logSecurityAudit({
      event: 'OTP_VERIFICATION_FAILED',
      ipAddress,
      details: { identifier: identifier.slice(0, 4) + '***', type, attemptsRemaining },
    });

    return {
      valid: false,
      error: attemptsRemaining > 0
        ? `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
        : 'Too many incorrect attempts. This code is now invalid. Please request a new one.',
      attemptsRemaining,
    };
  }

  // Consume OTP atomically
  await prisma.authOtp.update({
    where: { id: otpRecord.id },
    data: { consumedAt: now },
  });

  // Clean test store
  testOtpStore.delete(identifier);

  await logSecurityAudit({
    event: 'OTP_VERIFICATION_SUCCESS',
    ipAddress,
    details: { identifier: identifier.slice(0, 4) + '***', type },
  });

  return { valid: true };
}
