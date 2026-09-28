'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { FeeNav } from '@/components/fees/fee-nav';
import { FeeFilterBar } from '@/components/fees/fee-filter-bar';
import { FinancialAmount } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { ErrorState } from '@/components/ui/error-state';

interface ReceiptRow {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  totalPaid: number;
  paymentMode: string;
  status: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string | null;
  };
  studentEnrollment?: {
    rollNumber: string | null;
    class: { name: string };
    section: { name: string } | null;
  } | null;
  payment: {
    id: string;
    paymentNumber: string;
    paymentMode: string;
    status: string;
  };
  issuedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function ReceiptsListPage() {
  const router = useRouter();
  const [receipts, setReceipts] = React.useState<ReceiptRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');

  const fetchReceipts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedStatus) params.set('status', selectedStatus);

      const res = await fetch(`/api/fees/receipts?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to view receipts.');
        throw new Error(`Failed to load receipts (HTTP ${res.status})`);
      }
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err?.message || 'Failed to connect to receipts service');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus]);

  React.useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const columns: ColumnDef<ReceiptRow>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {row.receiptNumber}
        </span>
      ),
      width: '150px',
    },
    {
      key: 'date',
      header: 'Receipt Date',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.receiptDate).toLocaleDateString('en-IN', {
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
      header: 'Student',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">
            {row.student.firstName} {row.student.lastName}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Adm #{row.student.admissionNumber || 'N/A'}{' '}
            {row.studentEnrollment?.class?.name ? `· ${row.studentEnrollment.class.name}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'paymentNumber',
      header: 'Payment #',
      render: (row) => (
        <Link
          href={`/school/fees/payments/${row.payment.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-primary hover:underline"
        >
          {row.payment.paymentNumber}
        </Link>
      ),
      width: '150px',
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (row) => (
        <span className="text-xs font-semibold text-foreground">{row.paymentMode}</span>
      ),
      width: '100px',
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <FinancialAmount
            amount={row.totalPaid}
            size="sm"
            variant={row.status === 'CANCELLED' ? 'muted' : 'success'}
            className={row.status === 'CANCELLED' ? 'line-through' : ''}
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
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/school/fees/receipts/${row.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1">
              <Printer className="h-3 w-3" />
              <span>Print</span>
            </Button>
          </Link>
          <Link href={`/school/fees/receipts/${row.id}`}>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary px-2 gap-1">
              View <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ),
      width: '140px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Receipts Center"
        description="Authoritative, tamper-evident payment receipts issued across institutional fee collections"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReceipts}
            disabled={isLoading}
            className="h-8.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <FeeNav />

      {/* Filter Bar */}
      <FeeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by receipt #, payment #, student name or admission #..."
        statusOptions={[
          { label: 'Issued', value: 'ISSUED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        hasActiveFilters={Boolean(searchQuery || selectedStatus)}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedStatus('');
        }}
        className="mb-5"
      />

      {error && !isLoading && (
        <ErrorState
          title="Receipts Unavailable"
          message={error}
          onRetry={fetchReceipts}
          className="my-6"
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={receipts}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Receipts Issued"
        emptyDescription="Fee receipts will appear here automatically upon collecting student fee payments."
        onRowClick={(row) => router.push(`/school/fees/receipts/${row.id}`)}
      />
    </PageContainer>
  );
}
