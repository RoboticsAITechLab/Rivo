import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorize';
import { getMediaStorageService } from '@/lib/storage';
import {
  STANDARD_TEACHER_DOCUMENTS,
  calculateExpiryStatus,
  calculateDocumentChecklist,
  maskDocumentNumber,
} from '@/lib/teachers/document-catalog';
import { encryptSensitiveField, decryptSensitiveField } from '@/lib/security/encryption';

// GET /api/teachers/[id]/documents - List teacher legal, KYC, educational & employment documents with signed SAS URLs
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
          include: {
            verifiedBy: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: [{ isRequired: 'desc' }, { uploadedAt: 'desc' }],
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    // Role-based IDOR validation: If TEACHER role, must be own profile
    if (auth.role === 'TEACHER' && teacher.userId !== auth.userId) {
      return NextResponse.json(
        { message: 'Access denied. You may only access your own employment documents.' },
        { status: 403 }
      );
    }

    // Fetch school configured required documents if available
    const schoolSetting = await prisma.schoolSetting.findUnique({
      where: {
        schoolId_category: {
          schoolId: auth.schoolId,
          category: 'TEACHER_DOCUMENTS',
        },
      },
    });

    const settingValue = (schoolSetting?.value as any) || {};
    const requiredTypes: string[] = Array.isArray(settingValue.requiredDocumentTypes)
      ? settingValue.requiredDocumentTypes
      : STANDARD_TEACHER_DOCUMENTS.filter((d) => d.defaultRequired).map((d) => d.code);

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

        const expiryInfo = calculateExpiryStatus(doc.expiryDate);
        const rawDocumentNumber = decryptSensitiveField(doc.documentNumber);
        const maskedNum = maskDocumentNumber(doc.documentType, rawDocumentNumber);

        return {
          id: doc.id,
          teacherId: doc.teacherId,
          category: doc.category || 'KYC',
          documentType: doc.documentType,
          title: doc.title,
          documentNumberMasked: maskedNum,
          accessUrl,
          fileUrl: accessUrl,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: doc.status,
          isRequired: doc.isRequired,
          issueDate: doc.issueDate ? doc.issueDate.toISOString().split('T')[0] : null,
          expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : null,
          expiryStatus: expiryInfo.status,
          daysUntilExpiry: expiryInfo.daysRemaining,
          verifiedById: doc.verifiedById,
          verifiedByName: doc.verifiedBy ? `${doc.verifiedBy.firstName} ${doc.verifiedBy.lastName}`.trim() : null,
          verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : null,
          verificationNote: doc.verificationNote,
          rejectionReason: doc.rejectionReason,
          uploadedAt: doc.uploadedAt.toISOString(),
          updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : doc.uploadedAt.toISOString(),
        };
      })
    );

    // Calculate onboarding checklist progress
    const checklist = calculateDocumentChecklist(
      teacher.documents.map((d) => ({ documentType: d.documentType, status: d.status })),
      requiredTypes
    );

    return NextResponse.json({
      documents: documentsWithUrls,
      checklist,
      catalog: STANDARD_TEACHER_DOCUMENTS,
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

    // Role-based IDOR validation: If TEACHER role, can only upload to own profile
    if (auth.role === 'TEACHER' && teacher.userId !== auth.userId) {
      return NextResponse.json(
        { message: 'Access denied. You may only upload documents for your own profile.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || (formData.get('category') as string) || 'OTHER';
    const category = (formData.get('category') as string) || 'KYC';
    const title = (formData.get('title') as string) || file?.name || 'Faculty Document';
    const documentNumber = (formData.get('documentNumber') as string) || null;
    const issueDateStr = (formData.get('issueDate') as string) || null;
    const expiryDateStr = (formData.get('expiryDate') as string) || null;
    const isRequired = formData.get('isRequired') === 'true';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Size limit check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds maximum allowed limit of 10MB.' }, { status: 400 });
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

    // Store canonical storage key and metadata in database
    const document = await prisma.teacherDocument.create({
      data: {
        schoolId: auth.schoolId,
        teacherId: teacher.id,
        category,
        documentType,
        title,
        documentNumber: encryptSensitiveField(documentNumber),
        fileUrl: uploadResult.storageKey,
        storageKey: uploadResult.storageKey,
        fileName: file.name,
        fileSize: file.size.toString(),
        mimeType: file.type,
        status: 'UNDER_REVIEW',
        isRequired,
        issueDate: issueDateStr ? new Date(issueDateStr) : null,
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      },
    });

    // Sign temporary SAS URL for immediate UI display
    let signedUrl = uploadResult.storageKey;
    try {
      signedUrl = await storageService.getSignedUrl(uploadResult.storageKey, 900);
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher document uploaded successfully and queued for verification.',
      document: {
        id: document.id,
        teacherId: document.teacherId,
        category: document.category,
        documentType: document.documentType,
        title: document.title,
        documentNumberMasked: maskDocumentNumber(document.documentType, documentNumber),
        accessUrl: signedUrl,
        fileUrl: signedUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        isRequired: document.isRequired,
        issueDate: document.issueDate ? document.issueDate.toISOString().split('T')[0] : null,
        expiryDate: document.expiryDate ? document.expiryDate.toISOString().split('T')[0] : null,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[TEACHER_DOCUMENT_UPLOAD_ERROR] Error uploading teacher document:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
