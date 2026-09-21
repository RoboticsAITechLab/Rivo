import * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { KpiMetric } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { NavIcon } from '@/components/navigation/nav-icon';
import { cn } from '@/lib/utils';

export function KpiCard({ kpi }: { kpi: KpiMetric }) {
  return (
    <Card className="overflow-hidden hover:border-primary/40 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {kpi.title}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <NavIcon name={kpi.iconName} className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {kpi.value}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                kpi.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {kpi.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {kpi.change}
            </span>
            <span className="text-muted-foreground truncate">{kpi.timeframe}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
