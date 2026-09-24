import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';

// Default period definitions template
const DEFAULT_PERIODS = [
  { periodNumber: 1, name: 'Period 1', type: 'TEACHING' as const, startTime: '08:00', endTime: '08:45', durationMinutes: 45 },
  { periodNumber: 2, name: 'Period 2', type: 'TEACHING' as const, startTime: '08:45', endTime: '09:30', durationMinutes: 45 },
  { periodNumber: 3, name: 'Period 3', type: 'TEACHING' as const, startTime: '09:30', endTime: '10:15', durationMinutes: 45 },
  { periodNumber: 4, name: 'Morning Break', type: 'BREAK' as const, startTime: '10:15', endTime: '10:35', durationMinutes: 20 },
  { periodNumber: 5, name: 'Period 4', type: 'TEACHING' as const, startTime: '10:35', endTime: '11:20', durationMinutes: 45 },
  { periodNumber: 6, name: 'Period 5', type: 'TEACHING' as const, startTime: '11:20', endTime: '12:05', durationMinutes: 45 },
  { periodNumber: 7, name: 'Lunch Break', type: 'LUNCH' as const, startTime: '12:05', endTime: '12:45', durationMinutes: 40 },
  { periodNumber: 8, name: 'Period 6', type: 'TEACHING' as const, startTime: '12:45', endTime: '13:30', durationMinutes: 45 },
  { periodNumber: 9, name: 'Period 7', type: 'TEACHING' as const, startTime: '13:30', endTime: '14:15', durationMinutes: 45 },
  { periodNumber: 10, name: 'Period 8', type: 'TEACHING' as const, startTime: '14:15', endTime: '15:00', durationMinutes: 45 },
];

// GET /api/timetable/config - Retrieve bell schedule & period definitions
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'school_timetable.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const academicSessionId = searchParams.get('academicSessionId');
    const campusId = searchParams.get('campusId');

    let targetSessionId: string | null = academicSessionId || null;
    if (!targetSessionId || targetSessionId === 'ALL') {
      const activeSession = await prisma.academicSession.findFirst({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
      });
      targetSessionId = activeSession ? activeSession.id : null;
    }

    if (!targetSessionId) {
      return NextResponse.json({ message: 'No active academic session found' }, { status: 400 });
    }

    // Find or create default config
    let config = await prisma.timetableConfig.findFirst({
      where: {
        schoolId: auth.schoolId,
        academicSessionId: targetSessionId,
        ...(campusId && campusId !== 'ALL' ? { campusId } : {}),
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });

    if (!config) {
      // Seed default config for this academic session
      config = await prisma.timetableConfig.create({
        data: {
          schoolId: auth.schoolId,
          academicSessionId: targetSessionId,
          campusId: campusId && campusId !== 'ALL' ? campusId : null,
          name: 'Standard Daily Bell Schedule',
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
          isDefault: true,
          periods: {
            create: DEFAULT_PERIODS,
          },
        },
        include: {
          periods: {
            orderBy: { periodNumber: 'asc' },
          },
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in GET /api/timetable/config:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timetable/config - Update or customize period definitions and timings
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'school_timetable.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      configId,
      academicSessionId,
      campusId,
      name,
      workingDays,
      periods,
    } = body;

    let targetSessionId: string | null = academicSessionId || null;
    if (!targetSessionId) {
      const activeSession = await prisma.academicSession.findFirst({
        where: { schoolId: auth.schoolId, status: 'ACTIVE' },
      });
      targetSessionId = activeSession ? activeSession.id : null;
    }

    if (!targetSessionId) {
      return NextResponse.json({ message: 'Active academic session required' }, { status: 400 });
    }

    const updatedConfig = await prisma.$transaction(async (tx) => {
      let currentConfig;
      if (configId) {
        currentConfig = await tx.timetableConfig.findFirst({
          where: { id: configId, schoolId: auth.schoolId },
        });
      }

      if (!currentConfig) {
        currentConfig = await tx.timetableConfig.create({
          data: {
            schoolId: auth.schoolId,
            academicSessionId: targetSessionId,
            campusId: campusId || null,
            name: name || 'Standard Daily Bell Schedule',
            workingDays: workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
            isDefault: true,
          },
        });
      } else {
        currentConfig = await tx.timetableConfig.update({
          where: { id: currentConfig.id },
          data: {
            name: name || currentConfig.name,
            workingDays: workingDays || currentConfig.workingDays,
            campusId: campusId !== undefined ? campusId : currentConfig.campusId,
          },
        });
      }

      // If periods provided, replace them atomically
      if (Array.isArray(periods) && periods.length > 0) {
        await tx.periodDefinition.deleteMany({
          where: { configId: currentConfig.id },
        });

        await tx.periodDefinition.createMany({
          data: periods.map((p: any, idx: number) => ({
            configId: currentConfig.id,
            periodNumber: p.periodNumber || idx + 1,
            name: p.name || `Period ${idx + 1}`,
            type: p.type || 'TEACHING',
            startTime: p.startTime || '08:00',
            endTime: p.endTime || '08:45',
            durationMinutes: p.durationMinutes || null,
          })),
        });
      }

      return tx.timetableConfig.findUnique({
        where: { id: currentConfig.id },
        include: {
          periods: {
            orderBy: { periodNumber: 'asc' },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable configuration updated.',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error in POST /api/timetable/config:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
