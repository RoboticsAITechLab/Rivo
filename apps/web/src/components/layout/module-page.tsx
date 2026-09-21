'use client';

import * as React from 'react';
import { LucideIcon, Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

interface ModulePageProps<TData extends object = Record<string, unknown>> {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  stats?: { label: string; value: string; change?: string; isPositive?: boolean }[];
  searchPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  columns?: ColumnDef<TData>[];
  data?: TData[];
}

export function ModulePage<TData extends object>({
  title,
  description,
  icon: Icon,
  badge,
  primaryActionLabel,
  onPrimaryAction,
  stats,
  searchPlaceholder = 'Search records...',
  emptyStateTitle = 'Module Ready for Operational Data',
  emptyStateDescription = 'This module has been initialized for the institution. Operational data tables and management workflows will be connected in subsequent releases.',
  columns,
  data = [],
}: ModulePageProps<TData>) {
  return (
    <PageContainer>
      {/* Unified Page Header */}
      <PageHeader
        title={title}
        description={description}
        icon={Icon}
        badge={badge}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            {primaryActionLabel && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={onPrimaryAction}>
                <Plus className="h-4 w-4" />
                {primaryActionLabel}
              </Button>
            )}
          </>
        }
      />

      {/* KPI Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              change={stat.change}
              isPositive={stat.isPositive}
            />
          ))}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 bg-card text-xs sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Table or Empty State Foundation */}
      {columns && columns.length > 0 && data.length > 0 ? (
        <DataTable columns={columns} data={data} />
      ) : (
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={Icon}
          actionLabel={primaryActionLabel}
          onAction={onPrimaryAction}
        />
      )}
    </PageContainer>
  );
}
