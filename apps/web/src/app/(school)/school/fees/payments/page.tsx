'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Printer,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { FeeNav } from '@/components/fees/fee-nav';
import { FeeFilterBar } from '@/components/fees/fee-filter-bar';
import { FinancialAmount } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { FeeDetailDrawer } from '@/components/fees/fee-detail-drawer';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

interface PaymentRow {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  status: string;
  referenceNumber?: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string | null;
  };
  receipt?: {
    id: string;
    receiptNumber: string;
  } | null;
  allocations: Array<{
    id: string;
    allocatedAmount: number;
    obligation?: { id: string; title: string; dueDate: string };
  }>;
}

export default function PaymentsListPage() {
  const router = useRouter();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedMode, setSelectedMode] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');

  // Drawer Inspection
  const [inspectedPayment, setInspectedPayment] = React.useState<PaymentRow | null>(null);

  // Reversal Dialog
  const [reversalPayment, setReversalPayment] = React.useState<PaymentRow | null>(null);
  const [isReversing, setIsReversing] = React.useState(false);

  const fetchPayments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fees/payments');
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to view payments.');
        throw new Error(`Failed to load payments (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err?.message || 'Failed to connect to payments transaction service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle Payment Reversal
  const handleReverse = async (reason?: string) => {
    if (!reversalPayment || !reason) return;
    setIsReversing(true);
    try {
      const res = await fetch(`/api/fees/payments/${reversalPayment.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reversalReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment reversal failed');

      toast.success(
        `Payment ${reversalPayment.paymentNumber} reversed. Obligation balances rolled back.`
      );
      setReversalPayment(null);
      setInspectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reverse payment.');
    } finally {
      setIsReversing(false);
    }
  };

  // Filter Payments
  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNumber = p.paymentNumber.toLowerCase().includes(q);
        const matchStudent = `${p.student.firstName} ${p.student.lastName}`.toLowerCase().includes(q);
        const matchAdm = p.student.admissionNumber?.toLowerCase().includes(q);
        const matchReceipt = p.receipt?.receiptNumber.toLowerCase().includes(q);
        if (!matchNumber && !matchStudent && !matchAdm && !matchReceipt) return false;
      }
      if (selectedMode && p.paymentMode !== selectedMode) return false;
      if (selectedStatus && p.status !== selectedStatus) return false;
      return true;
    });
  }, [payments, searchQuery, selectedMode, selectedStatus]);

  const columns: ColumnDef<PaymentRow>[] = [
    {
      key: 'paymentNumber',
      header: 'Payment Number',
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {row.paymentNumber}
        </span>
      ),
      width: '150px',
    },
    {
      key: 'date',
      header: 'Payment Date',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.paymentDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'student',
      header: 'Student Identity',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">
            {row.student.firstName} {row.student.lastName}
          </div>
          {row.student.admissionNumber && (
            <div className="text-[11px] text-muted-foreground font-mono">
              Adm: {row.student.admissionNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (row) => (
        <span className="text-xs font-semibold text-foreground">{row.paymentMode}</span>
      ),
      width: '110px',
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <FinancialAmount
            amount={row.amount}
            size="sm"
            variant={row.status === 'REVERSED' ? 'muted' : 'success'}
            className={row.status === 'REVERSED' ? 'line-through' : ''}
          />
        </div>
      ),
      width: '120px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <FeeStatusBadge status={row.status} size="sm" />,
      width: '120px',
    },
    {
      key: 'receipt',
      header: 'Receipt #',
      render: (row) =>
        row.receipt ? (
          <Link
            href={`/school/fees/receipts/${row.receipt.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            {row.receipt.receiptNumber}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        ),
      width: '140px',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.receipt && (
            <Link href={`/school/fees/receipts/${row.receipt.id}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1">
                <Printer className="h-3 w-3" />
                <span className="hidden sm:inline">Receipt</span>
              </Button>
            </Link>
          )}
          <Link href={`/school/fees/payments/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2 gap-1">
              Details <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ),
      width: '160px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Payments & Transactions"
        description="Authoritative transaction ledger of collected school fees, cashier settlements, and payment audit logs"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayments}
              disabled={isLoading}
              className="h-8.5 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/school/fees/payments/new">
              <Button size="sm" className="h-8.5 text-xs gap-1.5 font-bold">
                <Plus className="h-3.5 w-3.5" />
                Collect Payment
              </Button>
            </Link>
          </div>
        }
      />

      <FeeNav />

      {/* Filter Toolbar */}
      <FeeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by payment #, student name, admission #, or receipt #..."
        statusOptions={[
          { label: 'Collected', value: 'COLLECTED' },
          { label: 'Reversed', value: 'REVERSED' },
        ]}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        hasActiveFilters={Boolean(searchQuery || selectedMode || selectedStatus)}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedMode('');
          setSelectedStatus('');
        }}
        className="mb-5"
      />

      {error && !isLoading && (
        <ErrorState
          title="Payments Unavailable"
          message={error}
          onRetry={fetchPayments}
          className="my-6"
        />
      )}

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Payments Recorded"
        emptyDescription="No fee payment records found. Use 'Collect Payment' to record a student fee payment."
        onRowClick={(row) => setInspectedPayment(row)}
      />

      {/* Slide-over Detail Drawer (Stripe Pattern) */}
      {inspectedPayment && (
        <FeeDetailDrawer
          open={!!inspectedPayment}
          onOpenChange={(open) => !open && setInspectedPayment(null)}
          title={inspectedPayment.paymentNumber}
          subtitle={`Recorded on ${new Date(inspectedPayment.paymentDate).toLocaleDateString('en-IN')}`}
          badge={<FeeStatusBadge status={inspectedPayment.status} size="sm" />}
          onOpenFullDetail={() => router.push(`/school/fees/payments/${inspectedPayment.id}`)}
          onPrint={inspectedPayment.receipt ? () => router.push(`/school/fees/receipts/${inspectedPayment.receipt!.id}`) : undefined}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-muted/20 rounded-lg space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold">Student Identity</span>
              <div className="font-bold text-sm text-foreground">
                {inspectedPayment.student.firstName} {inspectedPayment.student.lastName}
              </div>
              <div className="text-muted-foreground font-mono">
                Adm #{inspectedPayment.student.admissionNumber || 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase block">Amount</span>
                <FinancialAmount amount={inspectedPayment.amount} size="lg" variant={inspectedPayment.status === 'REVERSED' ? 'muted' : 'success'} />
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase block">Mode</span>
                <span className="font-bold text-foreground">{inspectedPayment.paymentMode}</span>
              </div>
            </div>

            {/* Obligations Allocated */}
            <div className="space-y-2 border-t pt-3">
              <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">
                Settled Obligations
              </span>
              {inspectedPayment.allocations && inspectedPayment.allocations.length > 0 ? (
                <div className="divide-y border rounded-lg bg-card/60">
                  {inspectedPayment.allocations.map((alloc) => (
                    <div key={alloc.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-foreground">
                          {alloc.obligation?.title || 'Obligation'}
                        </div>
                        {alloc.obligation?.dueDate && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Due: {new Date(alloc.obligation.dueDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                      <FinancialAmount amount={alloc.allocatedAmount} size="sm" variant="success" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No allocations recorded.</p>
              )}
            </div>

            {/* Reversal Action */}
            {inspectedPayment.status !== 'REVERSED' && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setReversalPayment(inspectedPayment)}
                  className="w-full text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reverse Payment
                </Button>
              </div>
            )}
          </div>
        </FeeDetailDrawer>
      )}

      {/* Reversal Confirmation Dialog */}
      {reversalPayment && (
        <FinancialConfirmDialog
          open={!!reversalPayment}
          onOpenChange={(open) => !open && setReversalPayment(null)}
          title={`Reverse Payment: ${reversalPayment.paymentNumber}`}
          description="Reversing this transaction will restore the student's obligation balances and permanently mark the associated receipt as Cancelled."
          confirmLabel="Execute Reversal & Roll Back"
          variant="destructive"
          requiresReason
          reasonLabel="Mandatory Financial Reversal Reason"
          reasonPlaceholder="Specify exact audit justification for rollback (minimum 5 characters)..."
          minReasonLength={5}
          isLoading={isReversing}
          onConfirm={handleReverse}
        >
          <div className="p-3 rounded-lg border bg-rose-50/40 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Amount to roll back:</span>
              <FinancialAmount amount={reversalPayment.amount} size="sm" variant="destructive" />
            </div>
            <div className="flex justify-between">
              <span>Student:</span>
              <span className="font-bold">{reversalPayment.student.firstName} {reversalPayment.student.lastName}</span>
            </div>
          </div>
        </FinancialConfirmDialog>
      )}
    </PageContainer>
  );
}
