'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectHouses } from '../selectors';
import { House, HouseId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Shield, AlertTriangle } from 'lucide-react';
import { detectHouseDuplicate } from '../validation/duplicate-detector';

export interface HouseSelectProps {
  value?: HouseId | null;
  onChange: (houseId: HouseId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function HouseSelect({
  value,
  onChange,
  label = 'School House',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select school house...',
  className,
}: HouseSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const options: SelectorOption<House>[] = React.useMemo(() => {
    const houses = selectHouses(store);
    return houses.map((h) => ({
      id: h.id,
      title: h.name,
      subtitle: h.motto || h.code,
      badge: (
        <span
          className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
          style={{ backgroundColor: h.color }}
        />
      ),
      raw: h,
    }));
  }, [store]);

  const handleHouseCreated = (newHouse: House) => {
    onChange(newHouse.id);
  };

  return (
    <>
      <UniversalSelector<House>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search school houses..."
        emptyMessage="No school houses configured."
        noResultsMessage="No matching house found."
        addNewLabel="+ Add New House"
        onAddNew={() => setIsAddModalOpen(true)}
        className={className}
      />

      <QuickHouseCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleHouseCreated}
      />
    </>
  );
}

function QuickHouseCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (house: House) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickHouseCreateModalInner onClose={onClose} onCreated={onCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickHouseCreateModalInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (house: House) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#e11d48');
  const [motto, setMotto] = React.useState('');
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) return;

    const duplicate = detectHouseDuplicate(store, { name });
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate.message);
      return;
    }

    const newHouse = schoolStore.createHouse({
      name: name.trim(),
      code: name.trim().slice(0, 4).toUpperCase(),
      color,
      motto: motto.trim() || 'Courage and Excellence',
      status: 'ACTIVE',
    });

    onCreated(newHouse);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New House</DialogTitle>
            <DialogDescription className="text-xs">
              Creates an institutional student house for extracurricular activities and sports.
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
        <FormField label="House Name" required>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDuplicateWarning(null);
            }}
            placeholder="e.g. Phoenix Rising"
            className="h-8.5 text-xs"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Badge Color" required>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8.5 w-10 p-0.5 rounded border border-input cursor-pointer bg-background"
              />
              <span className="text-xs font-mono">{color}</span>
            </div>
          </FormField>
          <FormField label="Motto">
            <Input
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Strength in Unity"
              className="h-8.5 text-xs"
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
            {duplicateWarning ? 'Create Anyway' : 'Save & Select House'}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
