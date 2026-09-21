'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption, SelectorGroup } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectSubjectsForClass, selectSubjects } from '../selectors';
import { Subject, SubjectId, ClassId, SubjectType } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { detectSubjectDuplicate } from '../validation/duplicate-detector';

export interface SubjectSelectProps {
  value?: SubjectId | null;
  onChange: (subjectId: SubjectId) => void;
  classId?: ClassId | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function SubjectSelect({
  value,
  onChange,
  classId,
  label = 'Academic Subject',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select subject...',
  className,
}: SubjectSelectProps) {
  const store = useSchoolStore();
  const [showInactive, setShowInactive] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const groups: SelectorGroup<Subject>[] = React.useMemo(() => {
    if (classId) {
      const { relevant, others } = selectSubjectsForClass(store, classId, {
        includeInactive: showInactive,
      });

      const mapToOption = (s: Subject): SelectorOption<Subject> => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.code} • ${s.type} • ${s.department}`,
        badge:
          s.status === 'INACTIVE' ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              Inactive
            </span>
          ) : undefined,
        raw: s,
      });

      const res: SelectorGroup<Subject>[] = [];
      if (relevant.length > 0) {
        res.push({
          label: 'Class Applicable Curriculum',
          items: relevant.map(mapToOption),
        });
      }
      if (others.length > 0) {
        res.push({
          label: relevant.length > 0 ? 'Other Academic Subjects' : 'All Subjects',
          items: others.map(mapToOption),
        });
      }
      return res;
    }

    const all = selectSubjects(store, { includeInactive: showInactive });
    return [
      {
        label: 'Subjects',
        items: all.map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: `${s.code} • ${s.type} • ${s.department}`,
          badge:
            s.status === 'INACTIVE' ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                Inactive
              </span>
            ) : undefined,
          raw: s,
        })),
      },
    ];
  }, [store, classId, showInactive]);

  const handleSubjectCreated = (newSubject: Subject) => {
    onChange(newSubject.id);
  };

  return (
    <>
      <UniversalSelector<Subject>
        value={value}
        onChange={(id) => onChange(id)}
        groups={groups}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search subject by title or code..."
        emptyMessage="No subjects configured."
        noResultsMessage="No matching subjects found."
        addNewLabel="+ Add New Subject"
        onAddNew={() => setIsAddModalOpen(true)}
        showInactiveToggle={true}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        className={className}
      />

      <QuickSubjectCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultClassId={classId}
        onCreated={handleSubjectCreated}
      />
    </>
  );
}

function QuickSubjectCreateDialog({
  isOpen,
  onClose,
  defaultClassId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: ClassId | null;
  onCreated: (subject: Subject) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickSubjectCreateModalInner
            onClose={onClose}
            defaultClassId={defaultClassId}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickSubjectCreateModalInner({
  onClose,
  defaultClassId,
  onCreated,
}: {
  onClose: () => void;
  defaultClassId?: ClassId | null;
  onCreated: (subject: Subject) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState<SubjectType>('CORE');
  const [department, setDepartment] = React.useState('Mathematics');
  const [weeklyPeriods, setWeeklyPeriods] = React.useState(6);
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim() || !code.trim()) return;

    const duplicate = detectSubjectDuplicate(store, { name, code });
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate.message);
      return;
    }

    const applicableClassIds: ClassId[] = defaultClassId ? [defaultClassId] : ['cls-10'];

    const newSub = schoolStore.createSubject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      department,
      description: `${name.trim()} course curriculum.`,
      applicableClassIds,
      weeklyPeriods,
      status: 'ACTIVE',
    });

    onCreated(newSub);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New Subject</DialogTitle>
            <DialogDescription className="text-xs">
              Creates a subject record and associates it with active academic sessions.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="space-y-3 pt-2"
      >
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Subject Name" required>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="e.g. Statistics"
                className="h-8.5 text-xs"
                required
              />
            </FormField>
            <FormField label="Subject Code" required>
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setDuplicateWarning(null);
                }}
                placeholder="e.g. STAT-10"
                className="h-8.5 text-xs font-mono uppercase"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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

            <FormField label="Department" required>
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

          <FormField label="Weekly Periods Allocation">
            <Input
              type="number"
              min={1}
              max={15}
              value={weeklyPeriods}
              onChange={(e) => setWeeklyPeriods(Number(e.target.value))}
              className="h-8.5 text-xs"
            />
          </FormField>

          {duplicateWarning && (
            <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Possible duplicate detected:</span>
                <p className="mt-0.5 text-[11px]">{duplicateWarning}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {duplicateWarning ? 'Create Anyway' : 'Save & Select Subject'}
            </Button>
          </DialogFooter>
        </div>
    </>
  );
}
