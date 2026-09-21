'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Award, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TabAcademic({ student }: { student: StudentDetail }) {
  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* Top Academic Banner */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-foreground">Cumulative Academic Standing</h4>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Overall GPA benchmark across all registered subjects
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-bold text-2xl text-foreground font-mono">
              {student.averageMarks}%
            </span>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Grade {student.averageMarks >= 90 ? 'A+' : student.averageMarks >= 80 ? 'A' : 'B+'}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Subject Proficiency & Class Benchmark
        </h4>

        <div className="space-y-3.5 pt-1">
          {student.subjectPerformance.map((subj) => (
            <div key={subj.subject} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">{subj.subject}</span>
                  <span className="text-muted-foreground text-[11px] ml-2">
                    ({subj.teacher})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Class Avg: <span className="font-mono">{subj.classAverage}%</span>
                  </span>
                  <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                    Grade {subj.grade}
                  </span>
                  <span className="font-bold font-mono text-xs w-10 text-right">
                    {subj.score}%
                  </span>
                </div>
              </div>

              {/* Progress bar with benchmark mark */}
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    subj.score >= 90
                      ? 'bg-emerald-500'
                      : subj.score >= 80
                      ? 'bg-primary'
                      : 'bg-amber-500',
                  )}
                  style={{ width: `${subj.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
