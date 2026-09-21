'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import {
  selectActiveSchedule,
  selectTeachingPeriods,
  selectSectionsForClass,
  resolveTeacherName,
  resolveSubjectName,
  resolveClassName,
  resolveSectionName,
  resolveRoomName,
  resolvePeriodDetails,
} from '@/shared/selectors';
import { checkTimetableConflicts, TimetableConflict } from '@/shared/validation/timetable-conflict';
import {
  PeriodSelect,
  ClassSelect,
  SectionSelect,
  SubjectSelect,
  TeacherSelect,
  RoomSelect,
} from '@/shared/entities';
import { TimetablePeriod } from '../types';
import { DayOfWeek } from '@/features/shared/types';

interface TimetableAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  periodToEdit?: TimetablePeriod | null;
  defaultDay?: DayOfWeek;
  defaultPeriodId?: string;
  onSavePeriod?: (period: TimetablePeriod) => void;
}

export function TimetableAddDialog({
  isOpen,
  onClose,
  periodToEdit,
  defaultDay = 'MON',
  defaultPeriodId,
  onSavePeriod,
}: TimetableAddDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <TimetableAddForm
        key={periodToEdit?.id ?? `${defaultDay}-${defaultPeriodId || 'new'}`}
        onClose={onClose}
        periodToEdit={periodToEdit}
        defaultDay={defaultDay}
        defaultPeriodId={defaultPeriodId}
        onSavePeriod={onSavePeriod}
      />
    </Dialog>
  );
}

function TimetableAddForm({
  onClose,
  periodToEdit,
  defaultDay = 'MON',
  defaultPeriodId,
  onSavePeriod,
}: {
  onClose: () => void;
  periodToEdit?: TimetablePeriod | null;
  defaultDay?: DayOfWeek;
  defaultPeriodId?: string;
  onSavePeriod?: (period: TimetablePeriod) => void;
}) {
  const store = useSchoolStore();
  const activeSchedule = selectActiveSchedule(store);
  const teachingPeriods = selectTeachingPeriods(store, activeSchedule?.id);

  // Form State
  const [day, setDay] = React.useState<DayOfWeek>(periodToEdit?.day || defaultDay);
  const [periodId, setPeriodId] = React.useState<string>(() => {
    if (defaultPeriodId) return defaultPeriodId;
    // Find matching period from start time if editing
    if (periodToEdit?.startTime) {
      const match = teachingPeriods.find((b) => b.startTime === periodToEdit.startTime);
      if (match) return match.id;
    }
    return teachingPeriods[0]?.id || 'blk-p1';
  });

  const [classId, setClassId] = React.useState<string>(periodToEdit?.classId || 'cls-10');
  const [sectionId, setSectionId] = React.useState<string>(periodToEdit?.sectionId || 'sec-10-a');
  const [subjectId, setSubjectId] = React.useState<string>(periodToEdit?.subjectId || 'sub-mat-101');
  const [teacherId, setTeacherId] = React.useState<string>(periodToEdit?.teacherId || 'tch-001');
  const [roomId, setRoomId] = React.useState<string>(() => {
    if (periodToEdit?.room) {
      const match = store.rooms.find(
        (r) => r.name.toLowerCase() === periodToEdit.room.toLowerCase() || r.id === periodToEdit.room
      );
      if (match) return match.id;
    }
    return 'rm-204';
  });
  const [notes, setNotes] = React.useState('');

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const validSections = selectSectionsForClass(store, newClassId);
    if (validSections.length > 0 && !validSections.some((s) => s.id === sectionId)) {
      setSectionId(validSections[0].id);
    }
  };

  const validSections = selectSectionsForClass(store, classId);
  const effectiveSectionId = validSections.some((s) => s.id === sectionId)
    ? sectionId
    : (validSections[0]?.id || sectionId);

  // Real-time conflict engine check
  const conflict: TimetableConflict | null = React.useMemo(() => {
    return checkTimetableConflicts(store, {
      day,
      periodId,
      classId,
      sectionId: effectiveSectionId,
      subjectId,
      teacherId,
      roomId,
      excludeEntryId: periodToEdit?.id,
    });
  }, [store, day, periodId, classId, effectiveSectionId, subjectId, teacherId, roomId, periodToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) return;

    const periodDetails = resolvePeriodDetails(store, periodId, activeSchedule?.id);
    const teacherName = resolveTeacherName(store, teacherId);
    const subjectName = resolveSubjectName(store, subjectId);
    const className = resolveClassName(store, classId);
    const sectionName = resolveSectionName(store, classId, effectiveSectionId);
    const roomName = resolveRoomName(store, roomId);

    let savedEntryId = periodToEdit?.id || '';

    // 1. Save to Central Store
    if (periodToEdit) {
      schoolStore.updateTimetableEntry({
        id: periodToEdit.id,
        academicSessionId: store.activeSessionId,
        scheduleId: activeSchedule?.id || 'sch-regular',
        periodId,
        day,
        classId,
        sectionId: effectiveSectionId,
        subjectId,
        teacherId,
        roomId,
        notes,
      });
    } else {
      const created = schoolStore.createTimetableEntry({
        academicSessionId: store.activeSessionId,
        scheduleId: activeSchedule?.id || 'sch-regular',
        periodId,
        day,
        classId,
        sectionId: effectiveSectionId,
        subjectId,
        teacherId,
        roomId,
        notes,
      });
      savedEntryId = created.id;
    }

    // 2. Notify legacy parent callback if provided
    if (onSavePeriod) {
      onSavePeriod({
        id: savedEntryId,
        day,
        startTime: periodDetails.startTime,
        endTime: periodDetails.endTime,
        periodSlot: `${periodDetails.startTime} - ${periodDetails.endTime}`,
        periodIndex: periodDetails.order,
        classId,
        className,
        sectionId,
        sectionName,
        subjectId,
        subjectName,
        teacherId,
        teacherName,
        room: roomName,
      });
    }

    onClose();
  };

  const workingDays = activeSchedule?.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">
              {periodToEdit ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select configured period, class division, subject, teacher and room with real-time collision detection.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {/* Day & Period Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Day of Week" required>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {workingDays.map((d) => (
                <option key={d} value={d}>
                  {d === 'MON' ? 'Monday' : d === 'TUE' ? 'Tuesday' : d === 'WED' ? 'Wednesday' : d === 'THU' ? 'Thursday' : d === 'FRI' ? 'Friday' : d === 'SAT' ? 'Saturday' : 'Sunday'}
                </option>
              ))}
            </select>
          </FormField>

          <PeriodSelect
            value={periodId}
            onChange={(id) => setPeriodId(id)}
            required
            showTimeBadge={true}
          />
        </div>

        {/* Class & Section (Cascading!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ClassSelect
            value={classId}
            onChange={handleClassChange}
            required
          />

          <SectionSelect
            value={effectiveSectionId}
            onChange={(id) => setSectionId(id)}
            classId={classId}
            required
          />
        </div>

        {/* Subject & Teacher (Prioritizing!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SubjectSelect
            value={subjectId}
            onChange={(id) => setSubjectId(id)}
            classId={classId}
            required
          />

          <TeacherSelect
            value={teacherId}
            onChange={(id) => setTeacherId(id)}
            subjectId={subjectId}
            required
          />
        </div>

        {/* Room / Lab Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RoomSelect
            value={roomId}
            onChange={(id) => setRoomId(id)}
            label="Classroom / Laboratory"
            required
          />

          <FormField label="Internal Notes / Syllabus Topic">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chapter 4 Quiz / Lab Practical"
              className="h-8.5 text-xs"
            />
          </FormField>
        </div>

        {/* Conflict Detection Status Banner */}
        <div className="pt-1">
          {conflict ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2.5 text-xs text-destructive animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">Collision Conflict Detected</h5>
                <p className="text-[11px] mt-0.5">{conflict.message}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">All conflict constraints verified clean. Ready to schedule.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={Boolean(conflict)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50 cursor-pointer"
          >
            {periodToEdit ? 'Update Period' : 'Add to Timetable'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
