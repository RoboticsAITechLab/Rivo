import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const doc = await prisma.teacherDocument.findFirst({
      where: {
        id: docId,
        teacherId: id,
        teacher: { schoolId: auth.schoolId },
      },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Clean up from Azure storage if storageKey
    if (doc.fileUrl && doc.fileUrl.startsWith('schools/')) {
      try {
        const storageService = getMediaStorageService();
        await storageService.delete(doc.fileUrl);
      } catch (storageErr) {
        console.warn('Failed to delete teacher document from storage:', storageErr);
      }
    }

    await prisma.teacherDocument.delete({
      where: { id: doc.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting teacher document:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
