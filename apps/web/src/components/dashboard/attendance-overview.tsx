import * as React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { AttendanceSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AttendanceOverview({
  data,
}: {
  data: AttendanceSummary;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Attendance Overview</CardTitle>
            <CardDescription className="text-xs">
              Daily student attendance rate across all enrolled divisions
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {data.todayPercentage}% Today
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-5">
        {/* KPI Mini Stat Summary */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground border">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Total Enrolled</div>
              <div className="text-sm font-bold text-foreground">{data.totalEnrolled}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Present</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {data.presentCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 border border-rose-200 dark:border-rose-800">
              <UserX className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Absent</div>
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {data.absentCount}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Trend Visual Bars */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Weekly Attendance Trend
          </div>
          <div className="space-y-2 pt-1">
            {data.weeklyTrend.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground w-14">
                    {item.day} <span className="text-muted-foreground font-normal">({item.date})</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {item.present} / {item.present + item.absent}
                    </span>
                    <span className="font-semibold text-foreground w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                {/* Progress track */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
