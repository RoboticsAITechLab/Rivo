'use client';

import * as React from 'react';
import {
  Hash,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings2,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import {
  selectCampuses,
  selectStreams,
  selectClasses,
} from '@/shared/selectors';
import {
  previewBulkExamRollAllocation,
  validateRollNumberUniqueness,
} from '@/shared/validation/roll-allocation-engine';

export default function ExamRollNumbersPage() {
  const store = useSchoolStore();

  // Filters
  const [selectedCampus, setSelectedCampus] = React.useState<string>('ALL');
  const [selectedClass, setSelectedClass] = React.useState<string>('ALL');
  const [selectedStream, setSelectedStream] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals
  const [isAllocateWizardOpen, setIsAllocateWizardOpen] = React.useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = React.useState(false);
  const [historyStudentId, setHistoryStudentId] = React.useState<string | null>(null);
  const [reassignStudentId, setReassignStudentId] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const campuses = selectCampuses(store);
  const streams = selectStreams(store);
  const classes = selectClasses(store);

  // Filtered roster rows
  const roster = React.useMemo(() => {
    return store.students
      .filter((std) => {
        if (selectedCampus !== 'ALL' && std.campusId !== selectedCampus) return false;
        if (selectedClass !== 'ALL' && std.classId !== selectedClass) return false;
        if (selectedStream !== 'ALL' && std.streamId !== selectedStream) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = std.name.toLowerCase().includes(q);
          const matchesAdm = std.admissionNumber.toLowerCase().includes(q);
          const matchesExamRoll = (std.examRollNumber || '').toLowerCase().includes(q);
          const matchesClassRoll = String(std.classRollNumber || '').includes(q);
          if (!matchesName && !matchesAdm && !matchesExamRoll && !matchesClassRoll) {
            return false;
          }
        }
        return true;
      })
      .map((std) => {
        const campus = store.campuses.find((c) => c.id === std.campusId);
        const cls = store.classes.find((c) => c.id === std.classId);
        const sec = cls?.sections.find((s) => s.id === std.sectionId);
        const stream = store.streams.find((s) => s.id === std.streamId);
        const assignment = store.examRollAssignments.find((a) => a.studentId === std.id);

        return {
          student: std,
          campusName: campus?.name || 'Main Campus',
          className: cls?.className || 'Class',
          sectionName: sec?.name || 'A',
          streamName: stream?.name,
          classRoll: std.classRollNumber || 1,
          examRoll: assignment?.examRollNumber || std.examRollNumber || 'Unallocated',
          status: assignment?.status || 'ACTIVE',
          assignedAt: assignment?.assignedAt || '2025-06-15',
          historyCount: assignment?.history.length || 1,
        };
      })
      .sort((a, b) => a.examRoll.localeCompare(b.examRoll, undefined, { numeric: true }));
  }, [store, selectedCampus, selectedClass, selectedStream, searchQuery]);

  const totalStudents = store.students.length;
  const totalAssigned = store.examRollAssignments.length;
  const pendingCount = Math.max(0, totalStudents - totalAssigned);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Exam Roll Number Management"
        description="Unified school-wide formal examination registry. Maintains separate, persistent Exam Roll Numbers across all campuses and examination cycles."
        icon={Hash}
        badge="Dual Roll Architecture"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 gap-1.5"
              onClick={() => setIsRulesModalOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Allocation Rules
            </Button>
            <Button
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setIsAllocateWizardOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Allocate New Students
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </div>
            <div className="text-xl font-bold text-foreground">{totalStudents}</div>
            <div className="text-[10px] text-muted-foreground">Across {campuses.length} Campuses</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Exam Rolls Assigned
            </div>
            <div className="text-xl font-bold text-foreground">{totalAssigned}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              100% Stable Identity
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pending Allocation
            </div>
            <div className="text-xl font-bold text-foreground">{pendingCount}</div>
            <div className="text-[10px] text-muted-foreground">New admissions to assign</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Next General Number
            </div>
            <div className="text-xl font-bold font-mono text-indigo-600">
              {store.rollAllocationConfig.nextAvailableNumber}
            </div>
            <div className="text-[10px] text-muted-foreground">School-wide Sequence</div>
          </div>
        </Card>
      </div>

      {/* 3. Filter Bar */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name, roll, admission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            {/* Campus Selector */}
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Campuses (Multi-site Aggregate)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Class Selector */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Classes (Grade 9-12)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </select>

            {/* Stream Selector */}
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Streams (Senior Secondary)</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{roster.length}</strong> candidates
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Roster Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Student &amp; ID</th>
                <th className="py-2.5 px-3">Campus</th>
                <th className="py-2.5 px-3">Class &amp; Div</th>
                <th className="py-2.5 px-3">Stream</th>
                <th className="py-2.5 px-3 font-semibold text-foreground">
                  Class Roll No.
                  <span className="block text-[9px] font-normal text-muted-foreground">Academic</span>
                </th>
                <th className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                  Exam Roll No.
                  <span className="block text-[9px] font-normal text-muted-foreground">Formal Stable</span>
                </th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              ) : (
                roster.map((row) => (
                  <tr key={row.student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{row.student.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {row.student.admissionNumber} • ID: {row.student.id}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {row.campusName}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-foreground">
                        {row.className} - {row.sectionName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {row.streamName ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.streamName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center justify-center font-mono font-medium px-2 py-0.5 rounded bg-muted text-foreground">
                        #{String(row.classRoll).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center justify-center font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {row.examRoll}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View Roll Number History"
                          onClick={() => setHistoryStudentId(row.student.id)}
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                          title="Controlled Manual Reassignment"
                          onClick={() => setReassignStudentId(row.student.id)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Modals & Sheets */}
      {isAllocateWizardOpen && (
        <BulkAllocationWizardDialog
          isOpen={isAllocateWizardOpen}
          onClose={() => setIsAllocateWizardOpen(false)}
          onSuccess={(msg) => {
            setIsAllocateWizardOpen(false);
            showToast(msg);
          }}
        />
      )}

      {isRulesModalOpen && (
        <AllocationRulesConfigDialog
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onSuccess={(msg) => {
            setIsRulesModalOpen(false);
            showToast(msg);
          }}
        />
      )}

      {historyStudentId && (
        <StudentRollHistoryDialog
          studentId={historyStudentId}
          isOpen={Boolean(historyStudentId)}
          onClose={() => setHistoryStudentId(null)}
        />
      )}

      {reassignStudentId && (
        <ManualReassignDialog
          studentId={reassignStudentId}
          isOpen={Boolean(reassignStudentId)}
          onClose={() => setReassignStudentId(null)}
          onSuccess={(msg) => {
            setReassignStudentId(null);
            showToast(msg);
          }}
        />
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// MODAL 1: BULK ALLOCATION WIZARD WITH PREVIEW & CONFLICT CHECKS
// ---------------------------------------------------------------------------
function BulkAllocationWizardDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const store = useSchoolStore();
  const [selectedCampus, setSelectedCampus] = React.useState<string>('ALL');
  const [selectedClass, setSelectedClass] = React.useState<string>('ALL');
  const [step, setStep] = React.useState<'config' | 'preview' | 'audit'>('config');
  const [previewData, setPreviewData] = React.useState<ReturnType<typeof previewBulkExamRollAllocation> | null>(null);

  const handleGeneratePreview = () => {
    const res = previewBulkExamRollAllocation(store, {
      campusIds: selectedCampus === 'ALL' ? undefined : [selectedCampus],
      classIds: selectedClass === 'ALL' ? undefined : [selectedClass],
      includeAlreadyAllocated: false,
    });
    setPreviewData(res);
    setStep('preview');
  };

  const handleCommitAllocation = () => {
    if (!previewData) return;
    const newStudentIds = previewData.allocations
      .filter((a) => a.isNewAllocation && a.status === 'READY')
      .map((a) => a.studentId);

    const committed = schoolStore.bulkAllocateExamRolls(newStudentIds);
    onSuccess(`Successfully allocated ${committed.length} new stable exam roll numbers across the institution!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Allocate New Students (Exam Roll Engine)</DialogTitle>
              <DialogDescription className="text-xs">
                Generates stable, persistent Exam Roll Numbers for newly admitted students without modifying or shifting existing students.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Guaranteed Roll Number Invariance (Rules 6, 7 &amp; 8)
              </div>
              <p className="text-muted-foreground text-[11px]">
                Existing students retain their current numbers. Numbers never shift, and transferred or alumni rolls are never reused automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Target Campus Scope" required>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="ALL">All Campuses (School-wide Aggregate)</option>
                  {store.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Class Division" required>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="ALL">All Academic Classes</option>
                  {store.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                onClick={handleGeneratePreview}
              >
                Preview Proposed Allocations
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border">
              <div>
                <span className="font-semibold text-foreground">
                  {previewData.newAllocationsCount} New Allocations Prepared
                </span>
                <span className="text-muted-foreground ml-2">
                  ({previewData.unchangedCount} already stable, {previewData.conflictsCount} conflicts)
                </span>
              </div>
              <Badge variant={previewData.conflictsCount > 0 ? 'destructive' : 'default'} className="text-[10px]">
                {previewData.conflictsCount > 0 ? 'Review Needed' : 'Conflict-Free'}
              </Badge>
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[10px] text-muted-foreground uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Student</th>
                    <th className="py-2 px-2.5">Campus</th>
                    <th className="py-2 px-2.5">Class / Stream</th>
                    <th className="py-2 px-2.5">Proposed Exam Roll</th>
                    <th className="py-2 px-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        All active students already have allocated exam rolls!
                      </td>
                    </tr>
                  ) : (
                    previewData.allocations.map((a) => (
                      <tr key={a.studentId} className="hover:bg-muted/20">
                        <td className="py-1.5 px-2.5 font-medium">{a.studentName}</td>
                        <td className="py-1.5 px-2.5 text-muted-foreground">{a.campusName}</td>
                        <td className="py-1.5 px-2.5">
                          {a.className} {a.streamName ? `(${a.streamName})` : ''}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-emerald-600">
                          {a.proposedRollNumber}
                        </td>
                        <td className="py-1.5 px-2.5">
                          {a.status === 'READY' ? (
                            <Badge variant="outline" className="text-emerald-600 text-[10px]">
                              Ready
                            </Badge>
                          ) : a.status === 'UNCHANGED' ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Existing
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              {a.conflictMessage}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep('config')}>
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={handleCommitAllocation}
                disabled={previewData.newAllocationsCount === 0 || previewData.conflictsCount > 0}
              >
                Confirm &amp; Commit Allocation
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MODAL 2: ALLOCATION RULES CONFIG DIALOG
// ---------------------------------------------------------------------------
function AllocationRulesConfigDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const store = useSchoolStore();
  const [config, setConfig] = React.useState(store.rollAllocationConfig);

  const handleSave = () => {
    schoolStore.updateRollAllocationConfig(config);
    onSuccess('Exam Roll Number Allocation rules updated successfully.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Exam Roll Number Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                Configure school-wide numbering sequences, Class 11/12 stream series, and reserved numbers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Allocation Scope" required>
              <select
                value={config.scope}
                onChange={(e) => setConfig({ ...config, scope: e.target.value as 'SCHOOL_WIDE' | 'CAMPUS_SPECIFIC' })}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="SCHOOL_WIDE">School-wide (All Campuses)</option>
                <option value="CAMPUS_SPECIFIC">Campus-Partitioned</option>
              </select>
            </FormField>

            <FormField label="Class 1–10 Start Number" required>
              <Input
                type="number"
                value={config.class1_10Rule.startNumber}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    class1_10Rule: { ...config.class1_10Rule, startNumber: parseInt(e.target.value, 10) || 1001 },
                  })
                }
                className="h-8.5 text-xs font-mono"
              />
            </FormField>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
            <div className="font-semibold text-xs text-foreground">Class 11 &amp; 12 Stream-Aware Rules</div>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="streamAwareCheck"
                checked={config.class11_12Rule.streamAware}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    class11_12Rule: { ...config.class11_12Rule, streamAware: e.target.checked },
                  })
                }
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="streamAwareCheck" className="text-foreground cursor-pointer">
                Enable separate numbering series for Science, Commerce &amp; Humanities
              </label>
            </div>

            {config.class11_12Rule.streamAware && (
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Science Prefix</span>
                  <Input value="SCI-" disabled className="h-7 text-xs font-mono bg-background" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Commerce Prefix</span>
                  <Input value="COM-" disabled className="h-7 text-xs font-mono bg-background" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Humanities Prefix</span>
                  <Input value="HUM-" disabled className="h-7 text-xs font-mono bg-background" />
                </div>
              </div>
            )}
          </div>

          <FormField label="Reserved Numbers (Comma-separated)">
            <Input
              value={config.reservedNumbers.join(', ')}
              onChange={(e) => {
                const nums = e.target.value
                  .split(',')
                  .map((n) => parseInt(n.trim(), 10))
                  .filter((n) => !isNaN(n));
                setConfig({ ...config, reservedNumbers: nums });
              }}
              placeholder="1000, 1099, 9999"
              className="h-8.5 text-xs font-mono"
            />
          </FormField>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="bg-primary text-white text-xs" onClick={handleSave}>
              Save Configuration
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MODAL 3: STUDENT ROLL HISTORY LOG
// ---------------------------------------------------------------------------
function StudentRollHistoryDialog({
  studentId,
  isOpen,
  onClose,
}: {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const store = useSchoolStore();
  const student = store.students.find((s) => s.id === studentId);
  const assignment = store.examRollAssignments.find((a) => a.studentId === studentId);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Exam Roll Assignment History</DialogTitle>
              <DialogDescription className="text-xs">
                Audit trail for {student?.name || 'Student'} ({student?.admissionNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-2.5 rounded bg-muted/40 text-xs">
            <div>
              <span className="text-muted-foreground">Current Active Exam Roll:</span>
              <span className="ml-2 font-mono font-bold text-emerald-600 text-sm">
                {assignment?.examRollNumber || 'Unassigned'}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Class Roll #{student?.classRollNumber}
            </Badge>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {!assignment || assignment.history.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No historical changes recorded.</div>
            ) : (
              assignment.history.map((h, idx) => (
                <div key={h.id || idx} className="p-2.5 rounded-lg border bg-card text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {h.oldRoll ? `${h.oldRoll} → ${h.newRoll}` : `Assigned: ${h.newRoll}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(h.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{h.reason}</p>
                  <div className="text-[10px] text-muted-foreground">Authorized by: {h.changedBy}</div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full">
              Close History Log
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MODAL 4: CONTROLLED MANUAL REASSIGNMENT DIALOG
// ---------------------------------------------------------------------------
function ManualReassignDialog({
  studentId,
  isOpen,
  onClose,
  onSuccess,
}: {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const store = useSchoolStore();
  const student = store.students.find((s) => s.id === studentId);
  const assignment = store.examRollAssignments.find((a) => a.studentId === studentId);

  const [newRoll, setNewRoll] = React.useState(assignment?.examRollNumber || '');
  const [reason, setReason] = React.useState('');
  const [adminName, setAdminName] = React.useState('Principal / Head of Evaluation');
  const [error, setError] = React.useState<string | null>(null);

  const handleReassign = () => {
    if (!newRoll.trim()) {
      setError('Please enter a valid roll number.');
      return;
    }
    if (!reason.trim()) {
      setError('Administrative reason is mandatory for any manual roll alteration.');
      return;
    }

    const check = validateRollNumberUniqueness(store, newRoll, studentId);
    if (!check.isUnique) {
      setError(`Roll number "${newRoll}" is already assigned to ${check.conflictingStudentName}.`);
      return;
    }

    schoolStore.manualReassignExamRoll(studentId, newRoll, reason, adminName);
    onSuccess(`Exam Roll Number updated for ${student?.name} to "${newRoll.trim()}".`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Edit2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Controlled Exam Roll Reassignment</DialogTitle>
              <DialogDescription className="text-xs">
                Modifies the formal exam roll for {student?.name}. Requires strict audit logging.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <strong>Rule 10 Policy:</strong> Manual reassignments are strictly auditable and permanent. The action will be logged in the student&apos;s immutable record.
          </div>

          <FormField label="Current Roll Number">
            <Input value={assignment?.examRollNumber || 'Unassigned'} disabled className="h-8.5 text-xs font-mono bg-muted/40" />
          </FormField>

          <FormField label="New Exam Roll Number" required error={error || undefined}>
            <Input
              value={newRoll}
              onChange={(e) => {
                setNewRoll(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. 1048 or SCI-1150"
              className="h-8.5 text-xs font-mono uppercase font-bold text-emerald-600"
            />
          </FormField>

          <FormField label="Reason for Modification" required>
            <Input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Disciplinary separation / Board exam correction order"
              className="h-8.5 text-xs"
            />
          </FormField>

          <FormField label="Authorized Signatory / Administrator" required>
            <Input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="h-8.5 text-xs"
            />
          </FormField>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs" onClick={handleReassign}>
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
