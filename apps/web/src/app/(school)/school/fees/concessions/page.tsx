'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BadgePercent,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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

interface ConcessionRow {
  id: string;
  customConcessionAmount: number;
  concessionReason: string | null;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string | null;
  };
  studentEnrollment?: {
    rollNumber: string | null;
    class: { id: string; name: string };
    section: { id: string; name: string } | null;
  };
  feePlanVersion: {
    id: string;
    versionNumber: number;
    totalAmount: number;
    feePlan: {
      id: string;
      name: string;
      code: string | null;
    };
  };
  assignedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function FeeConcessionsPage() {
  const [concessions, setConcessions] = React.useState<ConcessionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchConcessions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/fees/concessions?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to view concessions.');
        throw new Error(`Failed to load concessions (HTTP ${res.status})`);
      }
      const data = await res.json();
      setConcessions(data.concessions || []);
    } catch (err: any) {
      console.error('Error fetching concessions:', err);
      setError(err?.message || 'Failed to connect to concessions service');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    fetchConcessions();
  }, [fetchConcessions]);

  const columns: ColumnDef<ConcessionRow>[] = [
    {
      key: 'student',
      header: 'Student Name & Admission #',
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
      key: 'plan',
      header: 'Fee Plan',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs line-clamp-1">
            {row.feePlanVersion.feePlan.name}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            v{row.feePlanVersion.versionNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'original',
      header: 'Standard Fee',
      align: 'right',
      render: (row) => (
        <FinancialAmount amount={row.feePlanVersion.totalAmount} size="sm" variant="muted" />
      ),
      width: '120px',
    },
    {
      key: 'concession',
      header: 'Concession / Waiver',
      align: 'right',
      render: (row) => (
        <FinancialAmount amount={row.customConcessionAmount} size="sm" variant="success" />
      ),
      width: '140px',
    },
    {
      key: 'net',
      header: 'Net Payable',
      align: 'right',
      render: (row) => (
        <FinancialAmount
          amount={Math.max(0, Number(row.feePlanVersion.totalAmount) - Number(row.customConcessionAmount))}
          size="sm"
        />
      ),
      width: '120px',
    },
    {
      key: 'reason',
      header: 'Justification / Reason',
      render: (row) => (
        <span className="text-xs text-muted-foreground italic line-clamp-2">
          {row.concessionReason || 'Standard institutional scholarship'}
        </span>
      ),
    },
    {
      key: 'assignedBy',
      header: 'Assigned By',
      render: (row) => (
        <span className="text-xs text-foreground font-medium">
          {row.assignedByUser.firstName} {row.assignedByUser.lastName}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Link href={`/school/fees/students/${row.student.id}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            Ledger <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      ),
      width: '100px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Concessions & Waivers Queue"
        description="Auditable log of institutional fee reductions, sibling scholarships, and approved merit concessions"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConcessions}
            disabled={isLoading}
            className="h-8.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <FeeNav />

      {/* Filter Toolbar */}
      <FeeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search concessions by student name, admission #, or reason..."
        hasActiveFilters={Boolean(searchQuery)}
        onResetFilters={() => setSearchQuery('')}
        className="mb-5"
      />

      {error && !isLoading && (
        <ErrorState
          title="Concessions Queue Unavailable"
          message={error}
          onRetry={fetchConcessions}
          className="my-6"
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={concessions}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Concessions Granted"
        emptyDescription="Student fee concessions and waivers will appear here when custom concessions are approved during plan assignment."
      />
    </PageContainer>
  );
}
