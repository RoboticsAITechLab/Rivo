'use client';

import * as React from 'react';
import {
  Award,
  Calendar,
  Printer,
  ChevronDown,
  RefreshCw,
  Building,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Child {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  campus?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
}

interface SubjectResult {
  id: string;
  marksObtained: number | null;
  maxMarks: number;
  passingMarks: number;
  grade: string | null;
  status: string;
  remarks?: string | null;
  subject?: { id: string; name: string; code?: string | null };
}

interface MarksheetData {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    campus?: { name: string; city?: string | null };
    school?: { name: string };
  };
  results: Array<{
    id: string;
    totalMarks: number;
    maxTotalMarks: number;
    percentage: number;
    grade: string | null;
    overallStatus: 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD';
    publishedAt: string;
    examTerm: { id: string; name: string; code?: string | null };
    class: { name: string };
    section: { name: string };
    academicSession: { name: string };
    subjectResults: SubjectResult[];
  }>;
}

export default function ParentResultsPage() {
  const [activeChild, setActiveChild] = React.useState<Child | null>(null);
  const [marksheetData, setMarksheetData] = React.useState<MarksheetData | null>(null);
  const [selectedExamTermId, setSelectedExamTermId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  const loadResults = React.useCallback(async (childId?: string) => {
    setIsLoading(true);
    try {
      // 1. Get Children
      const childRes = await fetch('/api/parent/children');
      if (!childRes.ok) return;
      const cData = await childRes.json();
      const children = cData.children || [];
      const savedChildId = childId || localStorage.getItem('rivo_parent_selected_child');
      const current = children.find((c: Child) => c.id === savedChildId) || children[0] || null;
      setActiveChild(current);

      if (current) {
        const res = await fetch(`/api/results/student/${current.id}`);
        if (res.ok) {
          const data = await res.json();
          setMarksheetData(data);
          const results = data.results || [];
          if (results.length > 0 && !selectedExamTermId) {
            setSelectedExamTermId(results[0].examTerm.id);
          }
        } else {
          setMarksheetData(null);
        }
      }
    } catch (err) {
      console.error('Failed to load marksheet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamTermId]);

  React.useEffect(() => {
    loadResults();

    const handleSwitch = (e: any) => {
      loadResults(e.detail?.childId);
    };
    window.addEventListener('parentChildSwitched', handleSwitch);
    return () => window.removeEventListener('parentChildSwitched', handleSwitch);
  }, [loadResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No linked student profile found"
        description="Your parent account is not currently linked to any enrolled student."
      />
    );
  }

  const results = marksheetData?.results || [];

  if (results.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-base font-bold text-foreground">Examination Marksheets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Published term transcripts and official grade evaluation cards.
          </p>
        </div>
        <EmptyState
          icon={Award}
          title="No published examination results"
          description="Evaluation results for this student have not been published by the administration yet. Check back soon."
        />
      </div>
    );
  }

  const activeResult = results.find((r) => r.examTerm.id === selectedExamTermId) || results[0];

  return (
    <div className="space-y-4">
      {/* Header and Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-foreground">Official Examination Marksheet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified academic performance record for {activeChild.firstName} {activeChild.lastName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {results.length > 1 && (
            <select
              value={activeResult.examTerm.id}
              onChange={(e) => setSelectedExamTermId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold"
            >
              {results.map((r) => (
                <option key={r.examTerm.id} value={r.examTerm.id}>
                  {r.examTerm.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            Print Marksheet
          </Button>
        </div>
      </div>

      {/* Official Marksheet Document Card */}
      <Card className="p-5 border-2 shadow-sm print:border-none print:shadow-none bg-background">
        {/* Institutional Branding */}
        <div className="text-center pb-4 border-b">
          <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
            {marksheetData?.student.school?.name || 'Rivo Institutional Academy'}
          </h2>
          {marksheetData?.student.campus && (
            <div className="text-xs text-muted-foreground">
              {marksheetData.student.campus.name}
              {marksheetData.student.campus.city ? `, ${marksheetData.student.campus.city}` : ''}
            </div>
          )}
          <div className="text-xs font-semibold text-primary mt-1 uppercase tracking-wide">
            {activeResult.examTerm.name} — Academic Report Card
          </div>
          <div className="text-[10px] text-muted-foreground">
            Academic Session: {activeResult.academicSession.name}
          </div>
        </div>

        {/* Student Profile Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b text-xs">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Student Name</div>
            <div className="font-bold text-foreground">
              {activeChild.firstName} {activeChild.lastName}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Admission No.</div>
            <div className="font-mono font-bold text-foreground">
              {activeChild.admissionNumber}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Class &amp; Section</div>
            <div className="font-bold text-foreground">
              {activeResult.class.name} - {activeResult.section.name}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Published Date</div>
            <div className="text-foreground">
              {new Date(activeResult.publishedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Subjects Tabulation */}
        <div className="py-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-[10px] uppercase text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Max Marks</th>
                <th className="py-2.5 px-3 text-center">Pass Marks</th>
                <th className="py-2.5 px-3 text-center font-bold">Marks Scored</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {activeResult.subjectResults?.map((sr) => (
                <tr key={sr.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {sr.subject?.name || 'Subject'}
                    {sr.subject?.code ? (
                      <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                        ({sr.subject.code})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {sr.maxMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {sr.passingMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                    {sr.marksObtained !== null ? sr.marksObtained : 'AB'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {sr.grade || '—'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-bold text-[11px] ${
                        sr.status === 'PASS'
                          ? 'text-emerald-600'
                          : sr.status === 'ABSENT'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {sr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Aggregated Performance Footer */}
        <div className="mt-2 p-4 rounded-lg bg-muted/40 border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Aggregate Score</div>
            <div className="text-base font-bold font-mono">
              {activeResult.totalMarks} / {activeResult.maxTotalMarks}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Percentage</div>
            <div className="text-base font-bold font-mono text-primary">
              {activeResult.percentage}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Cumulative Grade</div>
            <div className="text-base font-bold font-mono">
              {activeResult.grade || '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Final Standing</div>
            <div className="mt-0.5">
              <Badge
                variant={
                  activeResult.overallStatus === 'PASS'
                    ? 'default'
                    : activeResult.overallStatus === 'COMPARTMENT'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {activeResult.overallStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Signatures Row */}
        <div className="grid grid-cols-3 gap-8 pt-10 text-center text-xs text-muted-foreground">
          <div className="border-t pt-1">Class Teacher</div>
          <div className="border-t pt-1">Controller of Examinations</div>
          <div className="border-t pt-1">Principal</div>
        </div>
      </Card>
    </div>
  );
}
