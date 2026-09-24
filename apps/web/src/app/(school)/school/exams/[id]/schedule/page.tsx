'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  ChevronLeft,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  FileText,
  Save,
  AlertCircle,
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

export default function ExamScheduleBuilderPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = React.useState<any>(null);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isAddSlotOpen, setIsAddSlotOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = React.useState<string | null>(null);

  // Exam Rules State (Instructions, Advice, Warnings)
  const [instructions, setInstructions] = React.useState('');
  const [advice, setAdvice] = React.useState('');
  const [warnings, setWarnings] = React.useState('');
  const [isSavingRules, setIsSavingRules] = React.useState(false);

  // Form State for Adding/Editing Exam Session
  const [selectedPaperId, setSelectedPaperId] = React.useState('');
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedSectionId, setSelectedSectionId] = React.useState('');
  const [selectedStream, setSelectedStream] = React.useState('General');
  const [examDate, setExamDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('11:00');
  const [reportingTime, setReportingTime] = React.useState('08:30');
  const [roomNumber, setRoomNumber] = React.useState('Exam Hall 1');
  const [sessionNotes, setSessionNotes] = React.useState('');
  const [isSubmittingSlot, setIsSubmittingSlot] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [examRes, classesRes] = await Promise.all([
        fetch(`/api/timetable/exam?termId=${examId}`),
        fetch('/api/classes'),
      ]);

      if (!examRes.ok) throw new Error('Failed to load examination schedule');
      const examData = await examRes.json();
      const currentTerm = examData.examTerms?.[0];
      if (!currentTerm) throw new Error('Exam cycle not found');

      setExam(currentTerm);
      setInstructions(currentTerm.instructions || '');
      setAdvice(currentTerm.advice || '');
      setWarnings(currentTerm.warnings || '');

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
        if (classesData.classes?.length > 0) {
          setSelectedClassId(classesData.classes[0].id);
          setSelectedSectionId(classesData.classes[0].sections?.[0]?.id || '');
        }
      }

      if (currentTerm.papers?.length > 0) {
        setSelectedPaperId(currentTerm.papers[0].id);
      }
      if (currentTerm.startDate) {
        setExamDate(currentTerm.startDate.split('T')[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading examination');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived list of all scheduled slots
  const allSchedules = React.useMemo(() => {
    if (!exam?.papers) return [];
    const list: any[] = [];
    exam.papers.forEach((p: any) => {
      (p.schedules || []).forEach((s: any) => {
        list.push({
          ...s,
          paperName: p.name,
          subjectName: p.subject.name,
          subjectCode: p.subject.code,
        });
      });
    });
    return list.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  }, [exam]);

  // Save Exam Instructions / Advice / Warnings
  const handleSaveRules = async () => {
    setIsSavingRules(true);
    try {
      const res = await fetch('/api/timetable/exam', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: examId,
          instructions,
          advice,
          warnings,
        }),
      });
      if (res.ok) {
        setToastMessage('Exam rules and instructions saved for all printouts.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingRules(false);
    }
  };

  // Submit Paper Schedule Slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperId || !selectedClassId || !selectedSectionId || !examDate || !startTime || !endTime) {
      alert('Please fill all required schedule fields.');
      return;
    }

    setIsSubmittingSlot(true);
    setConflictMessage(null);
    try {
      const res = await fetch('/api/timetable/exam/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: selectedPaperId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          streamId: selectedStream !== 'General' ? selectedStream : null,
          examDate,
          startTime,
          endTime,
          reportingTime,
          roomNumber,
          instructions: sessionNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 409 && errorData.conflict) {
          setConflictMessage(errorData.message || 'Exam overlap conflict detected.');
          return;
        }
        throw new Error(errorData.message || 'Failed to save exam schedule slot');
      }

      setIsAddSlotOpen(false);
      setToastMessage('Examination paper scheduled successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this examination session?')) return;
    try {
      const res = await fetch(`/api/timetable/exam/schedule?id=${slotId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setToastMessage('Schedule slot deleted.');
        setTimeout(() => setToastMessage(null), 3000);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-xs text-muted-foreground">Loading examination schedule...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !exam) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-semibold">{error || 'Exam cycle not found'}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/school/exams">Return to Exams</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const currentClassObj = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <PageContainer>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link href={`/school/exams/${examId}`} className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Exam 360 ({exam.name})
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Schedule Builder</span>
      </div>

      <PageHeader
        title={`Exam Date-sheet & Schedule: ${exam.name}`}
        description="Schedule examination papers, set duration and reporting times, and prevent overlapping exam conflicts across cohorts."
        icon={Calendar}
        badge={exam.isPublished ? 'Published' : 'Draft Schedule'}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/school/exams/${examId}/documents`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Print Center</span>
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                setConflictMessage(null);
                setIsAddSlotOpen(true);
              }}
              className="gap-1.5 text-xs h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Paper</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left Column: Scheduled Sessions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Scheduled Examination Papers</h3>
            <Badge variant="outline" className="text-xs">
              {allSchedules.length} Sessions
            </Badge>
          </div>

          {allSchedules.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 border-slate-200">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">No Papers Scheduled Yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Click &quot;Schedule Paper&quot; above to configure dates, session times, and room allocations.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {allSchedules.map((slot: any) => (
                <Card key={slot.id} className="p-4 border-slate-200 hover:border-slate-300 transition-colors shadow-2xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{slot.subjectName}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {slot.className} ({slot.section.name})
                        </Badge>
                        {slot.streamId && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            {slot.streamId}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {slot.examDate.split('T')[0]}
                        </span>
                        <span className="flex items-center gap-1 font-mono font-semibold text-foreground">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {slot.startTime} – {slot.endTime} ({slot.durationMinutes || 120} mins)
                        </span>
                        <span>Hall: {slot.roomNumber || 'Main Hall'}</span>
                        {slot.reportingTime && <span>Reporting: {slot.reportingTime}</span>}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Persistent Exam Rules, Advice & Warnings */}
        <div className="space-y-4">
          <Card className="p-5 border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Persistent Exam Instructions
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                These rules automatically appear on student admit cards and printed timetables.
              </p>
            </div>

            <div className="space-y-3">
              <FormField label="General Instructions">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Bring authorized stationery and arrive 30 mins early..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </FormField>

              <FormField label="Candidate Advice">
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="e.g. Read each question carefully before attempting..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </FormField>

              <FormField label="Disciplinary Warnings">
                <textarea
                  value={warnings}
                  onChange={(e) => setWarnings(e.target.value)}
                  placeholder="e.g. Mobile phones and smartwatches are strictly prohibited..."
                  rows={2}
                  className="w-full rounded-md border border-red-200 bg-red-50/30 p-2.5 text-xs text-red-900 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </FormField>
            </div>

            <Button
              onClick={handleSaveRules}
              disabled={isSavingRules}
              size="sm"
              className="w-full text-xs h-8.5 gap-1.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSavingRules ? 'Saving Rules...' : 'Save Instructions for Prints'}</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Add / Edit Exam Session Modal */}
      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Schedule Examination Paper</DialogTitle>
            <DialogDescription className="text-xs">
              Configure session timings, cohort targeting, and room allocation.
            </DialogDescription>
          </DialogHeader>

          {conflictMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-950">Cohort Exam Overlap Detected</p>
                <p className="mt-0.5">{conflictMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
            <FormField label="Examination Paper" required>
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {exam.papers?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.subject.name})
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Target Class" required>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const cls = classes.find((c) => c.id === e.target.value);
                    if (cls?.sections?.length > 0) setSelectedSectionId(cls.sections[0].id);
                  }}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Section" required>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {currentClassObj?.sections?.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Academic Stream (For Classes 11/12)">
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="General">General / All Streams</option>
                <option value="Science">Science (PCM / PCB)</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Humanities / Arts</option>
              </select>
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Exam Date" required>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </FormField>

              <FormField label="Start Time" required>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </FormField>

              <FormField label="End Time" required>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Reporting Time">
                <Input
                  type="text"
                  placeholder="e.g. 08:30 AM"
                  value={reportingTime}
                  onChange={(e) => setReportingTime(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </FormField>

              <FormField label="Examination Room / Hall">
                <Input
                  type="text"
                  placeholder="e.g. Hall A, Room 102"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </FormField>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddSlotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingSlot} size="sm" className="bg-primary text-white">
                {isSubmittingSlot ? 'Validating Overlaps...' : 'Save Paper Session'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
