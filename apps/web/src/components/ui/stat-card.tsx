import * as React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  timeframe?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  isPositive,
  timeframe,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-xs focus-within:ring-2 focus-within:ring-primary/40 border-border/80 bg-card',
        className
      )}
    >
      {/* Light accent indicator along top edge */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-transparent group-hover:bg-primary/50 transition-colors" />

      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase truncate">
            {title}
          </span>
          {Icon && (
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/8 text-primary shrink-0 transition-colors group-hover:bg-primary/15 dark:bg-primary/15">
              <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
          )}
        </div>

        <div className="mt-2.5 sm:mt-3">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
            {value}
          </div>
          {(change || timeframe) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              {change && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]',
                    isPositive === true
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                      : isPositive === false
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                      : 'bg-muted/70 text-muted-foreground border border-border/50',
                  )}
                >
                  {isPositive === true && <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                  {isPositive === false && <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                  {change}
                </span>
              )}
              {timeframe && (
                <span className="text-muted-foreground truncate">{timeframe}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
