'use client';

import * as React from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  GraduationCap,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Child {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  campus?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
}

interface FeeSummary {
  totalOriginal: number;
  totalConcessions: number;
  totalNet: number;
  totalPaid: number;
  totalBalance: number;
}

interface FeeObligation {
  id: string;
  title: string;
  dueDate: string | null;
  originalAmount: number | string;
  concessionAmount: number | string;
  netAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  status: string;
  feeHead?: { name: string; code: string } | null;
}

interface FeePayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMode: string;
  amount: number | string;
  status: string;
  receipt?: {
    id: string;
    receiptNumber: string;
    receiptDate: string;
    status: string;
  } | null;
}

export default function ParentFeesPage() {
  const [activeChild, setActiveChild] = React.useState<Child | null>(null);
  const [summary, setSummary] = React.useState<FeeSummary | null>(null);
  const [obligations, setObligations] = React.useState<FeeObligation[]>([]);
  const [payments, setPayments] = React.useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [downloadingReceiptId, setDownloadingReceiptId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchFeeData = React.useCallback(async (targetChildId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get linked children
      const childRes = await fetch('/api/parent/children');
      if (!childRes.ok) throw new Error('Could not verify parent profile.');
      const childData = await childRes.json();
      const children: Child[] = childData.children || [];

      if (children.length === 0) {
        setActiveChild(null);
        setIsLoading(false);
        return;
      }

      const savedChildId = targetChildId || localStorage.getItem('rivo_parent_selected_child');
      const current = children.find((c) => c.id === savedChildId) || children[0];
      setActiveChild(current);

      // 2. Fetch authoritative fees for this child
      const feeRes = await fetch(`/api/parent/children/${current.id}/fees`);
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setSummary(feeData.summary || null);
        setObligations(feeData.obligations || []);
        setPayments(feeData.payments || []);
      } else {
        const errJson = await feeRes.json().catch(() => ({}));
        setError(errJson.message || 'Unable to load fee ledger for this student.');
      }
    } catch (err: any) {
      console.error('Failed to load parent fees:', err);
      setError(err.message || 'Network error while retrieving fee records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeeData();

    // Listen to child switch event dispatched by parent layout header
    const handleSwitch = (e: any) => {
      fetchFeeData(e.detail?.childId);
    };
    window.addEventListener('parentChildSwitched', handleSwitch);
    return () => window.removeEventListener('parentChildSwitched', handleSwitch);
  }, [fetchFeeData]);

  const handleDownloadReceipt = async (receiptId: string, receiptNumber: string) => {
    if (!activeChild) return;
    try {
      setDownloadingReceiptId(receiptId);
      const res = await fetch(`/api/parent/children/${activeChild.id}/receipts/${receiptId}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to download receipt PDF.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receiptNumber || 'fee_receipt'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading receipt:', err);
      alert(err.message || 'Could not download receipt.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const isOverdue = (ob: FeeObligation) => {
    if (ob.status === 'PAID') return false;
    if (!ob.dueDate) return false;
    return new Date(ob.dueDate).getTime() < Date.now();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading verified fee ledger...</p>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={GraduationCap}
          title="No enrolled student profile found"
          description="Your parent account is not currently linked to any enrolled student in this school. Please contact the school administration office."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header & Child Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Fee Statement &amp; Receipts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Official term installments, verified payment history, and authorized receipt downloads for{' '}
            <span className="font-semibold text-foreground">
              {activeChild.firstName} {activeChild.lastName}
            </span>{' '}
            ({activeChild.admissionNumber}).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFeeData(activeChild.id)}
          className="text-xs gap-1.5 h-8 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Ledger
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-none border border-border/70">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Total Assessed</span>
            <p className="text-xl font-bold font-mono text-foreground">
              {formatCurrency(summary?.totalOriginal || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground">Prescribed Heads</span>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/70">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Scholarship / Concession</span>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatCurrency(summary?.totalConcessions || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground">Approved Relief</span>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/70">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Total Paid</span>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary?.totalPaid || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground">Settled Collections</span>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/70">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Outstanding Balance</span>
            <p
              className={`text-xl font-bold font-mono ${
                (summary?.totalBalance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(summary?.totalBalance || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {(summary?.totalBalance || 0) === 0 ? 'All Clear' : 'Payable Dues'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 3. Term Obligations Breakdown */}
      <Card className="shadow-none border border-border/70">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Scheduled Installments &amp; Term Dues</h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {obligations.length} {obligations.length === 1 ? 'Term' : 'Terms'}
          </span>
        </div>

        <CardContent className="p-0">
          {obligations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs space-y-1.5">
              <FileCheck className="h-6 w-6 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No fee obligations found</p>
              <p>No active fee plan has been assigned to this student enrollment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-[11px] font-semibold text-muted-foreground">
                    <th className="py-2.5 px-4">Installment / Head</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Net Payable</th>
                    <th className="py-2.5 px-4 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {obligations.map((ob) => {
                    const overdue = isOverdue(ob);
                    return (
                      <tr key={ob.id} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {ob.feeHead?.name || ob.title || 'Term Installment'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {ob.dueDate ? new Date(ob.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          {formatCurrency(ob.netAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(ob.paidAmount)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            Number(ob.balanceAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(ob.balanceAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-semibold ${
                              ob.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : overdue
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : ob.status === 'PARTIALLY_PAID' || ob.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {overdue
                              ? 'OVERDUE'
                              : ob.status === 'PARTIALLY_PAID'
                              ? 'PARTIAL'
                              : ob.status || 'PENDING'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Verified Payment History & Receipt Downloads */}
      <Card className="shadow-none border border-border/70">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-foreground">Official Payment Receipts</h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {payments.filter((p) => p.status === 'COLLECTED').length} Settled
          </span>
        </div>

        <CardContent className="p-4">
          {payments.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
              No payment receipts have been recorded for this student yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.map((pay) => {
                const receiptId = pay.receipt?.id;
                const receiptNum = pay.receipt?.receiptNumber || pay.paymentNumber;
                const isReversed = pay.status === 'REVERSED';

                return (
                  <div
                    key={pay.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/60 bg-muted/10 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground font-mono">
                          {formatCurrency(pay.amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 font-medium">
                          {pay.paymentMode || 'ONLINE'}
                        </Badge>
                        {isReversed && (
                          <Badge variant="destructive" className="text-[10px] py-0 bg-rose-100 text-rose-700 border-rose-200">
                            REVERSED
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Receipt #{receiptNum} • Date:{' '}
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </p>
                    </div>

                    {receiptId && !isReversed && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingReceiptId === receiptId}
                        onClick={() => handleDownloadReceipt(receiptId, receiptNum)}
                        className="text-xs gap-1.5 h-8 self-start sm:self-auto"
                      >
                        {downloadingReceiptId === receiptId ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5 text-primary" />
                        )}
                        Download Official PDF
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
