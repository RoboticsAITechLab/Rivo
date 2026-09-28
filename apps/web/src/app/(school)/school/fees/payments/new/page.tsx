'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Coins,
  QrCode,
  Building,
  FileText,
  User,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FeeNav } from '@/components/fees/fee-nav';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { StudentIdentityBlock } from '@/components/fees/student-identity-block';
import { PaymentAllocationPreview, AllocationPreviewItem } from '@/components/fees/payment-allocation-preview';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { toast } from 'sonner';

export default function CollectPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId');

  // Search & Student Selection
  const [studentSearch, setStudentSearch] = React.useState('');
  const [isSearchingStudents, setIsSearchingStudents] = React.useState(false);
  const [studentResults, setStudentResults] = React.useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<any | null>(null);

  // Ledger & Obligations
  const [isLoadingLedger, setIsLoadingLedger] = React.useState(false);
  const [obligations, setObligations] = React.useState<any[]>([]);
  const [totalOutstanding, setTotalOutstanding] = React.useState(0);
  const [activeSessionId, setActiveSessionId] = React.useState<string>('');
  const [activeEnrollmentId, setActiveEnrollmentId] = React.useState<string>('');

  // Payment Form Fields
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentMode, setPaymentMode] = React.useState<string>('CASH');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [chequeDate, setChequeDate] = React.useState('');
  const [remarks, setRemarks] = React.useState('');

  // Cash Change Calculator
  const [cashTendered, setCashTendered] = React.useState<number>(0);

  // Confirmation & Submit
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load student by preselected ID if query param present
  React.useEffect(() => {
    if (!preselectedStudentId) return;
    async function loadPreselected() {
      try {
        const res = await fetch(`/api/students/${preselectedStudentId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedStudent(data.student);
        }
      } catch (err) {
        console.warn('Failed to load preselected student', err);
      }
    }
    loadPreselected();
  }, [preselectedStudentId]);

  // Debounced Student Search
  React.useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch.trim())}&pageSize=8`);
        if (res.ok) {
          const data = await res.json();
          setStudentResults(data.students || []);
        }
      } catch (err) {
        console.warn('Search error', err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Fetch Obligations when student is selected
  React.useEffect(() => {
    if (!selectedStudent) {
      setObligations([]);
      setTotalOutstanding(0);
      setActiveSessionId('');
      setActiveEnrollmentId('');
      return;
    }

    async function loadStudentObligations() {
      setIsLoadingLedger(true);
      try {
        const res = await fetch(`/api/fees/obligations?studentId=${selectedStudent.id}`);
        if (res.ok) {
          const data = await res.json();
          const obs = data.obligations || [];
          setObligations(obs);

          const pendingObs = obs.filter(
            (o: any) =>
              (o.status === 'PENDING' || o.status === 'PARTIALLY_PAID') &&
              Number(o.balanceAmount) > 0
          );

          const sum = pendingObs.reduce((acc: number, o: any) => acc + Number(o.balanceAmount), 0);
          setTotalOutstanding(sum);

          // Get active enrollment and session from obligations or student
          if (pendingObs.length > 0) {
            setActiveSessionId(pendingObs[0].academicSessionId);
            setActiveEnrollmentId(pendingObs[0].studentEnrollmentId);
          } else if (obs.length > 0) {
            setActiveSessionId(obs[0].academicSessionId);
            setActiveEnrollmentId(obs[0].studentEnrollmentId);
          }
        }
      } catch (err) {
        console.error('Failed to load obligations:', err);
        toast.error('Unable to fetch student fee obligations');
      } finally {
        setIsLoadingLedger(false);
      }
    }
    loadStudentObligations();
  }, [selectedStudent]);

  // Compute Oldest-Due Allocation Preview
  const allocationPreview = React.useMemo(() => {
    let unallocated = paymentAmount;
    const items: AllocationPreviewItem[] = [];

    // Filter to payable obligations ordered by dueDate asc
    const payable = obligations
      .filter((o: any) => o.status !== 'CANCELLED' && Number(o.balanceAmount) > 0)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    for (const ob of payable) {
      const bal = Number(ob.balanceAmount);
      const applied = Math.min(unallocated, bal);
      const remainingBal = bal - applied;
      unallocated -= applied;

      items.push({
        id: ob.id,
        title: ob.title,
        dueDate: ob.dueDate,
        netDue: Number(ob.netAmount),
        currentPaid: Number(ob.paidAmount),
        currentBalance: bal,
        appliedAmount: applied,
        remainingBalance: remainingBal,
      });
    }

    const totalApplied = paymentAmount - unallocated;

    return {
      items,
      totalApplied,
      remainingUnallocated: unallocated,
    };
  }, [obligations, paymentAmount]);

  // Handle Submit Payment
  const handleRecordPayment = async () => {
    if (!selectedStudent || !activeSessionId || !activeEnrollmentId) {
      toast.error('Invalid student enrollment context.');
      return;
    }

    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > totalOutstanding) {
      toast.error(`Payment amount cannot exceed total outstanding dues (${formatINR(totalOutstanding)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        academicSessionId: activeSessionId,
        studentId: selectedStudent.id,
        studentEnrollmentId: activeEnrollmentId,
        amount: paymentAmount,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        chequeDate: chequeDate || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Payment processing failed');
      }

      toast.success(
        `Payment ${resData.payment?.paymentNumber} recorded! Receipt ${resData.receipt?.receiptNumber} generated.`
      );

      setConfirmOpen(false);

      // Redirect immediately to authoritative Receipt Print Center
      if (resData.receipt?.id) {
        router.push(`/school/fees/receipts/${resData.receipt.id}`);
      } else {
        router.push(`/school/fees/payments/${resData.payment?.id}`);
      }
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      toast.error(err?.message || 'Payment collection failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cashChange = Math.max(0, cashTendered - paymentAmount);

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
        title="Collect Fee Payment"
        description="Cashier counter terminal for student fee settlement, oldest-due allocation, and sequential receipt issuance"
      />

      <FeeNav />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Student Selection & Outstanding Obligations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Student Selector Card */}
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Step 1: Student Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedStudent ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Type student name, admission number, or roll number..."
                      className="pl-9 text-xs h-10 bg-background"
                      autoFocus
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {studentResults.length > 0 && (
                    <div className="border rounded-lg bg-card shadow-md divide-y max-h-60 overflow-y-auto">
                      {studentResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentSearch('');
                            setStudentResults([]);
                          }}
                          className="p-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-foreground">
                              {s.name || `${s.firstName} ${s.lastName}`}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Adm #{s.admissionNumber || 'N/A'} · {s.className || s.enrollments?.[0]?.class?.name || ''}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {studentSearch && !isSearchingStudents && studentResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No students found matching "{studentSearch}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <StudentIdentityBlock
                    student={{
                      id: selectedStudent.id,
                      name: selectedStudent.name || `${selectedStudent.firstName} ${selectedStudent.lastName}`,
                      admissionNumber: selectedStudent.admissionNumber,
                      rollNumber: selectedStudent.rollNumber,
                      className: selectedStudent.className,
                      sectionName: selectedStudent.sectionName,
                      campusName: selectedStudent.campusName,
                      fatherName: selectedStudent.fatherName,
                    }}
                    variant="card"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setPaymentAmount(0);
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Change Student
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Obligations Ledger */}
          {selectedStudent && (
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Step 2: Outstanding Fee Obligations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current unsettled installments for this student's active enrollment
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Total Due
                  </span>
                  <FinancialAmount amount={totalOutstanding} size="lg" variant="warning" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingLedger ? (
                  <div className="space-y-2 py-4">
                    <div className="h-6 bg-muted/40 rounded animate-pulse" />
                    <div className="h-6 bg-muted/40 rounded animate-pulse" />
                  </div>
                ) : obligations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-foreground">No Outstanding Dues Found</p>
                    <p>This student does not have any pending fee obligations.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="pb-2 font-semibold">Installment</th>
                          <th className="pb-2 font-semibold">Due Date</th>
                          <th className="pb-2 font-semibold text-right">Net Due</th>
                          <th className="pb-2 font-semibold text-right">Paid</th>
                          <th className="pb-2 font-semibold text-right">Balance</th>
                          <th className="pb-2 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {obligations.map((ob: any) => (
                          <tr key={ob.id}>
                            <td className="py-2.5 font-semibold text-foreground">{ob.title}</td>
                            <td className="py-2.5 font-mono text-muted-foreground text-[11px]">
                              {new Date(ob.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              <FinancialAmount amount={ob.netAmount} size="sm" />
                            </td>
                            <td className="py-2.5 text-right font-mono text-emerald-600">
                              <FinancialAmount amount={ob.paidAmount} size="sm" variant="success" />
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              <FinancialAmount
                                amount={ob.balanceAmount}
                                size="sm"
                                variant={Number(ob.balanceAmount) > 0 ? 'warning' : 'muted'}
                              />
                            </td>
                            <td className="py-2.5 text-right">
                              <FeeStatusBadge status={ob.status} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Allocation Preview */}
          {selectedStudent && paymentAmount > 0 && (
            <PaymentAllocationPreview
              items={allocationPreview.items}
              paymentAmount={paymentAmount}
              totalApplied={allocationPreview.totalApplied}
              remainingUnallocated={allocationPreview.remainingUnallocated}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Payment Entry Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Step 3: Payment Details
              </CardTitle>
              <CardDescription className="text-xs">
                Enter settlement amount and transaction mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pay-amt" className="text-xs font-bold text-foreground">
                    Collection Amount (₹) <span className="text-rose-500">*</span>
                  </Label>
                  {totalOutstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(totalOutstanding)}
                      className="text-[11px] text-primary font-semibold hover:underline"
                    >
                      Pay Full Due ({formatINR(totalOutstanding)})
                    </button>
                  )}
                </div>
                <Input
                  id="pay-amt"
                  type="number"
                  min="1"
                  max={totalOutstanding || undefined}
                  step="1"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="h-10 text-base font-mono font-bold text-foreground"
                  disabled={!selectedStudent || totalOutstanding === 0}
                />
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Payment Mode <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'DEMAND_DRAFT'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                        paymentMode === mode
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40'
                          : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {mode === 'BANK_TRANSFER' ? 'BANK' : mode === 'DEMAND_DRAFT' ? 'DD' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode-specific Fields */}
              {paymentMode === 'CASH' && (
                <div className="p-3 rounded-lg border bg-muted/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cash-in" className="text-[11px] font-semibold text-muted-foreground">
                      Cash Tendered
                    </Label>
                    <Input
                      id="cash-in"
                      type="number"
                      min="0"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder="Amount handed"
                      className="w-32 h-7 text-xs font-mono text-right"
                    />
                  </div>
                  {cashTendered > paymentAmount && (
                    <div className="flex items-center justify-between font-bold pt-1 border-t text-emerald-700 dark:text-emerald-400">
                      <span>Change Due:</span>
                      <FinancialAmount amount={cashChange} size="sm" variant="success" />
                    </div>
                  )}
                </div>
              )}

              {(paymentMode === 'UPI' || paymentMode === 'BANK_TRANSFER' || paymentMode === 'CARD') && (
                <div className="space-y-1.5">
                  <Label htmlFor="ref-num" className="text-xs font-semibold">
                    Reference / Transaction ID
                  </Label>
                  <Input
                    id="ref-num"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UTR / UPI Ref / Card Auth Code"
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              )}

              {(paymentMode === 'CHEQUE' || paymentMode === 'DEMAND_DRAFT') && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="chk-num" className="text-xs font-semibold">
                      Instrument Number
                    </Label>
                    <Input
                      id="chk-num"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Cheque / DD Number"
                      className="h-8.5 text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="bank-name" className="text-xs font-semibold">Bank Name</Label>
                      <Input
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chk-date" className="text-xs font-semibold">Date</Label>
                      <Input
                        id="chk-date"
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs font-semibold">
                  Remarks / Counter Notes (Optional)
                </Label>
                <Input
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional cashier remarks"
                  className="h-8.5 text-xs"
                />
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Button
                  size="lg"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!selectedStudent || paymentAmount <= 0 || paymentAmount > totalOutstanding}
                  className="w-full text-xs font-bold gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Review & Record Payment ({formatINR(paymentAmount)})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation & Authorization Dialog */}
      <FinancialConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Financial Payment"
        description="This will authoritatively record a payment transaction, apply allocation to obligations, and issue a signed financial receipt."
        confirmLabel={`Commit Payment (${formatINR(paymentAmount)})`}
        variant="default"
        isLoading={isSubmitting}
        onConfirm={handleRecordPayment}
      >
        <div className="space-y-3 text-xs my-2">
          <div className="p-3 border rounded-lg bg-muted/20 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-bold text-foreground">
                {selectedStudent?.name || `${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-bold font-mono">{paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <FinancialAmount amount={paymentAmount} size="sm" variant="success" />
            </div>
            {referenceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono">{referenceNumber}</span>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] flex items-center gap-2 border border-amber-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              An authoritative sequential receipt ID and payment ID will be generated upon confirmation.
            </span>
          </div>
        </div>
      </FinancialConfirmDialog>
    </PageContainer>
  );
}
