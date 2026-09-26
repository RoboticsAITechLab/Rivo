import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';

const VALID_DOC_TYPES = [
  'BIRTH_CERTIFICATE',
  'PREVIOUS_MARKSHEET',
  'TRANSFER_CERTIFICATE',
  'MEDICAL_RECORD',
  'IDENTITY_PROOF',
  'OTHER',
];

// GET /api/students/[id]/documents - List student documents with dynamic, short-lived signed access URLs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const student = await prisma.student.findFirst({
      where: { id, schoolId: auth.schoolId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const storageService = getMediaStorageService();

    // Generate short-lived signed URLs (15 min TTL) for authorized client consumption
    const documentsWithUrls = await Promise.all(
      student.documents.map(async (doc) => {
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
          studentId: doc.studentId,
          documentType: doc.documentType,
          title: doc.title,
          accessUrl,
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
    console.error('[STUDENT_DOCUMENTS_GET_ERROR] Error fetching documents:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students/[id]/documents - Upload private student document
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
    const documentType = (formData.get('documentType') as string) || 'OTHER';
    const title = (formData.get('title') as string) || file?.name || 'Student Document';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json(
        { message: `Invalid document type. Allowed: ${VALID_DOC_TYPES.join(', ')}` },
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
      category: 'documents',
      entityId: student.id,
      subCategory: documentType.toLowerCase(),
      scope: 'private',
    });

    // Store canonical storage key in database
    const document = await prisma.studentDocument.create({
      data: {
        studentId: student.id,
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
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[STUDENT_DOCUMENT_UPLOAD_ERROR] Error uploading document:', error.message);
    const status = error.message?.includes('exceeds') ? 413 : error.message?.includes('format') ? 415 : 400;
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || status }
    );
  }
}
