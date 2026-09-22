import crypto from 'crypto';

/**
 * Computes a SHA-256 hash for privacy-sensitive identifiers before placing them in Redis keys
 */
export function hashIdentifier(identifier: string): string {
  return crypto.createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export const RedisKeys = {
  /**
   * Rate limiter key: rivo:rl:<action>:<type>:<hashedIdentifier>
   */
  rateLimit(action: string, type: 'ip' | 'user', identifier: string): string {
    const hashed = hashIdentifier(identifier);
    return `rivo:rl:${action}:${type}:${hashed}`;
  },

  /**
   * Session cache key: rivo:session:<tokenHash>
   */
  session(tokenHash: string): string {
    return `rivo:session:${tokenHash}`;
  },

  /**
   * User active sessions set key: rivo:user:sessions:<userId>
   */
  userSessions(userId: string): string {
    return `rivo:user:sessions:${userId}`;
  },

  /**
   * MFA challenge rate limit key
   */
  mfaRateLimit(userId: string): string {
    return `rivo:rl:mfa:user:${userId}`;
  },
};
