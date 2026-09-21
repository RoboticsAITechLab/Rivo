'use client';

import React, { useState } from 'react';
import { CustomFieldDefinition, CustomFieldGroup } from '@/types/custom-fields';
import { Button } from '@/components/ui/button';
import { Plus, Edit3, Trash2, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { AddFieldDialog } from './add-field-dialog';

interface CustomFieldBuilderProps {
  customFields: CustomFieldDefinition[];
  onChange: (fields: CustomFieldDefinition[]) => void;
}

const GROUPS: { key: CustomFieldGroup; label: string; description: string }[] = [
  { key: 'PERSONAL', label: 'Personal Information', description: 'Student bio, demographics, and house systems' },
  { key: 'ADMISSION', label: 'Admission & Concessions', description: 'Scholarships, fee categories, and entry status' },
  { key: 'FAMILY', label: 'Family & Guardians', description: 'Sibling affiliations, guardian preferences' },
  { key: 'TRANSPORT', label: 'Logistics & Transport', description: 'Bus stop coordinates, carpooling details' },
  { key: 'SCHOOL_SPECIFIC', label: 'School Specific & Clubs', description: 'Clubs, extracurriculars, mentor allocations' },
];

export function CustomFieldBuilder({
  customFields,
  onChange,
}: CustomFieldBuilderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<CustomFieldDefinition | null>(null);

  const handleAddField = () => {
    setFieldToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditField = (field: CustomFieldDefinition) => {
    setFieldToEdit(field);
    setIsDialogOpen(true);
  };

  const handleDeleteField = (id: string) => {
    if (confirm('Are you sure you want to remove this custom field definition?')) {
      onChange(customFields.filter((f) => f.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    onChange(
      customFields.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  };

  const handleSaveField = (savedField: CustomFieldDefinition) => {
    const exists = customFields.some((f) => f.id === savedField.id);
    if (exists) {
      onChange(customFields.map((f) => (f.id === savedField.id ? savedField : f)));
    } else {
      onChange([...customFields, savedField]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Custom Student Fields Builder</h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Configure institutional fields without database migrations. Fields defined here automatically render
            in the Admission Workspace and become searchable attributes on Student 360 profiles.
          </p>
        </div>
        <Button
          onClick={handleAddField}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Field
        </Button>
      </div>

      <div className="space-y-6">
        {GROUPS.map((grp) => {
          const fieldsInGroup = customFields.filter((f) => f.group === grp.key);
          return (
            <div
              key={grp.key}
              className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs"
            >
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {grp.label}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                      {fieldsInGroup.length}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">{grp.description}</p>
                </div>
              </div>

              {fieldsInGroup.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No custom fields configured for this section. Click &ldquo;Add Custom Field&rdquo; above to create one.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {fieldsInGroup.map((field) => (
                    <div
                      key={field.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        field.active ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 opacity-75'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">
                            {field.name}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {field.key}
                          </span>
                          <span className="text-[11px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                              Required
                            </span>
                          )}
                        </div>

                        {field.description && (
                          <p className="text-xs text-slate-500">{field.description}</p>
                        )}

                        {field.options && field.options.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-wrap pt-0.5">
                            <span className="font-medium text-slate-600">Options:</span>
                            {field.options.map((opt) => (
                              <span
                                key={opt}
                                className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px]"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            {field.showInAdmission ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                            )}
                            Admission Form
                          </span>
                          <span className="flex items-center gap-1">
                            {field.showInProfile ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                            )}
                            Student 360
                          </span>
                          <span className="flex items-center gap-1">
                            {field.visibleToParents ? (
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                            )}
                            Parent Visible
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(field.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                            field.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {field.active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditField(field)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Field"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddFieldDialog
        key={fieldToEdit?.id ?? (isDialogOpen ? 'open' : 'closed')}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveField}
        fieldToEdit={fieldToEdit}
      />
    </div>
  );
}
