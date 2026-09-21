'use client';

import * as React from 'react';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { selectActiveSchedule } from '@/shared/selectors';
import { PeriodSchedule, ScheduleBlock, ScheduleBlockType, DayOfWeek } from '@/shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, CheckCircle2, Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimetableScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
  { key: 'SUN', label: 'Sun' },
];

export function TimetableScheduleSettingsModal({
  isOpen,
  onClose,
}: TimetableScheduleSettingsModalProps) {
  const store = useSchoolStore();
  const activeSchedule = selectActiveSchedule(store);

  if (!isOpen) return null;

  const fallbackSchedule: PeriodSchedule = {
    id: `ps-${Date.now()}`,
    schoolId: 'sch-main',
    academicSessionId: store.academicSessions.find((s) => s.status === 'ACTIVE')?.id || '',
    name: 'Standard Bell Schedule',
    status: 'ACTIVE',
    effectiveFrom: new Date().toISOString().split('T')[0],
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    blocks: [],
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <ScheduleSettingsModalInner
          activeSchedule={activeSchedule || fallbackSchedule}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function ScheduleSettingsModalInner({
  activeSchedule,
  onClose,
}: {
  activeSchedule: PeriodSchedule;
  onClose: () => void;
}) {
  const [scheduleName, setScheduleName] = React.useState(activeSchedule.name);
  const [workingDays, setWorkingDays] = React.useState<DayOfWeek[]>([...activeSchedule.workingDays]);
  const [blocks, setBlocks] = React.useState<ScheduleBlock[]>(
    [...activeSchedule.blocks].sort((a, b) => a.order - b.order)
  );
  const [isSavedNotice, setIsSavedNotice] = React.useState(false);

  // New Block Form Row
  const [newBlockName, setNewBlockName] = React.useState('');
  const [newBlockType, setNewBlockType] = React.useState<ScheduleBlockType>('TEACHING');
  const [newBlockStart, setNewBlockStart] = React.useState('13:30');
  const [newBlockEnd, setNewBlockEnd] = React.useState('14:15');

  const handleToggleDay = (day: DayOfWeek) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleUpdateBlock = (id: string, field: keyof ScheduleBlock, value: string | number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBlock = () => {
    if (!newBlockName.trim() || !newBlockStart || !newBlockEnd) return;

    const newBlock: ScheduleBlock = {
      id: `blk-${Math.random().toString(36).substring(2, 9)}`,
      scheduleId: activeSchedule.id,
      name: newBlockName.trim(),
      type: newBlockType,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      order: blocks.length + 1,
      status: 'ACTIVE',
    };

    setBlocks((prev) => [...prev, newBlock]);
    setNewBlockName('');
  };

  const handleSaveAll = () => {
    const updated: PeriodSchedule = {
      ...activeSchedule,
      name: scheduleName.trim() || activeSchedule.name,
      workingDays,
      blocks: blocks.map((b, idx) => ({ ...b, order: idx + 1 })),
    };

    schoolStore.updateSchedule(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <>
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-10px)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Timetable Schedule &amp; Bell Settings</DialogTitle>
              <DialogDescription className="text-xs">
                Configure school working days, period start/end times, recesses, and lunch breaks. No hardcoded hours.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Schedule Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/80">
            <div className="flex-1">
              <label className="text-xs font-semibold text-foreground">Schedule Profile Name</label>
              <Input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g. Regular Academic Schedule"
                className="h-8 text-xs mt-1 bg-background"
              />
            </div>
            <div className="text-[11px] text-muted-foreground self-end sm:self-center">
              Active Session: <span className="font-bold text-foreground">2025-26</span>
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Institutional Working Days
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {ALL_DAYS.map((day) => {
                const isChecked = workingDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleToggleDay(day.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                      isChecked
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background text-muted-foreground border-input hover:bg-muted'
                    )}
                  >
                    <span>{isChecked ? '✓' : ''}</span>
                    <span>{day.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Blocks Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">
                Configured Schedule Blocks ({blocks.length})
              </label>
              <span className="text-[11px] text-muted-foreground">Times reflect across all timetable grids</span>
            </div>

            <div className="border rounded-xl overflow-hidden divide-y divide-border/60 bg-card">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <Input
                      value={block.name}
                      onChange={(e) => handleUpdateBlock(block.id, 'name', e.target.value)}
                      className="h-8 text-xs font-semibold max-w-[160px]"
                    />
                    <select
                      value={block.type}
                      onChange={(e) => handleUpdateBlock(block.id, 'type', e.target.value as ScheduleBlockType)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      <option value="TEACHING">Teaching Period</option>
                      <option value="BREAK">Short Break</option>
                      <option value="LUNCH">Lunch Break</option>
                      <option value="ASSEMBLY">Morning Assembly</option>
                      <option value="ACTIVITY">Activity Block</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1 text-xs">
                      <Input
                        type="time"
                        value={block.startTime}
                        onChange={(e) => handleUpdateBlock(block.id, 'startTime', e.target.value)}
                        className="h-8 text-xs font-mono w-24"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={block.endTime}
                        onChange={(e) => handleUpdateBlock(block.id, 'endTime', e.target.value)}
                        className="h-8 text-xs font-mono w-24"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Append Block */}
            <div className="mt-2.5 p-3 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col sm:flex-row items-center gap-2">
              <Input
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                placeholder="Block Name (e.g. Period 7)"
                className="h-8 text-xs flex-1 bg-background"
              />
              <select
                value={newBlockType}
                onChange={(e) => setNewBlockType(e.target.value as ScheduleBlockType)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
              >
                <option value="TEACHING">Teaching</option>
                <option value="BREAK">Break</option>
                <option value="LUNCH">Lunch</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="ACTIVITY">Activity</option>
              </select>
              <div className="flex items-center gap-1">
                <Input
                  type="time"
                  value={newBlockStart}
                  onChange={(e) => setNewBlockStart(e.target.value)}
                  className="h-8 text-xs font-mono w-22 bg-background"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={newBlockEnd}
                  onChange={(e) => setNewBlockEnd(e.target.value)}
                  className="h-8 text-xs font-mono w-22 bg-background"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddBlock}
                className="h-8 text-xs gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Block
              </Button>
            </div>
          </div>

          {isSavedNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Schedule updated! Timetable matrices refreshed automatically.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            Save Timetable Settings
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
