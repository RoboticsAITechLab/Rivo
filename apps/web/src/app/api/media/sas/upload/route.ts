import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService, MediaCategory, StorageScope } from '@/lib/storage';
import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_DOCUMENT_MIME_TYPES } from '@/lib/storage/validation';
import crypto from 'crypto';

// POST /api/media/sas/upload - Generates short-lived, write-only SAS URL for direct browser-to-Azure-Blob upload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { category, entityId, subCategory, mimeType, scope } = body;

    // Validate category
    const validCategories: MediaCategory[] = [
      'teachers',
      'students',
      'parents',
      'staff',
      'branding',
      'documents',
    ];

    if (!category || !validCategories.includes(category as MediaCategory)) {
      return NextResponse.json(
        { message: `Invalid or missing media category. Allowed: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const mediaCategory = category as MediaCategory;

    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json(
        { message: 'Valid mimeType is required.' },
        { status: 400 }
      );
    }

    const normalizedMime = mimeType.trim().toLowerCase();
    const isDoc = mediaCategory === 'documents';
    const allowedMimes = isDoc ? ALLOWED_DOCUMENT_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;

    if (!allowedMimes.includes(normalizedMime)) {
      return NextResponse.json(
        { message: `Unsupported file format '${normalizedMime}'. Allowed: ${allowedMimes.join(', ')}` },
        { status: 415 }
      );
    }

    // Determine and enforce scope
    const determinedScope: StorageScope = mediaCategory === 'branding' && scope === 'public' ? 'public' : 'private';

    // Map permissions by category
    const permissionMap: Record<MediaCategory, string> = {
      teachers: 'teachers.edit',
      students: 'students.edit',
      parents: 'students.edit',
      staff: 'teachers.edit',
      branding: 'school.manage',
      documents: 'students.edit',
    };

    // If student admission intake (entityId begins with 'intake_'), require students.create instead of students.edit
    const requiredPermission =
      mediaCategory === 'students' && typeof entityId === 'string' && entityId.startsWith('intake_')
        ? 'students.create'
        : permissionMap[mediaCategory] || 'students.view';

    const auth = await requireAuth(req, { permission: requiredPermission });
    if (!auth.authorized) {
      return auth.response;
    }

    // Safe entity identifier (generate one if intake or missing)
    const sanitizedEntityId =
      typeof entityId === 'string' && entityId.trim().length > 0
        ? entityId.replace(/[^a-zA-Z0-9_-]/g, '')
        : `intake_${crypto.randomBytes(8).toString('hex')}`;

    const storageService = getMediaStorageService();

    const sasResult = await storageService.generateDirectUploadSas({
      schoolId: auth.schoolId,
      category: mediaCategory,
      entityId: sanitizedEntityId,
      subCategory: typeof subCategory === 'string' ? subCategory : undefined,
      mimeType: normalizedMime,
      scope: determinedScope,
      expiresInSeconds: 900, // 15-minute window
    });

    return NextResponse.json({
      success: true,
      storageKey: sasResult.storageKey,
      uploadUrl: sasResult.uploadUrl,
      scope: sasResult.scope,
      expiresAt: sasResult.expiresAt,
      maxSizeBytes: sasResult.maxSizeBytes,
    });
  } catch (error: any) {
    console.error('[MEDIA_SAS_UPLOAD_ERROR] Error generating upload SAS:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to generate upload authorization' },
      { status: 500 }
    );
  }
}
