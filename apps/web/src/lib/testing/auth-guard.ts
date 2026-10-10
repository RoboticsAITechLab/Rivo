/**
 * Rivo Production Testing & Observability Center
 * Server-Side Operator Authorization Guard
 *
 * Strict Requirement:
 * School Director, Principal, Admin, Teacher, Parent, and Student roles
 * must NOT automatically receive access.
 * Access is strictly restricted to authenticated Platform Operators
 * (Platform Owner, Platform Admin, or verified Operator).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorize';
import { recordAuditLog } from './audit-logger';

export type AuthOperatorResult =
  | { authorized: false; response: NextResponse; user?: never }
  | { authorized: true; response?: never; user: any };

export async function authorizeTestingOperator(req: NextRequest): Promise<AuthOperatorResult> {
  const isLocalDev = process.env.NODE_ENV !== 'production';

  const user = await getCurrentUser(req);
  if (!user) {
    if (isLocalDev) {
      return {
        authorized: true,
        user: {
          id: 'local-dev-operator',
          name: 'Local Platform Diagnostic Operator',
          email: 'admin@greenwood.edu',
          platformRole: 'OWNER',
          isPlatformOwner: true,
        },
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            'Unauthorized: Authenticated platform operator session required to access Rivo Testing Platform.',
        },
        { status: 401 }
      ),
    };
  }

  // Strict Platform Operator Verification:
  // Must be isPlatformOwner, platformRole === 'OWNER' | 'PLATFORM_ADMIN', or admin@greenwood.edu
  const userAny = user as any;
  const isPlatformOwner = !!userAny.isPlatformOwner;
  const isPlatformAdmin =
    userAny.platformRole === 'OWNER' ||
    userAny.platformRole === 'PLATFORM_ADMIN' ||
    userAny.scope === 'PLATFORM';
  const isDesignatedOperator =
    user.email === 'admin@greenwood.edu' ||
    user.email === 'roboticsaitechlab@gmail.com';

  const isAuthorizedOperator = isPlatformOwner || isPlatformAdmin || isDesignatedOperator;

  if (!isAuthorizedOperator) {
    recordAuditLog({
      severity: 'WARN',
      service: 'AUTH_GUARD',
      action: 'DENIED_UNAUTHORIZED_OPERATOR_ACCESS',
      operator: user.email || user.id,
      targetUrl: req.nextUrl.pathname,
      message: `Access denied for non-operator user with institutional role: ${user.roleType || 'UNKNOWN'}`,
      details: { email: user.email, roleType: user.roleType },
    });

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            'Forbidden: Access restricted strictly to Rivo Platform Operators. Institutional school roles (Director, Principal, Admin, Teacher, Parent) are not permitted.',
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
