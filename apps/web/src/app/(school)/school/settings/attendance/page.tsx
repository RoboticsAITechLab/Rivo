'use client';

import * as React from 'react';
import { CalendarCheck, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { toast } from 'sonner';

const defaultAttendance = {
  attendanceEnabled: true,
  teacherCanMark: true,
  adminCanCorrect: true,
  lockPreviousRecords: false,
  minAttendancePercentage: 75,
  supportedStatuses: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as ('PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED')[],
};

export default function AttendanceSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(defaultAttendance);

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=attendance');
      const json = await res.json();
      if (res.ok && json.data) {
        setForm(json.data);
        markSaved(json.data);
      }
    } catch (err) {
      console.error('Failed to load attendance settings:', err);
      toast.error('Failed to load attendance settings');
    } finally {
      setLoading(false);
    }
  }, [markSaved, setForm]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleStatus = (statusKey: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const current = form.supportedStatuses || [];
    const exists = current.includes(statusKey);
    const updated = exists
      ? current.filter((s) => s !== statusKey)
      : [...current, statusKey];
    setForm({ ...form, supportedStatuses: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'attendance',
          value: form,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save attendance settings');
      }

      markSaved(json.data);
      setSaveSuccess(true);
      toast.success('Attendance settings saved and enforced globally.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Attendance Settings"
        description="Configure daily roll call tracking, teacher permissions and attendance record locking."
        icon={CalendarCheck}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={resetForm}
                className="text-xs h-8"
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || saving}
              className="gap-1.5 text-xs h-8"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Attendance settings updated and enforced across attendance registers.</span>
        </div>
      )}

      {/* Operational Controls */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Roll Call Operational Rules</CardTitle>
          <CardDescription className="text-xs">
            Role privileges for taking, correcting and locking daily attendance registers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Attendance Module Enabled</span>
                <span className="text-[11px] text-muted-foreground">
                  Master switch to activate daily student attendance registers across the institution.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.attendanceEnabled}
                onChange={(e) => setForm({ ...form, attendanceEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Faculty Attendance Submission</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow assigned class teachers and subject instructors to mark daily classroom registers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.teacherCanMark}
                onChange={(e) => setForm({ ...form, teacherCanMark: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Administrative Record Correction</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow School Administrators and Principals to edit submitted attendance and rectify logs.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.adminCanCorrect}
                onChange={(e) => setForm({ ...form, adminCanCorrect: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Lock Historical Registers</span>
                <span className="text-[11px] text-muted-foreground">
                  Freeze attendance sheets past the designated date to prevent backdated tampering.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.lockPreviousRecords}
                onChange={(e) => setForm({ ...form, lockPreviousRecords: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Attendance Status Options */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Active Marking Status Codes</CardTitle>
          <CardDescription className="text-xs">
            Marking options available in the faculty daily roll call interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'PRESENT', label: 'Present (P)', desc: 'Standard on-time attendance', color: 'text-emerald-600 dark:text-emerald-400' },
              { key: 'ABSENT', label: 'Absent (A)', desc: 'Unexcused non-attendance', color: 'text-destructive' },
              { key: 'LATE', label: 'Late (L)', desc: 'Tardy / late arrival marker', color: 'text-amber-600 dark:text-amber-400' },
              { key: 'EXCUSED', label: 'Excused / Leave (E)', desc: 'Authorized medical or family leave', color: 'text-blue-600 dark:text-blue-400' },
            ].map(({ key, label, desc, color }) => {
              const active = form.supportedStatuses?.includes(key as any);
              return (
                <div
                  key={key}
                  onClick={() => handleToggleStatus(key as any)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    active
                      ? 'border-primary/50 bg-primary/5 shadow-2xs'
                      : 'border-border opacity-50 bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${color}`}>{label}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}} // handled by div click
                      className="h-3.5 w-3.5 rounded border-border accent-primary pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={async () => {
          await handleSubmit(new Event('submit') as any);
        }}
      />
    </form>
  );
}
