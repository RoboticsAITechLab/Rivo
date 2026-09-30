'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import {
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TabFeesProps {
  student: StudentDetail;
}

export function TabFees({ student }: TabFeesProps) {
  const [obligations, setObligations] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchFeeDetails = React.useCallback(async () => {
    if (!student.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [obRes, payRes] = await Promise.all([
        fetch(`/api/fees/obligations?studentId=${student.id}`),
        fetch(`/api/fees/payments?studentId=${student.id}`),
      ]);

      if (obRes.ok) {
        const obData = await obRes.json();
        setObligations(obData.obligations || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load student fee ledger:', err);
      setError('Could not retrieve fee obligations for this student.');
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  React.useEffect(() => {
    fetchFeeDetails();
  }, [fetchFeeDetails]);

  const totalAssigned = obligations.reduce((acc, o) => acc + Number(o.amount || 0), 0);
  const totalConcessions = obligations.reduce((acc, o) => acc + Number(o.concessionAmount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === 'SUCCESS').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const netPayable = Math.max(0, totalAssigned - totalConcessions);
  const outstandingBalance = Math.max(0, netPayable - totalPaid);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* Overview Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-4 border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                Fee Account &amp; Financial Ledger
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Institutional Master
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consolidated view of assigned fee plans, term obligations, recorded collections, and active concessions.
              </p>
            </div>
          </div>

          <Link href={`/school/fees/students/${student.id}`}>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Full Fee Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Total Assigned</span>
          <p className="text-lg font-bold font-mono text-foreground">
            {formatCurrency(totalAssigned)}
          </p>
          <span className="text-[10px] text-muted-foreground">Standard Head Dues</span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Concessions</span>
          <p className="text-lg font-bold font-mono text-indigo-600">
            {formatCurrency(totalConcessions)}
          </p>
          <span className="text-[10px] text-muted-foreground">Scholarship / Waiver</span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Total Paid</span>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalPaid)}
          </p>
          <span className="text-[10px] text-muted-foreground">Settled Payments</span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Outstanding Balance</span>
          <p className={`text-lg font-bold font-mono ${outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(outstandingBalance)}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {outstandingBalance === 0 ? 'All Dues Clear' : 'Pending Dues'}
          </span>
        </div>
      </div>

      {/* Term Obligations Breakdown */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            Fee Obligations &amp; Installments
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFeeDetails}
            disabled={isLoading}
            className="h-6 text-[11px] gap-1 px-2"
          >
            <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            Loading fee records...
          </div>
        ) : obligations.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-lg text-muted-foreground text-xs">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground/60" />
            No fee obligations assigned for this student in the current session.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                  <th className="py-2 px-3">Fee Head / Installment</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {obligations.map((ob) => (
                  <tr key={ob.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {ob.feeHead?.name || ob.title || 'Tuition Fee'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                      {ob.dueDate ? new Date(ob.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {formatCurrency(Number(ob.amount))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(Number(ob.paidAmount || 0))}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-2 ${
                          ob.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ob.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {ob.status || 'PENDING'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Log */}
      {payments.length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verified Payment Receipts
          </h4>
          <div className="space-y-2">
            {payments.slice(0, 5).map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-2.5 rounded-md border bg-muted/20 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {formatCurrency(Number(pay.amount))}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {pay.paymentMethod || 'ONLINE'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Receipt #{pay.receiptNumber || pay.id.slice(0, 8)} •{' '}
                    {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/school/fees/receipts/${pay.receiptId || pay.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Receipt className="w-3 h-3" />
                    View Receipt
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
