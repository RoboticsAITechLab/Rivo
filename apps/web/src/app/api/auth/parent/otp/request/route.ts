import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, normalizeEmail } from '@/lib/auth/normalize';
import { requestOtp } from '@/lib/auth/otp';

// POST /api/auth/parent/otp/request - Request OTP for phone or email login
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    const body = await req.json().catch(() => ({}));
    const { phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { message: 'Please provide either a phone number or email address.' },
        { status: 400 }
      );
    }

    let identifier: string | null = null;
    let type: 'PHONE' | 'EMAIL' = 'PHONE';

    if (phone) {
      identifier = normalizePhone(phone);
      type = 'PHONE';
      if (!identifier) {
        return NextResponse.json(
          { message: 'Invalid phone number format. Please enter a valid 10-digit mobile number.' },
          { status: 400 }
        );
      }
    } else if (email) {
      identifier = normalizeEmail(email);
      type = 'EMAIL';
      if (!identifier) {
        return NextResponse.json(
          { message: 'Invalid email address format.' },
          { status: 400 }
        );
      }
    }

    if (!identifier) {
      return NextResponse.json({ message: 'Invalid identifier.' }, { status: 400 });
    }

    // Check if an eligible parent account exists
    let eligibleUser: { id: string } | null = null;

    if (type === 'PHONE') {
      // 1. Direct user lookup by phone
      let user = await prisma.user.findFirst({
        where: {
          phone: identifier,
          isActive: true,
          status: 'ACTIVE',
          memberships: {
            some: { role: 'PARENT', status: 'ACTIVE' },
          },
        },
        select: { id: true },
      });

      // 2. If not found in User, check if Parent profile exists with this phone in school
      if (!user) {
        const parentRecord = await prisma.parent.findFirst({
          where: {
            phone: identifier,
          },
          include: {
            user: {
              include: {
                memberships: {
                  where: { role: 'PARENT', status: 'ACTIVE' },
                },
              },
            },
          },
        });

        if (parentRecord) {
          if (parentRecord.user && parentRecord.user.isActive) {
            user = { id: parentRecord.user.id };
          } else if (!parentRecord.userId) {
            // Provision user account for this school-created parent
            const newUser = await prisma.user.create({
              data: {
                firstName: parentRecord.firstName,
                lastName: parentRecord.lastName,
                phone: identifier,
                status: 'ACTIVE',
                isActive: true,
                memberships: {
                  create: {
                    schoolId: parentRecord.schoolId,
                    role: 'PARENT',
                    status: 'ACTIVE',
                  },
                },
              },
            });

            await prisma.parent.update({
              where: { id: parentRecord.id },
              data: { userId: newUser.id },
            });

            user = { id: newUser.id };
          }
        }
      }

      eligibleUser = user;
    } else {
      // Direct user lookup by email
      let user = await prisma.user.findFirst({
        where: {
          email: identifier,
          isActive: true,
          status: 'ACTIVE',
          memberships: {
            some: { role: 'PARENT', status: 'ACTIVE' },
          },
        },
        select: { id: true },
      });

      if (!user) {
        const parentRecord = await prisma.parent.findFirst({
          where: {
            email: identifier,
          },
          include: {
            user: {
              include: {
                memberships: {
                  where: { role: 'PARENT', status: 'ACTIVE' },
                },
              },
            },
          },
        });

        if (parentRecord) {
          if (parentRecord.user && parentRecord.user.isActive) {
            user = { id: parentRecord.user.id };
          } else if (!parentRecord.userId) {
            // Provision user account for this school-created parent
            const newUser = await prisma.user.create({
              data: {
                firstName: parentRecord.firstName,
                lastName: parentRecord.lastName,
                email: identifier,
                status: 'ACTIVE',
                isActive: true,
                memberships: {
                  create: {
                    schoolId: parentRecord.schoolId,
                    role: 'PARENT',
                    status: 'ACTIVE',
                  },
                },
              },
            });

            await prisma.parent.update({
              where: { id: parentRecord.id },
              data: { userId: newUser.id },
            });

            user = { id: newUser.id };
          }
        }
      }

      eligibleUser = user;
    }

    // Account enumeration safe response:
    // If eligible user was found, send real OTP
    if (eligibleUser) {
      const result = await requestOtp({
        identifier,
        type,
        ipAddress: ip,
        userAgent,
      });

      if (!result.success && result.cooldownSeconds) {
        return NextResponse.json(
          { message: result.message, cooldownSeconds: result.cooldownSeconds },
          { status: 429 }
        );
      }
    }

    // Always return a uniform response regardless of account existence
    return NextResponse.json({
      success: true,
      message: 'If an eligible parent account was found, a verification code has been sent.',
      identifier: identifier.slice(0, 4) + '••••' + identifier.slice(-2),
      cooldownSeconds: 60,
    });
  } catch (error) {
    console.error('Error in POST /api/auth/parent/otp/request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
