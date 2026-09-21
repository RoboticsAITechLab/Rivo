'use client';

import * as React from 'react';
import { FileText, Save, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';

export default function HomeworkSettingsPage() {
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
  } = useUnsavedChanges(store.homeworkSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = schoolStore.updateHomeworkSettings(form);
    markSaved(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Homework &amp; Assignments Configuration"
        description="Teacher publishing permissions, file attachment limits and parent visibility."
        icon={FileText}
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
              Save Policy
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Homework settings saved successfully.</span>
        </div>
      )}

      {/* Permissions & Visibility */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Publishing &amp; Student Visibility</CardTitle>
          <CardDescription className="text-xs">
            Controls for assignment authoring and portal disclosure.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Teacher Assignment Creation</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow teachers to publish homework and study tasks directly to assigned class sections.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.teacherCanCreate}
                onChange={(e) => setForm({ ...form, teacherCanCreate: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Parent Portal Homework Visibility</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow guardians to view pending homework deadlines and completion status from parent mobile view.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.parentVisibility}
                onChange={(e) => setForm({ ...form, parentVisibility: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Student Submission Status Tracking</span>
                <span className="text-[11px] text-muted-foreground">
                  Enable mark-as-completed checklist tracking for students on their dashboard.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.studentStatusTracking}
                onChange={(e) => setForm({ ...form, studentStatusTracking: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Enable File &amp; PDF Attachments</span>
                <span className="text-[11px] text-muted-foreground">
                  Permit teachers to upload worksheets, reading materials and project briefs.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.attachmentsEnabled}
                onChange={(e) => setForm({ ...form, attachmentsEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachment limits */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Storage &amp; Attachment Limits</CardTitle>
          <CardDescription className="text-xs">
            Configure upload quotas for worksheet files.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="max-w-xs">
            <FormField id="maxAttachmentSize" label="Maximum Attachment File Size (MB)">
              <Input
                id="maxAttachmentSize"
                type="number"
                min={1}
                max={50}
                value={form.maxAttachmentSizeMB}
                onChange={(e) => setForm({ ...form, maxAttachmentSizeMB: Number(e.target.value) || 10 })}
                className="text-xs font-mono"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={() => {
          schoolStore.updateHomeworkSettings(form);
          markSaved(form);
        }}
      />
    </form>
  );
}
