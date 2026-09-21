'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { CalendarCheck, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TabAttendance({ student }: { student: StudentDetail }) {
  const { attendanceSummary } = student;

  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Overall Rate</span>
          <p className="text-xl font-bold text-foreground">
            {attendanceSummary.overallPercentage}%
          </p>
          <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Good Standing
          </span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" /> Present
          </span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {attendanceSummary.presentDays}
          </p>
          <span className="text-[10px] text-muted-foreground">Days Attended</span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
            <XCircle className="h-3 w-3 text-rose-500" /> Absent
          </span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {attendanceSummary.absentDays}
          </p>
          <span className="text-[10px] text-muted-foreground">Days Missed</span>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" /> Late
          </span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {attendanceSummary.lateDays}
          </p>
          <span className="text-[10px] text-muted-foreground">Tardy Logs</span>
        </div>
      </div>

      {/* Monthly Attendance Progress Visualization */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-primary" />
          Monthly Attendance Rate (2026 Academic Term)
        </h4>

        <div className="space-y-2.5 pt-1">
          {attendanceSummary.monthlyTrend.map((m) => (
            <div key={m.month} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground w-12">{m.month}</span>
                <span className="text-muted-foreground text-[11px]">
                  {m.presentDays} / {m.workingDays} days
                </span>
                <span className="font-bold font-mono text-xs w-12 text-right">
                  {m.percentage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    m.percentage >= 90
                      ? 'bg-emerald-500'
                      : m.percentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-rose-500',
                  )}
                  style={{ width: `${m.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attendance Records Log Table */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          Recent Daily Logs
        </h4>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Day</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Punch Time</th>
                <th className="py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {attendanceSummary.recentRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/30">
                  <td className="py-2 px-3 font-semibold text-foreground">{rec.date}</td>
                  <td className="py-2 px-3 text-muted-foreground">{rec.day}</td>
                  <td className="py-2 px-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold select-none',
                        rec.status === 'PRESENT' &&
                          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        rec.status === 'ABSENT' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                        rec.status === 'LATE' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          rec.status === 'PRESENT' && 'bg-emerald-500',
                          rec.status === 'ABSENT' && 'bg-rose-500',
                          rec.status === 'LATE' && 'bg-amber-500',
                        )}
                      />
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                    {rec.punchTime || '—'}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-[11px]">{rec.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
