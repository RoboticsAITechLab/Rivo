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
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface RollRebalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RollPreviewItem {
  enrollmentId: string;
  studentId: string;
  name: string;
  admissionNumber: string;
  currentRollNumber: number | null;
  proposedRollNumber: number;
  rollNumberMode: 'AUTO' | 'MANUAL';
  changed: boolean;
}

export function RollRebalanceDialog({
  isOpen,
  onClose,
  onSuccess,
}: RollRebalanceDialogProps) {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedSectionId, setSelectedSectionId] = React.useState('');
  
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<RollPreviewItem[] | null>(null);
  const [manualCount, setManualCount] = React.useState(0);
  const [changedCount, setChangedCount] = React.useState(0);

  // Fetch classes
  React.useEffect(() => {
    if (!isOpen) return;
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClassId(data.classes[0].id);
          if (data.classes[0].sections && data.classes[0].sections.length > 0) {
            setSelectedSectionId(data.classes[0].sections[0].id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Update selected section when class changes
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setPreviewData(null);
    const cls = classes.find((c) => c.id === classId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setPreviewData(null);
  };

  const handleFetchPreview = async () => {
    if (!selectedClassId) return;
    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
      });
      if (selectedSectionId) {
        params.set('sectionId', selectedSectionId);
      }

      const res = await fetch(`/api/students/rolls/preview?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate roll rebalance preview');
      }
      const data = await res.json();
      setPreviewData(data.preview || []);
      setManualCount(data.manualCount || 0);
      setChangedCount(data.changedCount || 0);
    } catch (err: unknown) {
      toast('Preview Failed', err instanceof Error ? err.message : 'Error generating preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteRebalance = async () => {
    if (!selectedClassId) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/students/rolls/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionId: selectedSectionId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to rebalance roll numbers');
      }

      const result = await res.json();
      toast(
        'Roll Numbers Rebalanced',
        `Successfully re-calculated ${result.updatedCount} roll numbers in alphabetical order.`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast('Rebalance Failed', err instanceof Error ? err.message : 'Error executing rebalance');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Alphabetical Roll Number Rebalance
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Re-order and re-assign auto roll numbers according to lexicographical student name sorting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scope Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-border">
          <div>
            <label className="block text-xs font-semibold mb-1">Class / Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Section (Optional)</label>
            <select
              value={selectedSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background"
            >
              <option value="">All Sections</option>
              {(classes.find((c) => c.id === selectedClassId)?.sections || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Deterministic Alphabetical Policy</p>
            <p className="text-[11px] mt-0.5 opacity-90">
              Only students with <span className="font-bold">AUTO</span> roll numbers will shift.
              Existing <span className="font-bold">MANUAL</span> roll numbers are strictly preserved.
            </p>
          </div>
        </div>

        {/* Preview List or Trigger */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[340px] border rounded-lg p-2 bg-muted/20">
          {!previewData ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <RefreshCw className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="font-medium text-xs">Preview Not Generated Yet</p>
              <p className="text-[11px] max-w-sm mt-1">
                Click &quot;Generate Preview&quot; to compute proposed alphabetical roll numbers and verify shifts before committing.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 text-xs gap-1.5"
                onClick={handleFetchPreview}
                disabled={isLoadingPreview || !selectedClassId}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                {isLoadingPreview ? 'Computing...' : 'Generate Preview'}
              </Button>
            </div>
          ) : previewData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs py-8">
              No active students found in this class/section.
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                <span>Student Name &amp; Admission</span>
                <span>Roll Shift</span>
              </div>
              {previewData.map((item) => (
                <div
                  key={item.enrollmentId}
                  className={`flex items-center justify-between p-2 rounded-md border text-xs ${
                    item.rollNumberMode === 'MANUAL'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : item.changed
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-background border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{item.name}</span>
                      {item.rollNumberMode === 'MANUAL' ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1 py-0 px-1.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          MANUAL
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 py-0 px-1.5">
                          AUTO
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {item.admissionNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground line-through text-[11px]">
                      {item.currentRollNumber !== null ? `#${item.currentRollNumber}` : '—'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className={`font-bold text-sm ${item.changed ? 'text-primary' : 'text-foreground'}`}>
                      #{item.proposedRollNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rebalance Summary */}
        {previewData && (
          <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
            <span>
              Total: <strong className="text-foreground">{previewData.length}</strong> students
            </span>
            <span>
              Shifts: <strong className="text-blue-600">{changedCount}</strong> • Manual Preserved: <strong className="text-amber-600">{manualCount}</strong>
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExecuting}>
            Cancel
          </Button>
          {previewData ? (
            <Button
              size="sm"
              onClick={handleExecuteRebalance}
              disabled={isExecuting || changedCount === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isExecuting ? 'Applying...' : `Apply Rebalance (${changedCount} shifts)`}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFetchPreview}
              disabled={isLoadingPreview || !selectedClassId}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
              Preview Rebalance
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
