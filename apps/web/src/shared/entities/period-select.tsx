'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectTeachingPeriods, selectPeriodById, selectActiveSchedule } from '../selectors';
import { ScheduleBlock, PeriodId, ScheduleId, ScheduleBlockType } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Clock } from 'lucide-react';

export interface PeriodSelectProps {
  value?: PeriodId | null;
  onChange: (periodId: PeriodId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
  showTimeBadge?: boolean;
}

export function PeriodSelect({
  value,
  onChange,
  label = 'Period / Time Block',
  required,
  disabled,
  allowClear = false,
  placeholder = 'Select period...',
  className,
  showTimeBadge = true,
}: PeriodSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const activeSchedule = selectActiveSchedule(store);

  const options: SelectorOption<ScheduleBlock>[] = React.useMemo(() => {
    const teachingPeriods = selectTeachingPeriods(store, activeSchedule?.id);
    return teachingPeriods.map((b) => ({
      id: b.id,
      title: b.name,
      subtitle: `${b.startTime} – ${b.endTime} (${b.type})`,
      raw: b,
    }));
  }, [store, activeSchedule?.id]);

  const selectedPeriod = selectPeriodById(store, value, activeSchedule?.id);

  const handlePeriodCreated = (newBlock: ScheduleBlock) => {
    onChange(newBlock.id);
  };

  return (
    <div className={className}>
      <UniversalSelector<ScheduleBlock>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search period by name or time..."
        emptyMessage="No teaching periods found in active bell schedule."
        noResultsMessage="No matching period found."
        addNewLabel="+ Add New Schedule Block"
        onAddNew={() => setIsAddModalOpen(true)}
      />

      {/* Requirement 18: Automatic Read-only Schedule Time Box */}
      {showTimeBadge && selectedPeriod && (
        <div className="mt-1.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs">
          <span className="text-[11px] font-medium text-muted-foreground">Configured Schedule Time:</span>
          <span className="font-bold font-mono tracking-tight flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {selectedPeriod.startTime} – {selectedPeriod.endTime}
          </span>
        </div>
      )}

      {activeSchedule && (
        <QuickPeriodCreateDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          scheduleId={activeSchedule.id}
          existingBlocksCount={activeSchedule.blocks.length}
          onCreated={handlePeriodCreated}
        />
      )}
    </div>
  );
}

function QuickPeriodCreateDialog({
  isOpen,
  onClose,
  scheduleId,
  existingBlocksCount,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: ScheduleId;
  existingBlocksCount: number;
  onCreated: (block: ScheduleBlock) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickPeriodCreateModalInner
            onClose={onClose}
            scheduleId={scheduleId}
            existingBlocksCount={existingBlocksCount}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const QuickPeriodCreateModalInner = React.memo(function QuickPeriodCreateModalInner({
  onClose,
  scheduleId,
  existingBlocksCount,
  onCreated,
}: {
  onClose: () => void;
  scheduleId: ScheduleId;
  existingBlocksCount: number;
  onCreated: (block: ScheduleBlock) => void;
}) {
  const [name, setName] = React.useState(`Period ${existingBlocksCount + 1}`);
  const [type, setType] = React.useState<ScheduleBlockType>('TEACHING');
  const [startTime, setStartTime] = React.useState('13:30');
  const [endTime, setEndTime] = React.useState('14:15');

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim() || !startTime || !endTime) return;

    const newBlock = schoolStore.createScheduleBlock(scheduleId, {
      name: name.trim(),
      type,
      startTime,
      endTime,
      order: existingBlocksCount + 1,
      status: 'ACTIVE',
    });

    onCreated(newBlock);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add Schedule Block</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new bell schedule slot to the institutional timetable system.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="space-y-3 pt-2"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Block / Period Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Period 7 / Zero Period"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Slot Type" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ScheduleBlockType)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="TEACHING">Teaching Class</option>
              <option value="BREAK">Short Break</option>
              <option value="LUNCH">Lunch Break</option>
              <option value="ASSEMBLY">Morning Assembly</option>
              <option value="ACTIVITY">Co-curricular Activity</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Start Time (24h)" required>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="End Time (24h)" required>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            Save &amp; Select Period
          </Button>
        </DialogFooter>
      </div>
    </>
  );
});
