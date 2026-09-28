'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { CONCESSION_CATEGORIES, ConcessionType, ConcessionCategory } from '@/lib/fees/fee-constants';
import {
  BadgePercent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export interface EligibleObligation {
  id: string;
  title: string;
  dueDate: string | Date;
  originalAmount: number;
  concessionAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

interface ApplyConcessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    admissionNumber?: string | null;
    className?: string | null;
    sectionName?: string | null;
    enrollmentId: string;
    sessionId: string;
  };
  obligations: EligibleObligation[];
  onSuccess: () => void;
}

export function ApplyConcessionDialog({
  open,
  onOpenChange,
  student,
  obligations,
  onSuccess,
}: ApplyConcessionDialogProps) {
  const [concessionType, setConcessionType] = React.useState<ConcessionType>('FIXED_AMOUNT');
  const [rateOrAmount, setRateOrAmount] = React.useState<number>(0);
  const [category, setCategory] = React.useState<ConcessionCategory>('MERIT');
  const [reason, setReason] = React.useState('');
  const [selectedObligationIds, setSelectedObligationIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Eligible obligations with balance > 0
  const eligibleObligations = React.useMemo(() => {
    return obligations.filter((o) => o.status !== 'CANCELLED' && Number(o.balanceAmount) > 0);
  }, [obligations]);

  // Total available balance across all eligible obligations
  const totalEligibleBalance = React.useMemo(() => {
    return eligibleObligations.reduce((sum, o) => sum + Number(o.balanceAmount), 0);
  }, [eligibleObligations]);

  // Selected obligations balance pool
  const selectedBalancePool = React.useMemo(() => {
    if (selectedObligationIds.length === 0) return totalEligibleBalance;
    return eligibleObligations
      .filter((o) => selectedObligationIds.includes(o.id))
      .reduce((sum, o) => sum + Number(o.balanceAmount), 0);
  }, [eligibleObligations, selectedObligationIds, totalEligibleBalance]);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setRateOrAmount(0);
      setReason('');
      setCategory('MERIT');
      setConcessionType('FIXED_AMOUNT');
      setSelectedObligationIds([]);
    }
  }, [open]);

  // Calculate live preview of impact
  const calculatedImpact = React.useMemo(() => {
    let projectedConcession = 0;
    const targetObs =
      selectedObligationIds.length > 0
        ? eligibleObligations.filter((o) => selectedObligationIds.includes(o.id))
        : eligibleObligations;

    if (concessionType === 'PERCENTAGE') {
      const pct = Math.max(0, Math.min(100, rateOrAmount || 0));
      for (const ob of targetObs) {
        const calculated = Math.round((Number(ob.originalAmount) * (pct / 100)) * 100) / 100;
        const applied = Math.min(calculated, Number(ob.balanceAmount));
        projectedConcession += applied;
      }
    } else {
      projectedConcession = Math.min(Number(rateOrAmount) || 0, selectedBalancePool);
    }

    const newOutstanding = Math.max(0, selectedBalancePool - projectedConcession);

    return {
      projectedConcession,
      newOutstanding,
      isExceeded: concessionType === 'FIXED_AMOUNT' && (rateOrAmount || 0) > selectedBalancePool,
    };
  }, [concessionType, rateOrAmount, selectedObligationIds, eligibleObligations, selectedBalancePool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student.enrollmentId || !student.sessionId) {
      toast.error('Student enrollment context is missing.');
      return;
    }

    if (rateOrAmount <= 0) {
      toast.error('Please enter a valid concession amount or percentage rate.');
      return;
    }

    if (calculatedImpact.isExceeded) {
      toast.error(`Concession amount cannot exceed total outstanding balance (${formatINR(selectedBalancePool)}).`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('A detailed justification reason (at least 5 characters) is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentId: student.id,
        studentEnrollmentId: student.enrollmentId,
        academicSessionId: student.sessionId,
        type: concessionType,
        rateOrAmount: Number(rateOrAmount),
        category,
        reason: reason.trim(),
        obligationIds: selectedObligationIds.length > 0 ? selectedObligationIds : undefined,
      };

      const res = await fetch('/api/fees/concessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply concession');
      }

      toast.success(
        `Applied ₹${data.totalAppliedConcession} concession across ${data.affectedObligations?.length || 1} obligation(s).`
      );

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error granting fee concession');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <BadgePercent className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Apply Institutional Concession / Waiver
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Grant an authorized fee reduction or scholarship waiver against {student.name}'s active dues.
            </DialogDescription>
          </DialogHeader>

          {/* Student & Dues Banner */}
          <div className="p-3 rounded-lg border bg-muted/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground">{student.name}</span>
                <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                  (Adm #{student.admissionNumber || 'N/A'}{student.className ? ` · ${student.className}` : ''})
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {eligibleObligations.length} unpaid milestone(s)
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Total Eligible Outstanding:</span>
              <strong className="font-mono text-foreground">{formatINR(totalEligibleBalance)}</strong>
            </div>
          </div>

          {/* STEP 1: Select Scope */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Target Obligation Milestones
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedObligationIds.length === 0 ? 'Applying to all (Oldest First)' : `${selectedObligationIds.length} milestone(s) selected`}
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border rounded-md p-2 bg-card">
              {eligibleObligations.map((ob) => {
                const isSelected = selectedObligationIds.includes(ob.id);
                return (
                  <label
                    key={ob.id}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedObligationIds((prev) => [...prev, ob.id]);
                          } else {
                            setSelectedObligationIds((prev) => prev.filter((id) => id !== ob.id));
                          }
                        }}
                        className="rounded border-border"
                      />
                      <span className="font-medium text-foreground">{ob.title}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-muted-foreground mr-1.5">Bal:</span>
                      <strong className="text-foreground">{formatINR(ob.balanceAmount)}</strong>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Concession Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Concession Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConcessionType('FIXED_AMOUNT')}
                  className={`h-9 rounded-md border text-xs font-semibold transition-colors ${
                    concessionType === 'FIXED_AMOUNT'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Fixed Amount (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setConcessionType('PERCENTAGE')}
                  className={`h-9 rounded-md border text-xs font-semibold transition-colors ${
                    concessionType === 'PERCENTAGE'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Percentage (%)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concession-val" className="text-xs font-semibold">
                {concessionType === 'FIXED_AMOUNT' ? 'Rupee Amount (₹)' : 'Percentage Rate (%)'}{' '}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="concession-val"
                type="number"
                min="0"
                max={concessionType === 'PERCENTAGE' ? 100 : selectedBalancePool}
                step={concessionType === 'PERCENTAGE' ? '0.5' : '1'}
                value={rateOrAmount || ''}
                onChange={(e) => setRateOrAmount(parseFloat(e.target.value) || 0)}
                placeholder={concessionType === 'FIXED_AMOUNT' ? 'e.g. 3000' : 'e.g. 15'}
                className="h-9 text-xs font-mono font-semibold"
                required
              />
            </div>
          </div>

          {/* STEP 3: Category & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category / Policy</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ConcessionCategory)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CONCESSION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concession-reason" className="text-xs font-semibold">
                Mandatory Approval Justification <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="concession-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Approved by Principal per Merit Policy #402"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          {/* STEP 4: Real-time Parity & Impact Preview */}
          <div className="p-3.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Projected Ledger Impact
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground block">Target Balance:</span>
                <strong className="text-foreground">{formatINR(selectedBalancePool)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Concession Granted:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  -{formatINR(calculatedImpact.projectedConcession)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">New Outstanding:</span>
                <strong className="text-foreground">{formatINR(calculatedImpact.newOutstanding)}</strong>
              </div>
            </div>
            {calculatedImpact.isExceeded && (
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                ⚠️ Concession amount exceeds the selectable outstanding balance!
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isSubmitting ||
                rateOrAmount <= 0 ||
                calculatedImpact.isExceeded ||
                reason.trim().length < 5
              }
              className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? 'Applying Concession...' : 'Confirm Concession'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
