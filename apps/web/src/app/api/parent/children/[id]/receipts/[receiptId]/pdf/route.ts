import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { prisma } from '@/lib/prisma';
import { getReceiptPrintData } from '@/lib/fees/fee-payment-service';
import { generateReceiptPdfBuffer } from '@/lib/fees/fee-pdf-service';
import { getFeeSettings } from '@/lib/settings/settings-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; receiptId: string }> }
) {
  const auth = await requireAuth(req, {
    roles: ['PARENT'],
  });
  if (!auth.authorized) return auth.response;

  try {
    const { id: studentId, receiptId } = await context.params;

    if (!studentId || !receiptId) {
      return NextResponse.json({ message: 'Student ID and Receipt ID are required.' }, { status: 400 });
    }

    // 1. Verify parent profile
    const parent = await prisma.parent.findFirst({
      where: {
        schoolId: auth.schoolId,
        userId: auth.userId,
      },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent profile not found.' }, { status: 403 });
    }

    // 2. Strict Child Ownership Verification
    const parentStudent = await prisma.parentStudent.findFirst({
      where: {
        parentId: parent.id,
        studentId,
      },
    });

    if (!parentStudent) {
      return NextResponse.json(
        { message: 'Access denied: You are not authorized to access records for this student.' },
        { status: 403 }
      );
    }

    // 3. Verify receipt belongs to this school and linked student
    const receiptRecord = await prisma.feeReceipt.findFirst({
      where: {
        id: receiptId,
        schoolId: auth.schoolId,
        studentId,
      },
    });

    if (!receiptRecord) {
      return NextResponse.json(
        { message: 'Receipt record not found or does not belong to this student.' },
        { status: 404 }
      );
    }

    // 4. Retrieve complete print data and fee settings
    const [receipt, feeSettings] = await Promise.all([
      getReceiptPrintData(auth.schoolId, receiptId),
      getFeeSettings(auth.schoolId).catch(() => null),
    ]);

    const studentSnap: any = receipt.studentSnapshot || {};
    const allocSnap: any[] = (receipt.allocationSnapshot as any[]) || [];

    const studentFullName =
      studentSnap.name ||
      `${studentSnap.firstName || ''} ${studentSnap.lastName || ''}`.trim() ||
      'Student';

    const pdfBuffer = await generateReceiptPdfBuffer({
      schoolName: receipt.school?.name || 'Rivo Institutional Partner',
      schoolAddress: receipt.school?.address,
      schoolPhone: receipt.school?.phone,
      schoolEmail: receipt.school?.email,
      receiptNumber: receipt.receiptNumber,
      paymentNumber: receipt.payment?.paymentNumber || 'N/A',
      receiptDate: receipt.receiptDate,
      paymentMode: receipt.paymentMode,
      referenceNumber: receipt.referenceNumber,
      status: receipt.status as 'ISSUED' | 'CANCELLED',
      studentName: studentFullName,
      admissionNumber: studentSnap.admissionNumber || 'N/A',
      className: studentSnap.className,
      sectionName: studentSnap.sectionName,
      rollNumber: studentSnap.rollNumber,
      fatherName: studentSnap.fatherName,
      campusName: studentSnap.campusName,
      allocations: allocSnap.map((a: any) => ({
        title: a.obligationTitle || a.title || 'Scheduled Installment',
        amount: Number(a.allocatedAmount || a.amount || 0),
      })),
      totalPaid: Number(receipt.totalPaid),
      issuedByName: receipt.issuedByUser
        ? `${(receipt as any).issuedByUser.firstName || ''} ${(receipt as any).issuedByUser.lastName || ''}`.trim()
        : undefined,
      footerNote: feeSettings?.receiptFooterNote,
    });

    const sanitizedReceiptNumber = receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedReceiptNumber}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating parent receipt PDF:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to generate receipt PDF' },
      { status: 500 }
    );
  }
}
