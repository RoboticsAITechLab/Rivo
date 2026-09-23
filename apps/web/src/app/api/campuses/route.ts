import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/campuses - List all campuses for the authenticated school
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'campuses.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: Prisma.CampusWhereInput = {
      schoolId: auth.schoolId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const campuses = await prisma.campus.findMany({
      where,
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
          },
        },
      },
    });

    const formatted = campuses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      phone: c.phone || '',
      email: c.email || '',
      isMain: c.isMain,
      studentCount: c._count.students,
      teacherCount: c._count.teachers,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ campuses: formatted });
  } catch (error) {
    console.error('Error in GET /api/campuses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/campuses - Create a new campus
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'campuses.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const name = body.name?.trim();
    const code = body.code?.trim() || null;
    const address = body.address?.trim() || null;
    const city = body.city?.trim() || null;
    const state = body.state?.trim() || null;
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const isMain = Boolean(body.isMain);

    if (!name) {
      return NextResponse.json({ message: 'Campus name is required.' }, { status: 400 });
    }

    // Check duplicate name within school
    const existing = await prisma.campus.findUnique({
      where: {
        schoolId_name: {
          schoolId: auth.schoolId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Campus with name "${name}" already exists.` },
        { status: 409 }
      );
    }

    // If setting as main campus, clear previous main campus flag
    if (isMain) {
      await prisma.campus.updateMany({
        where: { schoolId: auth.schoolId, isMain: true },
        data: { isMain: false },
      });
    }

    const campus = await prisma.campus.create({
      data: {
        schoolId: auth.schoolId,
        name,
        code,
        address,
        city,
        state,
        phone,
        email,
        isMain,
      },
    });

    return NextResponse.json({ campus }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/campuses:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Campus with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
