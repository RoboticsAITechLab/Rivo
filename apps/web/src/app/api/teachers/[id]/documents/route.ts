import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

const VALID_TEACHER_DOC_TYPES = [
  'RESUME',
  'DEGREE_CERTIFICATE',
  'ID_PROOF',
  'EXPERIENCE_LETTER',
  'CONTRACT',
  'CERTIFICATION',
  'OTHER',
];

// GET /api/teachers/[id]/documents - List teacher documents with dynamic, short-lived signed access URLs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.view' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const storageService = getMediaStorageService();

    // Generate short-lived signed URLs (15 min TTL) for authorized client consumption
    const documentsWithUrls = await Promise.all(
      teacher.documents.map(async (doc) => {
        let accessUrl = doc.fileUrl;
        if (doc.fileUrl && doc.fileUrl.startsWith('schools/')) {
          try {
            accessUrl = await storageService.getSignedUrl(doc.fileUrl, 900);
          } catch {
            // Keep original if signed URL generation fails
          }
        }
        return {
          id: doc.id,
          teacherId: doc.teacherId,
          documentType: doc.documentType,
          title: doc.title,
          accessUrl,
          fileUrl: accessUrl,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithUrls,
    });
  } catch (error: any) {
    console.error('[TEACHER_DOCUMENTS_GET_ERROR] Error fetching teacher documents:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers/[id]/documents - Upload private teacher document to Azure Blob Storage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req, { permission: 'teachers.edit' });
    if (!auth.authorized) {
      return auth.response;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: auth.schoolId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'OTHER';
    const title = (formData.get('title') as string) || file?.name || 'Faculty Document';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!VALID_TEACHER_DOC_TYPES.includes(documentType)) {
      return NextResponse.json(
        { message: `Invalid document type. Allowed: ${VALID_TEACHER_DOC_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getMediaStorageService();

    const uploadResult = await storageService.upload({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      schoolId: auth.schoolId,
      category: 'teachers',
      entityId: teacher.id,
      subCategory: documentType.toLowerCase(),
      scope: 'private',
    });

    // Store canonical storage key in database
    const document = await prisma.teacherDocument.create({
      data: {
        teacherId: teacher.id,
        documentType,
        title,
        fileUrl: uploadResult.storageKey,
        fileName: file.name,
        fileSize: file.size.toString(),
        status: 'VERIFIED',
      },
    });

    // Generate signed download URL for immediate response
    const signedUrl = await storageService.getSignedUrl(uploadResult.storageKey, 900);

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully.',
      document: {
        id: document.id,
        documentType: document.documentType,
        title: document.title,
        accessUrl: signedUrl,
        fileUrl: signedUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[TEACHER_DOCUMENT_UPLOAD_ERROR] Error uploading document:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}
