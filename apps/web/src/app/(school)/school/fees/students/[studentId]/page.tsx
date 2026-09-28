'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Printer,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Receipt,
  RotateCcw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FeeNav } from '@/components/fees/fee-nav';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { StudentIdentityBlock } from '@/components/fees/student-identity-block';
import { FeeMetricCard } from '@/components/fees/fee-metric-card';
import { ApplyConcessionDialog } from '@/components/fees/apply-concession-dialog';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgePercent } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentFeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.studentId as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [studentData, setStudentData] = React.useState<any | null>(null);
  const [ledgerData, setLedgerData] = React.useState<any | null>(null);

  // Concession Dialogs State
  const [concessionDialogOpen, setConcessionDialogOpen] = React.useState(false);
  const [reversalObligation, setReversalObligation] = React.useState<any | null>(null);
  const [isReversingConcession, setIsReversingConcession] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [stuRes, ledgerRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/fees/obligations?studentId=${studentId}`),
      ]);

      if (!stuRes.ok) {
        if (stuRes.status === 404) throw new Error('Student profile not found');
        throw new Error(`Failed to load student (HTTP ${stuRes.status})`);
      }
      const sJson = await stuRes.json();
      setStudentData(sJson.student);

      if (ledgerRes.ok) {
        const lJson = await ledgerRes.json();
        setLedgerData(lJson);
      }
    } catch (err: any) {
      console.error('Error loading student fee profile:', err);
      setError(err?.message || 'Failed to load student fee ledger');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading && (!studentData || !ledgerData)) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !studentData) {
    return (
      <PageContainer>
        <ErrorState
          title="Student Record Unavailable"
          message={error || 'Unable to locate student financial record.'}
          onRetry={loadData}
          className="my-8"
        />
      </PageContainer>
    );
  }

  const summary = ledgerData?.summary || {
    totalOriginal: 0,
    totalConcessions: 0,
    totalNet: 0,
    totalPaid: 0,
    totalBalance: 0,
  };

  const obligations = ledgerData?.obligations || [];
  const payments = ledgerData?.payments || [];
  const assignments = ledgerData?.assignments || [];

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href="/school/fees/assignments">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assignments
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Student Fee Account`}
        description="Comprehensive financial ledger, scheduled installment obligations, and payment settlement history"
        actions={
          <div className="flex items-center gap-2">
            {summary.totalBalance > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConcessionDialogOpen(true)}
                className="h-8.5 text-xs gap-1.5 font-semibold text-emerald-700 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
              >
                <BadgePercent className="h-3.5 w-3.5 text-emerald-600" />
                Apply Concession
              </Button>
            )}
            <Link href={`/school/fees/payments/new?studentId=${studentId}`}>
              <Button size="sm" className="h-8.5 text-xs gap-1.5 font-bold">
                <CreditCard className="h-3.5 w-3.5" />
                Collect Payment
              </Button>
            </Link>
          </div>
        }
      />

      <FeeNav />

      {/* Authoritative Student Identity Banner */}
      <StudentIdentityBlock
        student={{
          id: studentData.id,
          name: studentData.name,
          admissionNumber: studentData.admissionNumber,
          rollNumber: studentData.rollNumber,
          className: studentData.className,
          sectionName: studentData.sectionName,
          streamName: studentData.streamName,
          campusName: studentData.campusName,
          fatherName: studentData.fatherName || studentData.parentStudents?.[0]?.parent?.firstName,
        }}
        variant="banner"
        className="mb-6"
      />

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FeeMetricCard
          title="Net Fee Obligation"
          amount={summary.totalNet}
          subtext={summary.totalConcessions > 0 ? `After ₹${summary.totalConcessions.toLocaleString('en-IN')} concession` : 'Standard scheduled total'}
          icon={Layers}
          variant="default"
        />
        <FeeMetricCard
          title="Total Paid"
          amount={summary.totalPaid}
          subtext={`Settled across ${payments.length} payment(s)`}
          icon={CheckCircle2}
          variant="success"
        />
        <FeeMetricCard
          title="Outstanding Balance"
          amount={summary.totalBalance}
          subtext={summary.totalBalance === 0 ? 'Fully settled' : 'Unpaid balance due'}
          icon={Clock}
          variant={summary.totalBalance === 0 ? 'success' : 'warning'}
        />
        <FeeMetricCard
          title="Concessions Granted"
          amount={summary.totalConcessions}
          subtext="Institutional scholarship / waiver"
          icon={AlertCircle}
          variant="default"
        />
      </div>

      {/* Ledger & History Tabs */}
      <Tabs defaultValue="obligations" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 border">
          <TabsTrigger value="obligations" className="text-xs">Fee Obligations & Ledger ({obligations.length})</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payment Receipts ({payments.length})</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs">Assigned Fee Plans ({assignments.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: OBLIGATIONS LEDGER */}
        <TabsContent value="obligations">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Authoritative Obligations Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Sequential installment obligations, original fees, concessions, and balance status
                </CardDescription>
              </div>
              {summary.totalBalance > 0 && (
                <Link href={`/school/fees/payments/new?studentId=${studentId}`}>
                  <Button size="sm" className="h-8 text-xs gap-1 font-semibold">
                    <CreditCard className="h-3.5 w-3.5" /> Collect Payment
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {obligations.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <Layers className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p>No fee obligations assigned to this student yet.</p>
                  <Link href={`/school/fees/assignments`}>
                    <Button size="sm" variant="outline" className="text-xs mt-2">
                      Assign a Fee Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left">
                        <th className="pb-2 font-semibold">Installment Title</th>
                        <th className="pb-2 font-semibold">Due Date</th>
                        <th className="pb-2 font-semibold text-right">Original</th>
                        <th className="pb-2 font-semibold text-right">Concession</th>
                        <th className="pb-2 font-semibold text-right">Net Due</th>
                        <th className="pb-2 font-semibold text-right">Paid</th>
                        <th className="pb-2 font-semibold text-right">Balance</th>
                        <th className="pb-2 font-semibold text-right">Status</th>
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {obligations.map((ob: any) => {
                        const isOverdue =
                          Number(ob.balanceAmount) > 0 && new Date(ob.dueDate) < new Date();
                        const displayStatus = isOverdue && ob.status === 'PENDING' ? 'OVERDUE' : ob.status;

                        return (
                          <tr key={ob.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">
                              {ob.title}
                            </td>
                            <td className="py-2.5 font-mono text-muted-foreground">
                              {new Date(ob.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">
                              <FinancialAmount amount={ob.originalAmount} size="sm" variant="muted" />
                            </td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">
                              <FinancialAmount amount={ob.concessionAmount} size="sm" variant="muted" />
                            </td>
                            <td className="py-2.5 text-right font-mono font-medium">
                              <FinancialAmount amount={ob.netAmount} size="sm" />
                            </td>
                            <td className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              <FinancialAmount amount={ob.paidAmount} size="sm" variant="success" />
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              <FinancialAmount
                                amount={ob.balanceAmount}
                                size="sm"
                                variant={Number(ob.balanceAmount) > 0 ? (isOverdue ? 'destructive' : 'warning') : 'muted'}
                              />
                            </td>
                            <td className="py-2.5 text-right">
                              <FeeStatusBadge status={displayStatus} size="sm" />
                            </td>
                            <td className="py-2.5 text-right">
                              {Number(ob.concessionAmount) > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReversalObligation(ob)}
                                  className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-rose-600"
                                  title="Reverse Concession"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" /> Reverse
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t font-bold bg-muted/10">
                        <td colSpan={2} className="py-3 font-semibold text-foreground">Cumulative Totals:</td>
                        <td className="py-3 text-right font-mono">
                          <FinancialAmount amount={summary.totalOriginal} size="sm" variant="muted" />
                        </td>
                        <td className="py-3 text-right font-mono">
                          <FinancialAmount amount={summary.totalConcessions} size="sm" variant="muted" />
                        </td>
                        <td className="py-3 text-right font-mono">
                          <FinancialAmount amount={summary.totalNet} size="sm" />
                        </td>
                        <td className="py-3 text-right font-mono">
                          <FinancialAmount amount={summary.totalPaid} size="sm" variant="success" />
                        </td>
                        <td className="py-3 text-right font-mono">
                          <FinancialAmount amount={summary.totalBalance} size="md" variant={summary.totalBalance > 0 ? 'warning' : 'success'} />
                        </td>
                        <td className="py-3 text-right">
                          <FeeStatusBadge status={summary.totalBalance === 0 ? 'PAID' : 'PARTIALLY_PAID'} size="sm" />
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PAYMENTS */}
        <TabsContent value="payments">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Payment Transactions & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p>No payment records found for this student account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left">
                        <th className="pb-2 font-semibold">Payment #</th>
                        <th className="pb-2 font-semibold">Date</th>
                        <th className="pb-2 font-semibold">Mode</th>
                        <th className="pb-2 font-semibold">Status</th>
                        <th className="pb-2 font-semibold text-right">Amount</th>
                        <th className="pb-2 font-semibold text-right">Receipt #</th>
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-foreground">
                            {p.paymentNumber}
                          </td>
                          <td className="py-2.5 font-mono text-muted-foreground">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2.5 font-semibold text-foreground">
                            {p.paymentMode}
                          </td>
                          <td className="py-2.5">
                            <FeeStatusBadge status={p.status} size="sm" />
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold">
                            <FinancialAmount
                              amount={p.amount}
                              size="sm"
                              variant={p.status === 'REVERSED' ? 'muted' : 'success'}
                              className={p.status === 'REVERSED' ? 'line-through' : ''}
                            />
                          </td>
                          <td className="py-2.5 text-right font-mono text-muted-foreground">
                            {p.receipt?.receiptNumber || 'N/A'}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.receipt?.id && (
                                <Link href={`/school/fees/receipts/${p.receipt.id}`}>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                                    <Printer className="h-3 w-3" /> Receipt
                                  </Button>
                                </Link>
                              )}
                              <Link href={`/school/fees/payments/${p.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1 px-2">
                                  Details <ArrowRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ASSIGNED FEE PLANS */}
        <TabsContent value="plans">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Fee Structure Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.map((assign: any) => {
                  const planVer = assign.feePlanVersion;
                  return (
                    <div
                      key={assign.id}
                      className="p-4 rounded-lg border bg-card/60 flex flex-wrap items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {planVer?.feePlan?.name}
                          </span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            v{planVer?.versionNumber}
                          </Badge>
                          <FeeStatusBadge status={assign.status} size="sm" />
                        </div>
                        <div className="text-muted-foreground">
                          {planVer?.items?.length || 0} component heads · {planVer?.installments?.length || 0} installments scheduled
                        </div>
                        {assign.concessionReason && (
                          <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Concession: {formatINR(assign.customConcessionAmount)} ({assign.concessionReason})
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Total Fee</span>
                          <FinancialAmount amount={planVer?.totalAmount} size="md" />
                        </div>
                        <Link href={`/school/fees/plans/${planVer?.feePlan?.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                            Plan Details <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Concession Dialog */}
      {studentData && (
        <ApplyConcessionDialog
          open={concessionDialogOpen}
          onOpenChange={setConcessionDialogOpen}
          student={{
            id: studentData.id,
            name: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            admissionNumber: studentData.admissionNumber,
            className: studentData.className,
            sectionName: studentData.sectionName,
            enrollmentId: studentData.enrollmentId || studentData.enrollments?.[0]?.id || assignments[0]?.studentEnrollmentId || '',
            sessionId: studentData.sessionId || studentData.enrollments?.[0]?.academicSessionId || assignments[0]?.academicSessionId || '',
          }}
          obligations={obligations}
          onSuccess={loadData}
        />
      )}

      {/* Reverse Concession Dialog */}
      <FinancialConfirmDialog
        open={Boolean(reversalObligation)}
        onOpenChange={(open) => !open && setReversalObligation(null)}
        title="Reverse Concession / Waiver"
        description={`Are you sure you want to reverse the concession of ${reversalObligation ? formatINR(reversalObligation.concessionAmount) : '₹0'} on '${reversalObligation?.title}'? The student's outstanding balance will increase accordingly.`}
        confirmLabel="Reverse Concession"
        variant="destructive"
        requiresReason
        reasonLabel="Mandatory Reversal Justification"
        reasonPlaceholder="e.g. Concession granted erroneously or revoked by Principal"
        isLoading={isReversingConcession}
        onConfirm={async (reason) => {
          if (!reversalObligation || !reason) return;
          setIsReversingConcession(true);
          try {
            const res = await fetch(`/api/fees/concessions/${reversalObligation.id}/reverse`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reversalReason: reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Reversal failed');

            toast.success(data.message || 'Concession reversed successfully.');
            setReversalObligation(null);
            loadData();
          } catch (err: any) {
            toast.error(err.message || 'Failed to reverse concession');
          } finally {
            setIsReversingConcession(false);
          }
        }}
      />
    </PageContainer>
  );
}
