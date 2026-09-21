'use client';

import * as React from 'react';
import { CalendarCheck, Save, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';

export default function AttendanceSettingsPage() {
  const store = useSchoolStore();
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(store.attendanceSettings);

  const handleToggleStatus = (statusKey: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const current = form.supportedStatuses || [];
    const exists = current.includes(statusKey);
    const updated = exists
      ? current.filter((s: string) => s !== statusKey)
      : [...current, statusKey];
    setForm({ ...form, supportedStatuses: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = schoolStore.updateAttendanceSettings(form);
    markSaved(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
                onClick={resetForm}
                className="text-xs h-8"
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty}
              className="gap-1.5 text-xs h-8"
            >
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Attendance settings updated successfully.</span>
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
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Teachers Can Mark Attendance</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow assigned class teachers to mark and submit attendance registers from their portal.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.teacherCanMark}
                onChange={(e) => setForm({ ...form, teacherCanMark: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Administrators Can Override &amp; Correct</span>
                <span className="text-[11px] text-muted-foreground">
                  Grant school administrators the ability to edit previously submitted registers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.adminCanCorrect}
                onChange={(e) => setForm({ ...form, adminCanCorrect: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Lock Past Attendance Registers</span>
                <span className="text-[11px] text-muted-foreground">
                  Prevent teachers from altering attendance records after the day has passed.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.lockPreviousRecords}
                onChange={(e) => setForm({ ...form, lockPreviousRecords: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Attendance Statuses */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Active Attendance Status Options</CardTitle>
          <CardDescription className="text-xs">
            Statuses available to teachers during morning or period roll call.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'PRESENT', label: 'Present (P)' },
              { id: 'ABSENT', label: 'Absent (A)' },
              { id: 'LATE', label: 'Tardy / Late (L)' },
              { id: 'EXCUSED', label: 'Excused Leave (E)' },
            ].map((st) => {
              const isChecked = form.supportedStatuses?.includes(st.id as any);
              return (
                <div
                  key={st.id}
                  onClick={() => handleToggleStatus(st.id as any)}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-foreground">{st.label}</span>
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
        onSave={() => {
          schoolStore.updateAttendanceSettings(form);
          markSaved(form);
        }}
      />
    </form>
  );
}
