'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Clock, CheckCircle2 } from 'lucide-react';
import { TimetablePeriod } from '../types';
import { DayOfWeek } from '@/features/shared/types';
import { ScheduleBlock } from '@/shared/types';
import { TimetableClass, TimetableTeacher, TimetableSubject, DEFAULT_SCHEDULE_BLOCKS, DEFAULT_WORKING_DAYS } from '../hooks/use-timetable';

interface TimetableAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classes: TimetableClass[];
  teachers: TimetableTeacher[];
  subjects: TimetableSubject[];
  scheduleBlocks?: ScheduleBlock[];
  workingDays?: DayOfWeek[];
  periodToEdit?: TimetablePeriod | null;
  defaultDay?: DayOfWeek;
  defaultPeriodId?: string;
  onSavePeriod: (payload: {
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
  }) => Promise<any>;
}

export function TimetableAddDialog({
  isOpen,
  onClose,
  classes,
  teachers,
  subjects,
  scheduleBlocks = DEFAULT_SCHEDULE_BLOCKS,
  workingDays = DEFAULT_WORKING_DAYS,
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
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        scheduleBlocks={scheduleBlocks}
        workingDays={workingDays}
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
  classes,
  teachers,
  subjects,
  scheduleBlocks,
  workingDays,
  periodToEdit,
  defaultDay = 'MON',
  defaultPeriodId,
  onSavePeriod,
}: {
  onClose: () => void;
  classes: TimetableClass[];
  teachers: TimetableTeacher[];
  subjects: TimetableSubject[];
  scheduleBlocks: ScheduleBlock[];
  workingDays: DayOfWeek[];
  periodToEdit?: TimetablePeriod | null;
  defaultDay?: DayOfWeek;
  defaultPeriodId?: string;
  onSavePeriod: (payload: {
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
  }) => Promise<any>;
}) {
  const teachingBlocks = React.useMemo(() => {
    return scheduleBlocks.filter((b) => b.type === 'TEACHING');
  }, [scheduleBlocks]);

  const [day, setDay] = React.useState<DayOfWeek>(periodToEdit?.day || defaultDay);
  const [blockId, setBlockId] = React.useState<string>(() => {
    if (defaultPeriodId) return defaultPeriodId;
    if (periodToEdit?.startTime) {
      const match = teachingBlocks.find((b) => b.startTime === periodToEdit.startTime);
      if (match) return match.id;
    }
    return teachingBlocks[0]?.id || '';
  });

  const [classId, setClassId] = React.useState<string>(() => {
    if (periodToEdit?.classId) return periodToEdit.classId;
    return classes[0]?.id || '';
  });

  const currentClass = classes.find((c) => c.id === classId) || classes[0];

  const [sectionId, setSectionId] = React.useState<string>(() => {
    if (periodToEdit?.sectionId) return periodToEdit.sectionId;
    return currentClass?.sections[0]?.id || '';
  });

  const [subjectId, setSubjectId] = React.useState<string>(() => {
    if (periodToEdit?.subjectId) return periodToEdit.subjectId;
    return subjects[0]?.id || '';
  });

  const [teacherId, setTeacherId] = React.useState<string>(() => {
    if (periodToEdit?.teacherId) return periodToEdit.teacherId;
    return teachers[0]?.id || '';
  });

  const [roomNumber, setRoomNumber] = React.useState<string>(periodToEdit?.room || 'Room 204');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const cls = classes.find((c) => c.id === newClassId);
    if (cls && cls.sections.length > 0) {
      setSectionId(cls.sections[0].id);
    } else {
      setSectionId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !sectionId || !subjectId || !teacherId) {
      setFormError('Please select class, section, subject, and teacher.');
      return;
    }

    const selectedBlock = teachingBlocks.find((b) => b.id === blockId) || teachingBlocks[0];
    if (!selectedBlock) {
      setFormError('Please select a valid period.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onSavePeriod({
        classId,
        sectionId,
        subjectId,
        teacherId,
        dayOfWeek: day,
        periodNumber: selectedBlock.order,
        startTime: selectedBlock.startTime,
        endTime: selectedBlock.endTime,
        roomNumber: roomNumber.trim() || 'Standard Classroom',
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save timetable slot');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Assign period slot, class division, subject, faculty and classroom.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {formError && (
          <div className="p-3 text-xs bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 rounded-lg">
            {formError}
          </div>
        )}

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

          <FormField label="Schedule Period" required>
            <select
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {teachingBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.startTime} - {b.endTime})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Class & Section (Cascading) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Class" required>
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Grade {c.gradeLevel})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Section" required>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(!currentClass || currentClass.sections.length === 0) && (
                <option value="">No sections available</option>
              )}
              {currentClass?.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Subject & Teacher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Subject" required>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {subjects.length === 0 && <option value="">No subjects found</option>}
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Faculty In-Charge" required>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {teachers.length === 0 && <option value="">No teachers found</option>}
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Room / Lab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Room / Laboratory" required>
            <Input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Room 204 or Science Lab"
              className="h-8.5 text-xs"
            />
          </FormField>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Direct database synchronization enabled for active session.</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || classes.length === 0 || teachers.length === 0 || subjects.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : periodToEdit ? 'Update Period' : 'Add to Timetable'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
