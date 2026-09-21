'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomFieldDefinition, CustomFieldType, CustomFieldGroup } from '@/types/custom-fields';

interface AddFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: CustomFieldDefinition) => void;
  fieldToEdit?: CustomFieldDefinition | null;
}

const FIELD_TYPES: { type: CustomFieldType; label: string; description: string }[] = [
  { type: 'text', label: 'Single-line Text', description: 'Short alphanumeric string (e.g. Sibling ID)' },
  { type: 'longtext', label: 'Multi-line Text', description: 'Extended paragraph notes or rationale' },
  { type: 'number', label: 'Integer Number', description: 'Whole number (e.g. rank, count)' },
  { type: 'decimal', label: 'Decimal Number', description: 'Floating point value (e.g. percentage)' },
  { type: 'date', label: 'Date', description: 'Calendar date picker' },
  { type: 'datetime', label: 'Date & Time', description: 'Precise timestamp with hour and minutes' },
  { type: 'select', label: 'Single Select', description: 'Dropdown list of predefined options' },
  { type: 'multiselect', label: 'Multi-Select', description: 'Multiple selectable chips or tags' },
  { type: 'yesno', label: 'Yes / No Toggle', description: 'Boolean boolean true/false switch' },
  { type: 'phone', label: 'Phone Number', description: 'Telephone with country calling prefix' },
  { type: 'email', label: 'Email Address', description: 'Validated electronic mail address' },
  { type: 'url', label: 'Web URL', description: 'Hyperlink to external web portal or document' },
];

const GROUPS: { key: CustomFieldGroup; label: string }[] = [
  { key: 'PERSONAL', label: 'Personal Information' },
  { key: 'ADMISSION', label: 'Admission & Concessions' },
  { key: 'FAMILY', label: 'Family & Guardians' },
  { key: 'TRANSPORT', label: 'Logistics & Transport' },
  { key: 'SCHOOL_SPECIFIC', label: 'School Specific & Clubs' },
];

export function AddFieldDialog({
  isOpen,
  onClose,
  onSave,
  fieldToEdit,
}: AddFieldDialogProps) {
  const [name, setName] = useState(fieldToEdit?.name || '');
  const [key, setKey] = useState(fieldToEdit?.key || '');
  const [group, setGroup] = useState<CustomFieldGroup>(fieldToEdit?.group || 'PERSONAL');
  const [type, setType] = useState<CustomFieldType>(fieldToEdit?.type || 'text');
  const [description, setDescription] = useState(fieldToEdit?.description || '');
  const [optionsStr, setOptionsStr] = useState(fieldToEdit?.options?.join(', ') || '');
  const [required, setRequired] = useState(fieldToEdit?.required ?? false);
  const [active, setActive] = useState(fieldToEdit?.active ?? true);
  const [showInAdmission, setShowInAdmission] = useState(fieldToEdit?.showInAdmission ?? true);
  const [showInProfile, setShowInProfile] = useState(fieldToEdit?.showInProfile ?? true);
  const [visibleToTeachers, setVisibleToTeachers] = useState(fieldToEdit?.visibleToTeachers ?? true);
  const [visibleToParents, setVisibleToParents] = useState(fieldToEdit?.visibleToParents ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (val: string) => {
    setName(val);
    if (!fieldToEdit) {
      // Auto-generate camelCase key
      const generatedKey = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      setKey(generatedKey);
    }
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Field label is required';
    if (!key.trim()) errs.key = 'Internal key identifier is required';

    if ((type === 'select' || type === 'multiselect') && !optionsStr.trim()) {
      errs.options = 'Please provide at least one option (separated by commas)';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const parsedOptions =
      type === 'select' || type === 'multiselect'
        ? optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: CustomFieldDefinition = {
      id: fieldToEdit?.id || `cf-${Date.now().toString(36)}`,
      name: name.trim(),
      key: key.trim(),
      group,
      type,
      description: description.trim() || undefined,
      options: parsedOptions,
      defaultValue: fieldToEdit?.defaultValue,
      required,
      active,
      showInAdmission,
      showInProfile,
      visibleToTeachers,
      visibleToParents,
    };

    onSave(newField);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fieldToEdit ? 'Edit Custom Field' : 'Create New Custom Field'}
          </DialogTitle>
          <DialogDescription>
            Configure student schema extensions. Custom fields automatically render in the
            Admission Workspace and the Student 360 profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. House Allocation, Sibling Admission No."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field Identifier Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. houseAllocation"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.key && <p className="text-[11px] text-rose-500 mt-1">{errors.key}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Group
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as CustomFieldGroup)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CustomFieldType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.type} value={ft.type}>
                    {ft.label} ({ft.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(type === 'select' || type === 'multiselect') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Options (Comma Separated) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Values that teachers and parents can select from during admission.
              </p>
              {errors.options && <p className="text-[11px] text-rose-500 mt-1">{errors.options}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Helper / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Please enter student's assigned inter-house competition house"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Validation &amp; Visibility Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Required Field</span>
                  <p className="text-[10px] text-slate-500">Must be answered before submitting</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Active</span>
                  <p className="text-[10px] text-slate-500">Available for use across school forms</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={showInAdmission}
                  onChange={(e) => setShowInAdmission(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Show in Admission Form</span>
                  <p className="text-[10px] text-slate-500">Collected during initial intake</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={showInProfile}
                  onChange={(e) => setShowInProfile(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Show in Student 360</span>
                  <p className="text-[10px] text-slate-500">Displayed on student profile card</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={visibleToTeachers}
                  onChange={(e) => setVisibleToTeachers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Visible to Teachers</span>
                  <p className="text-[10px] text-slate-500">Viewable by class teachers &amp; staff</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={visibleToParents}
                  onChange={(e) => setVisibleToParents(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Visible to Parents</span>
                  <p className="text-[10px] text-slate-500">Visible in Parent Portal view</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {fieldToEdit ? 'Update Field' : 'Create Custom Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
