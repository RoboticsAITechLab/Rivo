import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

// POST /api/school/branding/logo - Upload school logo/crest
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.manage' });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: auth.schoolId },
    });

    if (!school) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No logo file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getMediaStorageService();

    const uploadResult = await storageService.upload({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      schoolId: auth.schoolId,
      category: 'branding',
      entityId: 'logo',
      subCategory: 'official',
      scope: 'public',
    });

    // Clean up old logo blob if applicable
    if (school.logoUrl && school.logoUrl.startsWith('schools/')) {
      try {
        await storageService.delete(school.logoUrl);
      } catch {
        // Continue safely
      }
    }

    // Persist URL to School record
    const updated = await prisma.school.update({
      where: { id: school.id },
      data: { logoUrl: uploadResult.url },
    });

    return NextResponse.json({
      success: true,
      message: 'School logo updated successfully.',
      logoUrl: updated.logoUrl,
      storageKey: uploadResult.storageKey,
    });
  } catch (error: any) {
    console.error('[SCHOOL_LOGO_UPLOAD_ERROR] Error uploading school logo:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}

// DELETE /api/school/branding/logo - Remove school logo
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { permission: 'settings.manage' });
    if (!auth.authorized) {
      return auth.response;
    }

    if (!auth.schoolId) {
      return NextResponse.json({ message: 'Institutional school context required' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: auth.schoolId },
    });

    if (!school) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    if (school.logoUrl && school.logoUrl.startsWith('schools/')) {
      try {
        const storageService = getMediaStorageService();
        await storageService.delete(school.logoUrl);
      } catch (err: any) {
        console.warn('[SCHOOL_LOGO_DELETE_WARN] Failed deleting logo blob:', err.message);
      }
    }

    await prisma.school.update({
      where: { id: school.id },
      data: { logoUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: 'School logo removed successfully.',
    });
  } catch (error: any) {
    console.error('[SCHOOL_LOGO_DELETE_ERROR] Error removing school logo:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
