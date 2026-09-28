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
  Building,
  Hash,
  RefreshCw,
  Loader2,
  Users,
  Check,
  Send,
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

interface LiveExamSchedule {
  id: string;
  paperId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  roomNumber?: string;
  instructions?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

interface LiveExamPaper {
  id: string;
  examTermId: string;
  subjectId: string;
  name: string;
  maxMarks: number;
  passingMarks: number;
  subject?: { id: string; name: string; code?: string };
  schedules?: LiveExamSchedule[];
}

interface LiveExamTerm {
  id: string;
  name: string;
  code?: string | null;
  startDate: string;
  endDate: string;
  instructions?: string | null;
  advice?: string | null;
  warnings?: string | null;
  isPublished: boolean;
  academicSession?: { id: string; name: string };
  campus?: { id: string; name: string } | null;
  papers?: LiveExamPaper[];
}

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = React.useState<LiveExamTerm | null>(null);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<Exam360Tab>('overview');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isAddPaperOpen, setIsAddPaperOpen] = React.useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExamData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [termRes, subjectsRes, classesRes, studentsRes] = await Promise.all([
        fetch(`/api/timetable/exam?termId=${examId}`),
        fetch('/api/subjects'),
        fetch('/api/classes'),
        fetch('/api/students?limit=200'),
      ]);

      if (termRes.ok) {
        const data = await termRes.json();
        if (data.examTerms && data.examTerms.length > 0) {
          setExam(data.examTerms[0]);
        }
      }
      if (subjectsRes.ok) {
        const subData = await subjectsRes.json();
        setSubjects(subData.subjects || []);
      }
      if (classesRes.ok) {
        const clsData = await classesRes.json();
        setClasses(clsData.classes || []);
      }
      if (studentsRes.ok) {
        const stdData = await studentsRes.json();
        setStudents(stdData.students || []);
      }
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  React.useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  const handlePublishResults = async () => {
    if (!exam) return;
    setIsPublishing(true);
    try {
      // 1. Compute results first
      await fetch('/api/results/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examTermId: exam.id }),
      });

      // 2. Publish results
      const pubRes = await fetch('/api/results/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examTermId: exam.id, publish: true }),
      });

      if (pubRes.ok) {
        setExam((prev) => (prev ? { ...prev, isPublished: true } : prev));
        showToast('Examination results calculated and published successfully! Parent alerts dispatched.');
      } else {
        const err = await pubRes.json().catch(() => ({}));
        showToast(err.message || 'Failed to publish results.');
      }
    } catch (e: any) {
      console.error('Publish error:', e);
      showToast(e.message || 'Error publishing results.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to remove this examination paper?')) return;
    try {
      const res = await fetch(`/api/timetable/exam/papers?paperId=${paperId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Exam paper removed.');
        loadExamData();
      } else {
        showToast('Failed to delete paper.');
      }
    } catch (err) {
      showToast('Error removing paper.');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center space-y-3 flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading Examination 360 Workspace...</p>
        </div>
      </PageContainer>
    );
  }

  if (!exam) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-foreground">Examination Cycle Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The requested examination cycle &ldquo;{examId}&rdquo; does not exist or has been removed.
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

  const papers = exam.papers || [];
  const schedules = papers.flatMap((p) =>
    (p.schedules || []).map((s) => ({
      ...s,
      paperName: p.name,
      subjectName: p.subject?.name || p.name,
      maxMarks: p.maxMarks,
      passingMarks: p.passingMarks,
    }))
  );

  const tabs: { key: Exam360Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'papers', label: 'Exam Papers', count: papers.length },
    { key: 'schedule', label: 'Schedule', count: schedules.length },
    { key: 'candidates', label: 'Candidates', count: students.length },
    { key: 'roll_numbers', label: 'Roll Numbers' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'marks', label: 'Marks Entry' },
    { key: 'results', label: 'Results' },
    { key: 'documents', label: 'Print Center' },
    { key: 'activity', label: 'Audit Log' },
  ];

  return (
    <PageContainer>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-xs shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Status */}
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
          description={`Evaluation Cycle • ${exam.code || 'EXAM'} • ${exam.academicSession?.name || 'Active Session'}`}
          icon={Award}
          badge={exam.isPublished ? 'PUBLISHED' : 'SCHEDULED'}
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
              {!exam.isPublished && (
                <Button
                  size="sm"
                  disabled={isPublishing}
                  className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  onClick={handlePublishResults}
                >
                  {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Calculate &amp; Publish Results
                </Button>
              )}
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="border-b border-border flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3.5 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] h-4.5 px-1.5">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-4">
        {activeTab === 'overview' && (
          <ExamTabOverview
            exam={exam}
            papersCount={papers.length}
            schedulesCount={schedules.length}
            candidatesCount={students.length}
          />
        )}

        {activeTab === 'papers' && (
          <ExamTabPapers
            papers={papers}
            onOpenAdd={() => setIsAddPaperOpen(true)}
            onDeletePaper={handleDeletePaper}
          />
        )}

        {activeTab === 'schedule' && (
          <ExamTabSchedule
            examId={exam.id}
            schedules={schedules}
          />
        )}

        {activeTab === 'candidates' && (
          <ExamTabCandidates candidates={students} />
        )}

        {activeTab === 'roll_numbers' && (
          <ExamTabRollNumbers candidates={students} onRefresh={loadExamData} onToast={showToast} />
        )}

        {activeTab === 'attendance' && (
          <ExamTabAttendance examId={exam.id} papers={papers} classes={classes} onToast={showToast} />
        )}

        {activeTab === 'marks' && (
          <ExamTabMarks examId={exam.id} papers={papers} classes={classes} onToast={showToast} />
        )}

        {activeTab === 'results' && (
          <ExamTabResults examId={exam.id} isPublished={exam.isPublished} onToast={showToast} />
        )}

        {activeTab === 'documents' && (
          <ExamTabDocuments examId={exam.id} />
        )}

        {activeTab === 'activity' && (
          <ExamTabActivity exam={exam} />
        )}
      </div>

      {/* Add Paper Dialog */}
      {isAddPaperOpen && (
        <AddExamPaperDialog
          examId={exam.id}
          subjects={subjects}
          isOpen={isAddPaperOpen}
          onClose={() => setIsAddPaperOpen(false)}
          onSuccess={() => {
            setIsAddPaperOpen(false);
            showToast('Exam paper created and linked to examination cycle.');
            loadExamData();
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
  papersCount,
  schedulesCount,
  candidatesCount,
}: {
  exam: LiveExamTerm;
  papersCount: number;
  schedulesCount: number;
  candidatesCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Eligible Candidates</div>
          <div className="text-2xl font-bold text-foreground mt-1">{candidatesCount}</div>
          <div className="text-[10px] text-muted-foreground">Active enrolled students</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Curriculum Papers</div>
          <div className="text-2xl font-bold text-foreground mt-1">{papersCount}</div>
          <div className="text-[10px] text-muted-foreground">Subject assessment papers</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Timetable Slots</div>
          <div className="text-2xl font-bold text-foreground mt-1">{schedulesCount}</div>
          <div className="text-[10px] text-muted-foreground">Scheduled assessment shifts</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Lifecycle Status</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {exam.isPublished ? 'Published' : 'Scheduled'}
          </div>
          <div className="text-[10px] text-muted-foreground">Official evaluation state</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 space-y-3">
          <div className="font-semibold text-xs text-foreground flex items-center justify-between">
            <span>Examination Parameters &amp; Institutional Scope</span>
            <Badge variant="outline">{exam.code || 'EXAM'}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Session</span>
              <span className="font-semibold">{exam.academicSession?.name || 'Active Session'}</span>
            </div>
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Date Window</span>
              <span className="font-semibold font-mono">
                {new Date(exam.startDate).toLocaleDateString()} to {new Date(exam.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="p-2.5 rounded border bg-muted/20">
              <span className="text-[10px] text-muted-foreground block">Campus</span>
              <span className="font-semibold">{exam.campus?.name || 'All Campuses'}</span>
            </div>
          </div>

          {exam.instructions && (
            <div className="space-y-1 text-xs pt-2">
              <span className="text-[11px] text-muted-foreground font-medium">Candidate Instructions:</span>
              <p className="text-muted-foreground text-xs bg-muted/20 p-2.5 rounded border">{exam.instructions}</p>
            </div>
          )}

          {exam.warnings && (
            <div className="space-y-1 text-xs pt-1">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Evaluation Warnings:</span>
              <p className="text-muted-foreground text-xs bg-amber-500/10 border border-amber-500/20 p-2.5 rounded">{exam.warnings}</p>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-semibold text-xs text-foreground">Examination Workflows</div>
          <div className="space-y-2 text-xs">
            <Link
              href={`/school/exams/${exam.id}/schedule`}
              className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-all text-xs"
            >
              <div>
                <span className="font-medium text-foreground block">Schedule Builder</span>
                <span className="text-[11px] text-muted-foreground">Assign dates, rooms, and class sessions</span>
              </div>
              <Calendar className="h-4 w-4 text-primary" />
            </Link>

            <Link
              href={`/school/exams/${exam.id}/documents`}
              className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-all text-xs"
            >
              <div>
                <span className="font-medium text-foreground block">Exam Print Center</span>
                <span className="text-[11px] text-muted-foreground">Generate admit cards &amp; student datesheets</span>
              </div>
              <Printer className="h-4 w-4 text-primary" />
            </Link>
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
  papers: LiveExamPaper[];
  onOpenAdd: () => void;
  onDeletePaper: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Curriculum Examination Papers</h3>
          <p className="text-[11px] text-muted-foreground">
            Standardized evaluation papers with maximum and qualifying thresholds.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 cursor-pointer" onClick={onOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Exam Paper
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Subject &amp; Paper Name</th>
                <th className="py-2.5 px-3">Subject Code</th>
                <th className="py-2.5 px-3">Maximum Marks</th>
                <th className="py-2.5 px-3">Passing Marks</th>
                <th className="py-2.5 px-3">Scheduled Sessions</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No examination papers defined yet. Click &ldquo;Add Exam Paper&rdquo; to begin.
                  </td>
                </tr>
              ) : (
                papers.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.subject?.name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {p.subject?.code || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">{p.maxMarks}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{p.passingMarks}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {p.schedules?.length || 0} slots
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => onDeletePaper(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
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
  examId,
  schedules,
}: {
  examId: string;
  schedules: any[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Examination Datesheet &amp; Timetable</h3>
          <p className="text-[11px] text-muted-foreground">
            Scheduled slots with start/end timings, target classes, and hall allocation.
          </p>
        </div>
        <Link href={`/school/exams/${examId}/schedule`}>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
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
                <th className="py-2.5 px-3">Class &amp; Section</th>
                <th className="py-2.5 px-3">Room / Hall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No examination timetable sessions scheduled yet. Use Schedule Builder to allocate sessions.
                  </td>
                </tr>
              ) : (
                schedules.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-semibold text-foreground font-mono">
                      {new Date(entry.examDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-primary font-medium">
                      {entry.startTime} – {entry.endTime}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-foreground">{entry.paperName}</span>
                      <span className="text-[10px] text-muted-foreground block">{entry.subjectName}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.class?.name || 'Class'} - {entry.section?.name || 'Section'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {entry.roomNumber || 'Main Examination Hall'}
                    </td>
                  </tr>
                ))
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
function ExamTabCandidates({ candidates }: { candidates: any[] }) {
  const [search, setSearch] = React.useState('');

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.admissionNumber || '').toLowerCase().includes(q) ||
      (c.rollNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Examination Candidate Roster</h3>
          <p className="text-[11px] text-muted-foreground">
            Real student cohort populated dynamically from the school database.
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
                <th className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">Roll No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Admission ID</th>
                <th className="py-2.5 px-3">Class &amp; Section</th>
                <th className="py-2.5 px-3">Campus</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No matching student candidates found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600 text-xs">
                      {c.rollNumber || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-foreground">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                      {c.admissionNumber}
                    </td>
                    <td className="py-2 px-3">
                      {c.className} - {c.sectionName}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {c.campusName || 'Main Campus'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {c.status || 'ACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 5: ROLL NUMBERS
// ---------------------------------------------------------------------------
function ExamTabRollNumbers({
  candidates,
  onRefresh,
  onToast,
}: {
  candidates: any[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}) {
  const [editingStudentId, setEditingStudentId] = React.useState<string | null>(null);
  const [newRoll, setNewRoll] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleSaveRoll = async (studentId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: newRoll.trim() }),
      });
      if (res.ok) {
        onToast('Roll number updated and persisted.');
        setEditingStudentId(null);
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || 'Failed to update roll number.');
      }
    } catch (e: any) {
      onToast('Error updating roll number.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Authoritative Roll Number Registry</h3>
          <p className="text-[11px] text-muted-foreground">
            Directly update and manage student roll numbers persisted to database.
          </p>
        </div>
        <Link href="/school/exams/roll-numbers">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer">
            <Hash className="h-3.5 w-3.5" />
            Open Full Roll Allocation Engine
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Admission No</th>
                <th className="py-2.5 px-3">Class &amp; Section</th>
                <th className="py-2.5 px-3">Assigned Roll</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => {
                const isEditing = editingStudentId === c.id;
                return (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3 font-semibold text-foreground">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{c.admissionNumber}</td>
                    <td className="py-2 px-3">{c.className} - {c.sectionName}</td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          value={newRoll}
                          onChange={(e) => setNewRoll(e.target.value)}
                          className="h-7 w-24 text-xs font-mono"
                          placeholder="e.g. 01"
                        />
                      ) : (
                        <span className="font-mono font-bold text-emerald-600">{c.rollNumber || 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleSaveRoll(c.id)}
                            className="h-6.5 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStudentId(null)}
                            className="h-6.5 text-[11px] px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingStudentId(c.id);
                            setNewRoll(c.rollNumber || '');
                          }}
                          className="h-6.5 text-[11px] px-2 cursor-pointer"
                        >
                          Edit Roll
                        </Button>
                      )}
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
// SUB-TAB 6: ATTENDANCE
// ---------------------------------------------------------------------------
function ExamTabAttendance({
  examId,
  papers,
  classes,
  onToast,
}: {
  examId: string;
  papers: LiveExamPaper[];
  classes: any[];
  onToast: (msg: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Examination Hall Attendance</h3>
          <p className="text-[11px] text-muted-foreground">
            Hall seating verification and student presence recording.
          </p>
        </div>
      </div>

      <Card className="p-8 text-center space-y-2">
        <Users className="h-8 w-8 text-primary mx-auto opacity-70" />
        <h4 className="text-xs font-bold text-foreground">Direct Hall Seating Attendance</h4>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          Candidate examination attendance statuses (Present, Absent, Exempt) are integrated with individual paper evaluation under Marks Entry.
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 7: MARKS ENTRY
// ---------------------------------------------------------------------------
function ExamTabMarks({
  examId,
  papers,
  classes,
  onToast,
}: {
  examId: string;
  papers: LiveExamPaper[];
  classes: any[];
  onToast: (msg: string) => void;
}) {
  const [selectedPaperId, setSelectedPaperId] = React.useState<string>(papers[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = React.useState<string>(classes[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>(classes[0]?.sections?.[0]?.id || '');
  const [roster, setRoster] = React.useState<any[]>([]);
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [isLoadingRoster, setIsLoadingRoster] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId) || papers[0];
  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const fetchRoster = React.useCallback(async () => {
    if (!selectedPaperId || !selectedClassId || !selectedSectionId) return;
    setIsLoadingRoster(true);
    try {
      const res = await fetch(
        `/api/results/marks?examTermId=${examId}&paperId=${selectedPaperId}&classId=${selectedClassId}&sectionId=${selectedSectionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRoster(data.roster || []);
        const initialScores: Record<string, number> = {};
        (data.roster || []).forEach((r: any) => {
          if (r.marksObtained !== null && r.marksObtained !== undefined) {
            initialScores[r.student.id] = r.marksObtained;
          }
        });
        setScores(initialScores);
      } else {
        setRoster([]);
      }
    } catch (err) {
      console.error('Error fetching marks roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  }, [examId, selectedPaperId, selectedClassId, selectedSectionId]);

  React.useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    const max = selectedPaper?.maxMarks || 100;
    const clamped = Math.max(0, Math.min(max, num));
    setScores((prev) => ({ ...prev, [studentId]: clamped }));
  };

  const handleSaveMarks = async () => {
    if (!selectedPaperId) return;
    setIsSaving(true);
    try {
      const payload = {
        examTermId: examId,
        paperId: selectedPaperId,
        marks: roster.map((r) => ({
          studentId: r.student.id,
          marksObtained: scores[r.student.id] ?? 0,
          status: 'PRESENT',
          remarks: '',
        })),
      };

      const res = await fetch('/api/results/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onToast('Marks saved successfully to database!');
        fetchRoster();
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || 'Failed to save marks.');
      }
    } catch (err) {
      onToast('Error saving marks.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Select Paper */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Paper:</span>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Max: {p.maxMarks})
                </option>
              ))}
            </select>
          </div>

          {/* Select Class */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const cls = classes.find((c) => c.id === e.target.value);
                if (cls?.sections?.[0]) {
                  setSelectedSectionId(cls.sections[0].id);
                }
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Section */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Section:</span>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {(selectedClass?.sections || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          size="sm"
          disabled={isSaving || roster.length === 0}
          onClick={handleSaveMarks}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Candidate Marks
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoadingRoster ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Loading candidates for marks entry...</span>
          </div>
        ) : roster.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No enrolled students found for the selected Class &amp; Section in this academic cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Max Marks</th>
                  <th className="py-2.5 px-3">Passing Marks</th>
                  <th className="py-2.5 px-3 w-36">Marks Obtained</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.map((r) => {
                  const score = scores[r.student.id] ?? 0;
                  const max = selectedPaper?.maxMarks || 100;
                  const pass = selectedPaper?.passingMarks || 35;
                  const isPass = score >= pass;

                  return (
                    <tr key={r.student.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {r.student.firstName} {r.student.lastName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {r.student.admissionNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{max}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600">{pass}</td>
                      <td className="py-2.5 px-3">
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          value={score}
                          onChange={(e) => handleScoreChange(r.student.id, e.target.value)}
                          className="h-7 w-24 text-xs font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={isPass ? 'default' : 'destructive'} className="text-[10px]">
                          {isPass ? 'Pass' : 'Fail'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 8: RESULTS
// ---------------------------------------------------------------------------
function ExamTabResults({
  examId,
  isPublished,
  onToast,
}: {
  examId: string;
  isPublished: boolean;
  onToast: (msg: string) => void;
}) {
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleRecompute = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/results/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examTermId: examId }),
      });
      if (res.ok) {
        onToast('Results re-calculated and compiled authoritative server-side!');
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || 'Failed to recompute results.');
      }
    } catch (e) {
      onToast('Error recalculating results.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Official Examination Results</h3>
          <p className="text-[11px] text-muted-foreground">
            Aggregated candidate scores, percentage, pass/fail classification, and parent publication.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={isCalculating}
          onClick={handleRecompute}
          className="h-8 text-xs gap-1.5 cursor-pointer"
        >
          {isCalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recompute Results
        </Button>
      </div>

      <Card className="p-8 text-center space-y-3">
        <Award className="h-8 w-8 text-emerald-600 mx-auto opacity-80" />
        <h4 className="text-xs font-bold text-foreground">
          {isPublished ? 'Examination Results Published' : 'Results Compiled in Draft State'}
        </h4>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          {isPublished
            ? 'Results have been compiled and published. Published results are accessible to verified parents through Parent Portal and printable via Exam Print Center.'
            : 'Click "Calculate & Publish Results" in the header to compile results and publish them to students and parents.'}
        </p>
        <Link href={`/school/exams/${examId}/documents`}>
          <Button size="sm" variant="outline" className="text-xs h-7.5 gap-1.5 mt-2 cursor-pointer">
            <Printer className="h-3.5 w-3.5" />
            Open Print Center for Marksheets &amp; Results
          </Button>
        </Link>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 9: DOCUMENTS (PRINT CENTER)
// ---------------------------------------------------------------------------
function ExamTabDocuments({ examId }: { examId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Examination Print Center</h3>
          <p className="text-[11px] text-muted-foreground">
            Print-ready official documents including Admit Cards, Overall Datesheets, and Class Schedules.
          </p>
        </div>
        <Link href={`/school/exams/${examId}/documents`}>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground cursor-pointer">
            <Printer className="h-3.5 w-3.5" />
            Launch Full Print Workspace
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 space-y-2">
          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            <span>Candidate Admit Cards</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Official hall admission cards with roll numbers, datesheet, instructions, and signature boxes.
          </p>
          <Link href={`/school/exams/${examId}/documents`}>
            <Button size="sm" variant="outline" className="w-full text-xs h-7.5 mt-2 cursor-pointer">
              Print Admit Cards
            </Button>
          </Link>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Master Datesheet</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Complete institutional datesheet with paper times, room allocations, and shift schedules.
          </p>
          <Link href={`/school/exams/${examId}/documents`}>
            <Button size="sm" variant="outline" className="w-full text-xs h-7.5 mt-2 cursor-pointer">
              Print Master Datesheet
            </Button>
          </Link>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Award className="h-4 w-4 text-emerald-600" />
            <span>Class Marksheets</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Official consolidated grade sheets and subject-wise score matrices for archival.
          </p>
          <Link href={`/school/exams/${examId}/documents`}>
            <Button size="sm" variant="outline" className="w-full text-xs h-7.5 mt-2 cursor-pointer">
              Print Marksheets
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-TAB 10: ACTIVITY / AUDIT LOG
// ---------------------------------------------------------------------------
function ExamTabActivity({ exam }: { exam: LiveExamTerm }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-foreground">Examination Lifecycle Audit Trail</h3>
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3 text-xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
          <div>
            <span className="font-semibold text-foreground">Examination Cycle Initialized</span>
            <p className="text-[11px] text-muted-foreground">
              Cycle &ldquo;{exam.name}&rdquo; configured for Academic Session {exam.academicSession?.name || '2025-26'}.
            </p>
          </div>
        </div>

        {exam.isPublished && (
          <div className="flex items-start gap-3 text-xs pt-2 border-t">
            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Results Published</span>
              <p className="text-[11px] text-muted-foreground">
                Authoritative evaluation scores calculated and made visible to parents and students.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADD EXAM PAPER DIALOG
// ---------------------------------------------------------------------------
function AddExamPaperDialog({
  examId,
  subjects,
  isOpen,
  onClose,
  onSuccess,
}: {
  examId: string;
  subjects: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [subjectId, setSubjectId] = React.useState<string>(subjects[0]?.id || '');
  const [paperName, setPaperName] = React.useState('');
  const [maxMarks, setMaxMarks] = React.useState(100);
  const [passingMarks, setPassingMarks] = React.useState(33);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !paperName.trim()) {
      setError('Please select a subject and specify a paper name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/timetable/exam/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTermId: examId,
          subjectId,
          name: paperName.trim(),
          maxMarks,
          passingMarks,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create exam paper.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error creating exam paper.');
    } finally {
      setIsSubmitting(false);
    }
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
                Creates an evaluation paper connected to school subjects and persisted to database.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <FormField id="subjectId" label="Curriculum Subject" required>
            <select
              id="subjectId"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'Subj'})
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="paperName" label="Paper Name" required>
            <Input
              id="paperName"
              placeholder="e.g. Mathematics Paper 1, Chemistry Theory"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              className="text-xs"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="maxMarks" label="Maximum Marks">
              <Input
                id="maxMarks"
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </FormField>

            <FormField id="passingMarks" label="Passing Marks">
              <Input
                id="passingMarks"
                type="number"
                min={0}
                max={maxMarks}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </FormField>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="text-xs cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs cursor-pointer flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Create Exam Paper
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
