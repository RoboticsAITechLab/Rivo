'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  User,
  History,
  CreditCard,
  Building,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FeeNav } from '@/components/fees/fee-nav';
import { FinancialAmount } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { StudentIdentityBlock } from '@/components/fees/student-identity-block';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [payment, setPayment] = React.useState<any | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Reversal Dialog
  const [reverseDialogOpen, setReverseDialogOpen] = React.useState(false);
  const [isReversing, setIsReversing] = React.useState(false);

  const fetchPayment = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fees/payments/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Payment record not found');
        throw new Error(`Failed to load payment details (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPayment(data.payment);
      setAuditLogs(data.auditLogs || []);
    } catch (err: any) {
      console.error('Error fetching payment:', err);
      setError(err?.message || 'Failed to connect to payments service');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleReverse = async (reason?: string) => {
    if (!reason || !payment) return;
    setIsReversing(true);
    try {
      const res = await fetch(`/api/fees/payments/${payment.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reversalReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reverse payment');

      toast.success('Payment reversed successfully. Obligation balances rolled back.');
      setReverseDialogOpen(false);
      fetchPayment();
    } catch (err: any) {
      toast.error(err?.message || 'Payment reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  if (isLoading && !payment) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !payment) {
    return (
      <PageContainer>
        <ErrorState
          title="Payment Not Found"
          message={error || 'The requested payment transaction could not be located.'}
          onRetry={fetchPayment}
          className="my-8"
        />
      </PageContainer>
    );
  }

  const isReversed = payment.status === 'REVERSED';

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href="/school/fees/payments">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Payment: ${payment.paymentNumber}`}
        description={`Authoritative financial settlement recorded on ${new Date(payment.paymentDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}`}
        actions={
          <div className="flex items-center gap-2">
            {payment.receipt && (
              <Link href={`/school/fees/receipts/${payment.receipt.id}`}>
                <Button size="sm" className="h-8.5 text-xs gap-1.5 font-bold">
                  <Printer className="h-3.5 w-3.5" />
                  Print Official Receipt
                </Button>
              </Link>
            )}
            {!isReversed && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setReverseDialogOpen(true)}
                className="h-8.5 text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reverse Payment
              </Button>
            )}
          </div>
        }
      />

      <FeeNav />

      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-xl border bg-card/80 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-base text-foreground">
              {payment.paymentNumber}
            </span>
            <FeeStatusBadge status={payment.status} size="md" />
            <Badge variant="outline" className="font-semibold text-xs">
              {payment.paymentMode}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Academic Session: <strong>{payment.studentEnrollment?.academicSession?.name || 'Active Session'}</strong>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider block">
            Payment Amount
          </span>
          <FinancialAmount
            amount={payment.amount}
            size="2xl"
            variant={isReversed ? 'muted' : 'success'}
            className={isReversed ? 'line-through' : ''}
          />
        </div>
      </div>

      {/* Reversal Banner if Reversed */}
      {isReversed && (
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 dark:border-purple-900/60 dark:bg-purple-950/20 text-xs mb-6 space-y-1 text-purple-900 dark:text-purple-300">
          <div className="flex items-center gap-2 font-bold">
            <RotateCcw className="h-4 w-4 text-purple-600" />
            <span>This financial payment was reversed and rolled back.</span>
          </div>
          <p>
            Reversed on{' '}
            {payment.reversedAt
              ? new Date(payment.reversedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}{' '}
            {payment.reversedByUser && (
              <>by {payment.reversedByUser.firstName} {payment.reversedByUser.lastName}</>
            )}
          </p>
          {payment.reversalReason && (
            <p className="font-medium pt-1">
              Audit Justification: <em>"{payment.reversalReason}"</em>
            </p>
          )}
        </div>
      )}

      {/* Grid: Details & Student */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Payment Summary */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Payment Date:</span>
              <span className="font-mono font-semibold">
                {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-semibold text-foreground">{payment.paymentMode}</span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Reference / UTR #:</span>
                <span className="font-mono font-bold text-foreground">{payment.referenceNumber}</span>
              </div>
            )}
            {payment.bankName && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-medium">{payment.bankName}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Collected By:</span>
              <span className="font-medium text-foreground">
                {payment.collectedByUser?.firstName} {payment.collectedByUser?.lastName} ({payment.collectedByUser?.email})
              </span>
            </div>
            {payment.remarks && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Remarks:</span>
                <span className="text-foreground italic">{payment.remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Context */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Student Enrollment Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Student Name:</span>
              <span className="font-bold text-foreground">
                {payment.student.firstName} {payment.student.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Admission Number:</span>
              <span className="font-mono font-bold">{payment.student.admissionNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Class & Section:</span>
              <span className="font-semibold">
                {payment.studentEnrollment?.class?.name}{' '}
                {payment.studentEnrollment?.section?.name ? `· Sec ${payment.studentEnrollment.section.name}` : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Campus:</span>
              <span>{payment.studentEnrollment?.campus?.name || 'Main Campus'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Student Account:</span>
              <Link href={`/school/fees/students/${payment.student.id}`}>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary p-0 hover:underline">
                  Open Student Ledger
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Breakdown */}
      <Card className="border-border/80 shadow-2xs mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Settled Obligations & Allocation Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Direct ledger allocations mapped to student installment liabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 font-semibold">Obligation / Installment</th>
                  <th className="pb-2 font-semibold">Due Date</th>
                  <th className="pb-2 font-semibold text-right">Net Obligation</th>
                  <th className="pb-2 font-semibold text-right">Allocated in this Payment</th>
                  <th className="pb-2 font-semibold text-right">Allocation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payment.allocations?.map((alloc: any) => (
                  <tr key={alloc.id}>
                    <td className="py-2.5 font-semibold text-foreground">
                      {alloc.obligation?.title}
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      {alloc.obligation?.dueDate
                        ? new Date(alloc.obligation.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      <FinancialAmount amount={alloc.obligation?.netAmount} size="sm" variant="muted" />
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      <FinancialAmount
                        amount={alloc.allocatedAmount}
                        size="sm"
                        variant={alloc.isReversed ? 'muted' : 'success'}
                        className={alloc.isReversed ? 'line-through' : ''}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      {alloc.isReversed ? (
                        <FeeStatusBadge status="REVERSED" size="sm" />
                      ) : (
                        <FeeStatusBadge status="COLLECTED" size="sm" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Transaction Audit Trail
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-3 border rounded-lg bg-card/60 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] font-bold">
                        {log.action}
                      </Badge>
                      <span className="font-medium text-foreground">
                        {log.performedByUser?.firstName} {log.performedByUser?.lastName}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-muted-foreground text-[10px] shrink-0">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reversal Confirmation Dialog */}
      <FinancialConfirmDialog
        open={reverseDialogOpen}
        onOpenChange={setReverseDialogOpen}
        title={`Reverse Payment: ${payment.paymentNumber}`}
        description="Reversing this transaction will restore the student's unpaid obligation balances and permanently void the receipt."
        confirmLabel="Execute Reversal & Roll Back"
        variant="destructive"
        requiresReason
        reasonLabel="Mandatory Financial Reversal Reason"
        reasonPlaceholder="Specify exact audit justification for rollback (minimum 5 characters)..."
        minReasonLength={5}
        isLoading={isReversing}
        onConfirm={handleReverse}
      />
    </PageContainer>
  );
}
