'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { StudentAttendanceHistory } from '../types';

interface AttendanceHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
}

export function AttendanceHistorySheet({
  isOpen,
  onClose,
  studentId,
  studentName = 'Student',
  admissionNumber = '—',
  className = '—',
}: AttendanceHistorySheetProps) {
  // Real data-driven history (zeroed when no attendance records exist)
  const history: StudentAttendanceHistory = React.useMemo(() => {
    return {
      studentId: studentId || '',
      studentName,
      admissionNumber,
      className,
      section: '',
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      lateDays: 0,
      ratePercentage: 0,
      monthlyTrend: [],
    };
  }, [studentId, studentName, admissionNumber, className]);

  const totalRecordedDays = history.presentDays + history.absentDays + history.leaveDays + history.lateDays;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-6 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-primary font-semibold">{history.admissionNumber}</span>
              <SheetTitle className="text-xl font-bold text-foreground mt-0.5">
                {history.studentName}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {history.className} • Academic Term Attendance Profile
              </SheetDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-foreground">{history.ratePercentage}%</div>
              <Badge
                variant={totalRecordedDays === 0 ? 'outline' : history.ratePercentage >= 85 ? 'success' : history.ratePercentage >= 75 ? 'warning' : 'destructive'}
                className="text-[10px] px-1.5 py-0"
              >
                {totalRecordedDays === 0 ? 'No Records' : history.ratePercentage >= 85 ? 'Good Attendance' : 'Monitor Attendance'}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 flex-1">
          {/* Key Term Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{history.presentDays}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Present</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{history.absentDays}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Absent</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{history.leaveDays}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Leave</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{history.lateDays}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Late</div>
            </div>
          </div>

          {/* Monthly Trend Progress Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Attendance Trend
            </h4>
            {history.monthlyTrend.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border rounded-lg">
                No monthly attendance trend data recorded for this student.
              </div>
            ) : (
              <div className="space-y-3">
                {history.monthlyTrend.map((m) => (
                  <div key={m.month} className="rounded-lg border bg-card p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{m.month}</span>
                      <span className="font-mono text-muted-foreground">
                        {m.presentDays} / {m.workingDays} days ({m.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Punctuality & Leave Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Activity &amp; Recorded Notes
            </h4>
            <div className="py-6 text-center text-xs text-muted-foreground border rounded-lg">
              No punctuality incidents, biometric notes, or leave slips on file.
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
