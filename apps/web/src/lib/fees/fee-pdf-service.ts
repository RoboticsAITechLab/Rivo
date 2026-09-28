import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ReceiptPdfData {
  schoolName: string;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolEmail?: string | null;
  receiptNumber: string;
  paymentNumber: string;
  receiptDate: Date | string;
  paymentMode: string;
  referenceNumber?: string | null;
  status: 'ISSUED' | 'CANCELLED';
  studentName: string;
  admissionNumber: string;
  className?: string | null;
  sectionName?: string | null;
  rollNumber?: string | null;
  fatherName?: string | null;
  campusName?: string | null;
  allocations: Array<{
    title: string;
    amount: number;
  }>;
  totalPaid: number;
  issuedByName?: string | null;
}

function cleanText(str: string | null | undefined): string {
  if (!str) return '';
  // StandardFonts.Helvetica supports WinAnsi / Latin-1 characters
  // Clean special Indian rupee symbol (₹) to 'INR ' for PDF standard font safety
  return str
    .replace(/₹/g, 'INR ')
    .replace(/[^\x00-\x7F]/g, '')
    .trim();
}

/**
 * Generates an authoritative, A4-sized school fee receipt PDF buffer using pdf-lib.
 * Pure server-side JavaScript, zero Chromium/Puppeteer overhead, Vercel/Serverless compatible.
 */
export async function generateReceiptPdfBuffer(data: ReceiptPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 Page Dimensions in points (72 points per inch): 595.28 x 841.89
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const colorPrimary = rgb(0.08, 0.22, 0.45); // Deep navy #143872
  const colorDark = rgb(0.1, 0.1, 0.1);
  const colorMuted = rgb(0.4, 0.4, 0.4);
  const colorBorder = rgb(0.85, 0.85, 0.85);
  const colorBgLight = rgb(0.96, 0.97, 0.98);
  const colorCancelled = rgb(0.85, 0.15, 0.15);

  let y = height - 50;

  // CANCELLED watermark banner if applicable
  if (data.status === 'CANCELLED') {
    page.drawRectangle({
      x: 40,
      y: y - 25,
      width: width - 80,
      height: 30,
      color: rgb(1, 0.92, 0.92),
      borderColor: colorCancelled,
      borderWidth: 1,
    });
    page.drawText('*** THIS RECEIPT HAS BEEN CANCELLED DUE TO PAYMENT REVERSAL ***', {
      x: 75,
      y: y - 16,
      size: 10,
      font: helveticaBold,
      color: colorCancelled,
    });
    y -= 45;
  }

  // --- HEADER SECTION ---
  // Institution Name & Info (Left)
  page.drawText(cleanText(data.schoolName) || 'Rivo Institutional Partner', {
    x: 40,
    y: y,
    size: 16,
    font: helveticaBold,
    color: colorPrimary,
  });
  y -= 16;

  if (data.schoolAddress) {
    page.drawText(cleanText(data.schoolAddress), {
      x: 40,
      y: y,
      size: 9,
      font: helvetica,
      color: colorMuted,
    });
    y -= 13;
  }

  const contactLine = [
    data.schoolPhone ? `Tel: ${cleanText(data.schoolPhone)}` : null,
    data.schoolEmail ? `Email: ${cleanText(data.schoolEmail)}` : null,
  ]
    .filter(Boolean)
    .join('  |  ');

  if (contactLine) {
    page.drawText(contactLine, {
      x: 40,
      y: y,
      size: 8.5,
      font: helvetica,
      color: colorMuted,
    });
    y -= 13;
  }

  // Receipt Badge & Meta (Right Aligned on header)
  const headerRightX = width - 180;
  let rightY = height - (data.status === 'CANCELLED' ? 95 : 50);

  page.drawRectangle({
    x: headerRightX,
    y: rightY - 5,
    width: 140,
    height: 22,
    color: colorBgLight,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText('OFFICIAL FEE RECEIPT', {
    x: headerRightX + 12,
    y: rightY + 1,
    size: 9,
    font: helveticaBold,
    color: colorPrimary,
  });

  rightY -= 22;
  page.drawText(`Receipt #: ${cleanText(data.receiptNumber)}`, {
    x: headerRightX,
    y: rightY,
    size: 9.5,
    font: helveticaBold,
    color: colorDark,
  });

  rightY -= 14;
  page.drawText(`Payment #: ${cleanText(data.paymentNumber)}`, {
    x: headerRightX,
    y: rightY,
    size: 8.5,
    font: helvetica,
    color: colorMuted,
  });

  rightY -= 13;
  const formattedDate = new Date(data.receiptDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  page.drawText(`Date: ${formattedDate}`, {
    x: headerRightX,
    y: rightY,
    size: 8.5,
    font: helvetica,
    color: colorMuted,
  });

  // Align y pointer below header
  y = Math.min(y - 15, rightY - 20);

  // Divider
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: colorBorder,
  });
  y -= 20;

  // --- STUDENT IDENTITY BLOCK ---
  page.drawRectangle({
    x: 40,
    y: y - 75,
    width: width - 80,
    height: 80,
    color: colorBgLight,
    borderColor: colorBorder,
    borderWidth: 0.8,
  });

  const col1X = 55;
  const col2X = 230;
  const col3X = 410;
  let studentY = y - 20;

  // Row 1
  page.drawText('STUDENT NAME', { x: col1X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  page.drawText(cleanText(data.studentName) || 'Student', { x: col1X, y: studentY - 12, size: 10, font: helveticaBold, color: colorDark });

  page.drawText('ADMISSION NUMBER', { x: col2X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  page.drawText(cleanText(data.admissionNumber) || 'N/A', { x: col2X, y: studentY - 12, size: 10, font: helveticaBold, color: colorDark });

  page.drawText('CLASS & SECTION', { x: col3X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  const classSec = [cleanText(data.className), cleanText(data.sectionName) ? `Sec ${cleanText(data.sectionName)}` : null]
    .filter(Boolean)
    .join(' - ') || 'N/A';
  page.drawText(classSec, { x: col3X, y: studentY - 12, size: 9.5, font: helveticaBold, color: colorDark });

  studentY -= 36;

  // Row 2
  page.drawText('ROLL NUMBER', { x: col1X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  page.drawText(cleanText(data.rollNumber) ? `#${cleanText(data.rollNumber)}` : 'N/A', { x: col1X, y: studentY - 11, size: 9, font: helvetica, color: colorDark });

  page.drawText('GUARDIAN / FATHER', { x: col2X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  page.drawText(cleanText(data.fatherName) || 'Parent / Guardian', { x: col2X, y: studentY - 11, size: 9, font: helvetica, color: colorDark });

  page.drawText('PAYMENT MODE', { x: col3X, y: studentY, size: 7.5, font: helveticaBold, color: colorMuted });
  page.drawText(cleanText(data.paymentMode) || 'CASH', { x: col3X, y: studentY - 11, size: 9, font: helveticaBold, color: colorPrimary });

  y -= 95;

  // --- SETTLEMENT PARTICULARS TABLE ---
  page.drawText('SETTLEMENT ALLOCATION BREAKDOWN', {
    x: 40,
    y,
    size: 8.5,
    font: helveticaBold,
    color: colorMuted,
  });
  y -= 14;

  // Table Header
  const tableX = 40;
  const tableWidth = width - 80;
  const colParticularsWidth = tableWidth - 140;

  page.drawRectangle({
    x: tableX,
    y: y - 18,
    width: tableWidth,
    height: 22,
    color: rgb(0.92, 0.94, 0.97),
    borderColor: colorBorder,
    borderWidth: 0.8,
  });

  page.drawText('#', { x: tableX + 10, y: y - 12, size: 8.5, font: helveticaBold, color: colorDark });
  page.drawText('Installment / Fee Particulars', { x: tableX + 35, y: y - 12, size: 8.5, font: helveticaBold, color: colorDark });
  page.drawText('Settled Amount (INR)', { x: tableX + colParticularsWidth + 10, y: y - 12, size: 8.5, font: helveticaBold, color: colorDark });

  y -= 22;

  // Table Rows
  const items = data.allocations.length > 0 ? data.allocations : [{ title: 'Institutional Fee Settlement', amount: data.totalPaid }];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowY = y - 18;

    // Alternating row background
    if (i % 2 === 1) {
      page.drawRectangle({
        x: tableX,
        y: rowY,
        width: tableWidth,
        height: 22,
        color: rgb(0.98, 0.99, 1),
      });
    }

    // Border line bottom
    page.drawLine({
      start: { x: tableX, y: rowY },
      end: { x: tableX + tableWidth, y: rowY },
      thickness: 0.5,
      color: colorBorder,
    });

    page.drawText(`${i + 1}`, { x: tableX + 10, y: rowY + 6, size: 8.5, font: helvetica, color: colorMuted });
    page.drawText(cleanText(item.title) || 'Fee Particulars', {
      x: tableX + 35,
      y: rowY + 6,
      size: 9,
      font: helvetica,
      color: colorDark,
    });

    const amtStr = `INR ${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(amtStr, {
      x: tableX + colParticularsWidth + 10,
      y: rowY + 6,
      size: 9,
      font: helveticaBold,
      color: colorDark,
    });

    y -= 22;
  }

  // Total Summary Row
  page.drawRectangle({
    x: tableX,
    y: y - 24,
    width: tableWidth,
    height: 26,
    color: rgb(0.92, 0.94, 0.97),
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText('TOTAL AMOUNT RECEIVED:', {
    x: tableX + colParticularsWidth - 90,
    y: y - 16,
    size: 9.5,
    font: helveticaBold,
    color: colorDark,
  });

  const totalStr = `INR ${Number(data.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  page.drawText(totalStr, {
    x: tableX + colParticularsWidth + 10,
    y: y - 16,
    size: 11,
    font: helveticaBold,
    color: colorPrimary,
  });

  y -= 45;

  // Transaction Remarks if present
  if (data.referenceNumber) {
    page.drawText(`Ref / Transaction ID: ${cleanText(data.referenceNumber)}`, {
      x: 40,
      y,
      size: 8.5,
      font: helvetica,
      color: colorMuted,
    });
    y -= 16;
  }

  // --- FOOTER & VERIFICATION ---
  const footerY = 90;

  page.drawLine({
    start: { x: 40, y: footerY + 45 },
    end: { x: width - 40, y: footerY + 45 },
    thickness: 0.8,
    color: colorBorder,
  });

  // Left Disclaimer
  page.drawText('Note: This is an authoritative, digitally signed fee receipt.', {
    x: 40,
    y: footerY + 28,
    size: 7.5,
    font: helveticaOblique,
    color: colorMuted,
  });
  page.drawText('Fees once paid are subject to institutional policies and published guidelines.', {
    x: 40,
    y: footerY + 16,
    size: 7.5,
    font: helvetica,
    color: colorMuted,
  });
  page.drawText('Generated via Rivo Financial Operations Core System.', {
    x: 40,
    y: footerY + 4,
    size: 7,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Right Signatory Block
  const sigX = width - 180;
  page.drawLine({
    start: { x: sigX, y: footerY + 20 },
    end: { x: sigX + 140, y: footerY + 20 },
    thickness: 1,
    color: colorDark,
  });

  page.drawText('Authorized Signatory', {
    x: sigX + 22,
    y: footerY + 7,
    size: 8.5,
    font: helveticaBold,
    color: colorDark,
  });

  if (data.issuedByName) {
    page.drawText(`Cashier: ${cleanText(data.issuedByName)}`, {
      x: sigX + 15,
      y: footerY - 5,
      size: 7.5,
      font: helvetica,
      color: colorMuted,
    });
  }

  return pdfDoc.save();
}
