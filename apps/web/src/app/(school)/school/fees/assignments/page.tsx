'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  ShieldCheck,
  BadgePercent,
  Check,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { FeeNav } from '@/components/fees/fee-nav';
import { FinancialAmount, formatINR } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

interface StudentRow {
  id: string;
  name: string;
  admissionNumber: string;
  rollNumber: string | number;
  className: string;
  sectionName: string;
  parentName: string;
  enrollmentId: string;
}

export default function FeeAssignmentsPage() {
  const searchParams = useSearchParams();
  const preselectedPlanVersionId = searchParams.get('feePlanVersionId');

  const [isLoading, setIsLoading] = React.useState(false);
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Dropdown Metadata
  const [sessions, setSessions] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [classes, setClasses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [sections, setSections] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedSectionId, setSelectedSectionId] = React.useState('');

  // Published Fee Plans
  const [publishedPlans, setPublishedPlans] = React.useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = React.useState(preselectedPlanVersionId || '');

  // Concession Inputs
  const [customConcession, setCustomConcession] = React.useState<number>(0);
  const [concessionReason, setConcessionReason] = React.useState<string>('');

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Load Sessions & Classes
  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [sessRes, classRes] = await Promise.all([
          fetch('/api/academic-sessions'),
          fetch('/api/classes'),
        ]);
        if (sessRes.ok) {
          const s = await sessRes.json();
          const list = s.sessions || s.academicSessions || [];
          setSessions(list);
          const active = list.find((item: any) => item.status === 'ACTIVE');
          if (active) setSelectedSessionId(active.id);
        }
        if (classRes.ok) {
          const cl = await classRes.json();
          setClasses(cl.classes || []);
          if (cl.classes?.length > 0) setSelectedClassId(cl.classes[0].id);
        }
      } catch (err) {
        console.warn('Failed to load sessions/classes', err);
      }
    }
    loadMeta();
  }, []);

  // Load Sections when Class changes
  React.useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionId('');
      return;
    }
    async function loadSections() {
      try {
        const res = await fetch(`/api/sections?classId=${selectedClassId}`);
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections || []);
        }
      } catch (err) {
        console.warn('Failed to load sections', err);
      }
    }
    loadSections();
  }, [selectedClassId]);

  // Load Published Fee Plans for this session & class
  React.useEffect(() => {
    async function loadPublishedPlans() {
      try {
        const params = new URLSearchParams();
        if (selectedSessionId) params.set('academicSessionId', selectedSessionId);
        if (selectedClassId) params.set('classId', selectedClassId);

        const res = await fetch(`/api/fees/plans?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const plansList = data.plans || [];
          const publishedVersionsList: any[] = [];

          for (const plan of plansList) {
            for (const v of plan.versions || []) {
              if (v.status === 'PUBLISHED') {
                publishedVersionsList.push({
                  id: v.id,
                  planName: plan.name,
                  planCode: plan.code,
                  versionNumber: v.versionNumber,
                  totalAmount: v.totalAmount,
                  installmentsCount: v.installments?.length || 0,
                  className: plan.class?.name,
                });
              }
            }
          }

          setPublishedPlans(publishedVersionsList);
          if (publishedVersionsList.length > 0 && !selectedVersionId) {
            setSelectedVersionId(publishedVersionsList[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load published fee plans', err);
      }
    }
    loadPublishedPlans();
  }, [selectedSessionId, selectedClassId, selectedVersionId]);

  // Fetch Students for the selected class/section
  const fetchStudents = React.useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    setSelectedEnrollmentIds([]);
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
        pageSize: '100',
      });
      if (selectedSectionId) params.set('sectionId', selectedSectionId);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load students (HTTP ${res.status})`);
      const data = await res.json();

      const mapped: StudentRow[] = (data.students || []).map((s: any) => ({
        id: s.id,
        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        admissionNumber: s.admissionNumber || 'N/A',
        rollNumber: s.enrollments?.[0]?.rollNumber || s.rollNumber || 'N/A',
        className: s.enrollments?.[0]?.class?.name || s.className || '',
        sectionName: s.enrollments?.[0]?.section?.name || s.section || '',
        parentName: s.parentStudents?.[0]?.parent?.firstName || s.parentName || 'N/A',
        enrollmentId: s.enrollments?.[0]?.id || s.enrollmentId || s.id,
      }));

      setStudents(mapped);
    } catch (err: any) {
      console.error('Error fetching candidate students:', err);
      toast.error('Unable to fetch candidate student roster.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedSectionId]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const selectedPlanDetails = React.useMemo(() => {
    return publishedPlans.find((p) => p.id === selectedVersionId) || null;
  }, [publishedPlans, selectedVersionId]);

  // Handle Assignment Submission
  const handleAssign = async () => {
    if (!selectedSessionId || !selectedVersionId || selectedEnrollmentIds.length === 0) {
      toast.error('Select a fee plan and at least one student.');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch('/api/fees/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicSessionId: selectedSessionId,
          feePlanVersionId: selectedVersionId,
          studentEnrollmentIds: selectedEnrollmentIds,
          customConcessionAmount: customConcession > 0 ? customConcession : undefined,
          concessionReason: concessionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Assignment failed');

      toast.success(
        `Successfully assigned fee plan to ${selectedEnrollmentIds.length} student(s)! Obligations generated.`
      );
      setConfirmOpen(false);
      setSelectedEnrollmentIds([]);
      setCustomConcession(0);
      setConcessionReason('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign fee plan.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filtered Students
  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        String(s.rollNumber).toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Table Columns
  const columns: ColumnDef<StudentRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => {
        const isChecked = selectedEnrollmentIds.includes(row.enrollmentId);
        return (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {
              setSelectedEnrollmentIds((prev) =>
                isChecked ? prev.filter((id) => id !== row.enrollmentId) : [...prev, row.enrollmentId]
              );
            }}
            className="rounded border-border h-4 w-4 text-primary focus:ring-primary"
          />
        );
      },
      width: '40px',
    },
    {
      key: 'name',
      header: 'Student Name & Admission No.',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{row.name}</div>
          <div className="text-[11px] text-muted-foreground font-mono">Adm: {row.admissionNumber}</div>
        </div>
      ),
    },
    {
      key: 'rollNumber',
      header: 'Roll #',
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.rollNumber}</span>,
      width: '80px',
    },
    {
      key: 'class',
      header: 'Class & Section',
      render: (row) => (
        <span className="text-xs text-foreground font-medium">
          {row.className} {row.sectionName ? `· Sec ${row.sectionName}` : ''}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'parent',
      header: 'Parent / Guardian',
      render: (row) => <span className="text-xs text-muted-foreground">{row.parentName}</span>,
      width: '160px',
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Link href={`/school/fees/students/${row.id}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            Ledger <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      ),
      width: '100px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Student Fee Assignments"
        description="Assign authoritative published fee plans to student cohorts and generate sequential payment obligations"
      />

      <FeeNav />

      {/* Cohort Selection Strip */}
      <div className="p-4 rounded-xl border bg-card/80 shadow-2xs mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <Label className="font-semibold">Academic Session</Label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select Session...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="font-semibold">Class / Grade</Label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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

          <div className="space-y-1">
            <Label className="font-semibold">Section</Label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="font-semibold">Published Fee Plan</Label>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={publishedPlans.length === 0}
            >
              {publishedPlans.length === 0 ? (
                <option value="">No Published Plans Available</option>
              ) : (
                <>
                  <option value="">Select Published Plan...</option>
                  {publishedPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.planName} (v{p.versionNumber} - {formatINR(p.totalAmount)})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Selected Plan Snapshot */}
        {selectedPlanDetails && (
          <div className="p-3 rounded-lg border bg-primary/4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>
                Selected: <strong>{selectedPlanDetails.planName}</strong> (v{selectedPlanDetails.versionNumber}) · {selectedPlanDetails.installmentsCount} installments scheduled
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Standard Total:</span>
              <FinancialAmount amount={selectedPlanDetails.totalAmount} size="md" />
            </div>
          </div>
        )}

        {publishedPlans.length === 0 && (
          <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
            <span>No published fee plans found for this grade level. Fee plans must be published before cohort assignment.</span>
            <Link href="/school/fees/plans">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-background">
                View Draft Plans
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-lg border bg-card/60 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or roll number..."
            className="pl-8.5 text-xs h-8.5 bg-background"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedEnrollmentIds.length === filteredStudents.length) {
                setSelectedEnrollmentIds([]);
              } else {
                setSelectedEnrollmentIds(filteredStudents.map((s) => s.enrollmentId));
              }
            }}
            className="h-8.5 text-xs"
          >
            {selectedEnrollmentIds.length === filteredStudents.length && filteredStudents.length > 0
              ? 'Deselect All'
              : 'Select All Filtered'}
          </Button>

          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedEnrollmentIds.length === 0 || !selectedVersionId}
            className="h-8.5 text-xs font-bold gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Assign Fee Plan ({selectedEnrollmentIds.length})
          </Button>
        </div>
      </div>

      {/* Candidate Students Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={isLoading}
        loadingRowCount={5}
        emptyTitle="No Students Found"
        emptyDescription="No active enrolled students found matching the selected class and section criteria."
      />

      {/* Confirmation & Concession Dialog */}
      <FinancialConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Assign Fee Plan to ${selectedEnrollmentIds.length} Student(s)`}
        description={`This will authoritatively generate all ${selectedPlanDetails?.installmentsCount || ''} installment obligations per student.`}
        confirmLabel={`Generate Obligations for ${selectedEnrollmentIds.length} Student(s)`}
        variant="default"
        isLoading={isAssigning}
        onConfirm={handleAssign}
      >
        <div className="space-y-4 my-2 text-xs">
          <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee Plan:</span>
              <span className="font-bold">{selectedPlanDetails?.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Obligation Total:</span>
              <FinancialAmount amount={selectedPlanDetails?.totalAmount} size="sm" />
            </div>
          </div>

          <div className="space-y-2 p-3 border rounded-lg bg-card">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <BadgePercent className="h-4 w-4 text-primary" />
              <span>Optional Custom Concession / Waiver</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              If granted, this concession amount will be deducted upfront from the first scheduled installment obligation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label htmlFor="concession-amt" className="text-[11px]">Concession Amount (₹)</Label>
                <Input
                  id="concession-amt"
                  type="number"
                  min="0"
                  value={customConcession || ''}
                  onChange={(e) => setCustomConcession(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label htmlFor="concession-reason" className="text-[11px]">Concession Reason</Label>
                <Input
                  id="concession-reason"
                  value={concessionReason}
                  onChange={(e) => setConcessionReason(e.target.value)}
                  placeholder="e.g. Sibling scholarship, Merit waiver"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {customConcession > 0 && selectedPlanDetails && (
              <div className="pt-2 border-t flex justify-between font-semibold">
                <span>Net Obligation Total per Student:</span>
                <FinancialAmount
                  amount={Math.max(0, selectedPlanDetails.totalAmount - customConcession)}
                  size="sm"
                  variant="success"
                />
              </div>
            )}
          </div>
        </div>
      </FinancialConfirmDialog>
    </PageContainer>
  );
}
