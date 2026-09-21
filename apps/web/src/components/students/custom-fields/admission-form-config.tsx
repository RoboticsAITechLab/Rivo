'use client';

import React from 'react';
import { AdmissionFormSectionConfig, DocumentRequirementPolicy } from '@/types/custom-fields';
import { ShieldAlert, FileText, Sliders, Info } from 'lucide-react';

interface AdmissionFormConfigProps {
  sections: AdmissionFormSectionConfig[];
  onSectionsChange: (sections: AdmissionFormSectionConfig[]) => void;
  documentPolicy: DocumentRequirementPolicy;
  onDocumentPolicyChange: (policy: DocumentRequirementPolicy) => void;
}

export function AdmissionFormConfig({
  sections,
  onSectionsChange,
  documentPolicy,
  onDocumentPolicyChange,
}: AdmissionFormConfigProps) {
  const handleToggleEnabled = (id: string) => {
    onSectionsChange(
      sections.map((s) => (s.id === id && !s.isSystemRequired ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleToggleRequired = (id: string) => {
    onSectionsChange(
      sections.map((s) => (s.id === id && !s.isSystemRequired ? { ...s, required: !s.required } : s))
    );
  };

  return (
    <div className="space-y-8">
      {/* SECTION CONFIGURATION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Admission Intake Form Sections
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control which sections appear in the 2-column admission workspace and whether they are mandatory.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                sec.enabled ? 'hover:bg-slate-50/50' : 'bg-slate-50/30 opacity-70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{sec.title}</span>
                  {sec.isSystemRequired ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      System Core
                    </span>
                  ) : sec.required ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{sec.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                {!sec.isSystemRequired && (
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.required}
                      disabled={!sec.enabled}
                      onChange={() => handleToggleRequired(sec.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                    />
                    Required
                  </label>
                )}

                <button
                  type="button"
                  disabled={sec.isSystemRequired}
                  onClick={() => handleToggleEnabled(sec.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                    sec.isSystemRequired
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : sec.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {sec.isSystemRequired ? 'Locked Core' : sec.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DOCUMENT REQUIREMENT POLICY */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200/80">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Institutional Document Policy &amp; Compliance Rules
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict verification rules governing document uploads during student admission.
          </p>
        </div>

        <div className="p-5 space-y-6">
          {/* Important Rule Callout */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold block">
                Standard School Admission Business Rule
              </span>
              <p className="text-amber-800 leading-relaxed">
                <strong>Birth Certificate</strong> is configured as <strong>Optional</strong> by default across all tiers.
                Submission cannot be blocked if a student does not possess their birth certificate during initial intake.
                For <strong>Transfer students</strong>, the previous school transcript and transfer certificate are verified strictly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Policy Card 1: Birth Certificate */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Birth Certificate</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {documentPolicy.birthCertificate}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Applies to all admission types. Can be uploaded now or deferred for subsequent verification.
              </p>
              <select
                value={documentPolicy.birthCertificate}
                onChange={(e) =>
                  onDocumentPolicyChange({
                    ...documentPolicy,
                    birthCertificate: e.target.value as 'OPTIONAL' | 'REQUIRED' | 'DISABLED',
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
              >
                <option value="OPTIONAL">Optional (Recommended)</option>
                <option value="REQUIRED">Strictly Required</option>
                <option value="DISABLED">Not Requested</option>
              </select>
            </div>

            {/* Policy Card 2: Transfer Certificate */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Transfer Certificate (TC)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  {documentPolicy.transferCertificateForTransfer} (For Transfer)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enforced only when Admission Type is set to <strong>Transfer from another school</strong>.
              </p>
              <select
                value={documentPolicy.transferCertificateForTransfer}
                onChange={(e) =>
                  onDocumentPolicyChange({
                    ...documentPolicy,
                    transferCertificateForTransfer: e.target.value as 'REQUIRED' | 'OPTIONAL',
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
              >
                <option value="REQUIRED">Strictly Required (Transfer)</option>
                <option value="OPTIONAL">Optional / Conditionally Deferred</option>
              </select>
            </div>

            {/* Policy Card 3: Previous Marksheet */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Previous Marksheet</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  {documentPolicy.previousMarksheetForTransfer} (For Transfer)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enforced only when Admission Type is set to <strong>Transfer from another school</strong>.
              </p>
              <select
                value={documentPolicy.previousMarksheetForTransfer}
                onChange={(e) =>
                  onDocumentPolicyChange({
                    ...documentPolicy,
                    previousMarksheetForTransfer: e.target.value as 'REQUIRED' | 'OPTIONAL',
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
              >
                <option value="REQUIRED">Strictly Required (Transfer)</option>
                <option value="OPTIONAL">Optional / Conditionally Deferred</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              If <strong>First-Time Admission</strong> is chosen in the form, Transfer Certificate and Previous Marksheet are
              automatically rendered as <strong>Not Applicable</strong> with an informational badge.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
