'use client';

import * as React from 'react';
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  Eye,
  Filter,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { FeeNav } from '@/components/fees/fee-nav';
import { FeeFilterBar } from '@/components/fees/fee-filter-bar';
import { FeeDetailDrawer } from '@/components/fees/fee-detail-drawer';
import { ErrorState } from '@/components/ui/error-state';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  performedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function FeeAuditLogPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState('');

  // Selected Log for Drawer
  const [inspectedLog, setInspectedLog] = React.useState<AuditLog | null>(null);

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedAction) params.set('action', selectedAction);

      const res = await fetch(`/api/fees/audit?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to inspect fee audit logs.');
        throw new Error(`Failed to load audit logs (HTTP ${res.status})`);
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('Error fetching fee audit logs:', err);
      setError(err?.message || 'Failed to connect to fee audit service');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedAction]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
      width: '160px',
    },
    {
      key: 'action',
      header: 'Financial Action',
      render: (row) => {
        let badgeVariant = 'outline';
        if (row.action === 'PAYMENT_COLLECTED') badgeVariant = 'default';
        if (row.action === 'PAYMENT_REVERSED') badgeVariant = 'destructive';

        return (
          <span className="font-mono text-xs font-bold text-foreground">
            {row.action}
          </span>
        );
      },
      width: '180px',
    },
    {
      key: 'entity',
      header: 'Entity / ID',
      render: (row) => (
        <div>
          <span className="font-semibold text-foreground text-xs">{row.entityType}</span>
          <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
            {row.entityId}
          </div>
        </div>
      ),
      width: '160px',
    },
    {
      key: 'actor',
      header: 'Actor / User',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">
            {row.performedByUser.firstName} {row.performedByUser.lastName}
          </div>
          <div className="text-[10px] text-muted-foreground">{row.performedByUser.email}</div>
        </div>
      ),
      width: '160px',
    },
    {
      key: 'details',
      header: 'Audit Payload Details',
      render: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground line-clamp-1">
          {row.details || 'No payload details'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Management Audit Log"
        description="Immutable forensic audit trail of all financial state mutations, payment collections, and balance rollbacks"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
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
        searchPlaceholder="Search audit events by user, ID, or details..."
        statusOptions={[
          { label: 'Payment Collected', value: 'PAYMENT_COLLECTED' },
          { label: 'Payment Reversed', value: 'PAYMENT_REVERSED' },
          { label: 'Plan Published', value: 'PLAN_PUBLISHED' },
          { label: 'Plan Created', value: 'PLAN_CREATED' },
          { label: 'Assignment Created', value: 'ASSIGNMENT_CREATED' },
        ]}
        selectedStatus={selectedAction}
        onStatusChange={setSelectedAction}
        hasActiveFilters={Boolean(searchQuery || selectedAction)}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedAction('');
        }}
        className="mb-5"
      />

      {error && !isLoading && (
        <ErrorState
          title="Audit Log Unavailable"
          message={error}
          onRetry={fetchLogs}
          className="my-6"
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Audit Events Recorded"
        emptyDescription="All financial mutations across fee heads, plans, assignments, and payments will be immutably recorded here."
        onRowClick={(row) => setInspectedLog(row)}
      />

      {/* Audit Detail Drawer */}
      {inspectedLog && (
        <FeeDetailDrawer
          open={!!inspectedLog}
          onOpenChange={(open) => !open && setInspectedLog(null)}
          title={`Audit Event: ${inspectedLog.action}`}
          subtitle={`Recorded ${new Date(inspectedLog.createdAt).toLocaleString('en-IN')}`}
          badge={<Badge variant="outline" className="font-mono text-xs font-bold">{inspectedLog.entityType}</Badge>}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 border rounded-lg bg-muted/20 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Actor Context
              </span>
              <div className="font-bold text-sm text-foreground">
                {inspectedLog.performedByUser.firstName} {inspectedLog.performedByUser.lastName}
              </div>
              <div className="text-muted-foreground">{inspectedLog.performedByUser.email}</div>
              <div className="text-[10px] font-mono text-muted-foreground">User ID: {inspectedLog.performedByUser.id}</div>
            </div>

            <div className="p-3 border rounded-lg bg-card/60 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Target Entity
              </span>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity Type:</span>
                <span className="font-semibold">{inspectedLog.entityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity ID:</span>
                <span className="font-mono font-bold">{inspectedLog.entityId}</span>
              </div>
            </div>

            {inspectedLog.details && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Event Payload Snapshot
                </span>
                <pre className="p-3 rounded-lg bg-muted/40 border text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(inspectedLog.details), null, 2);
                    } catch {
                      return inspectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        </FeeDetailDrawer>
      )}
    </PageContainer>
  );
}
