'use client';

import * as React from 'react';
import { TimetablePeriod } from '../types';
import { DayOfWeek } from '@/features/shared/types';
import { TimetablePeriodCard } from './timetable-period-card';
import { Plus, Coffee, Utensils, Flag, Activity } from 'lucide-react';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { selectActiveSchedule } from '@/shared/selectors';

interface TimetableGridProps {
  periods: TimetablePeriod[];
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

export function TimetableGrid({
  periods,
  onAddSlot,
  onEditPeriod,
  onDuplicatePeriod,
  onDeletePeriod,
}: TimetableGridProps) {
  const store = useSchoolStore();
  const activeSchedule = selectActiveSchedule(store);

  const workingDays: DayOfWeek[] = React.useMemo(() => {
    return activeSchedule?.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }, [activeSchedule]);

  const scheduleBlocks = React.useMemo(() => {
    return activeSchedule?.blocks ? [...activeSchedule.blocks].sort((a, b) => a.order - b.order) : [];
  }, [activeSchedule]);

  if (scheduleBlocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Bell Schedule Configured</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Please configure periods, intervals, and teaching slots in Schedule Settings to initialize the timetable grid.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[900px]">
          {/* Header row: Configurable Working Days */}
          <thead>
            <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
              <th className="p-3 w-40 text-center border-r">Schedule Block</th>
              {workingDays.map((day) => {
                const info = DAY_LABELS[day] || { label: day, short: day };
                return (
                  <th key={day} className="p-3 text-center border-r last:border-r-0 font-bold text-foreground">
                    <div>{info.label}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{info.short}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {scheduleBlocks.map((block) => {
              const isNonTeaching = block.type !== 'TEACHING';

              if (isNonTeaching) {
                const Icon =
                  block.type === 'LUNCH'
                    ? Utensils
                    : block.type === 'ASSEMBLY'
                    ? Flag
                    : block.type === 'ACTIVITY'
                    ? Activity
                    : Coffee;

                return (
                  <tr key={`block-${block.id}`} className="border-b bg-muted/20 border-dashed">
                    <td className="p-2.5 text-center text-xs font-mono font-medium text-muted-foreground border-r bg-muted/30">
                      <div>{block.startTime} – {block.endTime}</div>
                      <div className="text-[10px] font-sans text-muted-foreground/70">{block.name}</div>
                    </td>
                    <td colSpan={workingDays.length} className="p-2 text-center text-xs text-muted-foreground">
                      <div className="inline-flex items-center gap-1.5 font-medium italic text-muted-foreground/80">
                        <Icon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{block.name} ({block.startTime} – {block.endTime})</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`block-${block.id}`} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                  {/* Period Time Slot Column */}
                  <td className="p-3 text-center border-r bg-muted/10 align-middle w-40">
                    <div className="text-xs font-mono font-semibold text-foreground">
                      {block.startTime} – {block.endTime}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                      {block.name}
                    </div>
                  </td>

                  {/* Day Cells */}
                  {workingDays.map((day) => {
                    // Match period by day AND matching block times / index
                    const matchedPeriod = periods.find(
                      (p) =>
                        p.day === day &&
                        (p.startTime === block.startTime || p.periodSlot.includes(block.startTime))
                    );

                    return (
                      <td
                        key={`${day}-${block.id}`}
                        className="p-1.5 border-r last:border-r-0 align-top h-24 min-w-[130px]"
                      >
                        {matchedPeriod ? (
                          <TimetablePeriodCard
                            period={matchedPeriod}
                            onEdit={onEditPeriod}
                            onDuplicate={onDuplicatePeriod}
                            onDelete={onDeletePeriod}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddSlot(day, block.startTime, block.id)}
                            className="group h-full w-full min-h-[5.5rem] rounded-lg border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:text-primary transition-all cursor-pointer select-none"
                            title={`Add period for ${day} at ${block.startTime}`}
                          >
                            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Add
                            </span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
