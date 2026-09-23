import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/campuses/[id] - Get single campus detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'campuses.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const campus = await prisma.campus.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
          },
        },
      },
    });

    if (!campus) {
      return NextResponse.json({ message: 'Campus not found.' }, { status: 404 });
    }

    return NextResponse.json({
      campus: {
        id: campus.id,
        name: campus.name,
        code: campus.code || '',
        address: campus.address || '',
        city: campus.city || '',
        state: campus.state || '',
        phone: campus.phone || '',
        email: campus.email || '',
        isMain: campus.isMain,
        studentCount: campus._count.students,
        teacherCount: campus._count.teachers,
        createdAt: campus.createdAt.toISOString(),
        updatedAt: campus.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/campuses/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/campuses/[id] - Update an existing campus
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'campuses.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    // Verify ownership
    const existing = await prisma.campus.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Campus not found.' }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const code = body.code !== undefined ? body.code?.trim() || null : existing.code;
    const address = body.address !== undefined ? body.address?.trim() || null : existing.address;
    const city = body.city !== undefined ? body.city?.trim() || null : existing.city;
    const state = body.state !== undefined ? body.state?.trim() || null : existing.state;
    const phone = body.phone !== undefined ? body.phone?.trim() || null : existing.phone;
    const email = body.email !== undefined ? body.email?.trim() || null : existing.email;
    const isMain = body.isMain !== undefined ? Boolean(body.isMain) : existing.isMain;

    if (!name) {
      return NextResponse.json({ message: 'Campus name cannot be empty.' }, { status: 400 });
    }

    // If name changed, verify school-scoped uniqueness
    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.campus.findUnique({
        where: {
          schoolId_name: {
            schoolId: auth.schoolId,
            name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: `Campus with name "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    // If toggled as main, unmark any previous main campus
    if (isMain && !existing.isMain) {
      await prisma.campus.updateMany({
        where: { schoolId: auth.schoolId, isMain: true },
        data: { isMain: false },
      });
    }

    const updated = await prisma.campus.update({
      where: { id: existing.id },
      data: {
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

    return NextResponse.json({ campus: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/campuses/[id]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Campus with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campuses/[id] - Delete or archive campus
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'campuses.archive' });
    if (!auth.authorized) {
      return auth.response;
    }

    const existing = await prisma.campus.findFirst({
      where: {
        id,
        schoolId: auth.schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Campus not found.' }, { status: 404 });
    }

    if (existing._count.students > 0 || existing._count.teachers > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete campus with active records (${existing._count.students} students, ${existing._count.teachers} teachers). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.campus.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Campus deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/campuses/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
