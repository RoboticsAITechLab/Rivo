import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { normalizePhone, normalizeEmail } from '@/lib/auth/normalize';

// GET /api/parents - List, search, and paginate parents in current school
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ParentWhereInput = {
      schoolId: auth.schoolId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, parents] = await Promise.all([
      prisma.parent.count({ where }),
      prisma.parent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          parentStudents: {
            include: {
              student: {
                select: {
                  id: true,
                  admissionNumber: true,
                  firstName: true,
                  lastName: true,
                  status: true,
                  enrollments: {
                    where: { status: 'ACTIVE' },
                    include: { class: true, section: true },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
        },
      }),
    ]);

    const formatted = parents.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      name: `${p.firstName} ${p.lastName}`.trim(),
      phone: p.phone,
      email: p.email,
      hasUserAccount: !!p.userId,
      isAccountActive: p.user?.isActive ?? false,
      lastLoginAt: p.user?.lastLoginAt?.toISOString() || null,
      children: p.parentStudents.map((ps) => {
        const enr = ps.student.enrollments[0];
        return {
          id: ps.student.id,
          admissionNumber: ps.student.admissionNumber,
          name: `${ps.student.firstName} ${ps.student.lastName}`.trim(),
          className: enr?.class?.name || 'Unassigned',
          sectionName: enr?.section?.name || 'A',
          relationship: ps.relationshipType,
          isPrimaryContact: ps.isPrimaryContact,
        };
      }),
    }));

    return NextResponse.json({
      parents: formatted,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/parents:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/parents - Create or link parent identity in current school
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => ({}));
    const {
      firstName,
      lastName,
      phone,
      email,
      studentId,
      relationshipType,
      isPrimaryContact,
    } = body;

    if (!firstName || (!phone && !email)) {
      return NextResponse.json(
        { message: 'First name and at least one contact method (phone or email) are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);

    if (phone && !normalizedPhone) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }
    if (email && !normalizedEmail) {
      return NextResponse.json({ message: 'Invalid email address format.' }, { status: 400 });
    }

    // If studentId provided, verify student belongs to this school
    if (studentId) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, schoolId: auth.schoolId },
      });
      if (!student) {
        return NextResponse.json({ message: 'Target student not found in this school.' }, { status: 404 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if parent already exists in this school by phone or email
      let existingParent = await tx.parent.findFirst({
        where: {
          schoolId: auth.schoolId,
          OR: [
            ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ],
        },
      });

      let parentId = existingParent?.id;

      if (existingParent) {
        // Identity Conflict Detection (Prompt Section 8):
        const existingFullName = `${existingParent.firstName} ${existingParent.lastName}`.trim().toLowerCase();
        const incomingFullName = `${firstName.trim()} ${(lastName || '').trim()}`.trim().toLowerCase();
        const namesMatch = existingFullName === incomingFullName ||
          existingParent.firstName.toLowerCase() === firstName.trim().toLowerCase();

        if (!namesMatch && !body.confirmLinkExistingParent) {
          throw new Error(
            `Contact "${normalizedPhone || normalizedEmail}" is already registered to parent "${existingParent.firstName} ${existingParent.lastName}". To link to this existing parent, confirm linking.`
          );
        }
      } else {
        // Create new Parent profile in school
        const newParent = await tx.parent.create({
          data: {
            schoolId: auth.schoolId,
            firstName: firstName.trim(),
            lastName: (lastName || '').trim(),
            phone: normalizedPhone,
            email: normalizedEmail,
          },
        });
        parentId = newParent.id;
        existingParent = newParent;
      }

      // 2. Ensure linked User account and SchoolMembership exists
      let userId = existingParent.userId;

      if (!userId) {
        // Check if user account already exists with phone or email
        let existingUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
              ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
          },
        });

        if (!existingUser) {
          existingUser = await tx.user.create({
            data: {
              firstName: firstName.trim(),
              lastName: (lastName || '').trim(),
              phone: normalizedPhone,
              email: normalizedEmail,
              status: 'ACTIVE',
              isActive: true,
            },
          });
        }

        userId = existingUser.id;

        // Link User to Parent profile
        await tx.parent.update({
          where: { id: parentId },
          data: { userId },
        });

        // Ensure active SchoolMembership(role=PARENT) exists
        const existingMembership = await tx.schoolMembership.findUnique({
          where: {
            userId_schoolId: {
              userId,
              schoolId: auth.schoolId,
            },
          },
        });

        if (!existingMembership) {
          await tx.schoolMembership.create({
            data: {
              userId,
              schoolId: auth.schoolId,
              role: 'PARENT',
              status: 'ACTIVE',
            },
          });
        }
      }

      // 3. Link Student if studentId provided
      if (studentId && parentId) {
        const existingLink = await tx.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId,
              studentId,
            },
          },
        });

        if (!existingLink) {
          await tx.parentStudent.create({
            data: {
              parentId,
              studentId,
              relationshipType: relationshipType || 'GUARDIAN',
              isPrimaryContact: !!isPrimaryContact,
            },
          });
        }
      }

      return existingParent;
    });

    return NextResponse.json({
      success: true,
      message: 'Parent contact processed and synchronized successfully.',
      parent: result,
    });
  } catch (error) {
    console.error('Error in POST /api/parents:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
