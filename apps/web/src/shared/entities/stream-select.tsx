'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectStreams } from '../selectors';
import { Stream, StreamId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Compass, AlertTriangle } from 'lucide-react';

export interface StreamSelectProps {
  value?: StreamId | null;
  onChange: (streamId: StreamId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  includeAllOption?: boolean;
  placeholder?: string;
  className?: string;
}

export function StreamSelect({
  value,
  onChange,
  label = 'Academic Stream',
  required,
  disabled,
  allowClear = true,
  includeAllOption = false,
  placeholder = 'Select stream...',
  className,
}: StreamSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const options: SelectorOption<Stream>[] = React.useMemo(() => {
    const streams = selectStreams(store);
    const list: SelectorOption<Stream>[] = streams.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.code} • Classes: ${s.applicableClasses.map((c) => c.replace('cls-', 'Class ')).join(', ')}`,
      badge: s.code,
      badgeVariant: 'outline',
      raw: s,
    }));

    if (includeAllOption) {
      list.unshift({
        id: 'ALL',
        title: 'All Streams (Science, Commerce, Humanities)',
        subtitle: 'Applies across all academic disciplines',
        badge: 'All Streams',
        raw: {
          id: 'ALL',
          schoolId: 'school-gwa',
          name: 'All Streams',
          code: 'ALL',
          applicableClasses: ['cls-11', 'cls-12'],
          status: 'ACTIVE',
        },
      });
    }

    return list;
  }, [store, includeAllOption]);

  const handleStreamCreated = (newStream: Stream) => {
    onChange(newStream.id);
  };

  return (
    <>
      <UniversalSelector<Stream>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search academic stream..."
        emptyMessage="No streams found."
        addNewLabel="+ Add New Stream"
        onAddNew={() => setIsAddModalOpen(true)}
        className={className}
      />

      <QuickStreamCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleStreamCreated}
      />
    </>
  );
}

function QuickStreamCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (stream: Stream) => void;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <QuickStreamCreateModalInner onClose={onClose} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

const QuickStreamCreateModalInner = React.memo(function QuickStreamCreateModalInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (stream: Stream) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) return;

    const existingCode = store.streams.find(
      (s) => s.code.toLowerCase() === (code.trim() || name.slice(0, 3)).toLowerCase()
    );
    if (existingCode && !duplicateWarning) {
      setDuplicateWarning(`A stream with code "${existingCode.code}" already exists.`);
      return;
    }

    const newStream = schoolStore.createStream({
      schoolId: 'school-gwa',
      name: name.trim(),
      code: code.trim().toUpperCase() || name.slice(0, 3).toUpperCase(),
      applicableClasses: ['cls-11', 'cls-12'],
      description: description.trim() || `${name.trim()} academic track`,
      status: 'ACTIVE',
    });

    onCreated(newStream);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add Academic Stream</DialogTitle>
            <DialogDescription className="text-xs">
              Define a specialized academic track (e.g. Science, Commerce, Vocational) for Classes 11 &amp; 12.
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
          <FormField label="Stream Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDuplicateWarning(null);
              }}
              placeholder="e.g. Biotechnology"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Stream Code" required>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setDuplicateWarning(null);
              }}
              placeholder="e.g. BIO"
              className="h-8.5 text-xs font-mono uppercase"
              required
            />
          </FormField>
        </div>

        <FormField label="Description / Subject Focus">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key subjects and curriculum scope"
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
            {duplicateWarning ? 'Create Anyway' : 'Save & Select Stream'}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
});
