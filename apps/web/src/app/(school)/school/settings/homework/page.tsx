'use client';

import * as React from 'react';
import { FileText, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from 'sonner';

interface HomeworkSettingsState {
  teacherCanCreate: boolean;
  teacherCanGrade: boolean;
  attachmentsEnabled: boolean;
  parentVisibility: boolean;
  studentStatusTracking: boolean;
  maxAttachmentSizeMB: number;
  allowLateSubmissions: boolean;
  submissionDeadlineHours: number;
}

const DEFAULT_HOMEWORK_FORM: HomeworkSettingsState = {
  teacherCanCreate: true,
  teacherCanGrade: true,
  attachmentsEnabled: true,
  parentVisibility: true,
  studentStatusTracking: true,
  maxAttachmentSizeMB: 10,
  allowLateSubmissions: false,
  submissionDeadlineHours: 24,
};

export default function HomeworkSettingsPage() {
  const [form, setForm] = React.useState<HomeworkSettingsState>(DEFAULT_HOMEWORK_FORM);
  const [initialForm, setInitialForm] = React.useState<HomeworkSettingsState>(DEFAULT_HOMEWORK_FORM);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isDirty = React.useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/school/settings?category=homework');
      if (!res.ok) {
        throw new Error('Failed to load homework settings');
      }
      const json = await res.json();
      if (json.success && json.data) {
        const loaded: HomeworkSettingsState = {
          teacherCanCreate: json.data.teacherCanCreate ?? true,
          teacherCanGrade: json.data.teacherCanGrade ?? true,
          attachmentsEnabled: json.data.attachmentsEnabled ?? true,
          parentVisibility: json.data.parentVisibility ?? true,
          studentStatusTracking: json.data.studentStatusTracking ?? true,
          maxAttachmentSizeMB: json.data.maxAttachmentSizeMB ?? 10,
          allowLateSubmissions: json.data.allowLateSubmissions ?? false,
          submissionDeadlineHours: json.data.submissionDeadlineHours ?? 24,
        };
        setForm(loaded);
        setInitialForm(loaded);
      }
    } catch (err: any) {
      console.error('[HOMEWORK_SETTINGS_FETCH_ERROR]', err);
      setError(err.message || 'Failed to load settings from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'homework',
          value: form,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save homework settings');
      }

      const json = await res.json();
      if (json.success && json.data) {
        const updated: HomeworkSettingsState = {
          teacherCanCreate: json.data.teacherCanCreate ?? true,
          teacherCanGrade: json.data.teacherCanGrade ?? true,
          attachmentsEnabled: json.data.attachmentsEnabled ?? true,
          parentVisibility: json.data.parentVisibility ?? true,
          studentStatusTracking: json.data.studentStatusTracking ?? true,
          maxAttachmentSizeMB: json.data.maxAttachmentSizeMB ?? 10,
          allowLateSubmissions: json.data.allowLateSubmissions ?? false,
          submissionDeadlineHours: json.data.submissionDeadlineHours ?? 24,
        };
        setForm(updated);
        setInitialForm(updated);
      }

      setSaveSuccess(true);
      toast.success('Homework settings saved successfully to server');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('[HOMEWORK_SETTINGS_SAVE_ERROR]', err);
      setError(err.message || 'Failed to save settings');
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading authoritative homework settings...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Homework & Assignments Configuration"
        description="Teacher publishing permissions, file attachment limits, deadline policies, and parent visibility."
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
                className="text-xs h-8"
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || isSaving}
              className="gap-1.5 text-xs h-8"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Policy
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Homework settings saved and synchronized with database successfully.</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Permissions & Visibility */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Publishing & Portal Visibility</CardTitle>
          <CardDescription className="text-xs">
            Controls for assignment authoring, teacher grading rights, and guardian portal visibility.
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
                <span className="text-xs font-semibold block text-foreground">Teacher Grading & Evaluation</span>
                <span className="text-[11px] text-muted-foreground">
                  Allow teachers to mark submissions and record grades in the assignment gradebook.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.teacherCanGrade}
                onChange={(e) => setForm({ ...form, teacherCanGrade: e.target.checked })}
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
                <span className="text-xs font-semibold block text-foreground">Allow Late Submissions</span>
                <span className="text-[11px] text-muted-foreground">
                  Permit students to turn in assignments past the designated due date timestamp.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.allowLateSubmissions}
                onChange={(e) => setForm({ ...form, allowLateSubmissions: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold block text-foreground">Enable File & PDF Attachments</span>
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

      {/* Attachment & Deadline Limits */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Storage & Deadline Boundaries</CardTitle>
          <CardDescription className="text-xs">
            Configure upload quotas and default submission grace hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField id="maxAttachmentSize" label="Maximum Attachment File Size (MB)">
            <Input
              id="maxAttachmentSize"
              type="number"
              min={1}
              max={100}
              value={form.maxAttachmentSizeMB}
              onChange={(e) => setForm({ ...form, maxAttachmentSizeMB: Number(e.target.value) || 10 })}
              className="text-xs font-mono"
            />
          </FormField>

          <FormField id="submissionDeadlineHours" label="Default Submission Window (Hours)">
            <Input
              id="submissionDeadlineHours"
              type="number"
              min={1}
              max={168}
              value={form.submissionDeadlineHours}
              onChange={(e) => setForm({ ...form, submissionDeadlineHours: Number(e.target.value) || 24 })}
              className="text-xs font-mono"
            />
          </FormField>
        </CardContent>
      </Card>
    </form>
  );
}
