import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const terms = await prisma.examTerm.findMany({
      where: { schoolId: auth.schoolId },
      include: {
        academicSession: { select: { id: true, name: true } },
        papers: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ terms });
  } catch (error: any) {
    console.error('Error fetching exam terms for results:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch exam terms' },
      { status: 500 }
    );
  }
}
