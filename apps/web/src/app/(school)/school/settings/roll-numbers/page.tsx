'use client';

import * as React from 'react';
import { Hash, Save, CheckCircle2, Sliders, ShieldAlert, GitBranch } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';

export default function RollNumbersSettingsPage() {
  const store = useSchoolStore();
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const streams = store.streams || [];
  const config = store.rollAllocationConfig;

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(config);

  const handleStreamRuleChange = (streamId: string, startNumber: number, prefix: string) => {
    setForm({
      ...form,
      class11_12Rule: {
        ...form.class11_12Rule,
        streamRules: {
          ...form.class11_12Rule.streamRules,
          [streamId]: { startNumber, prefix },
        },
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = schoolStore.updateRollAllocationConfig(form);
    markSaved(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Roll Number Allocation Engine"
        description="Configure rules for daily Class Roll Numbers and official examination roll numbering policies."
        icon={Hash}
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
              Save Rules
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Roll allocation rules saved successfully.</span>
        </div>
      )}

      {/* A. Class Roll Number Rules */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Class Roll Numbers (Daily Operations)</CardTitle>
          <CardDescription className="text-xs">
            Used for daily attendance registers and classroom identity within each division section.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="classStartNumber" label="Class Roll Start Number">
              <Input
                id="classStartNumber"
                type="number"
                min={1}
                value={form.class1_10Rule?.startNumber || 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class1_10Rule: {
                      ...form.class1_10Rule,
                      startNumber: Number(e.target.value) || 1,
                    },
                  })
                }
                className="text-xs font-mono"
              />
            </FormField>

            <FormField id="classFormat" label="Number Display Format">
              <Input
                id="classFormat"
                value={form.class1_10Rule?.format || '1'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class1_10Rule: {
                      ...form.class1_10Rule,
                      format: e.target.value,
                    },
                  })
                }
                placeholder="e.g. 1 or 01 or R-01"
                className="text-xs font-mono"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* B. Examination Roll Number Rules */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Examination Roll Numbers (Official Assessment)</CardTitle>
          <CardDescription className="text-xs">
            Assigned for board &amp; institutional examinations across halls and consolidated marksheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="scope" label="Numbering Scope">
              <select
                id="scope"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as any })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="SCHOOL_WIDE">School-Wide Unified Pool</option>
                <option value="CAMPUS_SPECIFIC">Campus-Specific Numbering</option>
              </select>
            </FormField>

            <FormField id="nextAvailable" label="Next Sequence Counter">
              <Input
                id="nextAvailable"
                type="number"
                min={1}
                value={form.nextAvailableNumber || 1}
                onChange={(e) => setForm({ ...form, nextAvailableNumber: Number(e.target.value) || 1 })}
                className="text-xs font-mono"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* C. Senior Secondary Stream-Aware Rules */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Senior Secondary Stream Rules (Classes 11 &amp; 12)</CardTitle>
              <CardDescription className="text-xs">
                Custom prefix codes and starting sequences for senior secondary streams.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="streamAware"
                checked={form.class11_12Rule?.streamAware ?? true}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class11_12Rule: {
                      ...form.class11_12Rule,
                      streamAware: e.target.checked,
                    },
                  })
                }
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="streamAware" className="text-xs font-medium cursor-pointer">
                Stream-Aware Numbering
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {streams.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
              No senior secondary streams configured yet. Configure streams under Academic → Streams to establish stream-specific prefixes.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b">
                <span>Stream Track</span>
                <span>Prefix</span>
                <span>Start Number</span>
              </div>
              {streams.map((stream) => {
                const rule = form.class11_12Rule?.streamRules?.[stream.id] || {
                  startNumber: 1101,
                  prefix: `${stream.code}-`,
                };
                return (
                  <div key={stream.id} className="grid grid-cols-3 gap-3 items-center text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      <span>{stream.name}</span>
                    </div>
                    <div>
                      <Input
                        value={rule.prefix || ''}
                        onChange={(e) =>
                          handleStreamRuleChange(stream.id, rule.startNumber, e.target.value)
                        }
                        placeholder="Prefix"
                        className="text-xs font-mono uppercase h-8"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min={1}
                        value={rule.startNumber || 1}
                        onChange={(e) =>
                          handleStreamRuleChange(stream.id, Number(e.target.value) || 1, rule.prefix || '')
                        }
                        className="text-xs font-mono h-8"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={() => {
          schoolStore.updateRollAllocationConfig(form);
          markSaved(form);
        }}
      />
    </form>
  );
}
