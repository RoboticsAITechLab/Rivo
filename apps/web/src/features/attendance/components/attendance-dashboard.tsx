'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Save, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassItem } from '../hooks/use-attendance';

interface AttendanceDashboardProps {
  classes: ClassItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  selectedSectionId: string;
  onSectionChange: (sectionId: string) => void;
  metrics: {
    totalEnrolled: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    lateCount: number;
    ratePercentage: number;
  };
  onSaveAttendance: () => void;
  isSaving?: boolean;
}

export function AttendanceDashboard({
  classes,
  selectedDate,
  onDateChange,
  selectedClassId,
  onClassChange,
  selectedSectionId,
  onSectionChange,
  metrics,
  onSaveAttendance,
  isSaving,
}: AttendanceDashboardProps) {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    onDateChange(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    onDateChange(cur.toISOString().split('T')[0]);
  };

  const formattedDisplayDate = React.useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* 1. Top Filters & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-2xs">
        {/* Class & Section pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const cls = classes.find((c) => c.id === e.target.value);
                onClassChange(e.target.value);
                if (cls && cls.sections.length > 0) {
                  onSectionChange(cls.sections[0].id);
                } else {
                  onSectionChange('');
                }
              }}
              className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Grade {cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => onSectionChange(e.target.value)}
              className="h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(!currentClass || currentClass.sections.length === 0) && (
                <option value="">No sections</option>
              )}
              {currentClass?.sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Selector & Save Register CTA */}
        <div className="flex items-center gap-2 justify-between md:justify-end">
          <div className="flex items-center rounded-lg border bg-background px-1.5 py-1 text-xs font-semibold shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrevDay}
              title="Previous Day"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <label className="px-2 flex items-center gap-1.5 text-foreground cursor-pointer">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDisplayDate}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value);
                }}
                className="sr-only"
              />
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextDay}
              title="Next Day"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onSaveAttendance}
            disabled={isSaving || classes.length === 0}
            className="gap-1.5 text-xs shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Enrolled */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{metrics.totalEnrolled}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Enrolled Students</div>
            </div>
          </CardContent>
        </Card>

        {/* Present */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.presentCount}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Present Today</div>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {metrics.absentCount}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Absent Today</div>
            </div>
          </CardContent>
        </Card>

        {/* Late / Leave */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.lateCount + metrics.leaveCount}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Late &amp; Leave</div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card className="col-span-2 lg:col-span-1 shadow-2xs">
          <CardContent className="p-3.5 flex flex-col justify-center gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Attendance Rate</span>
              <span className="text-base font-bold text-foreground">{metrics.ratePercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  metrics.ratePercentage >= 90
                    ? 'bg-emerald-500'
                    : metrics.ratePercentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${metrics.ratePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
