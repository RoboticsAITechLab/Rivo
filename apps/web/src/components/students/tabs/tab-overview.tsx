'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { StatusBadge } from '@/components/ui/status-badge';
import { Clock, Calendar, User, BookOpen, Award, Activity } from 'lucide-react';

export function TabOverview({ student }: { student: StudentDetail }) {
  return (
    <div className="space-y-4 pt-1">
      {/* 2-Column Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Class & Teacher
            </span>
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {student.className} • Section {student.section}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" /> Class Teacher: {student.currentTeacher}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Enrollment & Status
            </span>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Roll No. #{student.rollNumber}</span>
              <StatusBadge status={student.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enrolled on {student.enrollmentDate} ({student.academicSession})
            </p>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="rounded-lg border bg-card p-3.5 space-y-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-primary" />
          Term Progress Snapshot
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/40 p-2 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Attendance</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {student.attendancePercentage}%
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {student.attendanceSummary.presentDays} of {student.attendanceSummary.totalWorkingDays} days
            </span>
          </div>
          <div className="rounded-md bg-muted/40 p-2 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Homework</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {student.homeworkCompleted} / {student.homeworkTotal}
            </p>
            <span className="text-[10px] text-primary font-medium">
              {Math.round((student.homeworkCompleted / student.homeworkTotal) * 100)}% complete
            </span>
          </div>
          <div className="rounded-md bg-muted/40 p-2 border border-border/50">
            <p className="text-[11px] text-muted-foreground">Average</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {student.averageMarks}%
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Mid-term GPA
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Mini-Timeline */}
      <div className="rounded-lg border bg-card p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Recent Activity
          </h4>
          <span className="text-[10px] text-muted-foreground">Latest updates</span>
        </div>
        <div className="space-y-2 divide-y divide-border/50">
          {student.activityTimeline.slice(0, 3).map((item) => (
            <div key={item.id} className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate">{item.action}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
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
