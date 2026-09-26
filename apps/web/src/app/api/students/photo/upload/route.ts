import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';
import crypto from 'crypto';

// POST /api/students/photo/upload - Upload student photo during admission intake
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'students.create' });
    if (!auth.authorized) {
      return auth.response;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getMediaStorageService();
    const tempEntityId = `intake_${crypto.randomBytes(8).toString('hex')}`;

    const uploadResult = await storageService.upload({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      schoolId: auth.schoolId,
      category: 'students',
      entityId: tempEntityId,
      subCategory: 'profile',
      scope: 'private',
    });

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully.',
      photoUrl: uploadResult.url,
      storageKey: uploadResult.storageKey,
    });
  } catch (error: any) {
    console.error('[STUDENT_INTAKE_PHOTO_ERROR] Failed uploading intake photo:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}
