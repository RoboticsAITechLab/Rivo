'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  ChevronLeft,
  FileText,
  Award,
  Calendar,
  Building,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import {
  selectExamById,
  selectExamPapers,
  selectExamSchedule,
  selectExamCandidates,
  selectExamResults,
  selectCampuses,
} from '@/shared/selectors';

export type DocumentTemplateType =
  | 'admit_card'
  | 'marksheet'
  | 'timetable_overall'
  | 'timetable_campus'
  | 'class_result'
  | 'all_campus_summary';

export default function ExamDocumentsPrintPage() {
  const params = useParams();
  const examId = params.id as string;
  const store = useSchoolStore();

  const exam = selectExamById(store, examId);
  const papers = selectExamPapers(store, examId);
  const schedule = selectExamSchedule(store, examId);
  const candidates = selectExamCandidates(store, examId);
  const results = selectExamResults(store, examId);
  const campuses = selectCampuses(store);

  const [documentType, setDocumentType] = React.useState<DocumentTemplateType>('admit_card');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>(candidates[0]?.studentId || '');
  const [selectedCampusId, setSelectedCampusId] = React.useState<string>('ALL');

  if (!exam) {
    return (
      <PageContainer>
        <div className="py-20 text-center">
          <p className="text-xs text-muted-foreground">Exam cycle not found.</p>
        </div>
      </PageContainer>
    );
  }

  const selectedCandidate = candidates.find((c) => c.studentId === selectedStudentId) || candidates[0];
  const selectedResult = results.find((r) => r.studentId === selectedStudentId) || results[0];
  const candidateCampus = campuses.find((c) => c.id === selectedCandidate?.campusId) || campuses[0];
  const activeSession = store.academicSessions.find((s) => s.status === 'ACTIVE')?.name || 'Current Academic Session';

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      {/* Screen-only Controls */}
      <div className="space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/school/exams/${exam.id}`} className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Exam 360 ({exam.name})
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Print Center &amp; Formal Transcripts</span>
        </div>

        <PageHeader
          title="Formal Examination Print Center"
          description="Generate verified admit cards, official student marksheets, institutional timetables, and multi-campus consolidated results."
          icon={Printer}
          badge="Audit Certified"
          actions={
            <Button
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save as PDF
            </Button>
          }
        />

        {/* Template Switcher Bar */}
        <Card className="p-3 bg-muted/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={documentType === 'admit_card' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setDocumentType('admit_card')}
              >
                <FileText className="h-3.5 w-3.5" />
                Student Admit Card
              </Button>
              <Button
                variant={documentType === 'marksheet' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setDocumentType('marksheet')}
              >
                <Award className="h-3.5 w-3.5" />
                Official Marksheet
              </Button>
              <Button
                variant={documentType === 'timetable_overall' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setDocumentType('timetable_overall')}
              >
                <Calendar className="h-3.5 w-3.5" />
                Full Timetable Poster
              </Button>
              <Button
                variant={documentType === 'all_campus_summary' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setDocumentType('all_campus_summary')}
              >
                <Building className="h-3.5 w-3.5" />
                All-Campus Result Summary
              </Button>
            </div>

            {/* If Student Document, allow selecting student */}
            {(documentType === 'admit_card' || documentType === 'marksheet') && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground font-medium">Candidate:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {candidates.length === 0 ? (
                    <option value="">No candidates enrolled</option>
                  ) : (
                    candidates.map((c) => (
                      <option key={c.studentId} value={c.studentId}>
                        {c.examRollNumber} — {c.name} ({c.className})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Campus Selector for summary & timetables */}
            {(documentType === 'timetable_overall' || documentType === 'all_campus_summary') && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground font-medium">Campus Scope:</span>
                <select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="ALL">All Campuses (Consolidated)</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Printable Document Container */}
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-card text-foreground rounded-lg border shadow-sm p-8 print:p-0 print:border-none print:shadow-none print:m-0 space-y-6">
          {/* Institutional Header */}
          <div className="border-b pb-4 text-center space-y-1 relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-base">
                R
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground">
                {candidateCampus?.name || 'Central Examination Board'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {candidateCampus?.address ? `${candidateCampus.address}, ${candidateCampus.city}` : 'Institutional Examination Administration'} • Formal Assessment Authority
            </p>
            <p className="text-[11px] text-muted-foreground">
              Tel: {candidateCampus?.phone || 'Central Office'} • Email: examinations@institution.edu • Web: portal.institution.edu
            </p>
            <div className="pt-2">
              <span className="inline-block uppercase tracking-widest font-bold text-xs bg-muted px-4 py-1 rounded border">
                {documentType === 'admit_card' && 'OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET'}
                {documentType === 'marksheet' && 'SENIOR EVALUATION TRANSCRIPT & MARKSHEET'}
                {documentType === 'timetable_overall' && 'CENTRAL EXAMINATION TIMETABLE POSTER'}
                {documentType === 'all_campus_summary' && 'CONSOLIDATED ALL-CAMPUS PERFORMANCE REPORT'}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              Academic Session: <strong className="text-foreground">{activeSession}</strong> • Examination: <strong className="text-foreground">{exam.name}</strong>
            </div>
          </div>

          {/* TEMPLATE 1: ADMIT CARD */}
          {documentType === 'admit_card' && !selectedCandidate && (
            <div className="py-12 text-center text-muted-foreground text-sm border rounded-lg">
              No candidates enrolled in this examination cycle. Allocate roll numbers to generate admit cards.
            </div>
          )}
          {documentType === 'admit_card' && selectedCandidate && (
            <div className="space-y-6">
              {/* Student Identification Roster */}
              <div className="grid grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/10 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Permanent Student ID</span>
                  <span className="font-mono font-bold text-sm text-foreground">{selectedCandidate.permanentId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Class Roll No. (Academic)</span>
                  <span className="font-mono font-bold text-sm text-foreground">#{selectedCandidate.classRollNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-semibold">
                    Exam Roll No. (Formal Stable)
                  </span>
                  <span className="font-mono font-bold text-base text-emerald-600">{selectedCandidate.examRollNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Admission / Reg No.</span>
                  <span className="font-mono text-xs">{selectedCandidate.admissionNumber}</span>
                </div>

                <div className="col-span-2 pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground block uppercase">Candidate Legal Name</span>
                  <span className="font-bold text-sm text-foreground">{selectedCandidate.name}</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground block uppercase">Class &amp; Section</span>
                  <span className="font-medium text-xs text-foreground">
                    {selectedCandidate.className} - {selectedCandidate.sectionName}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground block uppercase">Stream / Campus</span>
                  <span className="font-medium text-xs text-foreground">
                    {selectedCandidate.streamName || 'General'} • {selectedCandidate.campusName}
                  </span>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Scheduled Examination Papers &amp; Room Allocations
                </div>
                <table className="w-full text-xs text-left border border-collapse">
                  <thead className="bg-muted text-[10px] uppercase font-bold border-b">
                    <tr>
                      <th className="py-2 px-3 border-r">Date</th>
                      <th className="py-2 px-3 border-r">Time Slot</th>
                      <th className="py-2 px-3 border-r">Curriculum Subject</th>
                      <th className="py-2 px-3 border-r">Paper Code</th>
                      <th className="py-2 px-3 border-r">Duration</th>
                      <th className="py-2 px-3 border-r">Room / Hall</th>
                      <th className="py-2 px-3 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b">
                    {schedule.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground">
                          No papers scheduled for this examination cycle.
                        </td>
                      </tr>
                    ) : (
                      schedule.map((slot) => {
                        const paper = papers.find((p) => p.id === slot.paperId);
                        const subj = store.subjects.find((s) => s.id === paper?.subjectId);

                        return (
                          <tr key={slot.id}>
                            <td className="py-2 px-3 border-r font-mono font-medium">{slot.date}</td>
                            <td className="py-2 px-3 border-r font-mono">{slot.startTime}–{slot.endTime}</td>
                            <td className="py-2 px-3 border-r font-semibold">{subj?.name || 'Subject'}</td>
                            <td className="py-2 px-3 border-r font-mono">{paper?.paperCode}</td>
                            <td className="py-2 px-3 border-r">{paper?.durationMinutes} min</td>
                            <td className="py-2 px-3 border-r">{slot.room}</td>
                            <td className="py-2 px-3 border-r text-center text-muted-foreground">_______</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mandatory Rules & Seal */}
              <div className="p-3 border rounded-lg bg-muted/20 text-[11px] space-y-1">
                <span className="font-bold uppercase tracking-wider block">Candidate Instructions:</span>
                <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                  <li>Candidates must occupy their assigned seat 15 minutes before the scheduled time slot.</li>
                  <li>This admit card along with student photo ID is mandatory for admission to the hall.</li>
                  <li>Electronic gadgets, smartwatches, and programmable calculators are strictly prohibited.</li>
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
                <div>
                  <div className="border-b pb-8 border-dashed" />
                  <span className="text-[11px] font-medium text-muted-foreground mt-1 block">Candidate Signature</span>
                </div>
                <div>
                  <div className="border-b pb-8 border-dashed" />
                  <span className="text-[11px] font-medium text-muted-foreground mt-1 block">Center Superintendent</span>
                </div>
                <div>
                  <div className="border-b pb-8 border-dashed" />
                  <span className="text-[11px] font-bold text-foreground mt-1 block">Principal / Head of School</span>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: OFFICIAL MARKSHEET */}
          {documentType === 'marksheet' && !selectedCandidate && (
            <div className="py-12 text-center text-muted-foreground text-sm border rounded-lg">
              No candidates enrolled in this examination cycle.
            </div>
          )}
          {documentType === 'marksheet' && selectedCandidate && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/10 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Candidate Name</span>
                  <span className="font-bold text-sm block text-foreground">{selectedCandidate.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Permanent Student ID</span>
                  <span className="font-mono text-sm block">{selectedCandidate.permanentId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Exam Roll Number</span>
                  <span className="font-mono font-bold text-base text-emerald-600 block">{selectedCandidate.examRollNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Class &amp; Div</span>
                  <span className="font-medium text-xs block">{selectedCandidate.className} - {selectedCandidate.sectionName}</span>
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="space-y-2">
                <table className="w-full text-xs text-left border border-collapse">
                  <thead className="bg-muted text-[10px] uppercase font-bold border-b">
                    <tr>
                      <th className="py-2.5 px-3 border-r">Course / Subject</th>
                      <th className="py-2.5 px-3 border-r">Paper Code</th>
                      <th className="py-2.5 px-3 border-r">Max Marks</th>
                      <th className="py-2.5 px-3 border-r">Pass Marks</th>
                      <th className="py-2.5 px-3 border-r font-bold">Marks Secured</th>
                      <th className="py-2.5 px-3 border-r">Letter Grade</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b">
                    {!selectedResult || selectedResult.subjectResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground">
                          No marks entered for this candidate yet.
                        </td>
                      </tr>
                    ) : (
                      selectedResult.subjectResults.map((sub, idx) => {
                        const subject = store.subjects.find((s) => s.id === sub.subjectId);
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 border-r font-semibold">{subject?.name || 'Subject'}</td>
                            <td className="py-2 px-3 border-r font-mono">{sub.paperId}</td>
                            <td className="py-2 px-3 border-r font-mono">{sub.maxMarks}</td>
                            <td className="py-2 px-3 border-r font-mono">33</td>
                            <td className="py-2 px-3 border-r font-mono font-bold text-sm">{sub.marksObtained}</td>
                            <td className="py-2 px-3 border-r font-bold">{sub.grade}</td>
                            <td className="py-2 px-3 text-center font-semibold text-emerald-600">{sub.status}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {selectedResult && selectedResult.subjectResults.length > 0 && (
                    <tfoot className="bg-muted/40 font-bold border-t">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 border-r text-right">Consolidated Aggregate:</td>
                        <td className="py-2.5 px-3 border-r font-mono">{selectedResult.maxTotalMarks || 0}</td>
                        <td className="py-2.5 px-3 border-r">—</td>
                        <td className="py-2.5 px-3 border-r font-mono text-base text-primary">{selectedResult.totalMarks}</td>
                        <td className="py-2.5 px-3 border-r font-mono text-base">{selectedResult.percentage}%</td>
                        <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{selectedResult.overallStatus}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-10 text-center text-xs">
                <div>
                  <div className="border-b pb-8 border-dashed" />
                  <span className="text-[11px] font-medium text-muted-foreground mt-1 block">Controller of Examinations</span>
                </div>
                <div>
                  <div className="border-b pb-8 border-dashed" />
                  <span className="text-[11px] font-bold text-foreground mt-1 block">Principal Seal &amp; Signature</span>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: FULL TIMETABLE POSTER */}
          {documentType === 'timetable_overall' && (
            <div className="space-y-4">
              {schedule.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm border rounded-lg">
                  No examination schedule timetable published for this cycle.
                </div>
              ) : (
                <table className="w-full text-xs text-left border border-collapse">
                  <thead className="bg-muted text-[10px] uppercase font-bold border-b">
                    <tr>
                      <th className="py-2.5 px-3 border-r">Date</th>
                      <th className="py-2.5 px-3 border-r">Time Slot</th>
                      <th className="py-2.5 px-3 border-r">Subject Course</th>
                      <th className="py-2.5 px-3 border-r">Paper Code</th>
                      <th className="py-2.5 px-3 border-r">Cohort / Stream</th>
                      <th className="py-2.5 px-3">Examination Center</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b">
                    {schedule.map((entry) => {
                      const paper = papers.find((p) => p.id === entry.paperId);
                      const subj = store.subjects.find((s) => s.id === paper?.subjectId);
                      const classNames = entry.classIds.map((c) => c.replace('cls-', 'Class ')).join(', ');

                      return (
                        <tr key={entry.id}>
                          <td className="py-2 px-3 border-r font-mono font-semibold">{entry.date}</td>
                          <td className="py-2 px-3 border-r font-mono font-medium">{entry.startTime} – {entry.endTime}</td>
                          <td className="py-2 px-3 border-r font-bold">{subj?.name}</td>
                          <td className="py-2 px-3 border-r font-mono">{paper?.paperCode}</td>
                          <td className="py-2 px-3 border-r">{classNames}</td>
                          <td className="py-2 px-3">{entry.room}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TEMPLATE 4: ALL-CAMPUS RESULT SUMMARY */}
          {documentType === 'all_campus_summary' && (() => {
            const totalCandidates = candidates.length;
            const totalResultsCount = results.length;
            const passedResults = results.filter((r) => r.overallStatus === 'PASS').length;
            const passRate = totalResultsCount > 0 ? `${((passedResults / totalResultsCount) * 100).toFixed(1)}%` : '0.0%';
            const avgPercentage = totalResultsCount > 0 ? `${(results.reduce((acc, r) => acc + r.percentage, 0) / totalResultsCount).toFixed(1)}%` : '0.0%';

            return (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border bg-muted/10 text-xs space-y-2">
                  <span className="font-bold uppercase tracking-wider block">School-Wide Consolidated Metrics</span>
                  <div className="grid grid-cols-4 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Candidates</span>
                      <span className="text-xl font-bold">{totalCandidates}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">School Pass Rate</span>
                      <span className="text-xl font-bold text-emerald-600">{passRate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">School Average</span>
                      <span className="text-xl font-bold text-primary">{avgPercentage}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Participating Campuses</span>
                      <span className="text-xl font-bold">{campuses.length}</span>
                    </div>
                  </div>
                </div>

                {/* Campus Breakdown Table */}
                <div className="space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Performance Breakdown by Campus Site
                  </span>
                  <table className="w-full text-xs text-left border border-collapse">
                    <thead className="bg-muted text-[10px] uppercase font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3 border-r">Campus Site</th>
                        <th className="py-2.5 px-3 border-r">Candidates</th>
                        <th className="py-2.5 px-3 border-r">Pass Count</th>
                        <th className="py-2.5 px-3 border-r">Pass %</th>
                        <th className="py-2.5 px-3">Average %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b">
                      {campuses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No campuses registered.
                          </td>
                        </tr>
                      ) : (
                        campuses.map((c) => {
                          const campusCandidates = candidates.filter((cand) => cand.campusId === c.id);
                          const campusStudentIds = new Set(campusCandidates.map((cand) => cand.studentId));
                          const campusResults = results.filter((r) => campusStudentIds.has(r.studentId));
                          const campusPassCount = campusResults.filter((r) => r.overallStatus === 'PASS').length;
                          const campusPassRate = campusResults.length > 0 ? `${((campusPassCount / campusResults.length) * 100).toFixed(1)}%` : '0.0%';
                          const campusAvg = campusResults.length > 0 ? `${(campusResults.reduce((acc, r) => acc + r.percentage, 0) / campusResults.length).toFixed(1)}%` : '0.0%';

                          return (
                            <tr key={c.id}>
                              <td className="py-2 px-3 border-r font-semibold">{c.name}</td>
                              <td className="py-2 px-3 border-r font-mono">{campusCandidates.length}</td>
                              <td className="py-2 px-3 border-r font-mono text-emerald-600 font-medium">
                                {campusPassCount}
                              </td>
                              <td className="py-2 px-3 border-r font-mono font-bold text-emerald-600">{campusPassRate}</td>
                              <td className="py-2 px-3 font-mono">{campusAvg}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </PageContainer>
  );
}
