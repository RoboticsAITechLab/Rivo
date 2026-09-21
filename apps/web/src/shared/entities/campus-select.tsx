'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectCampuses } from '../selectors';
import { Campus, CampusId } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Building, AlertTriangle } from 'lucide-react';

export interface CampusSelectProps {
  value?: CampusId | null;
  onChange: (campusId: CampusId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  includeAllOption?: boolean;
  placeholder?: string;
  className?: string;
}

export function CampusSelect({
  value,
  onChange,
  label = 'Campus / Institution Site',
  required,
  disabled,
  allowClear = true,
  includeAllOption = false,
  placeholder = 'Select campus...',
  className,
}: CampusSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const options: SelectorOption<Campus>[] = React.useMemo(() => {
    const campuses = selectCampuses(store);
    const list: SelectorOption<Campus>[] = campuses.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.code} • ${c.city}`,
      badge: c.status === 'ACTIVE' ? 'Active' : 'Inactive',
      badgeVariant: c.status === 'ACTIVE' ? 'default' : 'secondary',
      disabled: c.status !== 'ACTIVE',
      raw: c,
    }));

    if (includeAllOption) {
      list.unshift({
        id: 'ALL',
        title: 'All Campuses (School-wide Multi-Campus Scope)',
        subtitle: `Aggregates all ${campuses.length} active campuses across Rivo`,
        badge: 'All Sites',
        raw: {
          id: 'ALL',
          schoolId: 'school-gwa',
          name: 'All Campuses',
          code: 'ALL',
          address: 'All Campuses',
          city: 'Consolidated',
          status: 'ACTIVE',
        },
      });
    }

    return list;
  }, [store, includeAllOption]);

  const handleCampusCreated = (newCampus: Campus) => {
    onChange(newCampus.id);
  };

  return (
    <>
      <UniversalSelector<Campus>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search campus by name, code, or city..."
        emptyMessage="No campuses found."
        addNewLabel="+ Add New Campus"
        onAddNew={() => setIsAddModalOpen(true)}
        className={className}
      />

      <QuickCampusCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCampusCreated}
      />
    </>
  );
}

function QuickCampusCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campus: Campus) => void;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <QuickCampusCreateModalInner onClose={onClose} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

const QuickCampusCreateModalInner = React.memo(function QuickCampusCreateModalInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (campus: Campus) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [city, setCity] = React.useState('New Delhi');
  const [phone, setPhone] = React.useState('');
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) return;

    const existingCode = store.campuses.find(
      (c) => c.code.toLowerCase() === (code.trim() || name.slice(0, 4)).toLowerCase()
    );
    if (existingCode && !duplicateWarning) {
      setDuplicateWarning(`A campus with code "${existingCode.code}" already exists.`);
      return;
    }

    const newCampus = schoolStore.createCampus({
      schoolId: 'school-gwa',
      name: name.trim(),
      code: code.trim().toUpperCase() || name.slice(0, 4).toUpperCase(),
      address: address.trim() || 'Institutional Area',
      city: city.trim() || 'New Delhi',
      phone: phone.trim() || '+91 11 2345 0000',
      status: 'ACTIVE',
    });

    onCreated(newCampus);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New Campus</DialogTitle>
            <DialogDescription className="text-xs">
              Register a new school branch or physical institution site into the central network.
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
          <FormField label="Campus Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDuplicateWarning(null);
              }}
              placeholder="e.g. West City Campus"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Campus Code" required>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setDuplicateWarning(null);
              }}
              placeholder="e.g. CMP-WEST"
              className="h-8.5 text-xs font-mono uppercase"
              required
            />
          </FormField>
        </div>

        <FormField label="Street Address" required>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Plot 4, Sector 21"
            className="h-8.5 text-xs"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="City / Region" required>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="New Delhi"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Contact Phone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 11 2345 6789"
              className="h-8.5 text-xs font-mono"
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
            {duplicateWarning ? 'Create Anyway' : 'Save & Select Campus'}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
});
