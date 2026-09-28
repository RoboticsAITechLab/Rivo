'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Building,
  School,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Download,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ReceiptPrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [receipt, setReceipt] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReceipt = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fees/receipts/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Receipt not found');
        throw new Error(`Failed to load receipt (HTTP ${res.status})`);
      }
      const data = await res.json();
      setReceipt(data.receipt);
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      setError(err?.message || 'Failed to load official receipt data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!id || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const res = await fetch(`/api/fees/receipts/${id}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `PDF generation failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receipt?.receiptNumber || 'Receipt'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Fee receipt PDF downloaded successfully.');
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error(err.message || 'Failed to download receipt PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading && !receipt) {
    return (
      <PageContainer>
        <div className="space-y-6 max-w-3xl mx-auto py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !receipt) {
    return (
      <PageContainer>
        <ErrorState
          title="Receipt Not Found"
          message={error || 'The requested fee receipt record could not be found.'}
          onRetry={fetchReceipt}
          className="my-8"
        />
      </PageContainer>
    );
  }

  const isCancelled = receipt.status === 'CANCELLED';
  const studentSnap = receipt.studentSnapshot || {};
  const allocSnap = (receipt.allocationSnapshot as any[]) || [];

  return (
    <PageContainer className="print:p-0 print:m-0">
      {/* Non-Printable Header Bar */}
      <div className="print:hidden flex items-center justify-between mb-6 pb-4 border-b">
        <Link href="/school/fees/receipts">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Receipts
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {receipt.payment?.id && (
            <Link href={`/school/fees/payments/${receipt.payment.id}`}>
              <Button variant="outline" size="sm" className="h-8.5 text-xs">
                View Transaction
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="h-8.5 text-xs font-semibold gap-1.5 text-foreground"
          >
            {isDownloadingPdf ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Download className="h-3.5 w-3.5 text-primary" />
            )}
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button size="sm" onClick={handlePrint} className="h-8.5 text-xs font-bold gap-1.5 bg-primary text-primary-foreground">
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Official A4 Receipt Container */}
      <div className="max-w-3xl mx-auto bg-card border rounded-xl shadow-xs print:border-none print:shadow-none print:max-w-none print:w-full p-6 sm:p-8 space-y-6 text-foreground">
        {/* Cancelled Stamp Watermark if Cancelled */}
        {isCancelled && (
          <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold text-center uppercase tracking-widest">
            *** THIS RECEIPT HAS BEEN CANCELLED DUE TO PAYMENT REVERSAL ***
          </div>
        )}

        {/* Institution Branding & Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {receipt.school?.name || 'Rivo Institutional Partner'}
              </h1>
            </div>
            {receipt.school?.address && (
              <p className="text-xs text-muted-foreground max-w-sm">
                {receipt.school.address}
              </p>
            )}
            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3">
              {receipt.school?.phone && <span>Phone: {receipt.school.phone}</span>}
              {receipt.school?.email && <span>Email: {receipt.school.email}</span>}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block px-2.5 py-1 rounded bg-muted/60 text-xs font-bold uppercase tracking-wider text-foreground">
              Official Fee Receipt
            </div>
            <div className="font-mono font-bold text-base text-foreground">
              {receipt.receiptNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              Date: {new Date(receipt.receiptDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Student Identification Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/20 border border-border/60 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Student Name
            </span>
            <span className="font-bold text-foreground text-sm">
              {studentSnap.name || `${studentSnap.firstName || ''} ${studentSnap.lastName || ''}`.trim() || 'Student'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Admission Number
            </span>
            <span className="font-mono font-bold text-foreground">
              {studentSnap.admissionNumber || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Class & Section
            </span>
            <span className="font-semibold text-foreground">
              {studentSnap.className || 'Class'} {studentSnap.sectionName ? `· ${studentSnap.sectionName}` : ''}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Roll Number
            </span>
            <span className="font-mono font-semibold text-foreground">
              {studentSnap.rollNumber ? `#${studentSnap.rollNumber}` : 'N/A'}
            </span>
          </div>
          {studentSnap.fatherName && (
            <div className="col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Parent / Guardian
              </span>
              <span className="text-foreground">{studentSnap.fatherName}</span>
            </div>
          )}
          {studentSnap.campusName && (
            <div className="col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Campus
              </span>
              <span className="text-foreground">{studentSnap.campusName}</span>
            </div>
          )}
        </div>

        {/* Payment & Allocation Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Settlement Breakdown
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b text-muted-foreground text-left">
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Installment / Fee Particulars</th>
                  <th className="p-3 font-semibold text-right">Settled Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allocSnap.length > 0 ? (
                  allocSnap.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-mono text-muted-foreground w-8">{idx + 1}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {item.obligationTitle || item.title || `Scheduled Installment`}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <FinancialAmount amount={item.allocatedAmount || item.amount} size="sm" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-mono text-muted-foreground w-8">1</td>
                    <td className="p-3 font-semibold text-foreground">Tuition Fee Settlement</td>
                    <td className="p-3 text-right font-mono font-bold">
                      <FinancialAmount amount={receipt.totalPaid} size="sm" />
                    </td>
                  </tr>
                )}
                <tr className="bg-muted/10 font-bold border-t">
                  <td colSpan={2} className="p-3 text-right text-foreground">Total Amount Received:</td>
                  <td className="p-3 text-right font-mono text-sm text-foreground">
                    <FinancialAmount amount={receipt.totalPaid} size="md" variant="default" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border bg-card/60 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Payment Mode</span>
            <span className="font-bold text-foreground">{receipt.paymentMode}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Associated Payment #</span>
            <span className="font-mono text-foreground">{receipt.payment?.paymentNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Reference / UTR</span>
            <span className="font-mono text-foreground">{receipt.referenceNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
            <FeeStatusBadge status={receipt.status} size="sm" />
          </div>
        </div>

        {/* Authorization & Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground block">Cashier / Authorized Signatory</span>
            <div className="h-10 border-b border-dashed border-border/80" />
            <span className="text-[10px] text-muted-foreground">Accounts Department</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[11px] text-muted-foreground block">System Seal</span>
            <div className="h-10 flex items-center justify-end">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              RIVO-VERIFIED-RECEIPT
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 text-center text-[10px] text-muted-foreground border-t border-border/40">
          This is an authoritative computer-generated institutional fee receipt from Rivo School Management SaaS. No physical signature required.
        </div>
      </div>
    </PageContainer>
  );
}
