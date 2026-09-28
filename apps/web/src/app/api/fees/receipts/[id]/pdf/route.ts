import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorize';
import { getReceiptPrintData } from '@/lib/fees/fee-payment-service';
import { generateReceiptPdfBuffer } from '@/lib/fees/fee-pdf-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { permission: 'fees.receipt_view' });
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const receipt = await getReceiptPrintData(auth.schoolId, id);

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt record not found.' }, { status: 404 });
    }

    // Extract authoritative historical snapshot from the frozen JSON fields
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
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to generate receipt PDF' },
      { status: 500 }
    );
  }
}
