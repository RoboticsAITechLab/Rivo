import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { generateRunReport } from '@/lib/testing/test-repository';
import { recordAuditLog } from '@/lib/testing/audit-logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const format = req.nextUrl.searchParams.get('format') === 'csv' ? 'csv' : 'json';
    const report = await generateRunReport(id, format);

    const operatorName = auth.user ? (auth.user.email || auth.user.name || 'ADMIN_OPERATOR') : 'ADMIN_OPERATOR';
    recordAuditLog({
      severity: 'INFO',
      service: 'REPORT_EXPORT',
      action: 'EXPORT_TEST_REPORT',
      operator: operatorName,
      targetUrl: 'N/A',
      message: `Exported test report for run ${id} in ${format.toUpperCase()} format`,
      details: { runId: id, format },
    });

    return new NextResponse(report.content, {
      status: 200,
      headers: {
        'Content-Type': report.contentType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
