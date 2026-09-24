import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken, TokenPayload, verifyToken } from '@/lib/auth/crypto';
import {
  getCachedSession,
  setCachedSession,
  invalidateSessionCache,
  invalidateAllUserSessionsCache,
} from '@/lib/auth/session-cache';

export const SESSION_COOKIE_NAME = 'rivo_session';

export interface ActiveSessionContext {
  sessionId: string;
  userId: string;
  scope: 'PLATFORM' | 'SCHOOL';
  schoolId: string | null;
  email: string | null;
  role: string;
  platformRole?: 'OWNER' | 'PLATFORM_ADMIN' | null;
  teacherId?: string;
  status: string;
}

/**
 * Creates a database-backed session with a cryptographically random token.
 * Stores only the SHA-256 hash of the token in the database.
 * Supports schoolId = null for platform users (OWNER, PLATFORM_ADMIN).
 */
export async function createSession(params: {
  userId: string;
  schoolId?: string | null;
  rememberMe?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ rawToken: string; sessionId: string; expiresAt: Date }> {
  const { userId, schoolId, rememberMe, ipAddress, userAgent } = params;

  // 30 days if rememberMe, else 7 days
  const durationMs = rememberMe ? 30 * 86400 * 1000 : 7 * 86400 * 1000;
  const expiresAt = new Date(Date.now() + durationMs);

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);

  const session = await prisma.session.create({
    data: {
      userId,
      schoolId: schoolId || null,
      tokenHash,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  return {
    rawToken,
    sessionId: session.id,
    expiresAt,
  };
}

/**
 * Resolves the active session from request cookies or a raw token string.
 * Verifies session exists, is not revoked, has not expired, user is ACTIVE,
 * and user has an ACTIVE membership in the school.
 */
export async function getValidSession(
  reqOrToken: NextRequest | string | null | undefined
): Promise<ActiveSessionContext | null> {
  let rawToken: string | null = null;

  if (typeof reqOrToken === 'string') {
    rawToken = reqOrToken;
  } else if (reqOrToken && 'cookies' in reqOrToken) {
    rawToken = reqOrToken.cookies.get(SESSION_COOKIE_NAME)?.value || null;
  }

  if (!rawToken) {
    return null;
  }

  try {
    const tokenHash = hashToken(rawToken);

    // 1. Check Redis session cache first
    const cached = await getCachedSession(tokenHash);
    if (cached) {
      if (cached.user.status === 'ACTIVE' && cached.user.isActive) {
        // Platform session cache hit
        if (!cached.session.schoolId) {
          const platformRole = (cached.user.platformRole || (cached.user.isPlatformOwner ? 'OWNER' : null)) as 'OWNER' | 'PLATFORM_ADMIN' | null;
          if (platformRole) {
            return {
              sessionId: cached.session.id,
              userId: cached.user.id,
              scope: 'PLATFORM',
              schoolId: null,
              email: cached.user.email,
              role: platformRole,
              platformRole,
              status: cached.user.status,
            };
          }
        }

        // School session cache hit
        if (
          cached.membership &&
          cached.membership.status === 'ACTIVE' &&
          cached.session.schoolId
        ) {
          return {
            sessionId: cached.session.id,
            userId: cached.user.id,
            scope: 'SCHOOL',
            schoolId: cached.session.schoolId,
            email: cached.user.email,
            role: cached.membership.role,
            platformRole: cached.user.platformRole as any,
            teacherId: cached.teacherProfile?.id,
            status: cached.user.status,
          };
        }
      }
    }

    // 2. Query PostgreSQL
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: true,
            teachers: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check revocation and expiration
    if (session.revokedAt !== null || session.expiresAt < new Date()) {
      await invalidateSessionCache(tokenHash, session.userId);
      return null;
    }

    // Check user account status
    if (session.user.status !== 'ACTIVE' || !session.user.isActive) {
      await invalidateSessionCache(tokenHash, session.user.id);
      return null;
    }

    // A. PLATFORM SESSION (no schoolId)
    if (!session.schoolId) {
      const platformRole = session.user.platformRole || (session.user.isPlatformOwner ? 'OWNER' : null);
      if (!platformRole) {
        await invalidateSessionCache(tokenHash, session.user.id);
        return null;
      }

      await setCachedSession(tokenHash, {
        session,
        user: session.user,
        membership: null,
        teacherProfile: null,
      });

      return {
        sessionId: session.id,
        userId: session.user.id,
        scope: 'PLATFORM',
        schoolId: null,
        email: session.user.email,
        role: platformRole,
        platformRole: platformRole as 'OWNER' | 'PLATFORM_ADMIN',
        status: session.user.status,
      };
    }

    // B. SCHOOL SESSION (requires active school membership in session.schoolId)
    const membership = session.user.memberships.find(
      (m) => m.schoolId === session.schoolId && m.status === 'ACTIVE'
    );

    if (!membership) {
      await invalidateSessionCache(tokenHash, session.user.id);
      return null;
    }

    const teacher = session.user.teachers.find((t) => t.schoolId === session.schoolId);

    // 3. Populate Redis cache
    await setCachedSession(tokenHash, {
      session,
      user: session.user,
      membership,
      teacherProfile: teacher,
    });

    return {
      sessionId: session.id,
      userId: session.user.id,
      scope: 'SCHOOL',
      schoolId: session.schoolId,
      email: session.user.email,
      role: membership.role,
      platformRole: session.user.platformRole as any,
      teacherId: teacher?.id,
      status: session.user.status,
    };
  } catch (error) {
    console.error('Error verifying database session:', error);
    return null;
  }
}

/**
 * Backward-compatible helper for existing routes expecting synchronous or simple TokenPayload.
 * Resolves against active DB session.
 */
export async function getAuthSessionAsync(
  req: NextRequest
): Promise<TokenPayload | null> {
  const activeSession = await getValidSession(req);
  if (!activeSession) return null;

  return {
    userId: activeSession.userId,
    email: activeSession.email || '',
    role: activeSession.role,
    schoolId: activeSession.schoolId,
    teacherId: activeSession.teacherId,
    exp: 0,
  };
}

/**
 * Synchronous backward-compatibility fallback. Reads raw cookie token for crypto verification
 * if called in synchronous context, but prefer getValidSession.
 */
export function getAuthSession(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  // If token is a legacy signed token, verify with crypto
  if (token.includes('.')) {
    return verifyToken(token);
  }

  return null;
}

/**
 * Revokes an active session by raw token.
 */
export async function revokeSession(rawToken: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(rawToken);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await invalidateSessionCache(tokenHash);
    return true;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
}

/**
 * Revokes ALL active sessions for a user (e.g. after password reset or 'logout all').
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await invalidateAllUserSessionsCache(userId);
    return result.count;
  } catch (error) {
    console.error(`Error revoking all sessions for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Sets the secure session cookie on a NextResponse.
 */
export function setSessionCookie(
  response: NextResponse,
  rawToken: string,
  rememberMe = false
): void {
  const maxAge = rememberMe ? 30 * 86400 : 7 * 86400;
  response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Clears the session cookie on a NextResponse.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
  // Also explicitly set expired cookie for compatibility with older browsers
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { getValidSession as getSession };
