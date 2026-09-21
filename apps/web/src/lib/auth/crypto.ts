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
 * Generates an HMAC-SHA256 signed session token for secure cookie authentication.
 */
const DEFAULT_SECRET = process.env.JWT_SECRET || 'rivo-institutional-auth-secret-production-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  schoolId: string;
  teacherId?: string;
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, 'exp'>, expiresInSeconds = 86400 * 7): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', DEFAULT_SECRET);
  hmac.update(body);
  const signature = hmac.digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const hmac = crypto.createHmac('sha256', DEFAULT_SECRET);
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
