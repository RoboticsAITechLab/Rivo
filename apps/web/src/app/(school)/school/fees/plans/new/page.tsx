'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Calendar,
  Building2,
  Info,
  Sparkles,
  RefreshCw,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { SUGGESTED_FEE_HEADS, STREAM_OPTIONS, SuggestedFeeHead } from '@/lib/fees/fee-constants';
import { toast } from 'sonner';

interface FeeHead {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

interface ComponentItem {
  feeHeadId: string;
  name: string;
  amount: number;
  isOptional: boolean;
}

interface InstallmentItem {
  installmentNumber: number;
  name: string;
  dueDate: string;
  amount: number;
}

export default function FeePlanBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Metadata
  const [sessions, setSessions] = React.useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [campuses, setCampuses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [sections, setSections] = React.useState<Array<{ id: string; name: string }>>([]);
  const [feeHeads, setFeeHeads] = React.useState<FeeHead[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = React.useState(true);

  // Step 1: Identity
  const [planName, setPlanName] = React.useState('');
  const [planCode, setPlanCode] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Step 2: Targeting
  const [sessionId, setSessionId] = React.useState('');
  const [campusId, setCampusId] = React.useState('');
  const [classId, setClassId] = React.useState('');
  const [streamId, setStreamId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');

  // Step 3: Components
  const [components, setComponents] = React.useState<ComponentItem[]>([]);

  // Step 4: Installments
  const [installments, setInstallments] = React.useState<InstallmentItem[]>([]);

  // Step 5: Publish Option
  const [publishImmediately, setPublishImmediately] = React.useState(false);

  // Inline Fee Head Creation Modal
  const [quickHeadModalOpen, setQuickHeadModalOpen] = React.useState(false);
  const [newHeadName, setNewHeadName] = React.useState('');
  const [newHeadCode, setNewHeadCode] = React.useState('');
  const [newHeadDesc, setNewHeadDesc] = React.useState('');
  const [isCreatingHead, setIsCreatingHead] = React.useState(false);

  // Suggested Heads Opt-in inside Builder
  const [suggestModalOpen, setSuggestModalOpen] = React.useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<string[]>(
    SUGGESTED_FEE_HEADS.map((s: SuggestedFeeHead) => s.code)
  );
  const [isApplyingSuggestions, setIsApplyingSuggestions] = React.useState(false);

  // Load Metadata
  const loadMeta = React.useCallback(async () => {
    try {
      setIsLoadingMeta(true);
      const [sessRes, campRes, classRes, headsRes] = await Promise.all([
        fetch('/api/academic-sessions'),
        fetch('/api/campuses'),
        fetch('/api/classes'),
        fetch('/api/fees/heads'),
      ]);

      if (sessRes.ok) {
        const s = await sessRes.json();
        const list = s.sessions || s.academicSessions || [];
        setSessions(list);
        const active = list.find((item: any) => item.status === 'ACTIVE');
        if (active && !sessionId) setSessionId(active.id);
      }
      if (campRes.ok) {
        const c = await campRes.json();
        setCampuses(c.campuses || []);
      }
      if (classRes.ok) {
        const cl = await classRes.json();
        setClasses(cl.classes || []);
      }
      if (headsRes.ok) {
        const h = await headsRes.json();
        setFeeHeads(h.heads || []);
      }
    } catch (err) {
      console.warn('Failed to load builder metadata', err);
    } finally {
      setIsLoadingMeta(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Load Sections when Class changes
  React.useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId('');
      return;
    }
    async function loadSections() {
      try {
        const res = await fetch(`/api/sections?classId=${classId}`);
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections || []);
        }
      } catch (err) {
        console.warn('Failed to load sections', err);
      }
    }
    loadSections();
  }, [classId]);

  // Inline Fee Head Creation
  const handleQuickCreateHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName.trim() || !newHeadCode.trim()) {
      toast.error('Both Fee Head Name and Code are required.');
      return;
    }

    setIsCreatingHead(true);
    try {
      const res = await fetch('/api/fees/heads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newHeadName.trim(),
          code: newHeadCode.trim().toUpperCase(),
          description: newHeadDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create fee head');
      }

      toast.success(`Fee Head '${newHeadName.trim()}' created`);
      setQuickHeadModalOpen(false);
      setNewHeadName('');
      setNewHeadCode('');
      setNewHeadDesc('');

      // Refresh catalog and automatically add to components
      const updatedHeadsRes = await fetch('/api/fees/heads');
      if (updatedHeadsRes.ok) {
        const updated = await updatedHeadsRes.json();
        const list: FeeHead[] = updated.heads || [];
        setFeeHeads(list);

        const created = list.find((h) => h.id === data.head.id) || data.head;
        setComponents((prev) => [
          ...prev,
          {
            feeHeadId: created.id,
            name: created.name,
            amount: 0,
            isOptional: false,
          },
        ]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee head');
    } finally {
      setIsCreatingHead(false);
    }
  };

  // Bulk Apply Suggested Heads & pre-populate components
  const handleApplySuggestedStructure = async () => {
    setIsApplyingSuggestions(true);
    const toCreate = SUGGESTED_FEE_HEADS.filter(
      (s: SuggestedFeeHead) =>
        selectedSuggestions.includes(s.code) &&
        !feeHeads.some((h) => h.code.toUpperCase() === s.code.toUpperCase() || h.name.toLowerCase() === s.name.toLowerCase())
    );

    for (const item of toCreate) {
      try {
        await fetch('/api/fees/heads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } catch (err) {
        console.error('Error creating suggested head:', err);
      }
    }

    // Refresh heads
    const headsRes = await fetch('/api/fees/heads');
    let currentCatalog = feeHeads;
    if (headsRes.ok) {
      const data = await headsRes.json();
      currentCatalog = data.heads || [];
      setFeeHeads(currentCatalog);
    }

    // Pre-populate components with selected suggestions
    const newComponents: ComponentItem[] = [];
    for (const code of selectedSuggestions) {
      const head = currentCatalog.find((h) => h.code.toUpperCase() === code.toUpperCase());
      if (head && !components.some((c) => c.feeHeadId === head.id)) {
        newComponents.push({
          feeHeadId: head.id,
          name: head.name,
          amount: 0,
          isOptional: false,
        });
      }
    }

    if (newComponents.length > 0) {
      setComponents((prev) => [...prev, ...newComponents]);
      toast.success(`Added ${newComponents.length} component(s) to fee plan.`);
    }

    setIsApplyingSuggestions(false);
    setSuggestModalOpen(false);
  };

  // Add Component Item
  const handleAddComponent = () => {
    if (feeHeads.length === 0) {
      setQuickHeadModalOpen(true);
      return;
    }
    const defaultHead = feeHeads[0];
    setComponents((prev) => [
      ...prev,
      {
        feeHeadId: defaultHead.id,
        name: defaultHead.name,
        amount: 0,
        isOptional: false,
      },
    ]);
  };

  const handleUpdateComponent = (index: number, updates: Partial<ComponentItem>) => {
    setComponents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      if (updates.feeHeadId) {
        const head = feeHeads.find((h) => h.id === updates.feeHeadId);
        if (head) copy[index].name = head.name;
      }
      return copy;
    });
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Installment Item
  const handleAddInstallment = () => {
    const nextNum = installments.length + 1;
    const now = new Date();
    now.setMonth(now.getMonth() + (nextNum - 1) * 3);
    const dateStr = now.toISOString().slice(0, 10);

    setInstallments((prev) => [
      ...prev,
      {
        installmentNumber: nextNum,
        name: `Installment #${nextNum}`,
        dueDate: dateStr,
        amount: 0,
      },
    ]);
  };

  // Quick Preset EMI Splitter
  const handleApplyInstallmentPreset = (count: number) => {
    if (count <= 0) return;
    const total = componentsTotal;
    const baseAmount = total > 0 ? Math.floor(total / count) : 0;
    const remainder = total > 0 ? total - baseAmount * count : 0;

    const names =
      count === 1
        ? ['Annual One-Time Fee']
        : count === 2
        ? ['Semester 1 (Autumn)', 'Semester 2 (Spring)']
        : count === 4
        ? ['Quarter 1 (April)', 'Quarter 2 (July)', 'Quarter 3 (October)', 'Quarter 4 (January)']
        : Array.from({ length: count }, (_, i) => `Installment #${i + 1}`);

    const newInsts: InstallmentItem[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + i * Math.floor(12 / count));
      newInsts.push({
        installmentNumber: i + 1,
        name: names[i] || `Installment #${i + 1}`,
        dueDate: d.toISOString().slice(0, 10),
        amount: i === count - 1 ? baseAmount + remainder : baseAmount,
      });
    }

    setInstallments(newInsts);
    toast.success(`Generated ${count}-installment payment schedule.`);
  };

  const handleUpdateInstallment = (index: number, updates: Partial<InstallmentItem>) => {
    setInstallments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveInstallment = (index: number) => {
    setInstallments((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, installmentNumber: i + 1 }))
    );
  };

  // Mathematical Parity Checks
  const componentsTotal = React.useMemo(() => {
    return components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [components]);

  const installmentsTotal = React.useMemo(() => {
    return installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  }, [installments]);

  const difference = componentsTotal - installmentsTotal;
  const isParityValid = componentsTotal > 0 && installmentsTotal > 0 && Math.abs(difference) < 0.009;

  // Form Submission
  const handleSubmitPlan = async () => {
    setFormError(null);

    if (!planName.trim()) {
      setFormError('Plan Name is required.');
      setCurrentStep(1);
      return;
    }
    if (!sessionId || !classId) {
      setFormError('Academic Session and Class target are required.');
      setCurrentStep(2);
      return;
    }
    if (components.length === 0) {
      setFormError('At least one fee component is required.');
      setCurrentStep(3);
      return;
    }
    if (installments.length === 0) {
      setFormError('At least one installment schedule entry is required.');
      setCurrentStep(4);
      return;
    }
    if (!isParityValid) {
      setFormError(
        `Financial Parity Mismatch: Components Total (${formatINR(componentsTotal)}) must exactly equal Installments Total (${formatINR(installmentsTotal)}). Difference: ${formatINR(difference)}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        academicSessionId: sessionId,
        campusId: campusId || null,
        classId,
        streamId: streamId || null,
        sectionId: sectionId || null,
        name: planName.trim(),
        code: planCode.trim() || null,
        description: description.trim() || null,
        totalAmount: componentsTotal,
        items: components.map((c, i) => ({
          feeHeadId: c.feeHeadId,
          name: c.name,
          amount: Number(c.amount),
          isOptional: c.isOptional,
          displayOrder: i,
        })),
        installments: installments.map((inst) => ({
          installmentNumber: inst.installmentNumber,
          name: inst.name,
          dueDate: inst.dueDate,
          amount: Number(inst.amount),
        })),
      };

      const res = await fetch('/api/fees/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to create fee plan');
      }

      const planId = resData.plan?.id || resData.id;

      // If Publish Immediately was toggled, publish version 1 authoritatively
      if (publishImmediately && planId) {
        const pubRes = await fetch(`/api/fees/plans/${planId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionNumber: 1 }),
        });
        if (!pubRes.ok) {
          const pubErr = await pubRes.json();
          toast.warning(`Plan saved as Draft, but publishing failed: ${pubErr.message}`);
          router.push(`/school/fees/plans/${planId}`);
          return;
        }
        toast.success(`Fee Plan '${planName}' created and Version 1 published.`);
      } else {
        toast.success(`Fee Plan '${planName}' saved as Draft Version 1.`);
      }

      router.push(`/school/fees/plans/${planId}`);
    } catch (err: any) {
      console.error('Error submitting fee plan:', err);
      setFormError(err.message || 'Error saving fee plan. Verify server constraints.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Identity' },
    { num: 2, title: 'Targeting' },
    { num: 3, title: 'Components' },
    { num: 4, title: 'Installments' },
    { num: 5, title: 'Review & Save' },
  ];

  const selectedClassName = classes.find((c) => c.id === classId)?.name || 'All Classes';
  const selectedCampusName = campuses.find((c) => c.id === campusId)?.name || 'All Campuses';
  const selectedSectionName = sections.find((s) => s.id === sectionId)?.name;
  const selectedSessionName = sessions.find((s) => s.id === sessionId)?.name || 'Current Session';

  return (
    <PageContainer>
      <PageHeader
        title="Fee Plan Builder"
        description="Configure structured institutional fee plans, custom installment milestones, and target cohorts"
        actions={
          <Button variant="outline" size="sm" asChild className="h-8.5 text-xs gap-1.5">
            <Link href="/school/fees/plans">
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </Link>
          </Button>
        }
      />

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between max-w-3xl mx-auto my-6 px-2">
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-2 group text-xs font-semibold cursor-pointer ${
                currentStep === s.num
                  ? 'text-primary'
                  : currentStep > s.num
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs transition-colors ${
                  currentStep === s.num
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : currentStep > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  currentStep > idx + 1 ? 'bg-emerald-600' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {formError && (
        <div className="max-w-3xl mx-auto mb-6 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <div className="font-bold">Configuration Validation Error</div>
            <p className="whitespace-pre-line">{formError}</p>
          </div>
        </div>
      )}

      {/* Active Form Step Container */}
      <div className="max-w-3xl mx-auto">
        {/* STEP 1: IDENTITY */}
        {currentStep === 1 && (
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Step 1: Plan Identity & Reference
              </CardTitle>
              <CardDescription className="text-xs">
                Provide an administrative name and optional internal tracking code for this plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name" className="text-xs font-semibold">
                  Fee Plan Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="plan-name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Standard Secondary Tuition (Class 10 - 2026-27)"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-code" className="text-xs font-semibold">
                  Custom Plan Code (Optional)
                </Label>
                <Input
                  id="plan-code"
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FP-2026-CLS10-SCI (leave blank to auto-generate)"
                  className="text-xs h-9 font-mono uppercase"
                />
                <p className="text-[11px] text-muted-foreground">
                  If left blank, the Rivo Authoritative ID Sequence will generate an official immutable identifier.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-desc" className="text-xs font-semibold">
                  Description / Operational Notes
                </Label>
                <Input
                  id="plan-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Includes laboratory fees, library access, and term assessment components"
                  className="text-xs h-9"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!planName.trim()) {
                      toast.error('Plan Name is required.');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="text-xs gap-1.5"
                >
                  Continue to Targeting <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: COHORT TARGETING */}
        {currentStep === 2 && (
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Step 2: Cohort Targeting & Scope
              </CardTitle>
              <CardDescription className="text-xs">
                Select the academic session, grade level, stream, and division scope for this fee plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Academic Session <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Session...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Campus (Optional)</Label>
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">All Campuses (Institutional General)</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Class / Grade Level <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Academic Stream (Optional)</Label>
                  <select
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {STREAM_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Section Division (Optional)</Label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!classId}
                  >
                    <option value="">All Sections (Applies to all divisions of this class)</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Leave as 'All Sections' unless this fee structure is unique to a specific section cohort.
                  </p>
                </div>
              </div>

              {/* Targeting Visual Summary Strip */}
              <div className="p-3.5 rounded-lg border bg-muted/20 text-xs space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" /> Effective Audience Targeting
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Session:</span>
                    <strong className="text-foreground">{selectedSessionName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Class:</span>
                    <strong className="text-foreground">{selectedClassName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Stream:</span>
                    <strong className="text-foreground">{streamId || 'All Streams'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Section:</span>
                    <strong className="text-foreground">
                      {selectedSectionName ? `Sec ${selectedSectionName}` : 'All Sections'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="text-xs">
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!sessionId || !classId) {
                      toast.error('Please select both Academic Session and Class.');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="text-xs gap-1.5"
                >
                  Continue to Components <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: FEE COMPONENTS */}
        {currentStep === 3 && (
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Step 3: Fee Components Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Assign fee heads (Tuition, Lab, Transport, etc.) and their respective charges.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSuggestModalOpen(true)}
                  className="h-8 text-xs gap-1 text-emerald-700 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Suggested Heads
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddComponent} className="h-8 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Component
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {components.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-foreground">No components added yet</div>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Click "+ Add Component" to choose from your school fee catalog, or use Suggested Heads to quickly populate standard tuition items.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button size="sm" onClick={handleAddComponent} className="text-xs gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Custom Component
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSuggestModalOpen(true)}
                      className="text-xs gap-1 border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:border-emerald-800"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Use Suggested Heads
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg bg-card flex flex-wrap items-center gap-3 text-xs"
                    >
                      <div className="w-[190px]">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[10px] text-muted-foreground">Fee Head</Label>
                          <button
                            type="button"
                            onClick={() => setQuickHeadModalOpen(true)}
                            className="text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            + New Head
                          </button>
                        </div>
                        <select
                          value={comp.feeHeadId}
                          onChange={(e) => handleUpdateComponent(idx, { feeHeadId: e.target.value })}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {feeHeads.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 min-w-[150px]">
                        <Label className="text-[10px] text-muted-foreground block mb-1">Display Title</Label>
                        <Input
                          value={comp.name}
                          onChange={(e) => handleUpdateComponent(idx, { name: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="w-[130px]">
                        <Label className="text-[10px] text-muted-foreground block mb-1">Amount (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={comp.amount || ''}
                          onChange={(e) => handleUpdateComponent(idx, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs font-mono font-semibold"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveComponent(idx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between font-semibold text-xs">
                    <span>Total Components Sum:</span>
                    <FinancialAmount amount={componentsTotal} size="md" variant="default" />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} className="text-xs">
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (components.length === 0) {
                      toast.error('Add at least one fee component.');
                      return;
                    }
                    if (componentsTotal <= 0) {
                      toast.error('Component amount must be greater than ₹0.');
                      return;
                    }
                    setCurrentStep(4);
                  }}
                  disabled={components.length === 0}
                  className="text-xs gap-1.5"
                >
                  Continue to Installments <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: INSTALLMENTS / EMI SCHEDULE */}
        {currentStep === 4 && (
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Step 4: Installment Schedule Builder
                </CardTitle>
                <CardDescription className="text-xs">
                  Define due dates and amounts (supports arbitrary count, unequal amounts, and custom frequency).
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddInstallment} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Milestone
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Preset Toolbar */}
              <div className="p-3 rounded-lg border bg-card/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Quick Schedule Presets:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyInstallmentPreset(1)}
                    className="h-7 text-[11px] px-2"
                  >
                    Annual (1x)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyInstallmentPreset(2)}
                    className="h-7 text-[11px] px-2"
                  >
                    Half-Yearly (2x)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyInstallmentPreset(4)}
                    className="h-7 text-[11px] px-2 font-semibold text-primary"
                  >
                    Quarterly (4x)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyInstallmentPreset(6)}
                    className="h-7 text-[11px] px-2"
                  >
                    Bi-Monthly (6x)
                  </Button>
                </div>
              </div>

              {installments.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-2">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="font-semibold text-xs text-foreground">No installments configured</div>
                  <p className="text-[11px] text-muted-foreground">
                    Select a Quick Preset above or click "Add Milestone" to configure custom payment dates.
                  </p>
                  <Button size="sm" onClick={handleAddInstallment} className="text-xs mt-2">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Milestone
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {installments.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg bg-card flex flex-wrap items-center gap-3 text-xs"
                    >
                      <span className="font-mono font-bold text-muted-foreground w-6">#{inst.installmentNumber}</span>

                      <div className="flex-1 min-w-[150px]">
                        <Label className="text-[10px] text-muted-foreground block mb-1">Installment Name</Label>
                        <Input
                          value={inst.name}
                          onChange={(e) => handleUpdateInstallment(idx, { name: e.target.value })}
                          placeholder="e.g. Q1 / April 2026"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="w-[160px]">
                        <Label className="text-[10px] text-muted-foreground block mb-1">Due Date</Label>
                        <Input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => handleUpdateInstallment(idx, { dueDate: e.target.value })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="w-[130px]">
                        <Label className="text-[10px] text-muted-foreground block mb-1">Amount (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={inst.amount || ''}
                          onChange={(e) => handleUpdateInstallment(idx, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs font-mono font-semibold"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInstallment(idx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Parity Status in Step 4 */}
                  <div className="p-3.5 rounded-lg border bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Plan Target Total:</span>
                      <strong className="text-foreground">{formatINR(componentsTotal)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Installments Sum:</span>
                      <strong className="text-foreground">{formatINR(installmentsTotal)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Remaining to Allocate:</span>
                      <span
                        className={`font-mono font-bold ${
                          isParityValid
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isParityValid ? '₹0 (Balanced)' : formatINR(difference)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)} className="text-xs">
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(5)}
                  disabled={installments.length === 0}
                  className="text-xs gap-1.5"
                >
                  Review & Validate <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: REVIEW & FINANCIAL PARITY */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Step 5: Review & Financial Parity Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Financial rules strictly enforce that Components Sum equals Installments Sum before submission.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border bg-muted/10 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Components Total</span>
                    <FinancialAmount amount={componentsTotal} size="lg" />
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Installments Total</span>
                    <FinancialAmount amount={installmentsTotal} size="lg" />
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Difference</span>
                    <FinancialAmount
                      amount={difference}
                      size="lg"
                      variant={isParityValid ? 'success' : 'destructive'}
                    />
                  </div>
                </div>

                {isParityValid ? (
                  <div className="p-3 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Parity Verified:</strong> Components total exactly balances installments schedule.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>Validation Blocked:</strong> Installment schedule differs by {formatINR(Math.abs(difference))}.
                      Adjust installment amounts or fee components so difference is exactly ₹0.
                    </span>
                  </div>
                )}

                {/* Plan Summary Strip */}
                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Plan Name:</span>
                    <span className="font-bold text-foreground">{planName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Session / Campus:</span>
                    <span className="font-bold text-foreground">
                      {selectedSessionName} • {selectedCampusName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Target Cohort:</span>
                    <span className="font-bold text-foreground">
                      {selectedClassName} {streamId ? `(${streamId})` : ''}{' '}
                      {selectedSectionName ? `[Sec ${selectedSectionName}]` : '[All Sections]'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Components Breakdown:</span>
                    <span className="font-mono">{components.length} item(s)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Installments Count:</span>
                    <span className="font-mono">{installments.length} milestone(s)</span>
                  </div>
                </div>

                {/* Publishing Option */}
                <div className="p-4 border rounded-lg bg-card/60 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="publish-toggle" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-600" /> Publish Immediately (v1 Locked)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      If enabled, this version is published immediately and becomes available for student cohort assignments.
                    </p>
                  </div>
                  <Switch
                    id="publish-toggle"
                    checked={publishImmediately}
                    onCheckedChange={setPublishImmediately}
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)} className="text-xs">
                    Back to Installments
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitPlan}
                    disabled={!isParityValid || isSubmitting}
                    className="text-xs gap-1.5 font-bold"
                  >
                    {isSubmitting
                      ? 'Saving Plan...'
                      : publishImmediately
                      ? 'Publish Fee Plan v1'
                      : 'Save Plan as Draft v1'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Add Fee Head Modal */}
      <Dialog open={quickHeadModalOpen} onOpenChange={setQuickHeadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleQuickCreateHead}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Create Fee Head
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a new institutional fee category to your school catalog on the fly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="quick-head-name" className="text-xs font-semibold">
                  Fee Head Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quick-head-name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="e.g. Tuition Fee, Laboratory Charges"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-head-code" className="text-xs font-semibold">
                  Unique Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quick-head-code"
                  value={newHeadCode}
                  onChange={(e) => setNewHeadCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TUF, LAB, EXM"
                  className="text-xs h-9 font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-head-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Input
                  id="quick-head-desc"
                  value={newHeadDesc}
                  onChange={(e) => setNewHeadDesc(e.target.value)}
                  placeholder="Optional billing remarks"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickHeadModalOpen(false)}
                disabled={isCreatingHead}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreatingHead}>
                {isCreatingHead ? 'Creating...' : 'Create & Select'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suggested Heads Opt-in inside Builder */}
      <Dialog open={suggestModalOpen} onOpenChange={setSuggestModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Suggested Institutional Fee Structure
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Select standard institutional heads to add to your catalog and pre-fill this fee plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-3 max-h-[50vh] overflow-y-auto pr-1">
            {SUGGESTED_FEE_HEADS.map((s: SuggestedFeeHead) => {
              const isChecked = selectedSuggestions.includes(s.code);
              return (
                <div
                  key={s.code}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                    isChecked ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`builder-sugg-${s.code}`}
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSuggestions((prev) => [...prev, s.code]);
                      } else {
                        setSelectedSuggestions((prev) => prev.filter((c) => c !== s.code));
                      }
                    }}
                    className="mt-0.5 rounded border-border"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`builder-sugg-${s.code}`} className="font-bold text-foreground cursor-pointer">
                        {s.name}
                      </label>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSuggestModalOpen(false)}
              disabled={isApplyingSuggestions}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplySuggestedStructure}
              disabled={isApplyingSuggestions || selectedSuggestions.length === 0}
              className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isApplyingSuggestions ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Populate Selected Heads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}