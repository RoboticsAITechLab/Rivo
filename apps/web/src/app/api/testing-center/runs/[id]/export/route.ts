import { NextRequest, NextResponse } from 'next/server';
import { authorizeTestingOperator } from '@/lib/testing/auth-guard';
import { generateRunReport } from '@/lib/testing/test-repository';
import { recordAuditLog } from '@/lib/testing/audit-logger';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await authorizeTestingOperator(req);
  if (!auth.authorized) return auth.response;

  try {
    const params = await context.params;
    const runId = params.id;
    const format = (req.nextUrl.searchParams.get('format') || 'json') as 'html' | 'json' | 'csv';
    const report = await generateRunReport(runId, format);

    recordAuditLog({
      severity: 'INFO',
      service: 'REPORT_EXPORTER',
      action: 'EXPORT_REPORT',
      operator: auth.user.email || auth.user.id,
      targetUrl: req.nextUrl.pathname,
      message: `Exported test report ${runId} in ${format.toUpperCase()} format`,
      details: { runId, format },
    });

    return new NextResponse(report.content, {
      status: 200,
      headers: {
        'Content-Type': report.contentType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
