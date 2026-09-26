import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

// POST /api/students/[id]/photo - Upload student profile photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const student = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getMediaStorageService();

    const uploadResult = await storageService.upload({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      schoolId: auth.schoolId,
      category: 'students',
      entityId: student.id,
      subCategory: 'profile',
      scope: 'private',
    });

    // Clean up old storage asset if it was stored via key
    if (student.photoUrl && student.photoUrl.startsWith('schools/')) {
      try {
        await storageService.delete(student.photoUrl);
      } catch {
        // Silently continue if old asset cleanup fails
      }
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { photoUrl: uploadResult.url },
    });

    return NextResponse.json({
      success: true,
      message: 'Student photo uploaded successfully.',
      photoUrl: updated.photoUrl,
    });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_UPLOAD_ERROR] Error uploading student photo:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}

// DELETE /api/students/[id]/photo - Remove student photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'students.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const student = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    if (student.photoUrl && student.photoUrl.startsWith('schools/')) {
      try {
        const storageService = getMediaStorageService();
        await storageService.delete(student.photoUrl);
      } catch (err: any) {
        console.warn('[STUDENT_PHOTO_DELETE_WARN] Failed to delete blob asset:', err.message);
      }
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { photoUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Student photo removed successfully.',
    });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_DELETE_ERROR] Error removing student photo:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
