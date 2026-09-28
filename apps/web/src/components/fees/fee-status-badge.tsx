import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  Lock,
  RotateCcw,
  Check,
} from 'lucide-react';

export type FinancialStatus =
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'WAIVED'
  | 'CANCELLED'
  | 'COLLECTED'
  | 'REVERSED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'ARCHIVED'
  | 'ISSUED'
  | string;

interface FeeStatusBadgeProps {
  status: FinancialStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function FeeStatusBadge({
  status,
  size = 'md',
  className,
}: FeeStatusBadgeProps) {
  const norm = (status || '').toUpperCase().replace(/\s+/g, '_');

  let label = status;
  let bgClass = 'bg-muted text-muted-foreground border-border';
  let dotClass = 'bg-muted-foreground';
  let IconComponent: React.ComponentType<{ className?: string }> = Clock;

  switch (norm) {
    case 'PAID':
    case 'COLLECTED':
    case 'ISSUED':
    case 'ACTIVE':
      label = norm === 'PAID' ? 'Paid' : norm === 'COLLECTED' ? 'Collected' : norm === 'ISSUED' ? 'Issued' : 'Active';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      dotClass = 'bg-emerald-500';
      IconComponent = CheckCircle2;
      break;

    case 'PARTIALLY_PAID':
      label = 'Partially Paid';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      dotClass = 'bg-blue-500';
      IconComponent = Clock;
      break;

    case 'PENDING':
      label = 'Pending';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      dotClass = 'bg-amber-500';
      IconComponent = Clock;
      break;

    case 'OVERDUE':
      label = 'Overdue';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      dotClass = 'bg-rose-500 animate-pulse';
      IconComponent = AlertCircle;
      break;

    case 'PUBLISHED':
      label = 'Published';
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-semibold';
      dotClass = 'bg-emerald-600';
      IconComponent = Lock;
      break;

    case 'DRAFT':
      label = 'Draft';
      bgClass = 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-300 dark:border-zinc-800';
      dotClass = 'bg-zinc-400';
      IconComponent = FileEdit;
      break;

    case 'REVERSED':
      label = 'Reversed';
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 line-through';
      dotClass = 'bg-purple-500';
      IconComponent = RotateCcw;
      break;

    case 'CANCELLED':
      label = 'Cancelled';
      bgClass = 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800 line-through';
      dotClass = 'bg-zinc-400';
      IconComponent = XCircle;
      break;

    case 'WAIVED':
      label = 'Waived';
      bgClass = 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60';
      dotClass = 'bg-teal-500';
      IconComponent = Check;
      break;

    case 'SUPERSEDED':
      label = 'Superseded';
      bgClass = 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800';
      dotClass = 'bg-zinc-400';
      IconComponent = Lock;
      break;

    default:
      label = status || 'Unknown';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        bgClass,
        className
      )}
    >
      <IconComponent className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', 'shrink-0')} />
      <span>{label}</span>
    </span>
  );
}
