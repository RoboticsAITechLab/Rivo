import crypto from 'node:crypto';

/**
 * Secure password hashing using Node's built-in crypto.scrypt.
 * Output format: "salt:derivedKey" (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a password against a stored scrypt hash using timingSafeEqual to avoid timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.includes(':')) {
      return resolve(false);
    }
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return resolve(false);
    }

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Generates a cryptographically secure random token (hex-encoded).
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes a SHA-256 hash of a raw token for secure database storage/lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates password complexity:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special symbol
 */
export interface PasswordPolicyConfig {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export function validatePasswordPolicy(
  password: string,
  policy?: PasswordPolicyConfig
): {
  isValid: boolean;
  errors: string[];
} {
  const minLength = policy?.minLength ?? 8;
  const requireUpper = policy?.requireUppercase ?? true;
  const requireLower = policy?.requireLowercase ?? true;
  const requireNumbers = policy?.requireNumbers ?? true;
  const requireSpecial = policy?.requireSpecialChars ?? false;

  const errors: string[] = [];
  if (!password || password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long.`);
  }
  if (requireUpper && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (requireLower && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves the authoritative JWT / session HMAC signing secret.
 * In production mode, fails closed if JWT_SECRET is unset, matches known compromised placeholders,
 * or fails minimum entropy requirements.
 */
const REJECTED_JWT_PLACEHOLDERS = new Set([
  'rivo-institutional-auth-secret-production-2026',
  'super-secret-jwt-token-change-in-production',
  'replace-with-a-secure-random-32-byte-hex-secret',
  'dev_secret',
  'secret',
  'changeme',
  'default',
  'jwt_secret',
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const isProd = process.env.NODE_ENV === 'production' || process.env.AUTH_INFRA_MODE === 'production';

  if (!secret) {
    if (isProd) {
      throw new Error('[SECURITY FATAL] A secure, unique JWT_SECRET must be configured in production.');
    }
    return 'rivo-dev-temporary-secret-not-for-production-signing';
  }

  if (REJECTED_JWT_PLACEHOLDERS.has(secret.toLowerCase())) {
    if (isProd) {
      throw new Error('[SECURITY FATAL] Insecure/compromised JWT_SECRET placeholder detected in production.');
    }
    return 'rivo-dev-temporary-secret-not-for-production-signing';
  }

  if (isProd && secret.length < 32) {
    throw new Error('[SECURITY FATAL] Production JWT_SECRET must be at least 32 characters long.');
  }

  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  schoolId?: string | null;
  teacherId?: string;
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, 'exp'>, expiresInSeconds = 86400 * 7): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', getJwtSecret());
  hmac.update(body);
  const signature = hmac.digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const hmac = crypto.createHmac('sha256', getJwtSecret());
    hmac.update(body);
    const expectedSig = hmac.digest('base64url');

    if (
      Buffer.from(signature).length !== Buffer.from(expectedSig).length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
