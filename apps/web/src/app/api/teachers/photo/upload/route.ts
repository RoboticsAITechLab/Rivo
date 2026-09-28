import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';
import crypto from 'crypto';

// POST /api/teachers/photo/upload - Upload teacher photo during onboarding/intake or editing
export async function POST(req: NextRequest) {
  try {
    let auth = await requireAuth(req, { permission: 'teachers.create' });
    if (!auth.authorized) {
      // Also allow if user has teachers.edit
      auth = await requireAuth(req, { permission: 'teachers.edit' });
      if (!auth.authorized) {
        return auth.response;
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getMediaStorageService();
    const tempEntityId = `tch_intake_${crypto.randomBytes(8).toString('hex')}`;

    const uploadResult = await storageService.upload({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      schoolId: auth.schoolId,
      category: 'teachers',
      entityId: tempEntityId,
      subCategory: 'profile',
      scope: 'private',
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher photo uploaded successfully.',
      photoUrl: uploadResult.url,
      storageKey: uploadResult.storageKey,
    });
  } catch (error: any) {
    console.error('[TEACHER_INTAKE_PHOTO_ERROR] Failed uploading teacher photo:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}
