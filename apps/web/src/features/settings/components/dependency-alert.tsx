'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DependencyAlertProps {
  title: string;
  description?: string;
  message?: string;
  configureHref?: string;
  actionHref?: string;
  configureLabel?: string;
  actionText?: string;
  severity?: 'warning' | 'info' | 'success';
  className?: string;
}

export function DependencyAlert({
  title,
  description,
  message,
  configureHref,
  actionHref,
  configureLabel = 'Configure →',
  actionText,
  severity = 'warning',
  className,
}: DependencyAlertProps) {
  const finalDesc = description || message || '';
  const finalHref = configureHref || actionHref || '#';
  const finalLabel = actionText || configureLabel;
  const isWarning = severity === 'warning';
  const isInfo = severity === 'info';

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
        isWarning && 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200',
        isInfo && 'bg-blue-500/10 border-blue-500/25 text-blue-900 dark:text-blue-200',
        !isWarning && !isInfo && 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {isWarning && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
        {isInfo && <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
        {!isWarning && !isInfo && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{title}</div>
          <div className="text-muted-foreground">{finalDesc}</div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 self-start sm:self-auto shrink-0 border-current"
        asChild
      >
        <Link href={finalHref}>
          {finalLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
