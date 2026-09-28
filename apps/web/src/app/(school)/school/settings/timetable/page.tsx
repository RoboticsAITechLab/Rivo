'use client';

import * as React from 'react';
import { Clock, Plus, Save, CheckCircle2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScheduleBlock, ScheduleBlockType } from '@/shared/types';
import { DEFAULT_SCHEDULE_BLOCKS } from '@/features/timetable/hooks/use-timetable';

type DayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

const WEEKDAYS: { key: DayCode; label: string; full: string }[] = [
  { key: 'MON', label: 'Monday', full: 'MONDAY' },
  { key: 'TUE', label: 'Tuesday', full: 'TUESDAY' },
  { key: 'WED', label: 'Wednesday', full: 'WEDNESDAY' },
  { key: 'THU', label: 'Thursday', full: 'THURSDAY' },
  { key: 'FRI', label: 'Friday', full: 'FRIDAY' },
  { key: 'SAT', label: 'Saturday', full: 'SATURDAY' },
  { key: 'SUN', label: 'Sunday', full: 'SUNDAY' },
];

export default function TimetableSettingsPage() {
  const [configId, setConfigId] = React.useState<string | null>(null);
  const [scheduleName, setScheduleName] = React.useState('Standard Daily Bell Schedule');
  const [workingDays, setWorkingDays] = React.useState<DayCode[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  const [blocks, setBlocks] = React.useState<ScheduleBlock[]>(DEFAULT_SCHEDULE_BLOCKS);
  const [conflictSettings, setConflictSettings] = React.useState({
    teacherConflictDetection: true,
    roomConflictDetection: true,
    classConflictDetection: true,
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [periodForm, setPeriodForm] = React.useState({
    name: '',
    type: 'TEACHING' as ScheduleBlockType,
    startTime: '13:30',
    endTime: '14:15',
    order: blocks.length + 1,
  });

  const loadConfig = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/timetable/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfigId(data.config.id || null);
          if (data.config.name) setScheduleName(data.config.name);
          if (Array.isArray(data.config.workingDays) && data.config.workingDays.length > 0) {
            const mappedDays: DayCode[] = data.config.workingDays.map((d: string) => {
              const upper = d.toUpperCase();
              if (upper.startsWith('MON')) return 'MON';
              if (upper.startsWith('TUE')) return 'TUE';
              if (upper.startsWith('WED')) return 'WED';
              if (upper.startsWith('THU')) return 'THU';
              if (upper.startsWith('FRI')) return 'FRI';
              if (upper.startsWith('SAT')) return 'SAT';
              if (upper.startsWith('SUN')) return 'SUN';
              return 'MON';
            });
            setWorkingDays(Array.from(new Set(mappedDays)));
          }
          if (Array.isArray(data.config.periods) && data.config.periods.length > 0) {
            const loadedBlocks: ScheduleBlock[] = data.config.periods.map((p: any) => ({
              id: p.id,
              scheduleId: data.config.id,
              name: p.name,
              type: p.type as ScheduleBlockType,
              order: p.periodNumber,
              startTime: p.startTime,
              endTime: p.endTime,
              status: 'ACTIVE',
            }));
            setBlocks(loadedBlocks.sort((a, b) => a.order - b.order));
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load timetable config in settings:', err);
      setErrorMessage('Failed to load settings from server.');
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  }, []);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleToggleDay = (day: DayCode) => {
    setWorkingDays((prev) => {
      const updated = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      setIsDirty(true);
      return updated;
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      setIsDirty(true);
      return updated;
    });
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodForm.name.trim()) return;

    const newBlock: ScheduleBlock = {
      id: `blk-${Math.random().toString(36).substring(2, 9)}`,
      scheduleId: configId || 'active-schedule',
      name: periodForm.name.trim(),
      type: periodForm.type,
      startTime: periodForm.startTime,
      endTime: periodForm.endTime,
      order: blocks.length + 1,
      status: 'ACTIVE',
    };

    setBlocks((prev) => [...prev, newBlock]);
    setIsDirty(true);
    setPeriodForm({
      name: '',
      type: 'TEACHING',
      startTime: '13:30',
      endTime: '14:15',
      order: blocks.length + 2,
    });
    setIsDrawerOpen(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        configId: configId || undefined,
        name: scheduleName.trim() || 'Standard Daily Bell Schedule',
        workingDays: workingDays.map((d) => {
          switch (d) {
            case 'MON': return 'MONDAY';
            case 'TUE': return 'TUESDAY';
            case 'WED': return 'WEDNESDAY';
            case 'THU': return 'THURSDAY';
            case 'FRI': return 'FRIDAY';
            case 'SAT': return 'SATURDAY';
            case 'SUN': return 'SUNDAY';
            default: return d;
          }
        }),
        periods: blocks.map((b, idx) => ({
          periodNumber: idx + 1,
          name: b.name,
          type: b.type,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      };

      const res = await fetch('/api/timetable/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to update timetable configuration.');
      }

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving timetable settings:', err);
      setErrorMessage(err.message || 'Failed to persist timetable configuration.');
    } finally {
      setIsSaving(false);
    }
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
                onClick={loadConfig}
                disabled={isSaving}
                className="text-xs h-8 cursor-pointer"
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="gap-1.5 text-xs h-8 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Configuration
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Timetable configuration updated and persisted to database.</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <Card className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading timetable configuration from database...</span>
        </Card>
      ) : (
        <>
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
                  const isSelected = workingDays.includes(day.key);
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDrawerOpen(true)}
                className="gap-1.5 text-xs h-7 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Period
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {blocks.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    No bell schedule periods configured. Add teaching periods and break blocks to build timetable matrices.
                  </p>
                  <Button size="sm" onClick={() => setIsDrawerOpen(true)} className="gap-1.5 text-xs cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                    Add Period
                  </Button>
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
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
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
                Validation checks to prevent double-booking faculty, halls, and classroom sections (enforced authoritative server-side).
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
                    checked={conflictSettings.teacherConflictDetection}
                    onChange={(e) => {
                      setConflictSettings({ ...conflictSettings, teacherConflictDetection: e.target.checked });
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
                    checked={conflictSettings.roomConflictDetection}
                    onChange={(e) => {
                      setConflictSettings({ ...conflictSettings, roomConflictDetection: e.target.checked });
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
                    checked={conflictSettings.classConflictDetection}
                    onChange={(e) => {
                      setConflictSettings({ ...conflictSettings, classConflictDetection: e.target.checked });
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer">
                Add To Schedule
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
