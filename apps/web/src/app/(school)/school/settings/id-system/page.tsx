'use client';

import React, { useState, useEffect } from 'react';
import {
  Hash,
  Sparkles,
  Save,
  RotateCcw,
  Copy,
  Check,
  Info,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface IdConfigState {
  studentPrefix: string;
  teacherPrefix: string;
  staffPrefix: string;
  includeYear: boolean;
  studentPadding: number;
  teacherPadding: number;
  staffPadding: number;
}

interface PreviewsState {
  studentSample: string;
  teacherSample: string;
  staffSample: string;
}

export default function IdSystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [form, setForm] = useState<IdConfigState>({
    studentPrefix: 'STD',
    teacherPrefix: 'TCH',
    staffPrefix: 'STF',
    includeYear: true,
    studentPadding: 4,
    teacherPadding: 4,
    staffPadding: 4,
  });

  const [originalForm, setOriginalForm] = useState<IdConfigState>({ ...form });

  // Fetch current config from database
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/id-config');
      if (!res.ok) {
        throw new Error('Failed to load ID format settings.');
      }
      const data = await res.json();
      if (data.config) {
        const loaded: IdConfigState = {
          studentPrefix: data.config.studentPrefix || 'STD',
          teacherPrefix: data.config.teacherPrefix || 'TCH',
          staffPrefix: data.config.staffPrefix || 'STF',
          includeYear: data.config.includeYear ?? true,
          studentPadding: data.config.studentPadding ?? 4,
          teacherPadding: data.config.teacherPadding ?? 4,
          staffPadding: data.config.staffPadding ?? 4,
        };
        setForm(loaded);
        setOriginalForm(loaded);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Unable to load ID settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Compute real-time live preview strings based on client-side state
  const computePreviews = (): PreviewsState => {
    const currentYear = new Date().getFullYear();
    const sSeq = '1'.padStart(form.studentPadding, '0');
    const tSeq = '1'.padStart(form.teacherPadding, '0');
    const stSeq = '1'.padStart(form.staffPadding, '0');

    const studentSample = form.includeYear
      ? `${form.studentPrefix || 'STD'}-${currentYear}-${sSeq}`
      : `${form.studentPrefix || 'STD'}-${sSeq}`;

    const teacherSample = `${form.studentPrefix || 'STD'}-${form.teacherPrefix || 'TCH'}-${tSeq}`;
    const staffSample = `${form.studentPrefix || 'STD'}-${form.staffPrefix || 'STF'}-${stSeq}`;

    return { studentSample, teacherSample, staffSample };
  };

  const previews = computePreviews();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${text} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReset = () => {
    setForm({ ...originalForm });
    toast.info('Form reverted to last saved configuration.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/school/id-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update ID settings.');
      }

      setOriginalForm({ ...form });
      toast.success(data.message || 'ID system updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating ID configuration');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                School ID System & Numbering
              </h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 font-semibold text-[11px]">
                Autonomous Engine
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Automated, collision-free institutional sequence generator for student admissions, faculty badges, and staff records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!isDirty || saving}
            className="text-xs gap-1.5 font-semibold shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Live Sample Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Admission ID Preview */}
        <Card className="border-border/60 shadow-xs bg-linear-to-b from-card to-muted/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-4 w-4" />
                Student Admission ID
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Auto-assigned
              </Badge>
            </div>
            <CardTitle className="text-lg font-mono tracking-wider pt-2 text-foreground flex items-center justify-between">
              <span className="truncate">{previews.studentSample}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(previews.studentSample, 'student')}
                title="Copy sample"
              >
                {copiedKey === 'student' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Assigned during online admission or paper intake. Optional manual override supported for transfer admissions.
          </CardContent>
        </Card>

        {/* Teacher Employee ID Preview */}
        <Card className="border-border/60 shadow-xs bg-linear-to-b from-card to-muted/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Briefcase className="h-4 w-4" />
                Faculty Employee ID
              </div>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                Continuous
              </Badge>
            </div>
            <CardTitle className="text-lg font-mono tracking-wider pt-2 text-foreground flex items-center justify-between">
              <span className="truncate">{previews.teacherSample}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(previews.teacherSample, 'teacher')}
                title="Copy sample"
              >
                {copiedKey === 'teacher' ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Automatically generated upon faculty onboarding or when an invited teacher accepts their email invitation.
          </CardContent>
        </Card>

        {/* Staff Member ID Preview */}
        <Card className="border-border/60 shadow-xs bg-linear-to-b from-card to-muted/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
                <Users className="h-4 w-4" />
                Staff Member ID
              </div>
              <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                Continuous
              </Badge>
            </div>
            <CardTitle className="text-lg font-mono tracking-wider pt-2 text-foreground flex items-center justify-between">
              <span className="truncate">{previews.staffSample}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(previews.staffSample, 'staff')}
                title="Copy sample"
              >
                {copiedKey === 'staff' ? <Check className="h-3.5 w-3.5 text-violet-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            Assigned to non-teaching personnel, administrative staff, account operators, and library managers.
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Institutional Prefix & Structure</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tailor the code components to match your school&apos;s statutory reporting and document standards.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* School Code Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-border/40">
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="studentPrefix" className="text-xs font-semibold text-foreground">
                  School Shortcode / Main Prefix
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Institutional identifier prefix prepended across all IDs (e.g. GIS, RIVO, DPS).
                </p>
              </div>
              <div className="sm:col-span-2 max-w-sm space-y-1.5">
                <Input
                  id="studentPrefix"
                  value={form.studentPrefix}
                  onChange={(e) =>
                    setForm({ ...form, studentPrefix: e.target.value.toUpperCase().slice(0, 8) })
                  }
                  placeholder="e.g. GIS"
                  maxLength={8}
                  className="font-mono uppercase font-bold tracking-wider"
                  disabled={loading || saving}
                />
                <span className="text-[11px] text-muted-foreground">
                  Maximum 8 alphanumeric characters. Recommended: 3 to 4 letters.
                </span>
              </div>
            </div>

            {/* Include Year Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pb-6 border-b border-border/40">
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="includeYear" className="text-xs font-semibold text-foreground">
                  Include Admission Year
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When enabled, the calendar year is embedded into student admission numbers (e.g. {form.studentPrefix}-{new Date().getFullYear()}-0001).
                </p>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <Switch
                  id="includeYear"
                  checked={form.includeYear}
                  onCheckedChange={(checked) => setForm({ ...form, includeYear: checked })}
                  disabled={loading || saving}
                />
                <span className="text-xs font-medium text-foreground">
                  {form.includeYear ? 'Enabled (Yearly Resets)' : 'Disabled (Continuous All-Time Numbering)'}
                </span>
              </div>
            </div>

            {/* Sub-Prefixes for Teachers & Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-border/40">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-foreground">
                  Role Sub-Prefixes
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Distinguish teachers and non-teaching personnel from student admission sequences.
                </p>
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="teacherPrefix" className="text-[11px] text-muted-foreground">
                    Teacher Sub-Prefix
                  </Label>
                  <Input
                    id="teacherPrefix"
                    value={form.teacherPrefix}
                    onChange={(e) =>
                      setForm({ ...form, teacherPrefix: e.target.value.toUpperCase().slice(0, 6) })
                    }
                    placeholder="TCH"
                    maxLength={6}
                    className="font-mono uppercase font-semibold"
                    disabled={loading || saving}
                  />
                  <span className="text-[10px] text-muted-foreground">Result: {previews.teacherSample}</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staffPrefix" className="text-[11px] text-muted-foreground">
                    Staff Sub-Prefix
                  </Label>
                  <Input
                    id="staffPrefix"
                    value={form.staffPrefix}
                    onChange={(e) =>
                      setForm({ ...form, staffPrefix: e.target.value.toUpperCase().slice(0, 6) })
                    }
                    placeholder="STF"
                    maxLength={6}
                    className="font-mono uppercase font-semibold"
                    disabled={loading || saving}
                  />
                  <span className="text-[10px] text-muted-foreground">Result: {previews.staffSample}</span>
                </div>
              </div>
            </div>

            {/* Sequence Padding Digits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-foreground">
                  Sequential Zero-Padding
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Number of digits to pad counter numbers. (e.g. 4 digits format yields 0001, 0002).
                </p>
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Student Digits</Label>
                  <Select
                    value={String(form.studentPadding)}
                    onValueChange={(val) => setForm({ ...form, studentPadding: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="font-mono text-xs" disabled={loading || saving}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Digits (001 - 999)</SelectItem>
                      <SelectItem value="4">4 Digits (0001 - 9999)</SelectItem>
                      <SelectItem value="5">5 Digits (00001 - 99999)</SelectItem>
                      <SelectItem value="6">6 Digits (000001+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Teacher Digits</Label>
                  <Select
                    value={String(form.teacherPadding)}
                    onValueChange={(val) => setForm({ ...form, teacherPadding: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="font-mono text-xs" disabled={loading || saving}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Digits (001)</SelectItem>
                      <SelectItem value="4">4 Digits (0001)</SelectItem>
                      <SelectItem value="5">5 Digits (00001)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Staff Digits</Label>
                  <Select
                    value={String(form.staffPadding)}
                    onValueChange={(val) => setForm({ ...form, staffPadding: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="font-mono text-xs" disabled={loading || saving}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Digits (001)</SelectItem>
                      <SelectItem value="4">4 Digits (0001)</SelectItem>
                      <SelectItem value="5">5 Digits (00001)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/40 py-3.5 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Multi-tenant isolation & atomic database locking active.</span>
            </div>

            <Button
              type="submit"
              disabled={!isDirty || saving}
              className="font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Apply ID Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Technical Architecture / How It Works Card */}
      <Card className="border-border/60 bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">How Automatic ID Generation Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3 rounded-xl border border-border/50 bg-card space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Atomic Concurrency Safe
              </div>
              <p>
                Each number is minted in an atomic transaction counter in Neon Postgres. Two clerks admitting students at the exact same instant will never receive the same ID.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-card space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Manual Override Friendly
              </div>
              <p>
                When admitting transfer students with existing paper registry numbers, admins can enter the manual number directly. The auto-generator steps aside and checks uniqueness.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-card space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Seamless Onboarding
              </div>
              <p>
                When you invite a new faculty member via Settings &gt; Invitations, their official Employee ID is automatically generated the moment they accept their secure link.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
