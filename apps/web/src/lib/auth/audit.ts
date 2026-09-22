import { prisma } from '@/lib/prisma';

export type SecurityAuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'INVITATION_CREATED'
  | 'INVITATION_ACCEPTED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_ENABLED'
  | 'PERMISSION_CHANGED'
  | 'ROLE_CHANGED'
  | 'SESSION_REVOKED'
  | 'EMAIL_INVITATION_SENT'
  | 'EMAIL_INVITATION_FAILED'
  | 'PASSWORD_RESET_EMAIL_SENT'
  | 'PASSWORD_RESET_EMAIL_FAILED'
  | 'REDIS_RATE_LIMIT_BLOCKED'
  | 'MFA_ENROLLMENT_STARTED'
  | 'MFA_ENABLED'
  | 'MFA_VERIFICATION_FAILED'
  | 'MFA_LOGIN_SUCCESS'
  | 'MFA_RECOVERY_CODE_USED'
  | 'MFA_RECOVERY_CODES_REGENERATED'
  | 'MFA_DISABLED'
  | 'SESSION_CACHE_HIT'
  | 'SESSION_CACHE_MISS';

export interface AuditLogParams {
  event: SecurityAuditEvent;
  schoolId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Logs a security or authentication audit event.
 * Never logs raw passwords, plaintext tokens, or secrets.
 * Fails silently so audit issues never block user authentication.
 */
export async function logSecurityAudit(params: AuditLogParams): Promise<void> {
  try {
    const sanitizedDetails = params.details ? JSON.stringify(params.details) : null;

    await prisma.securityAuditLog.create({
      data: {
        event: params.event,
        schoolId: params.schoolId || null,
        userId: params.userId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: sanitizedDetails,
      },
    });
  } catch (error) {
    console.error(`[AUDIT_ERROR] Failed to record security audit log for event ${params.event}:`, error);
  }
}
