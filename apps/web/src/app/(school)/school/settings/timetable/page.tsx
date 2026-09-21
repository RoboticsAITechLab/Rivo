'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Plus, Save, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { DayOfWeek, ScheduleBlock, ScheduleBlockType } from '@/shared/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';

const WEEKDAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
];

export default function TimetableSettingsPage() {
  const store = useSchoolStore();
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const activeSchedule = store.schedules?.find((s) => s.id === store.activeScheduleId) || store.schedules?.[0];
  const blocks = activeSchedule?.blocks || [];

  const [periodForm, setPeriodForm] = React.useState({
    name: '',
    type: 'TEACHING' as ScheduleBlockType,
    startTime: '',
    endTime: '',
    order: blocks.length + 1,
  });

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(store.timetableSettings);

  const handleToggleDay = (day: DayOfWeek) => {
    const current = form.workingDays || [];
    const exists = current.includes(day);
    const updated = exists ? current.filter((d: DayOfWeek) => d !== day) : [...current, day];
    setForm({ ...form, workingDays: updated });
  };

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = schoolStore.updateTimetableSettings(form);
    markSaved(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule || !periodForm.name.trim()) return;

    schoolStore.createScheduleBlock(activeSchedule.id, {
      name: periodForm.name.trim(),
      type: periodForm.type,
      startTime: periodForm.startTime,
      endTime: periodForm.endTime,
      order: Number(periodForm.order) || blocks.length + 1,
      status: 'ACTIVE',
    });

    setPeriodForm({
      name: '',
      type: 'TEACHING',
      startTime: '',
      endTime: '',
      order: blocks.length + 2,
    });
    setIsDrawerOpen(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activeSchedule) return;
    schoolStore.deleteScheduleBlock(activeSchedule.id, blockId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable &amp; Schedule Settings"
        description="Configure institutional working days, bell intervals, teaching periods and automated conflict rules."
        icon={Clock}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="text-xs h-8"
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmitSettings}
              disabled={!isDirty}
              className="gap-1.5 text-xs h-8"
            >
              <Save className="h-3.5 w-3.5" />
              Save Rules
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Timetable configuration updated successfully.</span>
        </div>
      )}

      {/* A. Institutional Working Days */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Institutional Working Days</CardTitle>
          <CardDescription className="text-xs">
            Days of the week during which timetable slots and teaching periods are scheduled.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => {
              const isSelected = form.workingDays?.includes(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleToggleDay(day.key)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className="text-xs">{day.label}</div>
                  <div className="text-[10px] uppercase font-mono mt-0.5">
                    {isSelected ? 'Working' : 'Holiday'}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* B. Daily Bell Schedule & Periods */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Bell Schedule &amp; Teaching Periods</CardTitle>
            <CardDescription className="text-xs">
              Daily period intervals for class scheduling.
            </CardDescription>
          </div>
          {activeSchedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDrawerOpen(true)}
              className="gap-1.5 text-xs h-7"
            >
              <Plus className="h-3 w-3" />
              Add Period
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-5">
          {!activeSchedule || blocks.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                No bell schedule periods configured. Add teaching periods and break blocks to build timetable matrices.
              </p>
              {activeSchedule && (
                <Button size="sm" onClick={() => setIsDrawerOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add Period
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Period Name</span>
                <span className="col-span-3">Type</span>
                <span className="col-span-3">Time Interval</span>
                <span className="col-span-1 text-right">Action</span>
              </div>
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="grid grid-cols-12 gap-3 items-center py-2 text-xs border-b border-border/50 hover:bg-muted/20"
                >
                  <span className="col-span-1 font-mono text-muted-foreground">{idx + 1}</span>
                  <span className="col-span-4 font-semibold text-foreground">{block.name}</span>
                  <div className="col-span-3">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {block.type}
                    </Badge>
                  </div>
                  <span className="col-span-3 font-mono text-muted-foreground">
                    {block.startTime && block.endTime ? `${block.startTime} – ${block.endTime}` : '—'}
                  </span>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* C. Conflict Rules */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Automated Conflict Detection</CardTitle>
          <CardDescription className="text-xs">
            Validation checks to prevent double-booking faculty, halls, and classroom sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Teacher Conflict Detection</span>
                <span className="text-[11px] text-muted-foreground">
                  Flag an error if an instructor is assigned to two different classes at the same period.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.teacherConflictDetection}
                onChange={(e) => setForm({ ...form, teacherConflictDetection: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Room Conflict Detection</span>
                <span className="text-[11px] text-muted-foreground">
                  Prevent double-booking a science lab, computer room, or auditorium during the same period.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.roomConflictDetection}
                onChange={(e) => setForm({ ...form, roomConflictDetection: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Class Cohort Conflict Detection</span>
                <span className="text-[11px] text-muted-foreground">
                  Ensure a class section is not scheduled for more than one subject simultaneously.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.classConflictDetection}
                onChange={(e) => setForm({ ...form, classConflictDetection: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Period Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-base font-bold">Add Schedule Period</SheetTitle>
            <SheetDescription className="text-xs">
              Define a bell schedule period or non-teaching interval.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateBlock} className="space-y-4 pt-4">
            <FormField id="blockName" label="Period Label" required>
              <Input
                id="blockName"
                required
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="e.g. Period 1, Short Recess, Assembly"
                className="text-xs"
              />
            </FormField>

            <FormField id="blockType" label="Interval Classification">
              <select
                id="blockType"
                value={periodForm.type}
                onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value as any })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="TEACHING">Teaching Period</option>
                <option value="BREAK">Short Break / Recess</option>
                <option value="LUNCH">Lunch Interval</option>
                <option value="ASSEMBLY">Morning Assembly</option>
                <option value="ACTIVITY">Co-Curricular Activity</option>
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="startTime" label="Start Time">
                <Input
                  id="startTime"
                  type="time"
                  value={periodForm.startTime}
                  onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                  className="text-xs font-mono"
                />
              </FormField>

              <FormField id="endTime" label="End Time">
                <Input
                  id="endTime"
                  type="time"
                  value={periodForm.endTime}
                  onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                  className="text-xs font-mono"
                />
              </FormField>
            </div>

            <SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Create Period
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={() => {
          schoolStore.updateTimetableSettings(form);
          markSaved(form);
        }}
      />
    </div>
  );
}
