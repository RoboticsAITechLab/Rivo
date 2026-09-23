'use client';

import * as React from 'react';
import { TimetablePeriod } from '../types';
import { DayOfWeek } from '@/features/shared/types';
import { Button } from '@/components/ui/button';
import { Plus, User, MapPin, Edit3, Trash2, Copy, Clock, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_WORKING_DAYS } from '../hooks/use-timetable';

interface TimetableMobileListProps {
  periods: TimetablePeriod[];
  workingDays?: DayOfWeek[];
  onAddSlot: (day: DayOfWeek, startTime: string, periodId?: string) => void;
  onEditPeriod: (period: TimetablePeriod) => void;
  onDuplicatePeriod: (period: TimetablePeriod) => void;
  onDeletePeriod: (period: TimetablePeriod) => void;
}

const DAY_LABELS: Record<DayOfWeek, { label: string; short: string }> = {
  MON: { label: 'Monday', short: 'Mon' },
  TUE: { label: 'Tuesday', short: 'Tue' },
  WED: { label: 'Wednesday', short: 'Wed' },
  THU: { label: 'Thursday', short: 'Thu' },
  FRI: { label: 'Friday', short: 'Fri' },
  SAT: { label: 'Saturday', short: 'Sat' },
  SUN: { label: 'Sunday', short: 'Sun' },
};

export function TimetableMobileList({
  periods,
  workingDays = DEFAULT_WORKING_DAYS,
  onAddSlot,
  onEditPeriod,
  onDuplicatePeriod,
  onDeletePeriod,
}: TimetableMobileListProps) {
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek | null>(null);
  const activeDay = selectedDay && workingDays.includes(selectedDay)
    ? selectedDay
    : (workingDays[0] || 'MON');

  const dayPeriods = React.useMemo(() => {
    return periods
      .filter((p) => p.day === activeDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [periods, activeDay]);

  return (
    <div className="flex flex-col gap-3">
      {/* Dynamic Working Day Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {workingDays.map((d) => {
          const info = DAY_LABELS[d] || { label: d, short: d };
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={cn(
                'flex-1 min-w-[50px] py-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer',
                activeDay === d
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                  : 'bg-card text-muted-foreground border-border/80 hover:bg-muted/40'
              )}
            >
              {info.short}
            </button>
          );
        })}
      </div>

      {/* Daily Periods List */}
      <div className="flex flex-col gap-2.5">
        {dayPeriods.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
            <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No periods scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">There are no periods assigned for this day yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSlot(activeDay, '08:00')}
              className="mt-4 gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Period
            </Button>
          </div>
        ) : (
          dayPeriods.map((period) => {
            if (period.isBreak) {
              return (
                <div
                  key={period.id}
                  className="rounded-lg border border-dashed bg-muted/30 p-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground"
                >
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold">{period.breakLabel || 'Break'}</span>
                  <span>({period.periodSlot})</span>
                </div>
              );
            }

            return (
              <div
                key={period.id}
                className="rounded-xl border bg-card p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary mb-1">
                      {period.periodSlot}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">{period.subjectName}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>{period.teacherName}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-foreground">
                      {period.className}-{period.sectionName}
                    </span>
                    <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{period.room}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicatePeriod(period)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPeriod(period)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePeriod(period)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}

        <Button
          variant="outline"
          onClick={() => onAddSlot(activeDay, '08:00')}
          className="w-full gap-2 border-dashed py-5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Period to {DAY_LABELS[activeDay]?.label || activeDay}
        </Button>
      </div>
    </div>
  );
}
