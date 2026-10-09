/**
 * Rivo Production Testing & Observability Center
 * Server-Side Operator Authorization Guard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorize';

const ALLOWED_OPERATOR_ROLES = new Set([
  'OWNER',
  'PLATFORM_ADMIN',
  'DIRECTOR',
  'PRINCIPAL',
  'ADMIN',
  'SCHOOL_ADMIN',
]);

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
          name: 'Local Diagnostic Operator',
          email: 'diagnostics@rivo.school',
          roleType: 'ADMIN',
        },
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Valid administrative session required to access testing center.' },
        { status: 401 }
      ),
    };
  }

  const role = (user.roleType as string) || '';
  const isPlatformUser = user.scope === 'PLATFORM' || !!user.platformRole;
  const isAllowedSchoolAdmin = ALLOWED_OPERATOR_ROLES.has(role);

  if (!isPlatformUser && !isAllowedSchoolAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            'Forbidden: Production Testing & Observability Center is restricted to platform administrators and institutional leadership.',
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
