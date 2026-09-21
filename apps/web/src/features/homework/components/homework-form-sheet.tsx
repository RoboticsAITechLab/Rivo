'use client';

import * as React from 'react';
import { HomeworkItem, HomeworkAttachment } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import {
  selectStudentsForClassSection,
  selectClassById,
  selectSectionById,
  selectSubjectById,
  selectTeacherById,
} from '@/shared/selectors';
import {
  SubjectSelect,
  ClassSelect,
  SectionSelect,
  TeacherSelect,
} from '@/shared/entities';
import { AlertTriangle, Paperclip, Plus, Trash2, Send, Save, Users } from 'lucide-react';

interface HomeworkFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  homeworkToEdit?: HomeworkItem | null;
  onSave: (homework: HomeworkItem, isPublish: boolean) => void;
}

export function HomeworkFormSheet({
  isOpen,
  onClose,
  homeworkToEdit,
  onSave,
}: HomeworkFormSheetProps) {
  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col">
        <HomeworkFormContent
          key={homeworkToEdit?.id ?? 'new'}
          onClose={onClose}
          homeworkToEdit={homeworkToEdit}
          onSave={onSave}
        />
      </SheetContent>
    </Sheet>
  );
}

function HomeworkFormContent({
  onClose,
  homeworkToEdit,
  onSave,
}: {
  onClose: () => void;
  homeworkToEdit?: HomeworkItem | null;
  onSave: (homework: HomeworkItem, isPublish: boolean) => void;
}) {
  const store = useSchoolStore();

  const [title, setTitle] = React.useState(homeworkToEdit?.title || '');
  const [description, setDescription] = React.useState(homeworkToEdit?.description || '');
  const [subjectId, setSubjectId] = React.useState(homeworkToEdit?.subjectId || 'sub-mat-101');
  const [classId, setClassId] = React.useState(homeworkToEdit?.classId || 'cls-10');
  const [sectionId, setSectionId] = React.useState(homeworkToEdit?.sectionId || 'sec-10-a');
  const [teacherId, setTeacherId] = React.useState(homeworkToEdit?.teacherId || 'tch-001');
  const [dueDate, setDueDate] = React.useState(homeworkToEdit?.dueDate || '2026-09-25');
  const [priority, setPriority] = React.useState<'LOW' | 'NORMAL' | 'HIGH'>(homeworkToEdit?.priority || 'NORMAL');
  const [notifyStudents, setNotifyStudents] = React.useState(homeworkToEdit?.notifyStudents ?? true);
  const [attachments, setAttachments] = React.useState<HomeworkAttachment[]>(() => homeworkToEdit?.attachments || []);
  const [newAttachmentName, setNewAttachmentName] = React.useState('');

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const safeErrors = errors || {};

  // Infer enrolled students from Class + Section
  const enrolledStudents = selectStudentsForClassSection(store, classId, sectionId);
  const selectedClass = selectClassById(store, classId);
  const selectedSection = selectSectionById(store, classId, sectionId);
  const selectedSubject = selectSubjectById(store, subjectId);
  const selectedTeacher = selectTeacherById(store, teacherId);

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const item: HomeworkAttachment = {
      id: `att-${Date.now()}`,
      name: newAttachmentName.trim(),
      size: '1.2 MB',
      type: 'application/pdf',
    };
    setAttachments((prev) => [...prev, item]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (publish: boolean) => {
    const errs: { [key: string]: string } = {};
    if (!title.trim() || title.length < 3) errs.title = 'Title must be at least 3 characters';
    if (!description.trim() || description.length < 10) errs.description = 'Description must be at least 10 characters';
    if (!dueDate) errs.dueDate = 'Due date is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: HomeworkItem = {
      id: homeworkToEdit?.id || `hw-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      subjectId,
      subjectName: selectedSubject?.name || 'Subject',
      classId,
      className: selectedClass?.className || 'Class 10',
      sectionId,
      sectionName: selectedSection?.name || 'A',
      teacherId,
      teacherName: selectedTeacher ? `${selectedTeacher.personal.firstName} ${selectedTeacher.personal.lastName}` : 'Teacher',
      assignedDate: homeworkToEdit?.assignedDate || '2026-09-19',
      dueDate,
      status: publish ? 'PUBLISHED' : (homeworkToEdit?.status || 'DRAFT'),
      priority,
      notifyStudents,
      attachments,
      totalStudents: enrolledStudents.length || homeworkToEdit?.totalStudents || 40,
      completedCount: homeworkToEdit?.completedCount || 0,
      pendingCount: enrolledStudents.length || homeworkToEdit?.pendingCount || 40,
      overdueCount: homeworkToEdit?.overdueCount || 0,
      createdAt: homeworkToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(payload, publish);
  };

  return (
    <>
      <SheetHeader className="p-6 border-b bg-card">
        <SheetTitle className="text-xl font-bold text-foreground">
          {homeworkToEdit ? 'Edit Homework Assignment' : 'Create New Assignment'}
        </SheetTitle>
        <SheetDescription className="text-xs text-muted-foreground">
          {homeworkToEdit
            ? 'Update assignment details, problem sets, and submission parameters.'
            : 'Draft or publish a homework assignment for your student cohorts.'}
        </SheetDescription>
      </SheetHeader>

      <div className="p-6 space-y-5 flex-1">
        {/* Published Edit Warning Banner */}
        {homeworkToEdit?.status === 'PUBLISHED' && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Active Assignment Notice: </span>
              <span>
                This homework is already published. Modifying the description or deadlines will notify students with updated instructions.
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Core Details */}
        <FormSection title="Assignment Information" description="Headline title and student instructions.">
          <div className="space-y-3.5">
            <FormField label="Assignment Title" required error={safeErrors.title}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Quadratic Equations Problem Set"
                className="text-xs"
              />
            </FormField>

            <FormField label="Instructions & Problem List" required error={safeErrors.description}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe questions, textbook page references, method instructions..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Section 2: Course & Target Cohort with Reusable Entities */}
        <FormSection title="Cohort & Faculty Allocation" description="Assign curriculum subject, class division, and teacher.">
          <div className="space-y-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClassSelect
                value={classId}
                onChange={(id) => setClassId(id)}
                required
              />

              <SectionSelect
                value={sectionId}
                onChange={(id) => setSectionId(id)}
                classId={classId}
                required
              />
            </div>

            {/* Requirement 23: Automatic Student Inference */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs text-foreground">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{enrolledStudents.length} Students Inferred</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600">
                      Automatic Recipients
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Flowing from {selectedClass?.className || 'Class'} • Section {selectedSection?.name || 'A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Timeline & Priority */}
        <FormSection title="Submission Deadlines" description="Due dates, turnaround, and delivery settings.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Due Date" required error={safeErrors.dueDate}>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <FormField label="Priority / Urgency">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'NORMAL' | 'HIGH')}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH (Immediate Review)</option>
                <option value="LOW">LOW (Extended Reading)</option>
              </select>
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="notify-students-check"
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="notify-students-check" className="text-xs text-foreground cursor-pointer">
              Send instant homework alert notification to all {enrolledStudents.length} student portals
            </label>
          </div>
        </FormSection>

        {/* Section 4: Attachments */}
        <FormSection title="Reference Materials" description="Attach worksheet PDFs or rubrics.">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="Worksheet_Chapter_4.pdf"
                className="text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttachment}
                disabled={!newAttachmentName.trim()}
                className="gap-1.5 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add File
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{att.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">({att.size})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveAttachment(att.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>
      </div>

      {/* Footer Sticky Action Bar */}
      <div className="p-4 border-t bg-card flex items-center justify-between gap-2 mt-auto">
        <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(false)}
            className="gap-1.5 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            Save as Draft
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-3.5 w-3.5" />
            Publish Assignment
          </Button>
        </div>
      </div>
    </>
  );
}
