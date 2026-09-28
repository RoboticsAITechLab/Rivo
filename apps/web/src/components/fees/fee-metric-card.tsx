import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { FinancialAmount } from './financial-amount';
import { LucideIcon } from 'lucide-react';

interface FeeMetricCardProps {
  title: string;
  amount: number | string | null | undefined;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  subtext?: string;
  icon?: LucideIcon;
  compactNumber?: boolean;
  className?: string;
}

export function FeeMetricCard({
  title,
  amount,
  variant = 'default',
  subtext,
  icon: Icon,
  compactNumber = false,
  className,
}: FeeMetricCardProps) {
  const topBarClasses = {
    default: 'bg-primary/40',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-rose-500',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card border-border/80 shadow-2xs hover:border-border transition-colors',
        className
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-0.75', topBarClasses[variant])} />
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <FinancialAmount
            amount={amount}
            size="2xl"
            variant={variant}
            compact={compactNumber}
          />
        </div>

        {subtext && (
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
