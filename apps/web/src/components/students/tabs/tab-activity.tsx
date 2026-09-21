'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Activity, Clock, CheckCircle2, BookOpen, Award, UserCheck, ShieldAlert } from 'lucide-react';

export function TabActivity({ student }: { student: StudentDetail }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'RESULT':
        return <Award className="h-3.5 w-3.5 text-amber-500" />;
      case 'HOMEWORK':
        return <BookOpen className="h-3.5 w-3.5 text-primary" />;
      case 'ATTENDANCE':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'PROFILE':
        return <UserCheck className="h-3.5 w-3.5 text-sky-500" />;
      case 'STATUS':
        return <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-4 pt-1 text-xs">
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Audit Log & Activity History
          </h4>
          <span className="text-[11px] text-muted-foreground">
            {student.activityTimeline.length} recorded events
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {student.activityTimeline.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot icon */}
              <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card shadow-xs">
                {getCategoryIcon(item.category)}
              </div>

              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                  <span className="font-semibold text-foreground text-xs">{item.action}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
