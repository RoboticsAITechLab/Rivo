'use client';

import * as React from 'react';
import { PeriodSchedule, ScheduleBlock, ScheduleBlockType, DayOfWeek } from '@/shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, CheckCircle2, Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_SCHEDULE_BLOCKS, DEFAULT_WORKING_DAYS } from '../hooks/use-timetable';

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
  if (!isOpen) return null;

  const fallbackSchedule: PeriodSchedule = {
    id: `ps-default`,
    schoolId: 'active-school',
    academicSessionId: 'session-active',
    name: 'Standard Bell Schedule',
    status: 'ACTIVE',
    effectiveFrom: new Date().toISOString().split('T')[0],
    workingDays: DEFAULT_WORKING_DAYS,
    blocks: DEFAULT_SCHEDULE_BLOCKS,
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <ScheduleSettingsModalInner
          activeSchedule={fallbackSchedule}
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
                Configure instructional period hours, inter-period breaks, and institutional working days.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Schedule Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Schedule Configuration Name</label>
            <Input
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="h-8.5 text-xs"
              placeholder="e.g. Regular Academic Bell Schedule 2025-26"
            />
          </div>

          {/* Working Days Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Active Weekly Instructional Days</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((d) => {
                const isActive = workingDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleToggleDay(d.key)}
                    className={cn(
                      'py-2 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                        : 'bg-card text-muted-foreground border-border/80 hover:bg-muted/40'
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periods & Intervals List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Instructional Blocks &amp; Breaks</label>
              <span className="text-[11px] text-muted-foreground">{blocks.length} configured blocks</span>
            </div>

            <div className="space-y-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card/60 shadow-2xs hover:bg-muted/20 transition-all text-xs"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" />
                  <Input
                    value={b.name}
                    onChange={(e) => handleUpdateBlock(b.id, 'name', e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <select
                    value={b.type}
                    onChange={(e) => handleUpdateBlock(b.id, 'type', e.target.value as ScheduleBlockType)}
                    className="h-7 rounded-md border border-input bg-background px-2 text-[11px] text-foreground"
                  >
                    <option value="TEACHING">Teaching Period</option>
                    <option value="BREAK">Short Break</option>
                    <option value="LUNCH">Lunch Break</option>
                    <option value="ASSEMBLY">Morning Assembly</option>
                    <option value="ACTIVITY">Activity / Sports</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={b.startTime}
                      onChange={(e) => handleUpdateBlock(b.id, 'startTime', e.target.value)}
                      className="h-7 w-20 text-[11px] font-mono"
                    />
                    <span className="text-muted-foreground text-[10px]">–</span>
                    <Input
                      type="time"
                      value={b.endTime}
                      onChange={(e) => handleUpdateBlock(b.id, 'endTime', e.target.value)}
                      className="h-7 w-20 text-[11px] font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBlock(b.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Quick Add Block Bar */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed bg-muted/10 text-xs">
              <Input
                placeholder="Block Name (e.g. Period 9)"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                className="h-7.5 text-xs flex-1"
              />
              <select
                value={newBlockType}
                onChange={(e) => setNewBlockType(e.target.value as ScheduleBlockType)}
                className="h-7.5 rounded-md border border-input bg-background px-2 text-[11px] text-foreground"
              >
                <option value="TEACHING">Teaching</option>
                <option value="BREAK">Break</option>
                <option value="LUNCH">Lunch</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="ACTIVITY">Activity</option>
              </select>
              <Input
                type="time"
                value={newBlockStart}
                onChange={(e) => setNewBlockStart(e.target.value)}
                className="h-7.5 w-20 text-[11px] font-mono"
              />
              <Input
                type="time"
                value={newBlockEnd}
                onChange={(e) => setNewBlockEnd(e.target.value)}
                className="h-7.5 w-20 text-[11px] font-mono"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddBlock}
                className="h-7.5 gap-1 text-xs bg-primary text-primary-foreground cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="p-4 border-t bg-card/50 flex items-center justify-between">
        <div>
          {isSavedNotice && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Settings updated successfully!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
          >
            Apply Settings
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
