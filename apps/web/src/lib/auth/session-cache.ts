import { getRedisClient, isRedisHealthy } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';
import { Session, User, SchoolMembership, Teacher } from '@/generated/prisma';

export interface CachedSessionData {
  session: {
    id: string;
    userId: string;
    schoolId: string | null;
    tokenHash: string;
    expiresAt: string;
    lastSeenAt: string;
    revokedAt: string | null;
  };
  user: {
    id: string;
    email: string | null;
    firstName: string;
    lastName: string;
    status: string;
    isActive: boolean;
    isPlatformOwner: boolean;
    platformRole?: string | null;
  };
  membership: {
    id: string;
    userId: string;
    schoolId: string;
    role: string;
    customRoleId: string | null;
    status: string;
  } | null;
  teacherProfile: {
    id: string;
    campusId: string | null;
    status: string;
  } | null;
  cachedAt: number;
}

const inMemorySessionCache = new Map<string, { data: string; expiresAt: number }>();
const inMemoryUserSessions = new Map<string, Set<string>>();

/**
 * Retrieves cached session if available in Redis or local cache fallback
 */
export async function getCachedSession(tokenHash: string): Promise<CachedSessionData | null> {
  const redis = getRedisClient();
  if (!redis || !isRedisHealthy()) {
    const record = inMemorySessionCache.get(tokenHash);
    if (!record) return null;
    if (record.expiresAt <= Date.now()) {
      inMemorySessionCache.delete(tokenHash);
      return null;
    }
    try {
      const parsed = JSON.parse(record.data) as CachedSessionData;
      const expiresAt = new Date(parsed.session.expiresAt).getTime();
      if (expiresAt <= Date.now() || parsed.session.revokedAt !== null) {
        inMemorySessionCache.delete(tokenHash);
        return null;
      }
      return parsed;
    } catch {
      inMemorySessionCache.delete(tokenHash);
      return null;
    }
  }

  try {
    const key = RedisKeys.session(tokenHash);
    const data = await redis.get(key);
    if (!data) return null;

    const parsed = JSON.parse(data) as CachedSessionData;
    const expiresAt = new Date(parsed.session.expiresAt).getTime();
    if (expiresAt <= Date.now() || parsed.session.revokedAt !== null) {
      // Immediately evict stale / revoked session from cache
      await redis.del(key);
      return null;
    }

    return parsed;
  } catch {
    // Fail-open: Redis cache error falls back directly to PostgreSQL
    return null;
  }
}

/**
 * Caches validated session in Redis with short TTL (max 5 minutes or remaining session TTL)
 */
export async function setCachedSession(
  tokenHash: string,
  data: {
    session: Session;
    user: User;
    membership?: SchoolMembership | null;
    teacherProfile?: Teacher | null;
  }
): Promise<void> {
  try {
    const expiresAt = new Date(data.session.expiresAt).getTime();
    const remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);

    if (remainingSeconds <= 0 || data.session.revokedAt) {
      return;
    }

    // TTL is min(300s, remainingSeconds)
    const ttl = Math.min(300, remainingSeconds);

    const payload: CachedSessionData = {
      session: {
        id: data.session.id,
        userId: data.session.userId,
        schoolId: data.session.schoolId,
        tokenHash: data.session.tokenHash,
        expiresAt: data.session.expiresAt.toISOString(),
        lastSeenAt: data.session.lastSeenAt.toISOString(),
        revokedAt: null,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        status: data.user.status,
        isActive: data.user.isActive,
        isPlatformOwner: data.user.isPlatformOwner,
        platformRole: data.user.platformRole,
      },
      membership: data.membership
        ? {
            id: data.membership.id,
            userId: data.membership.userId,
            schoolId: data.membership.schoolId,
            role: data.membership.role,
            customRoleId: data.membership.customRoleId,
            status: data.membership.status,
          }
        : null,
      teacherProfile: data.teacherProfile
        ? {
            id: data.teacherProfile.id,
            campusId: data.teacherProfile.campusId,
            status: data.teacherProfile.status,
          }
        : null,
      cachedAt: Date.now(),
    };

    const redis = getRedisClient();
    if (!redis || !isRedisHealthy()) {
      inMemorySessionCache.set(tokenHash, {
        data: JSON.stringify(payload),
        expiresAt: Date.now() + ttl * 1000,
      });
      if (!inMemoryUserSessions.has(data.user.id)) {
        inMemoryUserSessions.set(data.user.id, new Set());
      }
      inMemoryUserSessions.get(data.user.id)!.add(tokenHash);
      return;
    }

    const key = RedisKeys.session(tokenHash);
    const userSessionsKey = RedisKeys.userSessions(data.user.id);
    const pipeline = redis.pipeline();
    pipeline.setex(key, ttl, JSON.stringify(payload));
    pipeline.sadd(userSessionsKey, tokenHash);
    pipeline.expire(userSessionsKey, 86400 * 30); // 30 days
    await pipeline.exec();
  } catch {
    // Fail-open: Never disrupt authentication if cache write fails
    console.warn('[SESSION_CACHE_WARN] Failed to write session to Redis cache, saving to in-memory fallback');
    try {
      const expiresAt = new Date(data.session.expiresAt).getTime();
      const ttl = Math.min(300, Math.floor((expiresAt - Date.now()) / 1000));
      if (ttl > 0) {
        inMemorySessionCache.set(tokenHash, {
          data: JSON.stringify({
            session: {
              id: data.session.id,
              userId: data.session.userId,
              schoolId: data.session.schoolId,
              tokenHash: data.session.tokenHash,
              expiresAt: data.session.expiresAt.toISOString(),
              lastSeenAt: data.session.lastSeenAt.toISOString(),
              revokedAt: null,
            },
            user: {
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              status: data.user.status,
              isActive: data.user.isActive,
              isPlatformOwner: data.user.isPlatformOwner,
              platformRole: data.user.platformRole,
            },
            membership: data.membership
              ? {
                  id: data.membership.id,
                  userId: data.membership.userId,
                  schoolId: data.membership.schoolId,
                  role: data.membership.role,
                  customRoleId: data.membership.customRoleId,
                  status: data.membership.status,
                }
              : null,
            teacherProfile: data.teacherProfile
              ? {
                  id: data.teacherProfile.id,
                  campusId: data.teacherProfile.campusId,
                  status: data.teacherProfile.status,
                }
              : null,
            cachedAt: Date.now(),
          }),
          expiresAt: Date.now() + ttl * 1000,
        });
        if (!inMemoryUserSessions.has(data.user.id)) {
          inMemoryUserSessions.set(data.user.id, new Set());
        }
        inMemoryUserSessions.get(data.user.id)!.add(tokenHash);
      }
    } catch {
      // ignore fallback write failure
    }
  }
}

/**
 * Invalidates a single session cache entry immediately
 */
export async function invalidateSessionCache(tokenHash: string, userId?: string): Promise<void> {
  inMemorySessionCache.delete(tokenHash);
  if (userId) {
    inMemoryUserSessions.get(userId)?.delete(tokenHash);
  }

  const redis = getRedisClient();
  if (!redis || !isRedisHealthy()) return;

  try {
    const key = RedisKeys.session(tokenHash);
    await redis.del(key);

    if (userId) {
      const userSessionsKey = RedisKeys.userSessions(userId);
      await redis.srem(userSessionsKey, tokenHash);
    }
  } catch {
    console.warn('[SESSION_CACHE_WARN] Failed to invalidate session cache');
  }
}

/**
 * Invalidates all cached sessions for a given user immediately
 * (Triggered on password reset, logout-all, account suspension, or membership status change)
 */
export async function invalidateAllUserSessionsCache(userId: string): Promise<void> {
  const localHashes = inMemoryUserSessions.get(userId);
  if (localHashes) {
    for (const th of localHashes) {
      inMemorySessionCache.delete(th);
    }
    inMemoryUserSessions.delete(userId);
  }

  const redis = getRedisClient();
  if (!redis || !isRedisHealthy()) return;

  try {
    const userSessionsKey = RedisKeys.userSessions(userId);
    const tokenHashes = await redis.smembers(userSessionsKey);

    if (tokenHashes && tokenHashes.length > 0) {
      const keysToDelete = tokenHashes.map((th) => RedisKeys.session(th));
      keysToDelete.push(userSessionsKey);
      await redis.del(...keysToDelete);
    } else {
      await redis.del(userSessionsKey);
    }
  } catch {
    console.warn('[SESSION_CACHE_WARN] Failed to invalidate all user sessions from cache');
  }
}
