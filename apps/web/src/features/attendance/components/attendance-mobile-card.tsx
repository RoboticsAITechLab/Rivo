'use client';

import * as React from 'react';
import { AttendanceRegisterItem } from '../types';
import { AttendanceStatus } from '@/features/shared/types';
import { MessageSquare, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceMobileCardProps {
  item: AttendanceRegisterItem;
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onOpenReason: (item: AttendanceRegisterItem) => void;
  onOpenHistory: (item: AttendanceRegisterItem) => void;
}

export function AttendanceMobileCard({
  item,
  onUpdateStatus,
  onOpenReason,
  onOpenHistory,
}: AttendanceMobileCardProps) {
  const statuses: { value: AttendanceStatus; label: string; activeClass: string }[] = [
    { value: 'PRESENT', label: 'P', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'ABSENT', label: 'A', activeClass: 'bg-red-600 text-white border-red-600' },
    { value: 'LATE', label: 'L', activeClass: 'bg-blue-600 text-white border-blue-600' },
    { value: 'LEAVE', label: 'LV', activeClass: 'bg-amber-600 text-white border-amber-600' },
  ];

  return (
    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {item.rollNumber}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenHistory(item)}
              className="font-bold text-xs text-foreground truncate hover:text-primary transition-colors text-left block"
            >
              {item.studentName}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <span>{item.admissionNumber}</span>
              {item.punchTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-2.5 w-2.5" />
                    {item.punchTime}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenReason(item)}
          className={cn(
            'p-1.5 rounded-md border text-xs transition-colors shrink-0',
            item.reason
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              : 'border-border/60 text-muted-foreground hover:bg-muted/40'
          )}
          title={item.reason ? `Reason: ${item.reason}` : 'Add note/reason'}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      </div>

      {item.reason && (
        <div className="text-[11px] bg-muted/40 border border-border/50 rounded p-1.5 text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3 text-primary shrink-0" />
          <span className="truncate">{item.reason}</span>
        </div>
      )}

      {/* Touch-Friendly Status Selection Buttons */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {statuses.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => onUpdateStatus(item.studentId, st.value)}
            className={cn(
              'py-1.5 rounded-lg text-xs font-bold border transition-all',
              item.status === st.value
                ? st.activeClass
                : 'bg-muted/20 text-muted-foreground border-border/80 hover:bg-muted/50'
            )}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}
