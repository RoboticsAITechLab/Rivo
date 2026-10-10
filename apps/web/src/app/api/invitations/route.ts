import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';
import { invitationRateLimiter } from '@/lib/auth/rate-limiter';
import { logSecurityAudit } from '@/lib/auth/audit';
import { sendStaffInvitationEmail } from '@/lib/email/email-service';
import { isRoleActive, getAuthorizedAssignableRoles } from '@/lib/roles/role-service';
import { Role } from '@prisma/client';

const VALID_BUILT_IN_ROLES: Role[] = [
  'DIRECTOR',
  'PRINCIPAL',
  'ADMIN',
  'TEACHER',
  'FEE_MANAGER',
  'STAFF',
  'SCHOOL_ADMIN',
];

interface SingleInviteInput {
  email: string;
  role?: string;
  customRoleId?: string | null;
  campusId?: string | null;
  department?: string | null;
  designation?: string | null;
}

async function processInvitation(
  input: SingleInviteInput,
  schoolId: string,
  userId: string,
  callerRole: string,
  ip: string,
  userAgent: string
) {
  const trimmedEmail = String(input.email || '').trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error(`Invalid email address: '${input.email}'.`);
  }

  // 1. Check if user already exists as an active member in this school
  const existingMembership = await prisma.schoolMembership.findFirst({
    where: {
      schoolId,
      user: { email: trimmedEmail },
      status: 'ACTIVE',
    },
  });

  if (existingMembership) {
    throw new Error(`A user with email '${trimmedEmail}' is already an active member of this school.`);
  }

  // 2. Validate Target Role (Built-in or Custom Role)
  let targetRole: Role;
  let targetCustomRoleId: string | null = null;
  let targetRoleDisplayName = '';

  if (input.customRoleId) {
    // Custom Role Path
    const customRole = await prisma.customRole.findFirst({
      where: {
        id: input.customRoleId,
        schoolId,
      },
    });

    if (!customRole) {
      throw new Error(`Custom role '${input.customRoleId}' not found or does not belong to this school.`);
    }

    if (!isRoleActive(customRole)) {
      throw new Error(`Custom role '${customRole.name}' is inactive and cannot be assigned to new invitees.`);
    }

    targetRole = customRole.baseRole;
    targetCustomRoleId = customRole.id;
    targetRoleDisplayName = customRole.name;
  } else if (input.role) {
    // Built-in Role Path
    const normalizedRole = input.role.toUpperCase() as Role;
    if (!VALID_BUILT_IN_ROLES.includes(normalizedRole)) {
      throw new Error(
        `Invalid role '${input.role}'. Expected one of: ${VALID_BUILT_IN_ROLES.join(', ')} or a valid customRoleId.`
      );
    }
    targetRole = normalizedRole;
    targetRoleDisplayName = normalizedRole;
  } else {
    throw new Error('Either a valid built-in role or a customRoleId must be provided.');
  }

  // 3. Strict Role Hierarchy & Invitation Authority Enforcement
  const assignableRoles = getAuthorizedAssignableRoles(callerRole);
  if (!assignableRoles.includes(targetRole)) {
    throw new Error(
      `Forbidden: Users with role '${callerRole}' are not authorized to invite members with role '${targetRoleDisplayName}'.`
    );
  }

  // 4. Token generation
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 86400 * 1000); // 7 days

  // 5. Revoke any prior pending invitations for this email in this school
  await prisma.staffInvitation.updateMany({
    where: {
      schoolId,
      email: trimmedEmail,
      acceptedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  // 6. Create StaffInvitation record
  const invitation = await prisma.staffInvitation.create({
    data: {
      schoolId,
      email: trimmedEmail,
      role: targetRole,
      customRoleId: targetCustomRoleId,
      campusId: input.campusId || null,
      department: input.department?.trim() || null,
      designation: input.designation?.trim() || null,
      invitedById: userId,
      tokenHash,
      expiresAt,
    },
    include: {
      school: { select: { name: true } },
      customRole: { select: { name: true, code: true } },
    },
  });

  // 7. Audit log
  await logSecurityAudit({
    event: 'INVITATION_CREATED',
    userId,
    schoolId,
    ipAddress: ip,
    userAgent,
    details: {
      email: trimmedEmail,
      role: invitation.role,
      customRoleId: invitation.customRoleId,
      customRoleName: invitation.customRole?.name || null,
    },
  });

  // 8. Deliver Email Notification
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rivo-web-sand.vercel.app';
  const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;

  const emailResult = await sendStaffInvitationEmail({
    to: trimmedEmail,
    schoolName: invitation.school?.name || 'Rivo School',
    role: invitation.customRole?.name || invitation.role,
    inviteUrl,
    schoolId,
    invitedById: userId,
    ipAddress: ip,
    userAgent,
  });

  return {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      customRoleId: invitation.customRoleId,
      customRoleName: invitation.customRole?.name || null,
      expiresAt: invitation.expiresAt.toISOString(),
    },
    inviteToken: rawToken,
    inviteUrl: `/invite/accept?token=${rawToken}`,
    emailDelivered: emailResult.success,
    emailError: emailResult.error || null,
  };
}

// POST /api/invitations - Create single or bulk staff invitations
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, {
      roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'PLATFORM_ADMIN'],
    });
    if (!auth.authorized) return auth.response;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    // Rate limit check
    const rateLimit = await invitationRateLimiter.consume(`${auth.schoolId}:${auth.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many invitations issued. Please wait before creating more.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Support Bulk Invitations if emails array is passed
    if (Array.isArray(body.emails) && body.emails.length > 0) {
      const results: Array<{ email: string; success: boolean; error?: string; invite?: any }> = [];

      for (const email of body.emails) {
        try {
          const outcome = await processInvitation(
            {
              email,
              role: body.role,
              customRoleId: body.customRoleId,
              campusId: body.campusId,
              department: body.department,
              designation: body.designation,
            },
            auth.schoolId,
            auth.userId,
            auth.role,
            ip,
            userAgent
          );
          results.push({ email, success: true, invite: outcome.invitation });
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      return NextResponse.json({
        success: true,
        message: `Processed ${body.emails.length} invitations (${successCount} successful, ${results.length - successCount} failed).`,
        results,
      });
    }

    // Single Invitation Path
    const outcome = await processInvitation(
      {
        email: body.email,
        role: body.role,
        customRoleId: body.customRoleId,
        campusId: body.campusId,
        department: body.department,
        designation: body.designation,
      },
      auth.schoolId,
      auth.userId,
      auth.role,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: outcome.emailDelivered
        ? `Invitation dispatched to ${body.email} via email.`
        : `Invitation created for ${body.email}. Activation link ready.`,
      ...outcome,
    });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to dispatch invitation.' },
      { status: 400 }
    );
  }
}

// GET /api/invitations - List invitations with filters, status, and custom role metadata
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'teachers.view' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const statusFilter = (searchParams.get('status') || 'PENDING').toUpperCase();
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search')?.trim();

    const now = new Date();
    const where: any = { schoolId: auth.schoolId };

    if (statusFilter === 'PENDING') {
      where.revokedAt = null;
      where.acceptedAt = null;
      where.expiresAt = { gt: now };
    } else if (statusFilter === 'ACCEPTED') {
      where.acceptedAt = { not: null };
    } else if (statusFilter === 'REVOKED') {
      where.revokedAt = { not: null };
    } else if (statusFilter === 'EXPIRED') {
      where.acceptedAt = null;
      where.revokedAt = null;
      where.expiresAt = { lte: now };
    }
    // If 'ALL', no status filter is applied

    if (roleFilter && roleFilter !== 'ALL') {
      where.OR = [
        { role: roleFilter },
        { customRoleId: roleFilter },
      ];
    }

    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const invitations = await prisma.staffInvitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: {
        customRole: {
          select: { id: true, name: true, code: true, baseRole: true },
        },
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const mapped = invitations.map((inv) => {
      let status = 'PENDING';
      if (inv.acceptedAt) status = 'ACCEPTED';
      else if (inv.revokedAt) status = 'REVOKED';
      else if (inv.expiresAt <= now) status = 'EXPIRED';

      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        customRoleId: inv.customRoleId,
        customRoleName: inv.customRole?.name || null,
        displayRole: inv.customRole ? `${inv.customRole.name} (${inv.role})` : inv.role,
        department: inv.department,
        designation: inv.designation,
        status,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
        revokedAt: inv.revokedAt ? inv.revokedAt.toISOString() : null,
        invitedBy: inv.invitedBy
          ? {
              firstName: inv.invitedBy.firstName,
              lastName: inv.invitedBy.lastName,
              email: inv.invitedBy.email,
            }
          : null,
      };
    });

    return NextResponse.json({ invitations: mapped });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
