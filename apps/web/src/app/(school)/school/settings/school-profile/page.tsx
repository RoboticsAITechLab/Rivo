'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Save, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Stamp, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { toast } from 'sonner';

export default function SchoolProfilePage() {
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
  } = useUnsavedChanges(store.schoolProfile);

  const isConfigured = Boolean(form.schoolName?.trim() && form.schoolCode?.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolName?.trim()) {
      toast.error('School Legal Name is required');
      return;
    }
    const updated = schoolStore.updateSchoolProfile(form);
    markSaved(updated);
    setSaveSuccess(true);
    toast.success('School profile saved successfully');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Page Header (Section 7 & 10) */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          School Profile
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure your institution&apos;s official legal identity, contact information, and regulatory accreditation.
        </p>
      </div>

      {/* 2. Success Banner */}
      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>School profile details successfully committed to central store.</span>
        </div>
      )}

      {/* 3. Empty State Notice (Section 13) */}
      {!isConfigured && (
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

      {/* 4. Single Main Content Surface (Section 7 & 11) */}
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
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                placeholder="e.g. St. Xavier's Senior Secondary School"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shortName" className="text-xs font-medium">
                Short Name / Acronym
              </Label>
              <Input
                id="shortName"
                value={form.shortName || ''}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                placeholder="e.g. SXS"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schoolCode" className="text-xs font-medium">
                School / Institution Code
              </Label>
              <Input
                id="schoolCode"
                value={form.schoolCode || ''}
                onChange={(e) => setForm({ ...form, schoolCode: e.target.value })}
                placeholder="e.g. SCH-04281"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="affiliation" className="text-xs font-medium">
                Affiliation / Board Code
              </Label>
              <Input
                id="affiliation"
                value={form.affiliation || ''}
                onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
                placeholder="e.g. CBSE / ICSE / State Board / IB"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registrationNumber" className="text-xs font-medium">
                Registration / Recognition Number
              </Label>
              <Input
                id="registrationNumber"
                value={form.registrationNumber || ''}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                placeholder="e.g. REG-2024-998"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section B: Contact Information */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contact Details
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primary communication channels displayed on circulars, invoices, and notification emails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Official Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@school.edu"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Helpdesk / Admin Telephone
              </Label>
              <Input
                id="phone"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 00000 00000"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="website" className="text-xs font-medium">
                Official Website URL
              </Label>
              <Input
                id="website"
                type="text"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://school.edu"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section C: Postal Address */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Address &amp; Location
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Headquarters campus address printed on official outgoing correspondence.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium">
                Campus Street Address
              </Label>
              <Input
                id="address"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Building number, road, landmark"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  value={form.city || ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-medium">
                  State / Province
                </Label>
                <Input
                  id="state"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pinCode" className="text-xs font-medium">
                  PIN / Postal Code
                </Label>
                <Input
                  id="pinCode"
                  value={form.pinCode || ''}
                  onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                  placeholder="PIN code"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section D: Document Identity Status (Section 10) */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-border/40 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document Identity Assets
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Institutional insignia, digital seal and signatures configured for document generation.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1 text-primary">
              <Link href="/school/settings/branding">
                Branding Center
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">Official Crest / Logo</div>
                <div className="text-[11px] text-muted-foreground">
                  {store.branding?.primaryLogoUrl ? 'Configured' : 'Not uploaded'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center gap-3">
              <Stamp className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">Institutional Seal</div>
                <div className="text-[11px] text-muted-foreground">
                  {store.branding?.schoolSealUrl ? 'Configured' : 'Not uploaded'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center gap-3">
              <FileSignature className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">Authorized Signature</div>
                <div className="text-[11px] text-muted-foreground">
                  {store.branding?.authorizedSignatureUrl ? 'Configured' : 'Not uploaded'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section E: Sticky Form Action Bar (Section 5) */}
        <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Unsaved changes pending submission
              </span>
            ) : (
              <span>All changes saved to school records</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty}
              onClick={resetForm}
              className="text-xs h-9 px-4"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty}
              className="text-xs h-9 px-5 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>

      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onDiscard={() => resetForm()}
        onContinueEditing={() => setShowUnsavedDialog(false)}
        onSave={() => {
          schoolStore.updateSchoolProfile(form);
          markSaved(form);
        }}
      />
    </form>
  );
}
