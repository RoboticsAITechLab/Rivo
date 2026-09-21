'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectClasses } from '../selectors';
import { SchoolClass, ClassId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Layers, AlertTriangle } from 'lucide-react';
import { detectClassDuplicate } from '../validation/duplicate-detector';

export interface ClassSelectProps {
  value?: ClassId | null;
  onChange: (classId: ClassId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function ClassSelect({
  value,
  onChange,
  label = 'Academic Class / Grade',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select class...',
  className,
}: ClassSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const options: SelectorOption<SchoolClass>[] = React.useMemo(() => {
    const classes = selectClasses(store);
    return classes.map((c) => ({
      id: c.id,
      title: c.className,
      subtitle: `${c.gradeLevel} • ${c.sections.length} sections (${c.sections.map((s) => s.name).join(', ')})`,
      raw: c,
    }));
  }, [store]);

  const handleClassCreated = (newClass: SchoolClass) => {
    onChange(newClass.id);
  };

  return (
    <>
      <UniversalSelector<SchoolClass>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search class or grade level..."
        emptyMessage="No classes configured."
        noResultsMessage="No matching classes found."
        addNewLabel="+ Add New Class"
        onAddNew={() => setIsAddModalOpen(true)}
        className={className}
      />

      <QuickClassCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleClassCreated}
      />
    </>
  );
}

function QuickClassCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (schoolClass: SchoolClass) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickClassCreateModalInner onClose={onClose} onCreated={onCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickClassCreateModalInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (schoolClass: SchoolClass) => void;
}) {
  const store = useSchoolStore();
  const [className, setClassName] = React.useState('');
  const [gradeLevel, setGradeLevel] = React.useState('Grade 10');
  const [initialSection, setInitialSection] = React.useState('A');
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!className.trim()) return;

    const duplicate = detectClassDuplicate(store, { className });
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate.message);
      return;
    }

    const newCls = schoolStore.createClass({
      className: className.trim(),
      displayName: className.trim(),
      gradeLevel: gradeLevel.trim(),
      academicSessionId: store.activeSessionId,
      status: 'ACTIVE',
      sections: [
        {
          id: `sec-${Math.random().toString(36).substring(2, 9)}-a`,
          classId: '', // populated in store
          name: initialSection.trim().toUpperCase() || 'A',
          capacity: 40,
        },
      ],
    });

    onCreated(newCls);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New Class</DialogTitle>
            <DialogDescription className="text-xs">
              Creates an academic class and sets up its baseline division.
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
        <FormField label="Class Name" required>
          <Input
            value={className}
            onChange={(e) => {
              setClassName(e.target.value);
              setDuplicateWarning(null);
            }}
            placeholder="Class 10"
            className="h-8.5 text-xs"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Grade Level" required>
            <Input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="Grade 10"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Initial Section" required>
            <Input
              value={initialSection}
              onChange={(e) => setInitialSection(e.target.value.toUpperCase())}
              placeholder="A"
              maxLength={3}
              className="h-8.5 text-xs font-mono uppercase"
              required
            />
          </FormField>
        </div>

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
            {duplicateWarning ? 'Create Anyway' : 'Save & Select Class'}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
