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
  selectCampuses,
  selectStreams,
  selectClasses,
} from '@/shared/selectors';
import {
  detectExamScheduleConflicts,
} from '@/shared/validation/exam-conflict-detector';
import { ExamScheduleEntry, ExamPaper, Campus, SchoolClass, Stream } from '@/shared/types';
import { cn } from '@/lib/utils';

export default function ExamScheduleBuilderPage() {
  const params = useParams();
  const examId = params.id as string;
  const store = useSchoolStore();

  const exam = selectExamById(store, examId);
  const papers = selectExamPapers(store, examId);
  const schedule = selectExamSchedule(store, examId);
  const campuses = selectCampuses(store);
  const streams = selectStreams(store);
  const classes = selectClasses(store);

  const [isAddSlotOpen, setIsAddSlotOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Real-time schedule conflicts
  const conflicts = React.useMemo(() => {
    return detectExamScheduleConflicts(store, schedule);
  }, [store, schedule]);

  // Group schedule entries by date
  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, ExamScheduleEntry[]>();
    schedule.forEach((entry) => {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [schedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!exam) {
    return (
      <PageContainer>
        <div className="py-20 text-center">
          <p className="text-xs text-muted-foreground">Exam cycle not found.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/school/exams/${exam.id}`} className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            Exam 360 ({exam.name})
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Schedule Builder</span>
        </div>

        <PageHeader
          title="Exam Schedule Builder"
          description={`Configure multi-paper shifts, room allocation, and stream timetables for ${exam.name}.`}
          icon={Calendar}
          badge={`${schedule.length} Slots`}
          actions={
            <Button
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-primary text-primary-foreground"
              onClick={() => setIsAddSlotOpen(true)}
              disabled={papers.length === 0}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Schedule Timeslot
            </Button>
          }
        />
      </div>

      {toastMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Conflict Warning Box if any conflicts detected */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{conflicts.length} Operational Conflicts Detected in Timetable</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {conflicts.map((c) => (
              <div key={c.id} className="p-2.5 rounded bg-background/80 border border-rose-200 dark:border-rose-800 flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-rose-600 block">{c.title}</span>
                  <p className="text-[11px] text-muted-foreground">{c.description}</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                    <strong>Suggestion:</strong> {c.suggestion}
                  </p>
                </div>
                <Badge variant="destructive" className="text-[9px] shrink-0">
                  {c.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Grouped Schedule View (Multi-exam per day) */}
      <div className="space-y-4 pt-1">
        {groupedByDate.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs">No exam slots scheduled yet.</p>
            <p className="text-[11px] text-muted-foreground">
              Click &ldquo;Add Schedule Timeslot&rdquo; to build morning and afternoon shifts.
            </p>
          </Card>
        ) : (
          groupedByDate.map(([date, entries]) => (
            <Card key={date} className="overflow-hidden border">
              <div className="bg-muted/40 px-3.5 py-2 border-b flex items-center justify-between text-xs">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="font-mono text-muted-foreground">({date})</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {entries.length} {entries.length === 1 ? 'Exam Shift' : 'Exam Shifts (Multi-Paper Day)'}
                </Badge>
              </div>

              <div className="divide-y divide-border">
                {entries.map((slot) => {
                  const paper = papers.find((p) => p.id === slot.paperId);
                  const subject = store.subjects.find((s) => s.id === paper?.subjectId);
                  const classLabels = slot.classIds.map((c: string) => c.replace('cls-', 'Class ')).join(', ');
                  const streamLabels = slot.streamIds
                    ?.map((id: string) => streams.find((s) => s.id === id)?.code || id)
                    .join(', ');

                  return (
                    <div key={slot.id} className="p-3 hover:bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-24 rounded bg-primary/10 border border-primary/20 text-primary font-mono font-bold flex items-center justify-center shrink-0">
                          {slot.startTime}–{slot.endTime}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>{subject?.name || 'Subject'}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {paper?.paperCode}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Classes: <strong className="text-foreground">{classLabels}</strong></span>
                            {streamLabels && (
                              <Badge variant="secondary" className="text-[9px]">
                                {streamLabels}
                              </Badge>
                            )}
                            <span>• Room: {slot.room}</span>
                            <span>• {slot.campusIds.length} Campuses</span>
                          </div>
                          {slot.instructions && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">
                              Note: {slot.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            schoolStore.deleteExamScheduleEntry(slot.id);
                            showToast('Exam slot removed.');
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 3. Add Slot Dialog */}
      {isAddSlotOpen && (
        <AddSlotDialog
          examId={exam.id}
          papers={papers}
          campuses={campuses}
          classes={classes}
          streams={streams}
          existingSchedule={schedule}
          isOpen={isAddSlotOpen}
          onClose={() => setIsAddSlotOpen(false)}
          onSuccess={() => {
            setIsAddSlotOpen(false);
            showToast('New exam slot added to timetable.');
          }}
        />
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// ADD SLOT DIALOG WITH LIVE CONFLICT DETECTION PREVIEW
// ---------------------------------------------------------------------------
function AddSlotDialog({
  examId,
  papers,
  campuses,
  classes,
  streams,
  existingSchedule,
  isOpen,
  onClose,
  onSuccess,
}: {
  examId: string;
  papers: ExamPaper[];
  campuses: Campus[];
  classes: SchoolClass[];
  streams: Stream[];
  existingSchedule: ExamScheduleEntry[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entry: ExamScheduleEntry) => void;
}) {
  const store = useSchoolStore();
  const [paperId, setPaperId] = React.useState<string>(papers[0]?.id || '');
  const [date, setDate] = React.useState('2025-09-16');
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('12:00');
  const [room, setRoom] = React.useState('Examination Hall 1');
  const [instructions, setInstructions] = React.useState('Standard stationery and admit card mandatory.');
  const [selectedCampusIds, setSelectedCampusIds] = React.useState<string[]>(campuses.map((c) => c.id));
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>(['cls-10']);
  const [selectedStreamIds, setSelectedStreamIds] = React.useState<string[]>([]);

  // Live conflict preview
  const previewConflicts = React.useMemo(() => {
    return detectExamScheduleConflicts(store, existingSchedule, {
      id: 'candidate-new',
      examId,
      paperId,
      date,
      startTime,
      endTime,
      campusIds: selectedCampusIds,
      classIds: selectedClassIds,
      streamIds: selectedStreamIds,
      room,
    });
  }, [store, existingSchedule, examId, paperId, date, startTime, endTime, selectedCampusIds, selectedClassIds, selectedStreamIds, room]);

  const handleSubmit = () => {
    if (!paperId || !date || !startTime || !endTime) return;

    const newEntry = schoolStore.createExamScheduleEntry({
      examId,
      paperId,
      date,
      startTime,
      endTime,
      campusIds: selectedCampusIds,
      classIds: selectedClassIds,
      streamIds: selectedStreamIds.length > 0 ? selectedStreamIds : undefined,
      room,
      instructions,
    });

    onSuccess(newEntry);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Add Examination Timeslot</DialogTitle>
              <DialogDescription className="text-xs">
                Schedule a morning or afternoon paper session with live conflict detection.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-2 text-xs">
          <FormField label="Curriculum Paper" required>
            <select
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
            >
              {papers.map((p) => {
                const subj = store.subjects.find((s) => s.id === p.subjectId);
                return (
                  <option key={p.id} value={p.id}>
                    {subj?.name} ({p.paperCode}) — Max {p.maxMarks}m
                  </option>
                );
              })}
            </select>
          </FormField>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Exam Date" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8.5 text-xs font-mono" />
            </FormField>
            <FormField label="Start Time" required>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8.5 text-xs font-mono" />
            </FormField>
            <FormField label="End Time" required>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8.5 text-xs font-mono" />
            </FormField>
          </div>

          <FormField label="Examination Room / Hall" required>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Hall 1 or Auditorium" className="h-8.5 text-xs" />
          </FormField>

          <FormField label="Candidate Instructions">
            <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Stationery, timings, reporting notes" className="h-8.5 text-xs" />
          </FormField>

          <div className="p-2.5 rounded border bg-muted/20 space-y-2">
            <span className="font-semibold text-[11px] block">Applicable Campus Sites</span>
            <div className="flex flex-wrap gap-2">
              {campuses.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCampusIds.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCampusIds([...selectedCampusIds, c.id]);
                      else setSelectedCampusIds(selectedCampusIds.filter((id) => id !== c.id));
                    }}
                    className="rounded h-3.5 w-3.5"
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded border bg-muted/20 space-y-2">
            <span className="font-semibold text-[11px] block">Applicable Class Cohort</span>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClassIds.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedClassIds([...selectedClassIds, c.id]);
                      else setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id));
                    }}
                    className="rounded h-3.5 w-3.5"
                  />
                  <span>{c.className}</span>
                </label>
              ))}
            </div>
          </div>

          {/* If class 11 or 12 selected, show stream option */}
          {(selectedClassIds.includes('cls-11') || selectedClassIds.includes('cls-12')) && (
            <div className="p-2.5 rounded border bg-indigo-500/10 border-indigo-500/20 space-y-1.5">
              <span className="font-semibold text-[11px] text-indigo-950 dark:text-indigo-200 block">
                Stream Specialization (Optional)
              </span>
              <div className="flex flex-wrap gap-2">
                {streams.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStreamIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStreamIds([...selectedStreamIds, s.id]);
                        else setSelectedStreamIds(selectedStreamIds.filter((id) => id !== s.id));
                      }}
                      className="rounded h-3.5 w-3.5"
                    />
                    <span>{s.name} ({s.code})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Live conflict warnings preview */}
          {previewConflicts.length > 0 && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Conflict Detected With Current Settings</span>
              </div>
              <p className="text-[11px]">{previewConflicts[0].description}</p>
            </div>
          )}

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className={cn('text-xs text-white', previewConflicts.length > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary')}
              onClick={handleSubmit}
            >
              {previewConflicts.length > 0 ? 'Schedule Anyway' : 'Commit Slot to Timetable'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
