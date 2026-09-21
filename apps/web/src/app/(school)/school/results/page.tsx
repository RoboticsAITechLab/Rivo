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
} from '@/components/ui/dialog';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import {
  selectExams,
  selectCampuses,
  selectStreams,
  selectClasses,
  selectExamResults,
  calculateAllCampusResultSummary,
} from '@/shared/selectors';
import { ExamResult } from '@/shared/types';

export default function ResultsPage() {
  const store = useSchoolStore();
  const exams = selectExams(store);
  const campuses = selectCampuses(store);
  const streams = selectStreams(store);
  const classes = selectClasses(store);

  const [selectedExamId, setSelectedExamId] = React.useState<string>(exams[0]?.id || '');
  const [selectedCampusScope, setSelectedCampusScope] = React.useState<string>('ALL');
  const [selectedClass, setSelectedClass] = React.useState<string>('ALL');
  const [selectedStream, setSelectedStream] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeView, setActiveView] = React.useState<'roster' | 'campus_summary' | 'stream_summary'>('roster');

  // Detail Modal
  const [selectedResult, setSelectedResult] = React.useState<ExamResult | null>(null);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Filtered results
  const filteredResults = React.useMemo(() => {
    return selectExamResults(store, selectedExamId, {
      campusId: selectedCampusScope,
      classId: selectedClass,
      streamId: selectedStream,
      search: searchQuery,
    });
  }, [store, selectedExamId, selectedCampusScope, selectedClass, selectedStream, searchQuery]);

  // Overall multi-campus summary
  const summary = React.useMemo(() => {
    return calculateAllCampusResultSummary(store, selectedExamId);
  }, [store, selectedExamId]);

  if (exams.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Examination Results &amp; All-Campus Analytics"
          description="Consolidated academic evaluation records, subject transcripts, and multi-campus institutional performance metrics."
          icon={BarChart2}
          badge="Institutional Analytics"
        />
        <EmptyState
          icon={Award}
          title="No examination cycles configured"
          description="Examination cycles and published evaluation marksheets will appear here once exams are configured and marks are recorded."
          actionLabel="Go to Examinations"
          onAction={() => {
            window.location.href = '/school/exams';
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Examination Results &amp; All-Campus Analytics"
        description="Consolidated academic evaluation records, subject transcripts, and multi-campus institutional performance metrics."
        icon={BarChart2}
        badge="Institutional Analytics"
        actions={
          <div className="flex items-center gap-2">
            {currentExam && (
              <Link href={`/school/exams/${currentExam.id}/documents`}>
                <Button variant="outline" size="sm" className="text-xs h-8.5 gap-1.5 border-primary/30 text-primary">
                  <Printer className="h-3.5 w-3.5" />
                  Print Marksheets
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* 2. Top Metric Cards (Calculated across All Campuses or Selected Scope) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {selectedCampusScope === 'ALL' ? 'All-Campus Candidates' : 'Campus Candidates'}
            </div>
            <div className="text-xl font-bold text-foreground">{filteredResults.length}</div>
            <div className="text-[10px] text-muted-foreground">
              {selectedCampusScope === 'ALL' ? `Across ${campuses.length} Campuses` : 'Selected Site Only'}
            </div>
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
              {summary.schoolPassPercentage}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              {summary.totalPassed} of {summary.totalCandidates} passed
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Aggregate Mean
            </div>
            <div className="text-xl font-bold text-indigo-600 font-mono">
              {summary.schoolAveragePercentage}%
            </div>
            <div className="text-[10px] text-muted-foreground">Grade Level Mean</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Peak Score
            </div>
            <div className="text-xl font-bold text-amber-600 font-mono">
              {summary.highestPercentage}%
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {summary.topperStudent?.name || 'School Topper'}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Scope & Filter Selector Bar */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full md:w-auto flex-1">
            {/* Exam Cycle Picker */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.code})
                </option>
              ))}
            </select>

            {/* Scope: All Campuses vs Campus A / B / C */}
            <select
              value={selectedCampusScope}
              onChange={(e) => setSelectedCampusScope(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Campuses (School-Wide Aggregate)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Class */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </select>

            {/* Stream */}
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Streams</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search candidate or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={activeView === 'roster' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveView('roster')}
            >
              Student Roster
            </Button>
            <Button
              variant={activeView === 'campus_summary' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveView('campus_summary')}
            >
              Campus Breakdown
            </Button>
            <Button
              variant={activeView === 'stream_summary' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveView('stream_summary')}
            >
              Stream Breakdown
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Content Views */}
      {activeView === 'roster' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                    Exam Roll No.
                  </th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Campus</th>
                  <th className="py-2.5 px-3">Class &amp; Div</th>
                  <th className="py-2.5 px-3">Stream</th>
                  <th className="py-2.5 px-3">Aggregate Score</th>
                  <th className="py-2.5 px-3 font-bold">Percentage</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3 text-right">Scorecard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      No published results matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => {
                    const std = store.students.find((s) => s.id === r.studentId);
                    const campus = store.campuses.find((c) => c.id === r.campusId);
                    const cls = store.classes.find((c) => c.id === r.classId);
                    const sec = cls?.sections.find((s) => s.id === r.sectionId);
                    const stream = store.streams.find((s) => s.id === r.streamId);

                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-xs">
                          {r.examRollNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{std?.name || 'Student'}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {std?.admissionNumber}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {campus?.name}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          {cls?.className} - {sec?.name}
                        </td>
                        <td className="py-2.5 px-3">
                          {stream ? (
                            <Badge variant="secondary" className="text-[9px]">
                              {stream.name}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {r.totalMarks} / {r.maxTotalMarks}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary text-xs">
                          {r.percentage}%
                        </td>
                        <td className="py-2.5 px-3 font-bold">{r.grade}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={r.overallStatus === 'PASS' ? 'default' : r.overallStatus === 'COMPARTMENT' ? 'outline' : 'destructive'}
                            className="text-[10px]"
                          >
                            {r.overallStatus}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => setSelectedResult(r)}
                          >
                            View Details
                            <ChevronRight className="h-3 w-3 ml-0.5" />
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
      )}

      {/* View 2: Campus Breakdown */}
      {activeView === 'campus_summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.campusBreakdowns.map((cb) => (
            <Card key={cb.campusId} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{cb.campusName}</span>
                <Badge variant="outline" className="text-[10px]">Campus Site</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Candidates</span>
                  <span className="font-bold text-sm">{cb.candidates}</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Pass Rate</span>
                  <span className="font-bold text-sm text-emerald-600">{cb.passPercentage}%</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Passed</span>
                  <span className="font-semibold text-emerald-600">{cb.passed}</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Average Score</span>
                  <span className="font-semibold">{cb.averageScore}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View 3: Stream Breakdown */}
      {activeView === 'stream_summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.streamBreakdowns.map((sb) => (
            <Card key={sb.streamId} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{sb.streamName}</span>
                <Badge variant="secondary" className="text-[10px]">Stream Cohort</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Candidates</span>
                  <span className="font-bold text-sm">{sb.candidates}</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Pass Rate</span>
                  <span className="font-bold text-sm text-emerald-600">{sb.passPercentage}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Scorecard Dialog */}
      {selectedResult && (
        <StudentScorecardDialog
          result={selectedResult}
          isOpen={Boolean(selectedResult)}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </PageContainer>
  );
}

function StudentScorecardDialog({
  result,
  isOpen,
  onClose,
}: {
  result: ExamResult;
  isOpen: boolean;
  onClose: () => void;
}) {
  const store = useSchoolStore();
  const student = store.students.find((s) => s.id === result.studentId);
  const campus = store.campuses.find((c) => c.id === result.campusId);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Candidate Scorecard</DialogTitle>
              <DialogDescription className="text-xs">
                Formal transcript for {student?.name} ({student?.admissionNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg border bg-muted/20">
            <div>
              <span className="text-[10px] text-muted-foreground block">Class Roll</span>
              <span className="font-mono font-medium">#{student?.classRollNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block font-semibold">Exam Roll</span>
              <span className="font-mono font-bold text-emerald-600">{result.examRollNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Campus</span>
              <span className="truncate block">{campus?.name}</span>
            </div>
          </div>

          <table className="w-full text-xs text-left border">
            <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="py-2 px-2.5">Course / Subject</th>
                <th className="py-2 px-2.5">Score</th>
                <th className="py-2 px-2.5">Grade</th>
                <th className="py-2 px-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.subjectResults.map((sub, idx) => {
                const subject = store.subjects.find((s) => s.id === sub.subjectId);
                return (
                  <tr key={idx}>
                    <td className="py-1.5 px-2.5 font-medium">{subject?.name || 'Subject'}</td>
                    <td className="py-1.5 px-2.5 font-mono">
                      {sub.marksObtained} / {sub.maxMarks}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold">{sub.grade}</td>
                    <td className="py-1.5 px-2.5 text-right text-emerald-600 font-semibold">{sub.status}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/40 font-bold border-t">
              <tr>
                <td className="py-2 px-2.5">Overall Total:</td>
                <td className="py-2 px-2.5 font-mono text-primary font-bold">
                  {result.totalMarks} / {result.maxTotalMarks} ({result.percentage}%)
                </td>
                <td className="py-2 px-2.5">{result.grade}</td>
                <td className="py-2 px-2.5 text-right text-emerald-600">{result.overallStatus}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
