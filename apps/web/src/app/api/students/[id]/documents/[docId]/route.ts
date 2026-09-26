import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

// GET /api/students/[id]/documents/[docId] - Retrieve single document with short-lived signed URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const student = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const doc = await prisma.studentDocument.findFirst({
      where: { id: docId, studentId: student.id },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    const storageService = getMediaStorageService();
    let accessUrl = doc.fileUrl;
    if (doc.fileUrl && doc.fileUrl.startsWith('schools/')) {
      accessUrl = await storageService.getSignedUrl(doc.fileUrl, 900);
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        documentType: doc.documentType,
        title: doc.title,
        accessUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        status: doc.status,
        uploadedAt: doc.uploadedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[DOCUMENT_FETCH_ERROR] Error fetching document:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/[id]/documents/[docId] - Delete student document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
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

    const doc = await prisma.studentDocument.findFirst({
      where: { id: docId, studentId: student.id },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Delete blob asset from cloud storage
    if (doc.fileUrl && doc.fileUrl.startsWith('schools/')) {
      try {
        const storageService = getMediaStorageService();
        await storageService.delete(doc.fileUrl);
      } catch (err: any) {
        console.warn('[DOCUMENT_DELETE_WARN] Failed deleting document blob:', err.message);
      }
    }

    await prisma.studentDocument.delete({
      where: { id: doc.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error: any) {
    console.error('[DOCUMENT_DELETE_ERROR] Error deleting document:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
