'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectSectionsForClass, selectClassById } from '../selectors';
import { Section, SectionId, ClassId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Split, AlertTriangle } from 'lucide-react';
import { detectSectionDuplicate } from '../validation/duplicate-detector';

export interface SectionSelectProps {
  value?: SectionId | null;
  onChange: (sectionId: SectionId) => void;
  classId?: ClassId | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function SectionSelect({
  value,
  onChange,
  classId,
  label = 'Class Section / Division',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select section...',
  className,
}: SectionSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const selectedClass = selectClassById(store, classId);

  const options: SelectorOption<Section>[] = React.useMemo(() => {
    if (!classId) return [];
    const sections = selectSectionsForClass(store, classId);
    return sections.map((s) => ({
      id: s.id,
      title: `Section ${s.name}`,
      subtitle: `Capacity: ${s.capacity} students`,
      raw: s,
    }));
  }, [store, classId]);

  const handleSectionCreated = (newSection: Section) => {
    onChange(newSection.id);
  };

  const isClassMissing = !classId;

  return (
    <>
      <UniversalSelector<Section>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled || isClassMissing}
        allowClear={allowClear}
        placeholder={isClassMissing ? 'Select a class first...' : placeholder}
        searchPlaceholder="Search section..."
        emptyMessage={
          isClassMissing
            ? 'Please choose a class first to view its sections.'
            : `No sections configured for ${selectedClass?.className || 'this class'}.`
        }
        noResultsMessage="No matching section found."
        addNewLabel={!isClassMissing ? `+ Add Section to ${selectedClass?.className || 'Class'}` : undefined}
        onAddNew={!isClassMissing ? () => setIsAddModalOpen(true) : undefined}
        className={className}
      />

      {classId && (
        <QuickSectionCreateDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          classId={classId}
          classNameLabel={selectedClass?.className || 'Class'}
          onCreated={handleSectionCreated}
        />
      )}
    </>
  );
}

function QuickSectionCreateDialog({
  isOpen,
  onClose,
  classId,
  classNameLabel,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  classId: ClassId;
  classNameLabel: string;
  onCreated: (section: Section) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickSectionCreateModalInner
            onClose={onClose}
            classId={classId}
            classNameLabel={classNameLabel}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickSectionCreateModalInner({
  onClose,
  classId,
  classNameLabel,
  onCreated,
}: {
  onClose: () => void;
  classId: ClassId;
  classNameLabel: string;
  onCreated: (section: Section) => void;
}) {
  const store = useSchoolStore();
  const [sectionName, setSectionName] = React.useState('');
  const [capacity, setCapacity] = React.useState(40);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanName = sectionName.trim().toUpperCase();
    if (!cleanName) return;

    // Check duplicate section within class
    const isDuplicate = detectSectionDuplicate(store, classId, cleanName);
    if (isDuplicate) {
      setError(`Section "${cleanName}" already exists in ${classNameLabel}. Each section in a class must be unique.`);
      return;
    }

    const newSection = schoolStore.createSection(classId, {
      name: cleanName,
      capacity,
    });

    onCreated(newSection);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Split className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add Section to {classNameLabel}</DialogTitle>
            <DialogDescription className="text-xs">
              Creates a new section division under {classNameLabel} without leaving your current form.
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
          <FormField label="Section Name" required>
            <Input
              value={sectionName}
              onChange={(e) => {
                setSectionName(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. C or D"
              maxLength={4}
              className="h-8.5 text-xs font-mono uppercase"
              required
            />
          </FormField>
          <FormField label="Capacity" required>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
              max={100}
              className="h-8.5 text-xs"
              required
            />
          </FormField>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Duplicate Section:</span>
              <p className="mt-0.5 text-[11px]">{error}</p>
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
            Save &amp; Select Section
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
