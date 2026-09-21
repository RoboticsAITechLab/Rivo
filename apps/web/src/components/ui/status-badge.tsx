import * as React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export type EntityStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SCHEDULED'
  | 'PENDING'
  | 'COMPLETED'
  | 'URGENT'
  | 'HIGH'
  | 'NORMAL'
  | 'GRADUATED'
  | 'SUSPENDED'
  | 'TRANSFERRED'
  | 'ARCHIVED';

const statusConfig: Record<
  EntityStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
    dotColor: string;
  }
> = {
  ACTIVE: { label: 'Active', variant: 'success', dotColor: 'bg-emerald-500' },
  COMPLETED: { label: 'Completed', variant: 'success', dotColor: 'bg-emerald-500' },
  SCHEDULED: { label: 'Scheduled', variant: 'info', dotColor: 'bg-sky-500' },
  NORMAL: { label: 'Normal', variant: 'secondary', dotColor: 'bg-slate-400' },
  PENDING: { label: 'Pending', variant: 'warning', dotColor: 'bg-amber-500' },
  HIGH: { label: 'High', variant: 'warning', dotColor: 'bg-amber-500' },
  URGENT: { label: 'Urgent', variant: 'destructive', dotColor: 'bg-rose-500' },
  INACTIVE: { label: 'Inactive', variant: 'outline', dotColor: 'bg-slate-400' },
  GRADUATED: { label: 'Graduated', variant: 'secondary', dotColor: 'bg-purple-400' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive', dotColor: 'bg-rose-500' },
  TRANSFERRED: { label: 'Transferred', variant: 'warning', dotColor: 'bg-orange-500' },
  ARCHIVED: { label: 'Archived', variant: 'outline', dotColor: 'bg-zinc-400' },
};

export function StatusBadge({
  status,
  className,
  customLabel,
}: {
  status: EntityStatus | string;
  className?: string;
  customLabel?: string;
}) {
  const config =
    statusConfig[status as EntityStatus] || {
      label: status,
      variant: 'secondary' as const,
      dotColor: 'bg-slate-400',
    };

  return (
    <Badge
      variant={config.variant}
      className={cn('inline-flex items-center gap-1.5 font-medium select-none', className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)} />
      <span>{customLabel || config.label}</span>
    </Badge>
  );
}
