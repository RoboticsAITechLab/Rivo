'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronLeft,
  Plus,
  BookOpen,
  Trash2,
  Check,
  Building,
  ArrowRight,
  Hash,
  RefreshCw,
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
  selectExamById,
  selectExamPapers,
  selectExamSchedule,
  selectExamCandidates,
  selectExamAttendance,
  selectExamMarks,
  selectExamResults,
  selectCampuses,
  ResolvedExamCandidate,
} from '@/shared/selectors';
import { SubjectSelect } from '@/shared/entities/subject-select';
import { detectExamScheduleConflicts, ExamConflict } from '@/shared/validation/exam-conflict-detector';
import {
  Exam,
  ExamPaper,
  ExamMode,
  ExamAttendanceStatus,
  ExamMark,
  ExamAttendance,
  ExamScheduleEntry,
  ExamResult,
} from '@/shared/types';
import { cn } from '@/lib/utils';

export type Exam360Tab =
  | 'overview'
  | 'papers'
  | 'schedule'
  | 'candidates'
  | 'roll_numbers'
  | 'attendance'
  | 'marks'
  | 'results'
  | 'documents'
  | 'activity';

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params.id as string;
  const store = useSchoolStore();

  const exam = selectExamById(store, examId);
  const papers = selectExamPapers(store, examId);
  const schedule = selectExamSchedule(store, examId);
  const candidates = selectExamCandidates(store, examId);
  const attendances = selectExamAttendance(store, examId);
  const marks = selectExamMarks(store, examId);
  const results = selectExamResults(store, examId);

  const [activeTab, setActiveTab] = React.useState<Exam360Tab>('overview');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals
  const [isAddPaperOpen, setIsAddPaperOpen] = React.useState(false);

  // Schedule conflicts
  const conflicts = React.useMemo(() => {
    return detectExamScheduleConflicts(store, schedule);
  }, [store, schedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!exam) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-foreground">Examination Cycle Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The requested examination cycle identifier &ldquo;{examId}&rdquo; does not exist in the institutional store.
          </p>
          <Link href="/school/exams">
            <Button size="sm" variant="outline" className="text-xs mt-2">
              Return to Examination List
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const tabs: { key: Exam360Tab; label: string; count?: number; highlight?: boolean }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'papers', label: 'Exam Papers', count: papers.length },
    { key: 'schedule', label: 'Timetable Schedule', count: schedule.length, highlight: conflicts.length > 0 },
    { key: 'candidates', label: 'Candidate Roster', count: candidates.length },
    { key: 'roll_numbers', label: 'Exam Rolls' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'marks', label: 'Marks Entry' },
    { key: 'results', label: 'Result Summary', count: results.length },
    { key: 'documents', label: 'Print Center' },
    { key: 'activity', label: 'Audit Log' },
  ];

  return (
    <PageContainer>
      {/* 1. Header with Breadcrumbs & Status Transitions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/school/exams" className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Formal Exams
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{exam.name}</span>
        </div>

        <PageHeader
          title={exam.name}
          description={`${exam.type.replace('_', ' ')} Evaluation • ${exam.code} • Academic Session 2025-26`}
          icon={Award}
          badge={exam.status.replace('_', ' ')}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/school/exams/${exam.id}/documents`}>
                <Button variant="outline" size="sm" className="text-xs h-8.5 gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                  <Printer className="h-3.5 w-3.5" />
                  Print Center
                </Button>
              </Link>
              <Link href={`/school/exams/${exam.id}/schedule`}>
                <Button variant="outline" size="sm" className="text-xs h-8.5 gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Builder
                </Button>
              </Link>
              {exam.status !== 'PUBLISHED' && (
                <Button
                  size="sm"
                  className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    schoolStore.calculateAndSaveExamResults(exam.id);
                    schoolStore.changeExamStatus(exam.id, 'PUBLISHED');
                    showToast('Exam results calculated and formally published school-wide!');
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Publish Official Results
                </Button>
              )}
            </div>
          }
        />
      </div>

      {toastMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Schedule Conflict Warning Banner if conflicts exist */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>{conflicts.length} Schedule Conflict(s) Detected in Exam Timetable</span>
              <Badge variant="destructive" className="text-[10px]">Action Required</Badge>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300">
              {conflicts[0].title}: {conflicts[0].description}
            </p>
            <div className="pt-1">
              <Link href={`/school/exams/${exam.id}/schedule`}>
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5">
                  Resolve in Schedule Builder
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-md transition-colors relative flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  tab.highlight && 'text-rose-600 font-bold'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Contents */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <ExamTabOverview exam={exam} papers={papers} schedule={schedule} candidates={candidates} results={results} />
        )}

        {activeTab === 'papers' && (
          <ExamTabPapers
            exam={exam}
            papers={papers}
            onOpenAdd={() => setIsAddPaperOpen(true)}
            onDeletePaper={(id) => {
              schoolStore.deleteExamPaper(id);
              showToast('Exam paper removed from syllabus.');
            }}
          />
        )}

        {activeTab === 'schedule' && (
          <ExamTabSchedule exam={exam} schedule={schedule} papers={papers} conflicts={conflicts} />
        )}

        {activeTab === 'candidates' && (
          <ExamTabCandidates exam={exam} candidates={candidates} />
        )}

        {activeTab === 'roll_numbers' && (
          <ExamTabRollNumbers exam={exam} candidates={candidates} />
        )}

        {activeTab === 'attendance' && (
          <ExamTabAttendance exam={exam} papers={papers} candidates={candidates} attendances={attendances} onToast={showToast} />
        )}

        {activeTab === 'marks' && (
          <ExamTabMarks exam={exam} papers={papers} candidates={candidates} marks={marks} onToast={showToast} />
        )}

        {activeTab === 'results' && (
          <ExamTabResults exam={exam} results={results} candidates={candidates} onToast={showToast} />
        )}

        {activeTab === 'documents' && (
          <ExamTabDocuments exam={exam} />
        )}

        {activeTab === 'activity' && (
          <ExamTabActivity exam={exam} />
        )}
      </div>

      {/* 5. Add Paper Dialog */}
      {isAddPaperOpen && (
        <AddExamPaperDialog
          examId={exam.id}
          isOpen={isAddPaperOpen}
          onClose={() => setIsAddPaperOpen(false)}
          onSuccess={(p) => {
            setIsAddPaperOpen(false);
            showToast(`Exam paper "${p.paperCode}" added successfully.`);
          }}
        />
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 1: OVERVIEW
// ---------------------------------------------------------------------------
function ExamTabOverview({
  exam,
  papers,
  schedule,
  candidates,
  results,
}: {
  exam: Exam;
  papers: ExamPaper[];
  schedule: ExamScheduleEntry[];
  candidates: ResolvedExamCandidate[];
  results: ExamResult[];
}) {
  const store = useSchoolStore();
  const campuses = selectCampuses(store);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Eligible Candidates</div>
          <div className="text-2xl font-bold text-foreground mt-1">{candidates.length}</div>
          <div className="text-[10px] text-muted-foreground">Class 10, 11, 12 cohorts</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Curriculum Papers</div>
          <div className="text-2xl font-bold text-foreground mt-1">{papers.length}</div>
          <div className="text-[10px] text-muted-foreground">Standardized formal assessments</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Timetable Slots</div>
          <div className="text-2xl font-bold text-foreground mt-1">{schedule.length}</div>
          <div className="text-[10px] text-muted-foreground">Across morning &amp; afternoon shifts</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Results Computed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{results.length}</div>
          <div className="text-[10px] text-muted-foreground">Ready for publication &amp; marksheet</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 space-y-3">
          <div className="font-semibold text-xs text-foreground flex items-center justify-between">
            <span>Examination Parameters &amp; Institutional Scope</span>
            <Badge variant="outline">{exam.code}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Session</span>
              <span className="font-semibold">2025-26</span>
            </div>
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Date Window</span>
              <span className="font-semibold font-mono">{exam.startDate} to {exam.endDate}</span>
            </div>
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Lifecycle Status</span>
              <span className="font-semibold text-emerald-600">{exam.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="space-y-1 text-xs pt-2">
            <span className="text-[11px] text-muted-foreground font-medium">Included Campuses:</span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {exam.campusIds.map((cId) => {
                const cmp = campuses.find((c) => c.id === cId);
                return (
                  <Badge key={cId} variant="secondary" className="text-xs">
                    <Building className="h-3 w-3 mr-1" />
                    {cmp?.name || cId}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 text-xs pt-2">
            <span className="text-[11px] text-muted-foreground font-medium">Exam Description:</span>
            <p className="text-muted-foreground text-xs">{exam.description}</p>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-semibold text-xs text-foreground">Operational Checklist</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Exam roll numbers synchronized from central registry</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{papers.length} Papers mapped to active curriculum</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border bg-muted/40">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Multi-exam timetable: {schedule.length} slots mapped</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 2: PAPERS
// ---------------------------------------------------------------------------
function ExamTabPapers({
  papers,
  onOpenAdd,
  onDeletePaper,
}: {
  exam?: Exam;
  papers: ExamPaper[];
  onOpenAdd: () => void;
  onDeletePaper: (id: string) => void;
}) {
  const store = useSchoolStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Curriculum Examination Papers</h3>
          <p className="text-[11px] text-muted-foreground">
            Subject evaluations, maximum score thresholds, and minimum passing criteria.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={onOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Exam Paper
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Subject &amp; Paper Code</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Maximum Marks</th>
                <th className="py-2.5 px-3">Passing Marks</th>
                <th className="py-2.5 px-3">Instructions</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No examination papers defined yet. Click &ldquo;Add Exam Paper&rdquo; to begin.
                  </td>
                </tr>
              ) : (
                papers.map((p) => {
                  const subject = store.subjects.find((s) => s.id === p.subjectId);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="py-2 px-3">
                        <div className="font-semibold text-foreground">{subject?.name || 'Subject'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.paperCode}</div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.examMode}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">{p.durationMinutes} minutes</td>
                      <td className="py-2 px-3 font-mono font-bold text-foreground">{p.maxMarks}</td>
                      <td className="py-2 px-3 font-mono text-emerald-600">{p.passingMarks}</td>
                      <td className="py-2 px-3 text-muted-foreground text-[11px] max-w-xs truncate">
                        {p.instructions}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeletePaper(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 3: SCHEDULE
// ---------------------------------------------------------------------------
function ExamTabSchedule({
  exam,
  schedule,
  papers,
}: {
  exam: Exam;
  schedule: ExamScheduleEntry[];
  papers: ExamPaper[];
  conflicts?: ExamConflict[];
}) {
  const store = useSchoolStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Examination Timetable (Multi-Paper Shifts)</h3>
          <p className="text-[11px] text-muted-foreground">
            Supports multiple papers per day, morning/afternoon shifts, and stream-specific schedules.
          </p>
        </div>
        <Link href={`/school/exams/${exam.id}/schedule`}>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Calendar className="h-3.5 w-3.5" />
            Open Dedicated Schedule Builder
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Time Slot</th>
                <th className="py-2.5 px-3">Exam Paper</th>
                <th className="py-2.5 px-3">Class &amp; Stream</th>
                <th className="py-2.5 px-3">Room / Center</th>
                <th className="py-2.5 px-3">Campuses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedule.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No schedule slots created yet. Use the Schedule Builder to configure dates and timeslots.
                  </td>
                </tr>
              ) : (
                schedule.map((entry) => {
                  const paper = papers.find((p) => p.id === entry.paperId);
                  const subject = store.subjects.find((s) => s.id === paper?.subjectId);
                  const classNames = entry.classIds.map((c: string) => c.replace('cls-', 'Class ')).join(', ');
                  const streamNames = entry.streamIds
                    ?.map((id: string) => store.streams.find((s) => s.id === id)?.code || id)
                    .join(', ');

                  return (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-semibold text-foreground font-mono">{entry.date}</td>
                      <td className="py-2 px-3 font-mono text-primary font-medium">
                        {entry.startTime} – {entry.endTime}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-foreground">{subject?.name || 'Subject'}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {paper?.paperCode}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span>{classNames}</span>
                        {streamNames && (
                          <Badge variant="secondary" className="text-[9px] ml-1.5">
                            {streamNames}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{entry.room}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {entry.campusIds.length === store.campuses.length
                            ? 'All Campuses'
                            : `${entry.campusIds.length} Campuses`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 4: CANDIDATES
// ---------------------------------------------------------------------------
function ExamTabCandidates({
  candidates,
}: {
  exam?: Exam;
  candidates: ResolvedExamCandidate[];
  onToast?: (msg: string) => void;
}) {
  const [search, setSearch] = React.useState('');

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.examRollNumber.toLowerCase().includes(q) ||
      String(c.classRollNumber).includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Resolved Examination Candidates</h3>
          <p className="text-[11px] text-muted-foreground">
            Student cohort populated dynamically from eligible classes and campuses with permanent Exam Roll Numbers.
          </p>
        </div>
        <div className="w-64">
          <Input
            placeholder="Search candidate by name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                  Exam Roll No.
                </th>
                <th className="py-2.5 px-3">Class Roll No.</th>
                <th className="py-2.5 px-3">Student Name &amp; ID</th>
                <th className="py-2.5 px-3">Campus</th>
                <th className="py-2.5 px-3">Class &amp; Div</th>
                <th className="py-2.5 px-3">Stream</th>
                <th className="py-2.5 px-3">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.studentId} className="hover:bg-muted/20">
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600 text-xs">
                    {c.examRollNumber}
                  </td>
                  <td className="py-2 px-3 font-mono text-muted-foreground">#{c.classRollNumber}</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      {c.admissionNumber}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant="outline" className="text-[10px]">
                      {c.campusName}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    {c.className} - {c.sectionName}
                  </td>
                  <td className="py-2 px-3">
                    {c.streamName ? (
                      <Badge variant="secondary" className="text-[9px]">
                        {c.streamName}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant={c.isEligible ? 'default' : 'secondary'} className="text-[10px]">
                      {c.isEligible ? 'Eligible' : 'Hold'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 5: ROLL NUMBERS (ROSTER VERIFICATION)
// ---------------------------------------------------------------------------
function ExamTabRollNumbers({
  candidates,
}: {
  exam?: Exam;
  candidates: ResolvedExamCandidate[];
  onToast?: (msg: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/40 rounded-lg border text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-foreground">Stable Exam Roll Number Verification</span>
          <p className="text-[11px] text-muted-foreground">
            Rules 4 &amp; 5: Candidate exam roll numbers are identical across Half-Yearly, Annual, and Pre-Board examinations.
          </p>
        </div>
        <Link href="/school/exams/roll-numbers">
          <Button size="sm" variant="outline" className="h-7.5 text-xs gap-1.5">
            <Hash className="h-3 w-3" />
            Central Roll Registry
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {candidates.map((c) => (
          <div key={c.studentId} className="p-2.5 rounded-lg border bg-card text-center space-y-1">
            <span className="text-[9px] text-muted-foreground block font-mono">Class Roll #{c.classRollNumber}</span>
            <div className="font-mono font-bold text-sm text-emerald-600">{c.examRollNumber}</div>
            <div className="font-medium text-[11px] truncate text-foreground">{c.name}</div>
            <div className="text-[9px] text-muted-foreground">{c.className}-{c.sectionName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 6: ATTENDANCE
// ---------------------------------------------------------------------------
function ExamTabAttendance({
  exam,
  papers,
  candidates,
  attendances,
  onToast,
}: {
  exam: Exam;
  papers: ExamPaper[];
  candidates: ResolvedExamCandidate[];
  attendances: ExamAttendance[];
  onToast: (msg: string) => void;
}) {
  const store = useSchoolStore();
  const [selectedPaperId, setSelectedPaperId] = React.useState<string>(papers[0]?.id || '');
  const [attendanceOverrides, setAttendanceOverrides] = React.useState<Record<string, ExamAttendanceStatus>>({});

  const attendanceState = React.useMemo(() => {
    const map: Record<string, ExamAttendanceStatus> = {};
    candidates.forEach((c) => {
      const match = attendances.find((a) => a.paperId === selectedPaperId && a.studentId === c.studentId);
      map[c.studentId] = attendanceOverrides[c.studentId] ?? match?.status ?? 'PRESENT';
    });
    return map;
  }, [selectedPaperId, candidates, attendances, attendanceOverrides]);

  const handleBulkSet = (status: ExamAttendanceStatus) => {
    const updated: Record<string, ExamAttendanceStatus> = {};
    candidates.forEach((c) => {
      updated[c.studentId] = status;
    });
    setAttendanceOverrides(updated);
  };

  const handleSave = () => {
    const records: ExamAttendance[] = candidates.map((c) => ({
      id: `att-${exam.id}-${selectedPaperId}-${c.studentId}`,
      examId: exam.id,
      paperId: selectedPaperId,
      studentId: c.studentId,
      examRollNumber: c.examRollNumber,
      status: attendanceState[c.studentId] || 'PRESENT',
    }));
    schoolStore.bulkSaveExamAttendance(records);
    onToast(`Exam attendance saved for ${records.length} candidates using Exam Roll Numbers.`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Paper:</span>
          <select
            value={selectedPaperId}
            onChange={(e) => {
              setSelectedPaperId(e.target.value);
              setAttendanceOverrides({});
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {papers.map((p) => {
              const subj = store.subjects.find((s) => s.id === p.subjectId);
              return (
                <option key={p.id} value={p.id}>
                  {subj?.name} ({p.paperCode})
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" className="h-7.5 text-xs" onClick={() => handleBulkSet('PRESENT')}>
            All Present
          </Button>
          <Button variant="outline" size="sm" className="h-7.5 text-xs" onClick={() => handleBulkSet('ABSENT')}>
            All Absent
          </Button>
          <Button size="sm" className="h-7.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
            Save Attendance
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3 font-bold text-emerald-700">Exam Roll No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Class &amp; Campus</th>
                <th className="py-2.5 px-3 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => {
                const currentStatus = attendanceState[c.studentId] || 'PRESENT';
                return (
                  <tr key={c.studentId} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">{c.examRollNumber}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {c.className}-{c.sectionName} • {c.campusName}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          setAttendanceOverrides((prev) => ({
                            ...prev,
                            [c.studentId]: e.target.value as ExamAttendanceStatus,
                          }))
                        }
                        className={cn(
                          'h-7 rounded border px-2 text-xs font-medium',
                          currentStatus === 'PRESENT' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
                          currentStatus === 'ABSENT' && 'bg-rose-500/10 text-rose-700 border-rose-500/30',
                          currentStatus === 'MEDICAL' && 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                        )}
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late Entry</option>
                        <option value="MEDICAL">Medical Leave</option>
                        <option value="EXEMPTED">Exempted</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 7: MARKS ENTRY
// ---------------------------------------------------------------------------
function ExamTabMarks({
  exam,
  papers,
  candidates,
  marks,
  onToast,
}: {
  exam: Exam;
  papers: ExamPaper[];
  candidates: ResolvedExamCandidate[];
  marks: ExamMark[];
  onToast: (msg: string) => void;
}) {
  const store = useSchoolStore();
  const [selectedPaperId, setSelectedPaperId] = React.useState<string>(papers[0]?.id || '');
  const [marksOverrides, setMarksOverrides] = React.useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const currentPaper = papers.find((p) => p.id === selectedPaperId);
  const currentSubject = store.subjects.find((s) => s.id === currentPaper?.subjectId);
  const maxMarks = currentPaper?.maxMarks || 100;
  const passingMarks = currentPaper?.passingMarks || 33;

  const marksDraft = React.useMemo(() => {
    const map: Record<string, number> = {};
    candidates.forEach((c) => {
      const match = marks.find((m) => m.paperId === selectedPaperId && m.studentId === c.studentId);
      map[c.studentId] = marksOverrides[c.studentId] ?? (match ? match.marksObtained : 0);
    });
    return map;
  }, [selectedPaperId, candidates, marks, marksOverrides]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      setMarksOverrides((prev) => ({ ...prev, [studentId]: 0 }));
      return;
    }

    if (num < 0 || num > maxMarks) {
      setValidationErrors((prev) => ({
        ...prev,
        [studentId]: `Must be 0 to ${maxMarks}`,
      }));
    } else {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }

    setMarksOverrides((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveMarks = () => {
    if (Object.keys(validationErrors).length > 0) {
      onToast('Please resolve score validation errors before saving.');
      return;
    }

    const records: ExamMark[] = candidates.map((c) => {
      const score = marksDraft[c.studentId] || 0;
      const pct = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F';

      return {
        id: `mrk-${exam.id}-${selectedPaperId}-${c.studentId}`,
        examId: exam.id,
        paperId: selectedPaperId,
        studentId: c.studentId,
        examRollNumber: c.examRollNumber,
        marksObtained: score,
        maxMarks,
        passingMarks,
        grade,
        status: 'SAVED',
      };
    });

    schoolStore.saveExamMarks(records);
    onToast(`Successfully saved marks for ${records.length} candidates in ${currentSubject?.name}.`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Select Paper:</span>
          <select
            value={selectedPaperId}
            onChange={(e) => {
              setSelectedPaperId(e.target.value);
              setMarksOverrides({});
              setValidationErrors({});
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {papers.map((p) => {
              const subj = store.subjects.find((s) => s.id === p.subjectId);
              return (
                <option key={p.id} value={p.id}>
                  {subj?.name} (Max: {p.maxMarks}, Pass: {p.passingMarks})
                </option>
              );
            })}
          </select>
        </div>

        <Button size="sm" className="h-7.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveMarks}>
          Save Marks
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3 font-bold text-emerald-700">Exam Roll No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Max Marks</th>
                <th className="py-2.5 px-3">Passing Marks</th>
                <th className="py-2.5 px-3 w-40 font-semibold">Marks Obtained</th>
                <th className="py-2.5 px-3">Calculated Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => {
                const score = marksDraft[c.studentId] ?? 0;
                const err = validationErrors[c.studentId];
                const pct = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F';

                return (
                  <tr key={c.studentId} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">{c.examRollNumber}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{maxMarks}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{passingMarks}</td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={score}
                        onChange={(e) => handleScoreChange(c.studentId, e.target.value)}
                        className={cn(
                          'h-7 text-xs font-mono w-24',
                          err && 'border-destructive focus-visible:ring-destructive'
                        )}
                      />
                      {err && <span className="text-[10px] text-destructive block mt-0.5">{err}</span>}
                    </td>
                    <td className="py-2 px-3 font-bold">
                      <Badge variant={score >= passingMarks ? 'default' : 'destructive'} className="text-[10px]">
                        {grade} ({score >= passingMarks ? 'Pass' : 'Fail'})
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 8: RESULTS SUMMARY
// ---------------------------------------------------------------------------
function ExamTabResults({
  exam,
  results,
  onToast,
}: {
  exam: Exam;
  results: ExamResult[];
  candidates?: ResolvedExamCandidate[];
  onToast: (msg: string) => void;
}) {
  const store = useSchoolStore();

  const handleCompute = () => {
    schoolStore.calculateAndSaveExamResults(exam.id);
    onToast('Exam results re-calculated across all papers.');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Official Examination Results</h3>
          <p className="text-[11px] text-muted-foreground">
            Aggregated scores, overall percentage, Pass/Fail status, and publication status.
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7.5 text-xs gap-1.5" onClick={handleCompute}>
          <RefreshCw className="h-3 w-3" />
          Recompute Results
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3 font-bold text-emerald-700">Exam Roll No.</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Campus</th>
                <th className="py-2.5 px-3">Total Marks</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No results compiled yet. Click &ldquo;Recompute Results&rdquo; after entering marks.
                  </td>
                </tr>
              ) : (
                results.map((r) => {
                  const std = store.students.find((s) => s.id === r.studentId);
                  const campus = store.campuses.find((c) => c.id === r.campusId);

                  return (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600">{r.examRollNumber}</td>
                      <td className="py-2 px-3 font-medium text-foreground">{std?.name || 'Student'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{campus?.name}</td>
                      <td className="py-2 px-3 font-mono">
                        {r.totalMarks} / {r.maxTotalMarks}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-primary">{r.percentage}%</td>
                      <td className="py-2 px-3 font-bold">{r.grade}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={r.overallStatus === 'PASS' ? 'default' : r.overallStatus === 'COMPARTMENT' ? 'outline' : 'destructive'}
                          className="text-[10px]"
                        >
                          {r.overallStatus}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="secondary" className="text-[10px]">
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 9: DOCUMENTS (PRINT CENTER LINK)
// ---------------------------------------------------------------------------
function ExamTabDocuments({ exam }: { exam: Exam }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
      <Card className="p-4 space-y-3">
        <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-xs text-foreground">Student Admit Cards</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Formal examination hall tickets with permanent ID, class roll, stable exam roll, and schedule.
          </p>
        </div>
        <Link href={`/school/exams/${exam.id}/documents`}>
          <Button size="sm" variant="outline" className="w-full text-xs">
            Generate Admit Cards
          </Button>
        </Link>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-xs text-foreground">Official Marksheets</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tabular subject transcripts with grading criteria, percentage, and principal seal.
          </p>
        </div>
        <Link href={`/school/exams/${exam.id}/documents`}>
          <Button size="sm" variant="outline" className="w-full text-xs">
            Print Marksheets
          </Button>
        </Link>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-xs text-foreground">Examination Timetable</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Institutional timetable posters sorted by date, shift, campus, and stream.
          </p>
        </div>
        <Link href={`/school/exams/${exam.id}/documents`}>
          <Button size="sm" variant="outline" className="w-full text-xs">
            Print Timetables
          </Button>
        </Link>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 10: ACTIVITY & AUDIT LOG
// ---------------------------------------------------------------------------
function ExamTabActivity({ exam }: { exam: Exam }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="font-semibold text-xs text-foreground">Examination Lifecycle Audit Log</div>
      <div className="space-y-2 text-xs">
        <div className="p-2 rounded border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Formal Examination Cycle Created</span>
            <span className="text-[10px] text-muted-foreground font-mono">{exam.createdAt || '2025-08-10'}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Authorized by Academic Director</p>
        </div>
        <div className="p-2 rounded border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Candidate Roster Synchronized</span>
            <span className="text-[10px] text-muted-foreground font-mono">2025-08-12</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Dual roll mapping verified for multi-campus scope</p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ADD EXAM PAPER DIALOG (WITH SUBJECT SELECTOR & FORM STATE PRESERVATION)
// ---------------------------------------------------------------------------
function AddExamPaperDialog({
  examId,
  isOpen,
  onClose,
  onSuccess,
}: {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paper: ExamPaper) => void;
}) {
  const store = useSchoolStore();
  const [subjectId, setSubjectId] = React.useState<string>(store.subjects[0]?.id || '');
  const [paperCode, setPaperCode] = React.useState('');
  const [maxMarks, setMaxMarks] = React.useState(100);
  const [passingMarks, setPassingMarks] = React.useState(33);
  const [durationMinutes, setDurationMinutes] = React.useState(180);
  const [examMode, setExamMode] = React.useState<ExamMode>('OFFLINE');
  const [instructions, setInstructions] = React.useState('Calculators prohibited. Standard stationery only.');

  const handleSubmit = () => {
    if (!subjectId) return;

    const paper = schoolStore.createExamPaper({
      examId,
      subjectId,
      paperCode: paperCode.trim().toUpperCase() || `PPR-${Math.floor(100 + Math.random() * 900)}`,
      maxMarks,
      passingMarks,
      durationMinutes,
      examMode,
      instructions,
      status: 'ACTIVE',
    });

    onSuccess(paper);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Add Curriculum Exam Paper</DialogTitle>
              <DialogDescription className="text-xs">
                Selects from the central subject store. Preserves form state if adding a new subject in-place.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Reusable Subject Selector */}
          <SubjectSelect
            value={subjectId}
            onChange={(id) => setSubjectId(id)}
            label="Subject Course"
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Paper Code" required>
              <Input
                value={paperCode}
                onChange={(e) => setPaperCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATH-10-HY"
                className="h-8.5 text-xs font-mono uppercase"
              />
            </FormField>

            <FormField label="Evaluation Mode" required>
              <select
                value={examMode}
                onChange={(e) => setExamMode(e.target.value as ExamMode)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="OFFLINE">Offline (Pen &amp; Paper)</option>
                <option value="ONLINE">Online CBT</option>
                <option value="PRACTICAL">Practical / Viva</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Max Marks" required>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value, 10) || 100)}
                className="h-8.5 text-xs font-mono"
              />
            </FormField>

            <FormField label="Pass Marks" required>
              <Input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(parseInt(e.target.value, 10) || 33)}
                className="h-8.5 text-xs font-mono"
              />
            </FormField>

            <FormField label="Duration (Min)" required>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 180)}
                className="h-8.5 text-xs font-mono"
              />
            </FormField>
          </div>

          <FormField label="Special Instructions">
            <Input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="h-8.5 text-xs"
            />
          </FormField>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="bg-primary text-white text-xs" onClick={handleSubmit}>
              Save Paper
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
