'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart2,
  CheckCircle2,
  Award,
  Search,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Send,
  Edit3,
  XCircle,
  Save,
  Check,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ExamTerm {
  id: string;
  name: string;
  code?: string | null;
  academicSession?: { id: string; name: string };
  papers?: Array<{
    id: string;
    name: string;
    maxMarks: number;
    passingMarks: number;
    subject?: { id: string; name: string; code?: string | null };
  }>;
}

interface SchoolClass {
  id: string;
  name: string;
  sections?: Array<{ id: string; name: string }>;
}

interface TabulationRecord {
  id: string;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  class: { id: string; name: string };
  section: { id: string; name: string };
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string | null;
  overallStatus: 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD';
  status: 'DRAFT' | 'CALCULATED' | 'PUBLISHED' | 'WITHDRAWN';
  publishedAt?: string | null;
  subjectResults?: Array<{
    id: string;
    marksObtained: number | null;
    maxMarks: number;
    passingMarks: number;
    grade: string | null;
    status: string;
    subject?: { id: string; name: string; code?: string | null };
  }>;
}

interface TabulationData {
  term: { id: string; name: string };
  pagination: { total: number; page: number; limit: number; totalPages: number };
  statistics: {
    totalStudents: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    passedCount: number;
    failedCount: number;
    compartmentCount: number;
    publishedCount: number;
  };
  records: TabulationRecord[];
}

export default function ResultsPage() {
  const [examTerms, setExamTerms] = React.useState<ExamTerm[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = React.useState(true);

  const [selectedExamId, setSelectedExamId] = React.useState<string>('');
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [tabulationData, setTabulationData] = React.useState<TabulationData | null>(null);
  const [isLoadingTabulation, setIsLoadingTabulation] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Marksheet Detail Modal
  const [selectedResult, setSelectedResult] = React.useState<TabulationRecord | null>(null);

  // Marks Entry Modal
  const [isMarksEntryOpen, setIsMarksEntryOpen] = React.useState(false);
  const [selectedPaperId, setSelectedPaperId] = React.useState<string>('');
  const [marksRoster, setMarksRoster] = React.useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = React.useState(false);
  const [isSavingMarks, setIsSavingMarks] = React.useState(false);

  // Fetch Exam Terms and Classes on Mount
  React.useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true);
      try {
        const [termsRes, classesRes] = await Promise.all([
          fetch('/api/results/terms'),
          fetch('/api/classes'),
        ]);

        if (termsRes.ok) {
          const tData = await termsRes.json();
          const terms = tData.terms || [];
          setExamTerms(terms);
          if (terms.length > 0) {
            setSelectedExamId(terms[0].id);
          }
        }

        if (classesRes.ok) {
          const cData = await classesRes.json();
          const cls = cData.classes || [];
          setClasses(cls);
          if (cls.length > 0) {
            setSelectedClassId(cls[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load results metadata:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Fetch Class Tabulation
  const fetchTabulation = React.useCallback(async () => {
    if (!selectedExamId || !selectedClassId) return;

    setIsLoadingTabulation(true);
    setActionMessage(null);
    try {
      const url = new URL(`/api/results/class/${selectedClassId}`, window.location.origin);
      url.searchParams.set('examTermId', selectedExamId);
      if (selectedSectionId && selectedSectionId !== 'ALL') {
        url.searchParams.set('sectionId', selectedSectionId);
      }
      if (searchQuery.trim()) {
        url.searchParams.set('search', searchQuery.trim());
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTabulationData(data);
      } else {
        setTabulationData(null);
      }
    } catch (err) {
      console.error('Error fetching tabulation:', err);
      setTabulationData(null);
    } finally {
      setIsLoadingTabulation(false);
    }
  }, [selectedExamId, selectedClassId, selectedSectionId, searchQuery]);

  React.useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchTabulation();
    }
  }, [selectedExamId, selectedClassId, selectedSectionId, fetchTabulation]);

  // Handle Calculate Results
  const handleCalculateResults = async () => {
    if (!selectedExamId) return;
    setIsLoadingTabulation(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/results/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTermId: selectedExamId,
          classId: selectedClassId || undefined,
          sectionId: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          text: `Calculation completed successfully (${data.calculatedCount} candidates evaluated).`,
          type: 'success',
        });
        fetchTabulation();
      } else {
        setActionMessage({ text: data.message || 'Calculation failed', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error during calculation', type: 'error' });
    } finally {
      setIsLoadingTabulation(false);
    }
  };

  // Handle Publish / Withdraw Results
  const handleTogglePublish = async (publish: boolean) => {
    if (!selectedExamId) return;
    setIsLoadingTabulation(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/results/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTermId: selectedExamId,
          publish,
          classId: selectedClassId || undefined,
          sectionId: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          text: publish
            ? `Results published successfully (${data.count} candidates). Parents notified.`
            : `Results withdrawn (${data.count} candidates).`,
          type: 'success',
        });
        fetchTabulation();
      } else {
        setActionMessage({ text: data.message || 'Action failed', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error during publication toggle', type: 'error' });
    } finally {
      setIsLoadingTabulation(false);
    }
  };

  // Open Marks Entry Modal
  const currentExam = examTerms.find((e) => e.id === selectedExamId);
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const sections = currentClass?.sections || [];

  const handleOpenMarksEntry = async (paperId?: string) => {
    const targetPaperId = paperId || currentExam?.papers?.[0]?.id;
    if (!targetPaperId || !selectedClassId) return;

    setSelectedPaperId(targetPaperId);
    const targetSectionId = selectedSectionId !== 'ALL' ? selectedSectionId : sections[0]?.id;
    if (!targetSectionId) {
      alert('Please select a specific section to enter marks');
      return;
    }

    setIsMarksEntryOpen(true);
    setIsLoadingRoster(true);
    try {
      const url = new URL('/api/results/marks', window.location.origin);
      url.searchParams.set('examTermId', selectedExamId);
      url.searchParams.set('paperId', targetPaperId);
      url.searchParams.set('classId', selectedClassId);
      url.searchParams.set('sectionId', targetSectionId);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setMarksRoster(data.roster || []);
      } else {
        setMarksRoster([]);
      }
    } catch (err) {
      console.error('Error fetching marks roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedPaperId) return;

    setIsSavingMarks(true);
    try {
      const payload = marksRoster.map((r) => ({
        studentId: r.student.id,
        marksObtained: r.status === 'PRESENT' ? Number(r.marksObtained) : null,
        status: r.status,
        remarks: r.remarks,
      }));

      const res = await fetch('/api/results/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTermId: selectedExamId,
          paperId: selectedPaperId,
          marks: payload,
        }),
      });

      if (res.ok) {
        setIsMarksEntryOpen(false);
        setActionMessage({ text: 'Marks saved successfully.', type: 'success' });
        fetchTabulation();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save marks');
      }
    } catch {
      alert('Network error saving marks');
    } finally {
      setIsSavingMarks(false);
    }
  };

  if (isLoadingMeta) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (examTerms.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Formal Examination Results &amp; Marksheets"
          description="Consolidated academic evaluation records, subject transcripts, marks entry, and publication controls."
          icon={BarChart2}
          badge="Results Management"
        />
        <EmptyState
          icon={Award}
          title="No examination cycles found"
          description="Examination terms and date-sheets must be configured in Examinations before recording marks."
          actionLabel="Go to Examinations"
          onAction={() => {
            window.location.href = '/school/exams';
          }}
        />
      </PageContainer>
    );
  }

  const stats = tabulationData?.statistics;
  const records = tabulationData?.records || [];
  const isAllPublished = records.length > 0 && records.every((r) => r.status === 'PUBLISHED');

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Formal Examination Results &amp; Marksheets"
        description="Consolidated academic evaluation records, subject transcripts, marks entry, and publication controls."
        icon={BarChart2}
        badge="Results Management"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 gap-1.5"
              onClick={() => handleOpenMarksEntry()}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Enter Marks
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 gap-1.5 border-primary/30 text-primary"
              onClick={handleCalculateResults}
              disabled={isLoadingTabulation}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTabulation ? 'animate-spin' : ''}`} />
              Calculate Results
            </Button>
            {isAllPublished ? (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs h-8.5 gap-1.5"
                onClick={() => handleTogglePublish(false)}
                disabled={isLoadingTabulation}
              >
                <XCircle className="h-3.5 w-3.5" />
                Withdraw Results
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleTogglePublish(true)}
                disabled={isLoadingTabulation || records.length === 0}
              >
                <Send className="h-3.5 w-3.5" />
                Publish Results
              </Button>
            )}
          </div>
        }
      />

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-md text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Candidates
            </div>
            <div className="text-xl font-bold text-foreground">{stats?.totalStudents ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">Class Cohort</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pass Rate
            </div>
            <div className="text-xl font-bold text-emerald-600">
              {stats?.totalStudents
                ? Math.round(((stats.passedCount || 0) / stats.totalStudents) * 100)
                : 0}
              %
            </div>
            <div className="text-[10px] text-muted-foreground">
              {stats?.passedCount ?? 0} passed / {stats?.failedCount ?? 0} failed
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Cohort Average
            </div>
            <div className="text-xl font-bold text-indigo-600 font-mono">
              {stats?.averagePercentage ?? 0}%
            </div>
            <div className="text-[10px] text-muted-foreground">Class Mean Score</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Publication Status
            </div>
            <div className="text-xl font-bold text-amber-600 font-mono">
              {isAllPublished ? 'PUBLISHED' : `${stats?.publishedCount ?? 0}/${stats?.totalStudents ?? 0}`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isAllPublished ? 'Visible to Parents' : 'Draft / Calculated'}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Scope & Filter Bar */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
            {/* Exam Cycle Picker */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {examTerms.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.code ? `(${ex.code})` : ''}
                </option>
              ))}
            </select>

            {/* Class */}
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId('ALL');
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Section */}
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search student or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Tabulation Roster */}
      <Card className="overflow-hidden">
        {isLoadingTabulation ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No results found for this cohort"
            description="Enter marks for papers in this exam cycle, then click 'Calculate Results' to generate authoritative tabulation sheets."
            actionLabel="Enter Marks"
            onAction={() => handleOpenMarksEntry()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3">Admission No.</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Class &amp; Div</th>
                  <th className="py-2.5 px-3">Aggregate Score</th>
                  <th className="py-2.5 px-3 font-bold">Percentage</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Publication</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {r.student.admissionNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {r.student.firstName} {r.student.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {r.class.name}-{r.section.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {r.totalMarks} / {r.maxTotalMarks}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-primary">
                      {r.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {r.grade || '—'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        variant={
                          r.overallStatus === 'PASS'
                            ? 'default'
                            : r.overallStatus === 'COMPARTMENT'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {r.overallStatus}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        variant={r.status === 'PUBLISHED' ? 'outline' : 'secondary'}
                        className={`text-[10px] ${
                          r.status === 'PUBLISHED' ? 'text-emerald-600 border-emerald-300' : ''
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary"
                        onClick={() => setSelectedResult(r)}
                      >
                        Marksheet <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. Detailed Marksheet Modal */}
      {selectedResult && (
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Official Examination Transcript</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3 w-3" /> Print
                </Button>
              </DialogTitle>
              <DialogDescription>
                Formal institutional evaluation report for academic records.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {/* Header Info */}
              <div className="p-3 rounded-lg border bg-muted/20 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Student:</span>{' '}
                  <span className="font-bold text-foreground">
                    {selectedResult.student.firstName} {selectedResult.student.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Admission No:</span>{' '}
                  <span className="font-mono font-bold">{selectedResult.student.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class &amp; Section:</span>{' '}
                  <span className="font-bold">
                    {selectedResult.class.name}-{selectedResult.section.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exam:</span>{' '}
                  <span className="font-bold">{currentExam?.name}</span>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted text-[10px] uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3 text-center">Max Marks</th>
                      <th className="py-2 px-3 text-center">Pass Marks</th>
                      <th className="py-2 px-3 text-center">Marks Obtained</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedResult.subjectResults?.map((sr) => (
                      <tr key={sr.id}>
                        <td className="py-2 px-3 font-medium">
                          {sr.subject?.name || 'Subject'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{sr.maxMarks}</td>
                        <td className="py-2 px-3 text-center font-mono">{sr.passingMarks}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {sr.marksObtained !== null ? sr.marksObtained : 'AB'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {sr.grade || '—'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={
                              sr.status === 'PASS'
                                ? 'text-emerald-600 font-bold'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            {sr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between font-bold">
                <div>
                  Grand Total: {selectedResult.totalMarks} / {selectedResult.maxTotalMarks}
                </div>
                <div>Percentage: {selectedResult.percentage}%</div>
                <div>Grade: {selectedResult.grade || '—'}</div>
                <div>Result: {selectedResult.overallStatus}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Marks Entry Modal */}
      {isMarksEntryOpen && (
        <Dialog open={isMarksEntryOpen} onOpenChange={setIsMarksEntryOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Enter Examination Marks</span>
              </DialogTitle>
              <DialogDescription>
                Record obtained marks, attendance, and remarks for the selected subject paper.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 items-center pb-2 border-b">
              <label className="text-xs font-semibold">Select Paper:</label>
              <select
                value={selectedPaperId}
                onChange={(e) => handleOpenMarksEntry(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
              >
                {currentExam?.papers?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Max: {p.maxMarks})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {isLoadingRoster ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : marksRoster.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No active students enrolled in this section.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted sticky top-0 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Admission No.</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-center">Marks Obtained</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {marksRoster.map((r, idx) => (
                      <tr key={r.student.id}>
                        <td className="py-2 px-3 font-mono font-medium">
                          {r.student.admissionNumber}
                        </td>
                        <td className="py-2 px-3 font-semibold">
                          {r.student.firstName} {r.student.lastName}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <select
                            value={r.status}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[idx].status = e.target.value;
                              if (e.target.value !== 'PRESENT') {
                                updated[idx].marksObtained = '';
                              }
                              setMarksRoster(updated);
                            }}
                            className="h-7 text-xs border rounded px-1.5 bg-background"
                          >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="EXEMPT">Exempt</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input
                            type="number"
                            min="0"
                            max={r.maxMarks}
                            disabled={r.status !== 'PRESENT'}
                            value={r.marksObtained ?? ''}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[idx].marksObtained = e.target.value;
                              setMarksRoster(updated);
                            }}
                            className="h-7 w-20 text-center font-mono mx-auto"
                            placeholder="Marks"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            value={r.remarks || ''}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[idx].remarks = e.target.value;
                              setMarksRoster(updated);
                            }}
                            className="h-7 text-xs"
                            placeholder="Optional remark"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsMarksEntryOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={handleSaveMarks}
                disabled={isSavingMarks}
              >
                <Save className="h-3.5 w-3.5" />
                {isSavingMarks ? 'Saving...' : 'Save Marks'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
