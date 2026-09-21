'use client';

import * as React from 'react';
import { AttendanceRegisterItem } from '../types';
import { AttendanceStatus } from '@/features/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Clock, MessageSquare, Search, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceRegisterProps {
  items: AttendanceRegisterItem[];
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onOpenReason: (item: AttendanceRegisterItem) => void;
  onOpenHistory: (item: AttendanceRegisterItem) => void;
  onMarkAll: (status: AttendanceStatus) => void;
}

export function AttendanceRegister({
  items,
  onUpdateStatus,
  onOpenReason,
  onOpenHistory,
  onMarkAll,
}: AttendanceRegisterProps) {
  const [search, setSearch] = React.useState('');

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.studentName.toLowerCase().includes(q) ||
        i.admissionNumber.toLowerCase().includes(q) ||
        i.rollNumber.includes(q)
    );
  }, [items, search]);

  return (
    <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or roll number..."
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Quick Batch Marking Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-muted-foreground mr-1 hidden md:inline">Quick Roll-Call:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll('PRESENT')}
            className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 font-medium"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll('ABSENT')}
            className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-500/30 font-medium"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            All Absent
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-3 w-14 text-center">Roll</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-3 w-32">Admission No</th>
              <th className="py-3 px-3 w-28">Punch Time</th>
              <th className="py-3 px-4 w-72 text-center">Status</th>
              <th className="py-3 px-4">Notes / Reason</th>
              <th className="py-3 px-3 w-16 text-center">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No students matched search</p>
                  <p className="text-xs text-muted-foreground">Try searching with a different name or roll number.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                  {/* Roll No */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                    {item.rollNumber}
                  </td>

                  {/* Student */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {item.studentName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenHistory(item)}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate"
                      >
                        {item.studentName}
                      </button>
                    </div>
                  </td>

                  {/* Admission No */}
                  <td className="py-3 px-3 font-mono text-muted-foreground text-[11px]">
                    {item.admissionNumber}
                  </td>

                  {/* Punch Time */}
                  <td className="py-3 px-3">
                    {item.punchTime ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <Clock className="h-3 w-3" />
                        {item.punchTime}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">—</span>
                    )}
                  </td>

                  {/* Interactive Status Segmented Control */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 gap-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.studentId, 'PRESENT')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                          item.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Mark Present"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.studentId, 'ABSENT')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                          item.status === 'ABSENT'
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Mark Absent"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.studentId, 'LATE')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                          item.status === 'LATE'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Mark Late Arrival"
                      >
                        L
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.studentId, 'LEAVE')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                          item.status === 'LEAVE'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Mark Authorized Leave"
                      >
                        LV
                      </button>
                    </div>
                  </td>

                  {/* Reason / Notes */}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onOpenReason(item)}
                      className={cn(
                        'text-xs text-left truncate max-w-[200px] flex items-center gap-1.5 transition-colors',
                        item.reason
                          ? 'text-foreground hover:text-primary font-medium'
                          : 'text-muted-foreground/60 hover:text-foreground italic'
                      )}
                    >
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.reason || '+ Add note'}</span>
                    </button>
                  </td>

                  {/* Actions (View Profile Sheet) */}
                  <td className="py-3 px-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenHistory(item)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="View Student 360 Attendance Profile"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Count Bar */}
      <div className="p-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filteredItems.length} of {items.length} students</span>
        <span>{items[0]?.markedBy ? `Marked by ${items[0].markedBy}` : 'Attendance Register'}</span>
      </div>
    </div>
  );
}
