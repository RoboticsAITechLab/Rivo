'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  ChevronLeft,
  FileText,
  Calendar,
  Building,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type DocumentTemplateType =
  | 'admit_card'
  | 'timetable_overall'
  | 'timetable_class'
  | 'timetable_stream';

export default function ExamDocumentsPrintPage() {
  const params = useParams();
  const examId = params.id as string;

  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [documentType, setDocumentType] = React.useState<DocumentTemplateType>('admit_card');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>('');
  const [selectedClassId, setSelectedClassId] = React.useState<string>('ALL');
  const [selectedStream, setSelectedStream] = React.useState<string>('ALL');

  const fetchPrintData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timetable/exam/print-data?examId=${examId}`);
      if (!res.ok) {
        throw new Error('Failed to load examination print registry');
      }
      const json = await res.json();
      setData(json);
      if (json.candidates?.length > 0) {
        setSelectedStudentId(json.candidates[0].studentId);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading print data');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  React.useEffect(() => {
    fetchPrintData();
  }, [fetchPrintData]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-xs text-muted-foreground">Compiling verified examination print registry...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-semibold">{error || 'Examination record not found'}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/school/exams">Return to Exams</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const { branding, schedules, candidates } = data;

  const currentCandidate = candidates.find((c: any) => c.studentId === selectedStudentId) || candidates[0];

  // Filter schedules applicable to the student or selected class
  const candidateSchedules = schedules.filter((s: any) => {
    if (documentType === 'admit_card' && currentCandidate) {
      const classMatch = s.classId === currentCandidate.classId;
      const sectionMatch = s.sectionId === currentCandidate.sectionId;
      const streamMatch = s.streamId === 'General' || s.streamId === currentCandidate.stream;
      return classMatch && sectionMatch && streamMatch;
    }
    if (documentType === 'timetable_class' && selectedClassId !== 'ALL') {
      return s.classId === selectedClassId;
    }
    if (documentType === 'timetable_stream' && selectedStream !== 'ALL') {
      return s.streamId === selectedStream || s.streamId === 'General';
    }
    return true;
  });

  const distinctClasses = Array.from(new Set(schedules.map((s: any) => s.className)));
  const distinctStreams = Array.from(new Set(schedules.map((s: any) => s.streamId).filter(Boolean)));

  return (
    <PageContainer>
      {/* Screen Controls (Hidden during print) */}
      <div className="space-y-4 print:hidden mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/school/exams/${examId}`} className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            Exam 360 ({branding.examName})
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Official Print Center</span>
        </div>

        <PageHeader
          title="Examination Print &amp; Permission Center"
          description="Generate official A4 student permission cards, institutional datesheets, and cohort exam schedules with dynamic school branding."
          icon={Printer}
          badge="Audit Certified"
          actions={
            <Button
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save A4 PDF
            </Button>
          }
        />

        {/* Document Format Switcher Card */}
        <Card className="p-4 border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">Document Type:</span>
              <div className="inline-flex rounded-lg border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setDocumentType('admit_card')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    documentType === 'admit_card' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Student Admit Card
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('timetable_overall')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    documentType === 'timetable_overall' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Overall Datesheet
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('timetable_class')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    documentType === 'timetable_class' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Class-wise Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('timetable_stream')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    documentType === 'timetable_stream' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Stream-wise Schedule
                </button>
              </div>
            </div>

            {/* Target Selectors based on Document Type */}
            <div className="flex items-center gap-3">
              {documentType === 'admit_card' && candidates.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Select Candidate:</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {candidates.map((c: any) => (
                      <option key={c.studentId} value={c.studentId}>
                        {c.name} ({c.className}-{c.sectionName}, Roll #{c.rollNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {documentType === 'timetable_class' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Select Class:</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ALL">All Classes</option>
                    {Array.from(new Set(schedules.map((s: any) => s.classId))).map((clsId: any) => {
                      const sample = schedules.find((s: any) => s.classId === clsId);
                      return (
                        <option key={clsId} value={clsId}>
                          {sample?.className || clsId}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {documentType === 'timetable_stream' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Select Stream:</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ALL">All Streams</option>
                    {distinctStreams.map((stm: any) => (
                      <option key={stm} value={stm}>
                        {stm}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* PRINT CANVAS (A4-Optimized Paper Container)              */}
      {/* ======================================================== */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-xl shadow-md p-8 sm:p-12 mx-auto max-w-[850px] print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* 1. Official School Branding Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="flex items-center justify-center gap-4 mb-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.schoolName} className="h-16 w-16 object-contain" />
            ) : (
              <div className="h-14 w-14 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-xl text-slate-900">
                {branding.schoolName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">{branding.schoolName}</h1>
              <p className="text-xs font-semibold text-slate-700 tracking-wide">
                {branding.campusName} • {branding.address}
              </p>
            </div>
          </div>

          <div className="inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-sm mt-1">
            {documentType === 'admit_card'
              ? 'Student Examination Permission / Admit Card'
              : 'Official Examination Date-Sheet & Timetable'}
          </div>

          <div className="text-xs text-slate-600 font-medium pt-1">
            <span>Academic Session: <strong>{branding.academicSessionName}</strong></span>
            <span className="mx-2">•</span>
            <span>Cycle: <strong>{branding.examName}</strong></span>
          </div>
        </div>

        {/* 2. Admit Card: Student Identity Block */}
        {documentType === 'admit_card' && currentCandidate && (
          <div className="my-6 p-4 border border-slate-300 rounded-md bg-slate-50/60">
            <div className="flex items-start justify-between gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs flex-1">
                <div>
                  <span className="text-slate-500 font-medium block">Student Full Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{currentCandidate.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Admission / Student ID:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{currentCandidate.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Official Roll Number:</span>
                  <span className="font-mono font-black text-slate-900 text-base">#{currentCandidate.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Class &amp; Section:</span>
                  <span className="font-semibold text-slate-900">{currentCandidate.className} — Section {currentCandidate.sectionName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Academic Stream:</span>
                  <span className="font-semibold text-slate-900">{currentCandidate.stream}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Gender:</span>
                  <span className="font-semibold text-slate-900">{currentCandidate.gender}</span>
                </div>
              </div>

              {/* Candidate Photo Box */}
              <div className="h-28 w-24 border-2 border-dashed border-slate-400 rounded bg-white flex flex-col items-center justify-center text-center p-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-medium leading-tight">Affix Verified Student Photo</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Examination Paper Schedule Table */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5 flex items-center justify-between">
            <span>Scheduled Examination Papers</span>
            <span className="text-[11px] font-normal lowercase text-slate-500">
              ({candidateSchedules.length} papers scheduled)
            </span>
          </h3>

          {candidateSchedules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded">
              No examination papers scheduled for this selection.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">Date &amp; Day</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Subject / Paper</th>
                  {documentType !== 'admit_card' && (
                    <th className="py-2.5 px-3 border-r border-slate-300">Class / Section</th>
                  )}
                  <th className="py-2.5 px-3 border-r border-slate-300">Time Window</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Duration</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Reporting</th>
                  <th className="py-2.5 px-3">Room / Hall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {candidateSchedules.map((sch: any) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 border-r border-slate-300 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{sch.examDate}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{sch.dayOfWeek}</div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300">
                      <div className="font-bold text-slate-950">{sch.subjectName}</div>
                      <div className="text-[10px] text-slate-500">{sch.paperName} {sch.subjectCode ? `(${sch.subjectCode})` : ''}</div>
                    </td>
                    {documentType !== 'admit_card' && (
                      <td className="py-2.5 px-3 border-r border-slate-300 font-medium">
                        {sch.className} ({sch.sectionName})
                        {sch.streamId !== 'General' && <span className="block text-[10px] text-slate-500">{sch.streamId}</span>}
                      </td>
                    )}
                    <td className="py-2.5 px-3 border-r border-slate-300 font-mono font-semibold whitespace-nowrap">
                      {sch.startTime} – {sch.endTime}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 whitespace-nowrap">
                      {sch.durationMinutes} mins
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-[11px] text-slate-600">
                      {sch.reportingTime}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {sch.roomNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Persistent Instructions, Advice & Warnings Block */}
        <div className="my-6 border border-slate-300 rounded p-4 space-y-3 bg-slate-50/40 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5 text-slate-700" />
              General Examination Instructions
            </h4>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed pl-5">
              {branding.instructions}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Academic Advice to Candidates
            </h4>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed pl-5">
              {branding.advice}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-red-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5 mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-700" />
              Disciplinary Rules &amp; Prohibitions
            </h4>
            <p className="text-red-900 whitespace-pre-line leading-relaxed pl-5 font-medium">
              {branding.warnings}
            </p>
          </div>
        </div>

        {/* 5. Official Verification Signature Blocks */}
        <div className="pt-12 mt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-10 border-b border-slate-400 mx-6 mb-2" />
            <span className="font-semibold text-slate-800 block">Candidate Signature</span>
            <span className="text-[10px] text-slate-400">Signed in presence of Invigilator</span>
          </div>

          <div>
            <div className="h-10 border-b border-slate-400 mx-6 mb-2" />
            <span className="font-semibold text-slate-800 block">Invigilator Signature</span>
            <span className="text-[10px] text-slate-400">Verification on Date of Exam</span>
          </div>

          <div>
            <div className="h-10 border-b border-slate-400 mx-6 mb-2" />
            <span className="font-bold text-slate-900 block">Controller of Examinations / Principal</span>
            <span className="text-[10px] text-slate-500 font-mono">{branding.schoolName}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
