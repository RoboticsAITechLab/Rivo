'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  FileEdit,
  Eye,
  ArrowRight,
  ShieldCheck,
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
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

interface FeePlanVersion {
  id: string;
  versionNumber: number;
  totalAmount: number;
  status: string;
  publishedAt: string | null;
  items: any[];
  installments: any[];
}

interface FeePlan {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  class: { id: string; name: string };
  section: { id: string; name: string } | null;
  campus: { id: string; name: string } | null;
  academicSession: { id: string; name: string };
  versions: FeePlanVersion[];
}

export default function FeePlansListPage() {
  const router = useRouter();
  const [plans, setPlans] = React.useState<FeePlan[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sessions, setSessions] = React.useState<Array<{ label: string; value: string }>>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [campuses, setCampuses] = React.useState<Array<{ label: string; value: string }>>([]);
  const [selectedCampusId, setSelectedCampusId] = React.useState('');
  const [classes, setClasses] = React.useState<Array<{ label: string; value: string }>>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');

  // Publish Dialog
  const [publishPlan, setPublishPlan] = React.useState<FeePlan | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);

  // Load Metadata
  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [sessRes, campRes, classRes] = await Promise.all([
          fetch('/api/academic-sessions'),
          fetch('/api/campuses'),
          fetch('/api/classes'),
        ]);

        if (sessRes.ok) {
          const s = await sessRes.json();
          const list = s.sessions || s.academicSessions || [];
          setSessions(list.map((item: any) => ({ label: item.name, value: item.id })));
          const active = list.find((item: any) => item.status === 'ACTIVE');
          if (active) setSelectedSessionId(active.id);
        }
        if (campRes.ok) {
          const c = await campRes.json();
          setCampuses((c.campuses || []).map((item: any) => ({ label: item.name, value: item.id })));
        }
        if (classRes.ok) {
          const cl = await classRes.json();
          setClasses((cl.classes || []).map((item: any) => ({ label: item.name, value: item.id })));
        }
      } catch (err) {
        console.warn('Failed to load filter metadata', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Plans
  const fetchPlans = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSessionId) params.set('academicSessionId', selectedSessionId);
      if (selectedCampusId) params.set('campusId', selectedCampusId);
      if (selectedClassId) params.set('classId', selectedClassId);

      const res = await fetch(`/api/fees/plans?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to view fee plans.');
        throw new Error(`Failed to load fee plans (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err: any) {
      console.error('Error fetching fee plans:', err);
      setError(err?.message || 'Unable to connect to fee plans service.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionId, selectedCampusId, selectedClassId]);

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle Publish
  const handleConfirmPublish = async () => {
    if (!publishPlan) return;
    setIsPublishing(true);
    try {
      const latestVer = publishPlan.versions[0]?.versionNumber || 1;
      const res = await fetch(`/api/fees/plans/${publishPlan.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber: latestVer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish version');

      toast.success(`Fee plan '${publishPlan.name}' v${latestVer} published and locked.`);
      setPublishPlan(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered List
  const filteredPlans = React.useMemo(() => {
    return plans.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code?.toLowerCase().includes(q);
        const matchClass = p.class?.name.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClass) return false;
      }
      if (selectedStatus) {
        const latestVerStatus = p.versions[0]?.status || p.status;
        if (latestVerStatus !== selectedStatus) return false;
      }
      return true;
    });
  }, [plans, searchQuery, selectedStatus]);

  const columns: ColumnDef<FeePlan>[] = [
    {
      key: 'name',
      header: 'Plan Name & Code',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{row.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {row.code && (
              <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1 rounded">
                {row.code}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {row.academicSession?.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'targeting',
      header: 'Cohort Target',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{row.class?.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {row.section?.name ? `Sec ${row.section.name}` : 'All Sections'}
            {row.campus?.name ? ` · ${row.campus.name}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => {
        const ver = row.versions[0];
        const isPublished = ver?.status === 'PUBLISHED';
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs">
              v{ver?.versionNumber ?? row.currentVersion}
            </span>
            <FeeStatusBadge status={ver?.status || row.status} size="sm" />
          </div>
        );
      },
      width: '130px',
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      render: (row) => {
        const ver = row.versions[0];
        return (
          <div className="text-right">
            <FinancialAmount amount={ver?.totalAmount ?? 0} size="sm" />
            <div className="text-[10px] text-muted-foreground">
              {ver?.installments?.length || 0} installments
            </div>
          </div>
        );
      },
      width: '130px',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const ver = row.versions[0];
        const isDraft = ver?.status === 'DRAFT';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {isDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPublishPlan(row);
                }}
                className="h-7 text-[11px] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 px-2"
              >
                <Lock className="h-3 w-3" />
                Publish
              </Button>
            )}
            <Link href={`/school/fees/plans/${row.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-primary">
                Open <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        );
      },
      width: '160px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Plans & Schedules"
        description="Versioned fee templates with institutional component breakdowns, installment schedules, and cohort targeting"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPlans}
              disabled={isLoading}
              className="h-8.5 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/school/fees/plans/new">
              <Button size="sm" className="h-8.5 text-xs gap-1.5 font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Create Fee Plan
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
        searchPlaceholder="Search plans by name, code or grade..."
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSessionChange={setSelectedSessionId}
        campuses={campuses}
        selectedCampusId={selectedCampusId}
        onCampusChange={setSelectedCampusId}
        classes={classes}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        statusOptions={[
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Draft', value: 'DRAFT' },
        ]}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        hasActiveFilters={Boolean(
          searchQuery || selectedCampusId || selectedClassId || selectedStatus
        )}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedCampusId('');
          setSelectedClassId('');
          setSelectedStatus('');
        }}
        className="mb-5"
      />

      {error && !isLoading && (
        <ErrorState
          title="Fee Plans Unavailable"
          message={error}
          onRetry={fetchPlans}
          className="my-6"
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPlans}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Fee Plans Configured"
        emptyDescription="Create your first fee plan to define annual tuition, facilities, and installment schedules."
        onRowClick={(row) => router.push(`/school/fees/plans/${row.id}`)}
      />

      {/* Publish Confirmation Dialog */}
      {publishPlan && (
        <FinancialConfirmDialog
          open={!!publishPlan}
          onOpenChange={(open) => !open && setPublishPlan(null)}
          title={`Publish Fee Plan: ${publishPlan.name}`}
          description="Publishing makes this version authoritative and strictly immutable. Future structural modifications will require creating version v2."
          confirmLabel="Publish & Lock Version"
          variant="warning"
          isLoading={isPublishing}
          onConfirm={handleConfirmPublish}
        >
          <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-bold font-mono">v{publishPlan.versions[0]?.versionNumber || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cohort:</span>
              <span className="font-bold">{publishPlan.class?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Plan Amount:</span>
              <FinancialAmount amount={publishPlan.versions[0]?.totalAmount} size="sm" />
            </div>
          </div>
        </FinancialConfirmDialog>
      )}
    </PageContainer>
  );
}
