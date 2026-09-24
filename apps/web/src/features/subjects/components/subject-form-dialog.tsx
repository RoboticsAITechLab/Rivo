'use client';

import * as React from 'react';
import { SubjectDetail } from '../types';
import { validateSubjectForm, SubjectValidationErrors } from '../validation/subject-schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { BookOpen, Search } from 'lucide-react';
import { SubjectType } from '@/features/shared/types';

interface SubjectFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: SubjectDetail | null;
  existingSubjects: SubjectDetail[];
  onSaveSubject: (subject: SubjectDetail) => void;
}

export function SubjectFormDialog({
  isOpen,
  onClose,
  subjectToEdit,
  existingSubjects,
  onSaveSubject,
}: SubjectFormDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SubjectFormContent
        key={subjectToEdit?.id ?? 'new'}
        onClose={onClose}
        subjectToEdit={subjectToEdit}
        existingSubjects={existingSubjects}
        onSaveSubject={onSaveSubject}
      />
    </Dialog>
  );
}

function SubjectFormContent({
  onClose,
  subjectToEdit,
  existingSubjects,
  onSaveSubject,
}: {
  onClose: () => void;
  subjectToEdit?: SubjectDetail | null;
  existingSubjects: SubjectDetail[];
  onSaveSubject: (subject: SubjectDetail) => void;
}) {
  const [classes, setClasses] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []))
      .catch(() => setClasses([]));
  }, []);

  const [name, setName] = React.useState(subjectToEdit?.name || '');
  const [code, setCode] = React.useState(subjectToEdit?.code || '');
  const [type, setType] = React.useState<SubjectType>(subjectToEdit?.type || 'CORE');
  const [department, setDepartment] = React.useState(subjectToEdit?.department || 'Mathematics');
  const [description, setDescription] = React.useState(subjectToEdit?.description || '');
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>(
    subjectToEdit?.applicableClassIds || ['cls-10', 'cls-11']
  );
  const [classSearch, setClassSearch] = React.useState('');
  const [weeklyPeriods, setWeeklyPeriods] = React.useState<number>(subjectToEdit?.weeklyPeriods || 6);
  const [status, setStatus] = React.useState<'ACTIVE' | 'INACTIVE'>(subjectToEdit?.status || 'ACTIVE');

  const [errors, setErrors] = React.useState<SubjectValidationErrors>({});
  const safeErrors = errors || {};

  const filteredClasses = React.useMemo(() => {
    if (!classSearch.trim()) return classes;
    const q = classSearch.toLowerCase();
    return classes.filter((c) => c.className.toLowerCase().includes(q) || String(c.gradeLevel).toLowerCase().includes(q));
  }, [classes, classSearch]);

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSelectAllClasses = () => {
    setSelectedClassIds(classes.map((c) => c.id));
  };

  const handleClearClasses = () => {
    setSelectedClassIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSubjectForm(
      {
        name,
        code,
        type,
        department,
        applicableClassIds: selectedClassIds,
        weeklyPeriods,
      },
      existingSubjects,
      subjectToEdit?.id
    ) || {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const subId = subjectToEdit?.id || `sub-${Date.now()}`;
    const applicableClassNames = selectedClassIds;

    const updatedItem: SubjectDetail = {
      id: subId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      department,
      description: description.trim(),
      applicableClassIds: selectedClassIds,
      applicableClassNames,
      qualifiedTeacherIds: subjectToEdit?.qualifiedTeacherIds || [],
      qualifiedTeacherNames: subjectToEdit?.qualifiedTeacherNames || [],
      weeklyPeriods,
      status,
      createdAt: subjectToEdit?.createdAt || new Date().toISOString(),
    };

    onSaveSubject(updatedItem);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">
              {subjectToEdit ? 'Edit Subject Details' : 'Create New Curriculum Subject'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure course code, academic department, applicable cohorts and weekly period allocation.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Subject Name" required error={safeErrors.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Mathematics"
              className="h-8.5 text-xs"
            />
          </FormField>

          <FormField label="Subject Code" required error={safeErrors.code}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MAT-101"
              className="h-8.5 text-xs font-mono uppercase"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Subject Type" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SubjectType)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CORE">CORE (Mandatory)</option>
              <option value="ELECTIVE">ELECTIVE</option>
              <option value="LANGUAGE">LANGUAGE</option>
              <option value="PRACTICAL">PRACTICAL</option>
              <option value="ACTIVITY">ACTIVITY</option>
            </select>
          </FormField>

          <FormField label="Department" required error={safeErrors.department}>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Languages">Languages</option>
              <option value="Social Sciences">Social Sciences</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </FormField>
        </div>

        <FormField label="Description & Learning Goals">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Curriculum overview and term learning objectives..."
            className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </FormField>

        {/* Requirement 26: Searchable Multi-select Applicable Classes */}
        <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Applicable Class Cohorts</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={handleSelectAllClasses}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={handleClearClasses}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Search classes..."
              className="w-full h-7.5 pl-8 pr-2.5 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
            {filteredClasses.map((c) => {
              const isChecked = selectedClassIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-primary/10 border-primary/40 font-semibold text-primary'
                      : 'bg-background border-border hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleClass(c.id)}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="truncate">{c.className}</span>
                </label>
              );
            })}
          </div>
          {safeErrors.classes && <p className="text-[11px] text-destructive mt-1">{safeErrors.classes}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Weekly Periods" required error={safeErrors.weeklyPeriods}>
            <Input
              type="number"
              min={1}
              max={20}
              value={weeklyPeriods}
              onChange={(e) => setWeeklyPeriods(Number(e.target.value))}
              className="h-8.5 text-xs font-mono"
            />
          </FormField>

          <FormField label="Operational Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {subjectToEdit ? 'Save Changes' : 'Create Subject'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
