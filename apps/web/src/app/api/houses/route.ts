import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getHouseSettings, updateSchoolSetting } from '@/lib/settings/settings-service';

// GET /api/houses - Return configured/active school houses for the tenant
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    if (auth.schoolId) {
      const houseSettings = await getHouseSettings(auth.schoolId);
      if (houseSettings?.houses && houseSettings.houses.length > 0) {
        return NextResponse.json({ houses: houseSettings.houses });
      }
    }

    // Query distinct houses from students registered in this school as fallback
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
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[index % colors.length];
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        code: name.slice(0, 3).toUpperCase(),
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

// POST /api/houses - Create a new house and persist to school settings
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'] });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional context required' }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, color, motto, status } = body;

    if (!name || !code) {
      return NextResponse.json({ message: 'House name and code are required' }, { status: 400 });
    }

    const current = await getHouseSettings(auth.schoolId);
    const existing = current.houses || [];

    const newHouse = {
      id: `house-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color: color || '#3b82f6',
      motto: motto?.trim() || '',
      status: status || 'ACTIVE',
    };

    const updatedHouses = [...existing, newHouse];
    await updateSchoolSetting(auth.schoolId, 'houses', { houses: updatedHouses });

    return NextResponse.json({ success: true, house: newHouse });
  } catch (error) {
    console.error('Error in POST /api/houses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/houses - Update entire house list or specific house
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER'] });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional context required' }, { status: 400 });
    }

    const body = await req.json();
    const { houses } = body;

    if (!Array.isArray(houses)) {
      return NextResponse.json({ message: 'Houses array required' }, { status: 400 });
    }

    await updateSchoolSetting(auth.schoolId, 'houses', { houses });

    return NextResponse.json({ success: true, houses });
  } catch (error) {
    console.error('Error in PUT /api/houses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
