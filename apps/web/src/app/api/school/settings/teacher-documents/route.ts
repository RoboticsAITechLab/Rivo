import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { STANDARD_TEACHER_DOCUMENTS } from '@/lib/teachers/document-catalog';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const setting = await prisma.schoolSetting.findUnique({
      where: {
        schoolId_category: {
          schoolId: auth.schoolId,
          category: 'TEACHER_DOCUMENTS',
        },
      },
    });

    const val = (setting?.value as any) || {};
    const requiredDocumentTypes: string[] = Array.isArray(val.requiredDocumentTypes)
      ? val.requiredDocumentTypes
      : STANDARD_TEACHER_DOCUMENTS.filter((d) => d.defaultRequired).map((d) => d.code);

    const customDocumentTypes: any[] = Array.isArray(val.customDocumentTypes)
      ? val.customDocumentTypes
      : [];

    const expiryWarningDays: number = typeof val.expiryWarningDays === 'number' ? val.expiryWarningDays : 30;

    return NextResponse.json({
      requiredDocumentTypes,
      customDocumentTypes,
      expiryWarningDays,
      catalog: STANDARD_TEACHER_DOCUMENTS,
    });
  } catch (error: any) {
    console.error('[TEACHER_DOC_SETTINGS_GET_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { requiredDocumentTypes, customDocumentTypes, expiryWarningDays } = body;

    const payload = {
      requiredDocumentTypes: Array.isArray(requiredDocumentTypes) ? requiredDocumentTypes : [],
      customDocumentTypes: Array.isArray(customDocumentTypes) ? customDocumentTypes : [],
      expiryWarningDays: typeof expiryWarningDays === 'number' ? expiryWarningDays : 30,
    };

    const setting = await prisma.schoolSetting.upsert({
      where: {
        schoolId_category: {
          schoolId: auth.schoolId,
          category: 'TEACHER_DOCUMENTS',
        },
      },
      update: {
        value: payload,
        updatedById: auth.userId,
      },
      create: {
        schoolId: auth.schoolId,
        category: 'TEACHER_DOCUMENTS',
        value: payload,
        updatedById: auth.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher document requirements updated successfully.',
      setting: setting.value,
    });
  } catch (error: any) {
    console.error('[TEACHER_DOC_SETTINGS_PUT_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
