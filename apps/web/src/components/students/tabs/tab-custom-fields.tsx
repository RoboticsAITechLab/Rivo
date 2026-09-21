'use client';

import React from 'react';
import { StudentDetail } from '@/types/student';
import { CustomFieldDefinition, CustomFieldGroup } from '@/types/custom-fields';
import { initialCustomFields } from '@/data/mock-custom-fields';
import { Sparkles, Check, X } from 'lucide-react';

interface TabCustomFieldsProps {
  student: StudentDetail;
  definitions?: CustomFieldDefinition[];
}

const GROUPS: { key: CustomFieldGroup; label: string }[] = [
  { key: 'PERSONAL', label: 'Personal Attributes & Houses' },
  { key: 'ADMISSION', label: 'Admission & Concessions' },
  { key: 'FAMILY', label: 'Family & Siblings' },
  { key: 'TRANSPORT', label: 'Logistics & Transport' },
  { key: 'SCHOOL_SPECIFIC', label: 'School Specific & Clubs' },
];

export function TabCustomFields({ student, definitions = initialCustomFields }: TabCustomFieldsProps) {
  const values = student.customFields || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">Institutional Custom Attributes</h3>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Configurable student fields defined by school administrators without database alterations.
        </p>
      </div>

      <div className="space-y-4">
        {GROUPS.map((grp) => {
          const fieldsInGroup = definitions.filter((f) => f.group === grp.key && f.active && f.showInProfile);
          if (fieldsInGroup.length === 0) return null;

          return (
            <div
              key={grp.key}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {grp.label}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                  {fieldsInGroup.length} fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {fieldsInGroup.map((field) => {
                  const rawVal = values[field.key];
                  return (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {field.name}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                          {field.type}
                        </span>
                      </div>

                      <div className="pt-0.5">
                        {typeof rawVal === 'boolean' ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              rawVal
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rawVal ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {rawVal ? 'Yes' : 'No'}
                          </span>
                        ) : Array.isArray(rawVal) ? (
                          <div className="flex flex-wrap gap-1">
                            {rawVal.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/60"
                              >
                                {String(item)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">
                            {rawVal !== undefined && rawVal !== null && rawVal !== ''
                              ? String(rawVal)
                              : '— (Not provided)'}
                          </span>
                        )}
                      </div>

                      {field.description && (
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
