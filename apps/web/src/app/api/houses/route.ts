import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// GET /api/houses - Return configured/active school houses for the tenant
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    // Query distinct houses from students registered in this school
    const distinctHouses = await prisma.student.findMany({
      where: {
        schoolId: auth.schoolId,
        house: { not: null },
      },
      distinct: ['house'],
      select: { house: true },
    });

    const houseNames = distinctHouses
      .map((d) => d.house?.trim())
      .filter((h): h is string => Boolean(h));

    // Map to SchoolHouse objects
    const houses = houseNames.map((name, index) => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[index % colors.length];
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        color,
        motto: 'Strive for Excellence',
        status: 'ACTIVE' as const,
      };
    });

    return NextResponse.json({ houses });
  } catch (error) {
    console.error('Error in GET /api/houses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
