'use client';

import * as React from 'react';
import { Palette, Upload, CheckCircle2, Save, FileImage, ShieldCheck, PenTool } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';

export default function BrandingSettingsPage() {
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
  } = useUnsavedChanges(store.branding || {});

  const handleSimulateUpload = (field: 'primaryLogoUrl' | 'secondaryLogoUrl' | 'schoolSealUrl' | 'authorizedSignatureUrl', name: string) => {
    // In real app, uploads to storage or backend; stores real URL or asset identifier
    setForm({ ...form, [field]: `uploaded://${name}` });
  };

  const handleClearAsset = (field: 'primaryLogoUrl' | 'secondaryLogoUrl' | 'schoolSealUrl' | 'authorizedSignatureUrl') => {
    setForm({ ...form, [field]: undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = schoolStore.updateBranding(form);
    markSaved(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const hasAnyAsset = Boolean(
    form.primaryLogoUrl ||
    form.secondaryLogoUrl ||
    form.schoolSealUrl ||
    form.authorizedSignatureUrl ||
    form.documentHeader ||
    form.documentFooter
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Branding &amp; Identity"
        description="Official school crest, signatures, digital seal and print header configurations."
        icon={Palette}
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
              Save Branding
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Branding configurations updated successfully.</span>
        </div>
      )}

      {/* Visual Identity Assets */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Institutional Graphics</CardTitle>
          <CardDescription className="text-xs">
            Logos and official stamps applied across report cards, admit cards, and circular headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Logo */}
            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Primary School Logo</span>
                </div>
                {form.primaryLogoUrl && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Configured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                High-resolution SVG or PNG logo for student portal and printed documents.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSimulateUpload('primaryLogoUrl', file.name);
                  }}
                  className="text-xs file:text-xs file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                />
                {form.primaryLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearAsset('primaryLogoUrl')}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {form.primaryLogoUrl ? `File: ${form.primaryLogoUrl}` : 'No logo configured'}
              </div>
            </div>

            {/* Secondary / Mascot Logo */}
            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Secondary Emblem / Mascot</span>
                </div>
                {form.secondaryLogoUrl && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Configured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Alternative crest or monochrome emblem for secondary reports.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSimulateUpload('secondaryLogoUrl', file.name);
                  }}
                  className="text-xs file:text-xs file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                />
                {form.secondaryLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearAsset('secondaryLogoUrl')}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {form.secondaryLogoUrl ? `File: ${form.secondaryLogoUrl}` : 'No secondary emblem configured'}
              </div>
            </div>

            {/* School Seal */}
            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Institutional Digital Seal</span>
                </div>
                {form.schoolSealUrl && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Configured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Transparent circular seal stamped onto examination marksheets.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSimulateUpload('schoolSealUrl', file.name);
                  }}
                  className="text-xs file:text-xs file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                />
                {form.schoolSealUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearAsset('schoolSealUrl')}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {form.schoolSealUrl ? `File: ${form.schoolSealUrl}` : 'No official seal configured'}
              </div>
            </div>

            {/* Authorized Signature */}
            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Authorized Signature</span>
                </div>
                {form.authorizedSignatureUrl && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Configured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Digital signature of the Principal or Controller of Examinations.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSimulateUpload('authorizedSignatureUrl', file.name);
                  }}
                  className="text-xs file:text-xs file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                />
                {form.authorizedSignatureUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearAsset('authorizedSignatureUrl')}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {form.authorizedSignatureUrl ? `File: ${form.authorizedSignatureUrl}` : 'No signature configured'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Headers & Footers */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Document Header &amp; Footer Layout</CardTitle>
          <CardDescription className="text-xs">
            Standard text rendered at the top and bottom of printed circulars and examination papers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <FormField id="headerText" label="Document Header Title / Subtitle">
            <Input
              id="headerText"
              value={form.documentHeader || ''}
              onChange={(e) => setForm({ ...form, documentHeader: e.target.value })}
              placeholder="e.g. ST. XAVIER'S SENIOR SECONDARY SCHOOL • AFFILIATED TO CBSE, NEW DELHI"
              className="text-xs font-mono"
            />
          </FormField>

          <FormField id="footerText" label="Document Footer Legal Text">
            <Input
              id="footerText"
              value={form.documentFooter || ''}
              onChange={(e) => setForm({ ...form, documentFooter: e.target.value })}
              placeholder="e.g. This is a computer-generated document. No manual signature is required."
              className="text-xs font-mono"
            />
          </FormField>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={() => {
          schoolStore.updateBranding(form);
          markSaved(form);
        }}
      />
    </form>
  );
}
