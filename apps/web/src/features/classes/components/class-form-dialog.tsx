'use client';

import * as React from 'react';
import { ClassItem, SectionItem } from '../types';
import { validateClassForm, ClassValidationErrors } from '../validation/class-schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Plus, X, Layers } from 'lucide-react';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { selectTeachers, resolveTeacherName } from '@/shared/selectors';
import { TeacherSelect } from '@/shared/entities';

interface ClassFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit?: ClassItem | null;
  existingClasses: ClassItem[];
  onSaveClass: (classItem: ClassItem) => void;
}

export function ClassFormDialog({
  isOpen,
  onClose,
  classToEdit,
  existingClasses,
  onSaveClass,
}: ClassFormDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ClassFormContent
        key={classToEdit?.id ?? 'new'}
        onClose={onClose}
        classToEdit={classToEdit}
        existingClasses={existingClasses}
        onSaveClass={onSaveClass}
      />
    </Dialog>
  );
}

function ClassFormContent({
  onClose,
  classToEdit,
  existingClasses,
  onSaveClass,
}: {
  onClose: () => void;
  classToEdit?: ClassItem | null;
  existingClasses: ClassItem[];
  onSaveClass: (classItem: ClassItem) => void;
}) {
  const store = useSchoolStore();
  const teachers = selectTeachers(store);

  const [session] = React.useState(classToEdit?.academicSession || '2025-26');
  const [className, setClassName] = React.useState(classToEdit?.className || '');
  const [displayName, setDisplayName] = React.useState(classToEdit?.displayName || '');
  const [primaryTeacherId, setPrimaryTeacherId] = React.useState<string>(() => {
    if (classToEdit?.primaryClassTeacher) {
      const match = teachers.find(
        (t) => `${t.personal.firstName} ${t.personal.lastName}`.toLowerCase() === classToEdit.primaryClassTeacher.toLowerCase()
      );
      if (match) return match.id;
    }
    return teachers[0]?.id || 'tch-001';
  });
  const status: 'ACTIVE' | 'ARCHIVED' = classToEdit?.status || 'ACTIVE';

  // Dynamic sections state
  const [sections, setSections] = React.useState<{ name: string; teacherId: string }[]>(() =>
    classToEdit?.sections.map((s) => ({
      name: s.name,
      teacherId: s.classTeacherId || 'tch-001',
    })) || [
      { name: 'A', teacherId: 'tch-001' },
      { name: 'B', teacherId: teachers[1]?.id || 'tch-002' },
    ]
  );

  const [newSectionInput, setNewSectionInput] = React.useState('');
  const [errors, setErrors] = React.useState<ClassValidationErrors>({});
  const safeErrors = errors || {};

  const handleAddSection = () => {
    if (!newSectionInput.trim()) return;
    const name = newSectionInput.trim().toUpperCase();
    if (sections.some((s) => s.name === name)) {
      setErrors((prev) => ({ ...(prev || {}), sections: `Section "${name}" already exists.` }));
      return;
    }
    const defaultTeacher = teachers[sections.length % (teachers.length || 1)];
    const teacherId = defaultTeacher?.id || 'tch-001';

    setSections((prev) => [...prev, { name, teacherId }]);
    setNewSectionInput('');
    setErrors((prev) => {
      const next = { ...(prev || {}) };
      delete next.sections;
      return next;
    });
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      setErrors((prev) => ({ ...(prev || {}), sections: 'A class must have at least one section.' }));
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSectionTeacherChange = (index: number, teacherId: string) => {
    setSections((prev) =>
      prev.map((sec, i) => (i === index ? { ...sec, teacherId } : sec))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateClassForm(
      {
        academicSession: session,
        className,
        sections: sections.map((s) => ({ name: s.name })),
      },
      existingClasses,
      classToEdit?.id
    ) || {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const leadTeacherName = resolveTeacherName(store, primaryTeacherId);

    const sectionsPayload: SectionItem[] = sections.map((sec, idx) => {
      const existingSec = classToEdit?.sections.find((s) => s.name === sec.name);
      return {
        id: existingSec?.id || `sec-${Math.random().toString(36).substring(2, 9)}-${idx}`,
        name: sec.name,
        roomNumber: existingSec?.roomNumber || `Room 20${idx + 1}`,
        classTeacherId: sec.teacherId,
        classTeacherName: resolveTeacherName(store, sec.teacherId),
        studentCount: existingSec?.studentCount || 42,
        subjectsCount: existingSec?.subjectsCount || 6,
        attendanceRate: existingSec?.attendanceRate || 94.2,
      };
    });

    const numericGrade = parseInt(className.replace(/\D/g, ''), 10) || 10;
    const totalStudents = sectionsPayload.reduce((acc, s) => acc + s.studentCount, 0);

    const classId = classToEdit?.id || `cls-${Math.random().toString(36).substring(2, 9)}`;

    const updatedItem: ClassItem = {
      id: classId,
      academicSession: session,
      className,
      displayName: displayName || `${className} General`,
      gradeLevel: numericGrade,
      status,
      primaryClassTeacher: leadTeacherName,
      totalStudents,
      totalSections: sectionsPayload.length,
      sections: sectionsPayload,
      createdAt: classToEdit?.createdAt || new Date().toISOString(),
    };

    // Also persist into central relational store
    if (classToEdit) {
      schoolStore.updateClass({
        id: classId,
        className,
        displayName: displayName || className,
        gradeLevel: `Grade ${numericGrade}`,
        academicSessionId: store.activeSessionId,
        primaryClassTeacherId: primaryTeacherId,
        status,
        sections: sectionsPayload.map((s) => ({
          id: s.id,
          classId,
          name: s.name,
          classTeacherId: s.classTeacherId,
          roomId: 'rm-204',
          capacity: 45,
        })),
      });
    } else {
      schoolStore.createClass({
        id: classId,
        className,
        displayName: displayName || className,
        gradeLevel: `Grade ${numericGrade}`,
        academicSessionId: store.activeSessionId,
        primaryClassTeacherId: primaryTeacherId,
        status,
        sections: sectionsPayload.map((s) => ({
          id: s.id,
          classId,
          name: s.name,
          classTeacherId: s.classTeacherId,
          roomId: 'rm-204',
          capacity: 45,
        })),
      });
    }

    onSaveClass(updatedItem);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">
              {classToEdit ? 'Edit Class & Sections' : 'Create New Academic Class'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure grade divisions, class teachers, and dynamic sections with shared entity references.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Academic Session" required>
            <Input value={session} disabled readOnly className="bg-muted/40 h-8.5 text-xs font-mono" />
          </FormField>

          <FormField label="Class Name" required error={safeErrors.className}>
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Class 10"
              className="h-8.5 text-xs"
            />
          </FormField>
        </div>

        <FormField label="Display / Alternate Name">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Grade 10 - Senior Secondary"
            className="h-8.5 text-xs"
          />
        </FormField>

        {/* Dynamic Sections Section */}
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Sections &amp; Section In-Charges</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {sections.length} section(s) defined
            </span>
          </div>

          {safeErrors.sections && (
            <p className="text-xs text-destructive font-medium">{safeErrors.sections}</p>
          )}

          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div
                key={sec.name}
                className="flex items-center gap-2 p-2 rounded-md bg-background border text-xs"
              >
                <div className="w-16 font-bold font-mono text-primary flex items-center gap-1">
                  <span>Sec</span>
                  <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                    {sec.name}
                  </span>
                </div>

                <select
                  value={sec.teacherId}
                  onChange={(e) => handleSectionTeacherChange(idx, e.target.value)}
                  className="flex-1 h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.personal.firstName} {t.personal.lastName} ({t.employment.department})
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveSection(idx)}
                  title="Remove Section"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add section row */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Input
              value={newSectionInput}
              onChange={(e) => setNewSectionInput(e.target.value)}
              placeholder="New section name (e.g. C, D)..."
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSection();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAddSection}
            >
              <Plus className="h-3 w-3" />
              Add Section
            </Button>
          </div>
        </div>

        {/* Lead Class Teacher using Universal TeacherSelect with Contextual + Add New */}
        <TeacherSelect
          value={primaryTeacherId}
          onChange={(id) => setPrimaryTeacherId(id)}
          label="Lead Class Teacher"
          required
        />

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {classToEdit ? 'Save Changes' : 'Create Class'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
