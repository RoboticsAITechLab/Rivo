'use client';

import * as React from 'react';
import { Palette, Upload, CheckCircle2, Save, FileImage, ShieldCheck, PenTool, RefreshCw, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { toast } from 'sonner';

const defaultBranding = {
  primaryLogoUrl: '',
  secondaryLogoUrl: '',
  schoolSealUrl: '',
  authorizedSignatureUrl: '',
  documentHeader: '',
  documentFooter: '',
  watermarkText: '',
};

export default function BrandingSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(defaultBranding);

  const fetchBranding = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/branding');
      const json = await res.json();
      if (res.ok && json.data) {
        setForm(json.data);
        markSaved(json.data);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  }, [markSaved, setForm]);

  React.useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/school/branding/logo', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to upload logo');
      }

      setForm((prev) => ({ ...prev, primaryLogoUrl: json.logoUrl }));
      toast.success('School logo uploaded to storage and updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true);
      const res = await fetch('/api/school/branding/logo', {
        method: 'DELETE',
      });
      if (res.ok) {
        setForm((prev) => ({ ...prev, primaryLogoUrl: '' }));
        toast.success('School logo removed.');
      }
    } catch (err) {
      toast.error('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/school/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update branding');
      }

      markSaved(json.data);
      setSaveSuccess(true);
      toast.success('Branding settings saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      <PageHeader
        title="Branding & Identity"
        description="Official school crest, signatures, digital seal and print header configurations."
        icon={Palette}
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
              {saving ? 'Saving...' : 'Save Branding'}
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Branding configurations updated and persisted to database.</span>
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
        <CardContent className="pt-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Primary Logo Upload */}
            <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileImage className="h-4 w-4 text-primary" />
                  Primary Institutional Crest / Logo
                </div>
                {form.primaryLogoUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Uploaded</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Main high-resolution emblem rendered in navigation headers, PDF receipts, and official admit cards.
              </p>
              
              {form.primaryLogoUrl ? (
                <div className="flex items-center justify-between gap-3 p-2 rounded bg-background border border-border/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.primaryLogoUrl}
                      alt="Primary Logo"
                      className="h-9 w-9 object-contain rounded border border-border/40 p-0.5"
                    />
                    <span className="text-[11px] font-mono truncate text-muted-foreground">
                      {form.primaryLogoUrl.split('/').pop() || 'school_logo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs h-7"
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={handleRemoveLogo}
                      className="text-xs h-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full text-xs h-9 gap-2 border-dashed"
                >
                  {uploadingLogo ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploadingLogo ? 'Uploading to Azure...' : 'Upload Primary Logo'}
                </Button>
              )}
            </div>

            {/* Official Seal / Stamp */}
            <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Official Digital Seal / Stamp
                </div>
                {form.schoolSealUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Configured</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Authenticity stamp placed over result certificates, transfer documents, and marksheet summaries.
              </p>
              <Input
                value={form.schoolSealUrl || ''}
                onChange={(e) => setForm({ ...form, schoolSealUrl: e.target.value })}
                placeholder="https://... or storage asset key"
                className="text-xs font-mono"
              />
            </div>

            {/* Authorized Signature */}
            <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/20 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-primary" />
                  Authorized Signatory (Principal / Director)
                </div>
                {form.authorizedSignatureUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Configured</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Digital signature URL / vector rendered on official transcripts and grade cards.
              </p>
              <Input
                value={form.authorizedSignatureUrl || ''}
                onChange={(e) => setForm({ ...form, authorizedSignatureUrl: e.target.value })}
                placeholder="https://... or storage asset key"
                className="text-xs font-mono"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Document Printing Customization */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Document Headers & Footers</CardTitle>
          <CardDescription className="text-xs">
            Global header and footer text applied to formal printed documents and circulars.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <FormField label="Official Letterhead Header Tagline" className="text-xs">
            <Input
              value={form.documentHeader || ''}
              onChange={(e) => setForm({ ...form, documentHeader: e.target.value })}
              placeholder="e.g. Recognized by Department of Education | ISO 9001:2015 Certified"
              className="text-xs"
            />
          </FormField>

          <FormField label="Official Document Footer Text / Legal Disclaimer" className="text-xs">
            <Input
              value={form.documentFooter || ''}
              onChange={(e) => setForm({ ...form, documentFooter: e.target.value })}
              placeholder="e.g. This is a computer generated document issued under the seal of the Examination Board."
              className="text-xs"
            />
          </FormField>

          <FormField label="Document Watermark Text (Optional)" className="text-xs">
            <Input
              value={form.watermarkText || ''}
              onChange={(e) => setForm({ ...form, watermarkText: e.target.value })}
              placeholder="e.g. OFFICIAL / CONFIDENTIAL"
              className="text-xs font-mono uppercase"
            />
          </FormField>
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
