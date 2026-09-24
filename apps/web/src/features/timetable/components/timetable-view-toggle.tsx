'use client';

import * as React from 'react';
import { TimetableFilterState } from '../types';
import { TimetableClass, TimetableTeacher } from '../hooks/use-timetable';
import { Button } from '@/components/ui/button';
import { Calendar, Users, GraduationCap, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimetableViewToggleProps {
  filters: TimetableFilterState;
  onFilterChange: (updates: Partial<TimetableFilterState>) => void;
  classes: TimetableClass[];
  teachers: TimetableTeacher[];
}

export function TimetableViewToggle({
  filters,
  onFilterChange,
  classes,
  teachers,
}: TimetableViewToggleProps) {
  const selectedClass = classes.find((c) => c.id === filters.classId) || classes[0];

  return (
    <div className="flex flex-col gap-4 bg-card border rounded-xl p-4 shadow-2xs">
      {/* Top row: Mode Switcher + Academic Session + Week Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Mode Segmented Control */}
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'CLASS' })}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              filters.viewMode === 'CLASS'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Class View
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'TEACHER' })}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              filters.viewMode === 'TEACHER'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Teacher View
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'ROOM' })}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              filters.viewMode === 'ROOM'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Room View
          </button>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-foreground gap-1.5 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{filters.selectedWeek || 'Current Week'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" title="Previous Week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" title="Next Week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom row: Mode specific dropdowns */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/50">
        {filters.viewMode === 'CLASS' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Class:</label>
              <select
                value={filters.classId}
                onChange={(e) => {
                  const newClass = classes.find((c) => c.id === e.target.value);
                  onFilterChange({
                    classId: e.target.value,
                    sectionId: newClass?.sections[0]?.id || '',
                  });
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {classes.length === 0 && <option value="">No classes</option>}
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Grade {cls.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Section:</label>
              <select
                value={filters.sectionId}
                onChange={(e) => onFilterChange({ sectionId: e.target.value })}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {(!selectedClass || selectedClass.sections.length === 0) && (
                  <option value="">No sections</option>
                )}
                {selectedClass?.sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Stream:</label>
              <select
                value={filters.streamId || 'ALL'}
                onChange={(e) => onFilterChange({ streamId: e.target.value })}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Streams</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
          </>
        )}

        {filters.viewMode === 'TEACHER' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Teacher:</label>
            <select
              value={filters.teacherId}
              onChange={(e) => onFilterChange({ teacherId: e.target.value })}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px]"
            >
              {teachers.length === 0 && <option value="">No teachers found</option>}
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name} ({tch.department})
                </option>
              ))}
            </select>
          </div>
        )}

        {filters.viewMode === 'ROOM' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Room:</label>
            <input
              type="text"
              value={filters.room}
              onChange={(e) => onFilterChange({ room: e.target.value })}
              placeholder="e.g. Room 204"
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px]"
            />
          </div>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          Session: <span className="font-semibold text-foreground">2025-26</span>
        </div>
      </div>
    </div>
  );
}
