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
    <Card className={cn('overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-xs', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {title}
          </span>
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {(change || timeframe) && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {change && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    isPositive === true
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isPositive === false
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {isPositive === true && <TrendingUp className="h-3 w-3" />}
                  {isPositive === false && <TrendingDown className="h-3 w-3" />}
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
