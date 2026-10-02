'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Save, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Stamp, FileSignature, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { toast } from 'sonner';

const defaultProfile = {
  schoolName: '',
  shortName: '',
  schoolCode: '',
  affiliation: '',
  registrationNumber: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  timezone: 'Asia/Kolkata',
};

export default function SchoolProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [brandingMeta, setBrandingMeta] = React.useState<{ primaryLogoUrl?: string; schoolSealUrl?: string; authorizedSignatureUrl?: string }>({});

  const {
    currentValues: form,
    setCurrentValues: setForm,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges(defaultProfile);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, brandingRes] = await Promise.all([
        fetch('/api/school/profile'),
        fetch('/api/school/branding'),
      ]);

      const profileJson = await profileRes.json();
      if (profileRes.ok && profileJson.data) {
        setForm(profileJson.data);
        markSaved(profileJson.data);
      }

      const brandingJson = await brandingRes.json();
      if (brandingRes.ok && brandingJson.data) {
        setBrandingMeta(brandingJson.data);
      }
    } catch (err) {
      console.error('Failed to load school profile:', err);
      toast.error('Failed to load school profile from database');
    } finally {
      setLoading(false);
    }
  }, [markSaved, setForm]);

  React.useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const isConfigured = Boolean(form.schoolName?.trim() && form.schoolCode?.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolName?.trim()) {
      toast.error('School Legal Name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/school/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update school profile');
      }

      markSaved(json.data);
      setSaveSuccess(true);
      toast.success('School profile saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save school profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Page Header */}
      <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            School Profile
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure your institution&apos;s official legal identity, contact information, and regulatory accreditation.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            Loading profile...
          </div>
        )}
      </div>

      {/* 2. Success Banner */}
      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>School profile details successfully committed to central database.</span>
        </div>
      )}

      {/* 3. Empty State Notice */}
      {!loading && !isConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">Some profile information has not been configured yet.</div>
            <div className="text-muted-foreground text-[11px] leading-relaxed">
              Complete the fields below to establish your institutional identity across report cards, invoices, admit cards, and student records.
            </div>
          </div>
        </div>
      )}

      {/* 4. Single Main Content Surface */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-7 space-y-8 shadow-2xs">
        
        {/* Section A: Institution Identity */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Institution Identity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Legal registration names used across verified governmental records and certificates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="schoolName" className="text-xs font-medium">
                  School Legal Name <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Required on official transcripts</span>
              </div>
              <Input
                id="schoolName"
                value={form.schoolName || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, schoolName: e.target.value }))}
                placeholder="e.g. St. Xavier's Senior Secondary School"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="shortName" className="text-xs font-medium">
                  Short Name / Acronym
                </Label>
                <span className="text-[10px] text-muted-foreground">Used in headers & badges</span>
              </div>
              <Input
                id="shortName"
                value={form.shortName || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, shortName: e.target.value }))}
                placeholder="e.g. SXSSS"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="schoolCode" className="text-xs font-medium">
                  School Code <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Internal identifier</span>
              </div>
              <Input
                id="schoolCode"
                value={form.schoolCode || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, schoolCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. SCH-001"
                className="text-xs font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section B: Regulatory Accreditation */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accreditation & Affiliation
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Regulatory board registration printed on admit cards and report cards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="affiliation" className="text-xs font-medium">
                Educational Board / Affiliation
              </Label>
              <Input
                id="affiliation"
                value={form.affiliation || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, affiliation: e.target.value }))}
                placeholder="e.g. CBSE / ICSE / State Board / Cambridge"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registrationNumber" className="text-xs font-medium">
                Affiliation / Registration No.
              </Label>
              <Input
                id="registrationNumber"
                value={form.registrationNumber || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, registrationNumber: e.target.value }))}
                placeholder="e.g. CBSE/AFF/2024/98765"
                className="text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section C: Official Contact & Address */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Official Communication & Campus Address
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Printed on invoice headers, admit cards, student ID cards, and official notices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Administrative Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))}
                placeholder="contact@school.edu.in"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Official Phone Number
              </Label>
              <Input
                id="phone"
                value={form.phone || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="website" className="text-xs font-medium">
                Official Website
              </Label>
              <Input
                id="website"
                value={form.website || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.school.edu.in"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address" className="text-xs font-medium">
                Physical Street Address
              </Label>
              <Input
                id="address"
                value={form.address || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Education Boulevard, Institutional Area"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium">
                City / District
              </Label>
              <Input
                id="city"
                value={form.city || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, city: e.target.value }))}
                placeholder="New Delhi"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-medium">
                  State / Province
                </Label>
                <Input
                  id="state"
                  value={form.state || ''}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, state: e.target.value }))}
                  placeholder="Delhi"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pinCode" className="text-xs font-medium">
                  PIN / Postal Code
                </Label>
                <Input
                  id="pinCode"
                  value={form.pinCode || ''}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, pinCode: e.target.value }))}
                  placeholder="110001"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Section D: Associated Branding Preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Institutional Branding Assets
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Logos and official seals configured for this school.
              </p>
            </div>
            <Link
              href="/school/settings/branding"
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              Configure in Branding
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 p-3 bg-muted/20 flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted/80 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">Primary Logo</div>
                <div className="text-[10px] text-muted-foreground">
                  {brandingMeta?.primaryLogoUrl ? 'Uploaded' : 'Not uploaded'}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-3 bg-muted/20 flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted/80 flex items-center justify-center shrink-0">
                <Stamp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">Official Seal</div>
                <div className="text-[10px] text-muted-foreground">
                  {brandingMeta?.schoolSealUrl ? 'Configured' : 'Not uploaded'}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-3 bg-muted/20 flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted/80 flex items-center justify-center shrink-0">
                <FileSignature className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">Principal Sign</div>
                <div className="text-[10px] text-muted-foreground">
                  {brandingMeta?.authorizedSignatureUrl ? 'Configured' : 'Not uploaded'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section E: Sticky Form Action Bar */}
        <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Unsaved changes pending submission
              </span>
            ) : (
              <span>All changes saved to database</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty || saving}
              onClick={resetForm}
              className="text-xs h-9 px-4"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || saving}
              className="text-xs h-9 px-5 gap-1.5"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

      </div>

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
