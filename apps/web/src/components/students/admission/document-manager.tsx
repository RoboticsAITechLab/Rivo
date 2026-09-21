'use client';

import React from 'react';
import { AdmissionType, StudentDocument } from '@/types/student';
import { DocumentCard } from './document-card';
import { AlertTriangle, Info } from 'lucide-react';

interface DocumentManagerProps {
  admissionType: AdmissionType;
  onAdmissionTypeChange: (type: AdmissionType) => void;
  previousSchool?: string;
  onPreviousSchoolChange: (school: string) => void;
  previousClass?: string;
  onPreviousClassChange: (cls: string) => void;
  documents: StudentDocument[];
  onDocumentsChange: (documents: StudentDocument[]) => void;
  disabled?: boolean;
}

export function DocumentManager({
  admissionType,
  onAdmissionTypeChange,
  previousSchool = '',
  onPreviousSchoolChange,
  previousClass = '',
  onPreviousClassChange,
  documents,
  onDocumentsChange,
  disabled = false,
}: DocumentManagerProps) {
  const isTransfer = admissionType === 'TRANSFER';
  const isFirstTime = admissionType === 'FIRST_TIME';

  // Ensure documents contains the standard types
  const getDoc = (type: StudentDocument['type']) => documents.find((d) => d.type === type);

  const handleUpload = (type: StudentDocument['type'], file: File) => {
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const existing = documents.find((d) => d.type === type);
    if (existing) {
      onDocumentsChange(
        documents.map((d) =>
          d.type === type
            ? {
                ...d,
                fileName: file.name,
                fileSize: fileSizeStr,
                uploadedAt: nowStr,
                status: 'VERIFIED',
              }
            : d
        )
      );
    } else {
      const newDoc: StudentDocument = {
        id: `doc-${type.toLowerCase()}-${Date.now().toString(36)}`,
        type,
        title:
          type === 'BIRTH_CERTIFICATE'
            ? 'Municipal Birth Certificate'
            : type === 'TRANSFER_CERTIFICATE'
            ? 'School Transfer Certificate (TC)'
            : type === 'PREVIOUS_MARKSHEET'
            ? 'Previous Class Official Marksheet'
            : type === 'ID_PROOF'
            ? 'National ID / Aadhaar Card'
            : 'Supporting Document',
        isRequired:
          type === 'BIRTH_CERTIFICATE' ? false : type === 'ID_PROOF' ? true : isTransfer,
        status: 'VERIFIED',
        fileName: file.name,
        fileSize: fileSizeStr,
        uploadedAt: nowStr,
      };
      onDocumentsChange([...documents, newDoc]);
    }
  };

  const handleRemove = (type: StudentDocument['type']) => {
    onDocumentsChange(
      documents.map((d) =>
        d.type === type
          ? {
              ...d,
              fileName: undefined,
              fileSize: undefined,
              uploadedAt: undefined,
              status: 'PENDING',
            }
          : d
      )
    );
  };

  const handleVerifyToggle = (type: StudentDocument['type']) => {
    onDocumentsChange(
      documents.map((d) =>
        d.type === type
          ? {
              ...d,
              status: d.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED',
            }
          : d
      )
    );
  };

  const birthCert = getDoc('BIRTH_CERTIFICATE') || {
    id: 'doc-birth',
    type: 'BIRTH_CERTIFICATE',
    title: 'Municipal Birth Certificate',
    isRequired: false, // ALWAYS optional per specification
    status: 'PENDING',
  };

  const idProof = getDoc('ID_PROOF') || {
    id: 'doc-id',
    type: 'ID_PROOF',
    title: 'Aadhaar / National Identity Card',
    isRequired: true,
    status: 'PENDING',
  };

  const transferCert = getDoc('TRANSFER_CERTIFICATE') || {
    id: 'doc-tc',
    type: 'TRANSFER_CERTIFICATE',
    title: 'School Transfer Certificate (TC)',
    isRequired: isTransfer,
    status: 'PENDING',
  };

  const prevMarksheet = getDoc('PREVIOUS_MARKSHEET') || {
    id: 'doc-prevmarks',
    type: 'PREVIOUS_MARKSHEET',
    title: 'Previous Class Official Marksheet',
    isRequired: isTransfer,
    status: 'PENDING',
  };

  const isTransferDocsMissing =
    isTransfer && (!transferCert.fileName || !prevMarksheet.fileName || !previousSchool.trim());

  return (
    <div className="space-y-6">
      {/* ADMISSION TYPE SELECTOR */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Student Admission Category <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAdmissionTypeChange('FIRST_TIME')}
            className={`p-3 rounded-xl border text-left transition-all ${
              isFirstTime
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-xs font-bold">First-Time Admission</span>
            <span
              className={`block text-[11px] mt-0.5 ${
                isFirstTime ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              New entrant, nursery, or grade 1
            </span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onAdmissionTypeChange('TRANSFER')}
            className={`p-3 rounded-xl border text-left transition-all ${
              isTransfer
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-xs font-bold">Transfer from Another School</span>
            <span
              className={`block text-[11px] mt-0.5 ${
                isTransfer ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              Lateral entry with previous TC &amp; marks
            </span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onAdmissionTypeChange('RETURNING')}
            className={`p-3 rounded-xl border text-left transition-all ${
              admissionType === 'RETURNING'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-xs font-bold">Returning Student</span>
            <span
              className={`block text-[11px] mt-0.5 ${
                admissionType === 'RETURNING' ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              Re-admission or extended sabbatical
            </span>
          </button>
        </div>
      </div>

      {/* CONDITIONAL PREVIOUS SCHOOL FIELDS FOR TRANSFER STUDENTS */}
      {isTransfer && (
        <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Previous Institution Details (Required for Transfer)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previous School Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => onPreviousSchoolChange(e.target.value)}
                disabled={disabled}
                placeholder="e.g. St. Xavier High School, Ahmedabad"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Grade / Class Attended <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={previousClass}
                onChange={(e) => onPreviousClassChange(e.target.value)}
                disabled={disabled}
                placeholder="e.g. Class 9 (CBSE)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* WARNING IF TRANSFER DOCS ARE MISSING */}
      {isTransferDocsMissing && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Transfer Requirements Incomplete</span>
            <p className="text-rose-800">
              For transfer admissions, Previous School Name, School Transfer Certificate (TC), and Previous
              Marksheet are strictly mandatory before submission.
            </p>
          </div>
        </div>
      )}

      {/* POLICY CALLOUT FOR BIRTH CERTIFICATE */}
      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center gap-2.5 text-blue-900 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Birth Certificate</strong> is configured as <strong>Optional</strong>. Student admission can proceed
          even if birth certificate upload is deferred.
        </span>
      </div>

      {/* DOCUMENT LIST */}
      <div className="space-y-3">
        {/* Document 1: Birth Certificate (ALWAYS OPTIONAL) */}
        <DocumentCard
          document={birthCert}
          onUpload={(f) => handleUpload('BIRTH_CERTIFICATE', f)}
          onRemove={() => handleRemove('BIRTH_CERTIFICATE')}
          onVerifyToggle={() => handleVerifyToggle('BIRTH_CERTIFICATE')}
          disabled={disabled}
        />

        {/* Document 2: Identity Proof (Required) */}
        <DocumentCard
          document={idProof}
          onUpload={(f) => handleUpload('ID_PROOF', f)}
          onRemove={() => handleRemove('ID_PROOF')}
          onVerifyToggle={() => handleVerifyToggle('ID_PROOF')}
          disabled={disabled}
        />

        {/* Document 3: Transfer Certificate (Required for Transfer, N/A for First-Time) */}
        <DocumentCard
          document={transferCert}
          isNotApplicable={isFirstTime}
          notApplicableReason="First-time school entrants do not require a prior Transfer Certificate (TC)."
          onUpload={(f) => handleUpload('TRANSFER_CERTIFICATE', f)}
          onRemove={() => handleRemove('TRANSFER_CERTIFICATE')}
          onVerifyToggle={() => handleVerifyToggle('TRANSFER_CERTIFICATE')}
          disabled={disabled}
        />

        {/* Document 4: Previous Marksheet (Required for Transfer, N/A for First-Time) */}
        <DocumentCard
          document={prevMarksheet}
          isNotApplicable={isFirstTime}
          notApplicableReason="First-time school entrants do not have a prior institution transcript."
          onUpload={(f) => handleUpload('PREVIOUS_MARKSHEET', f)}
          onRemove={() => handleRemove('PREVIOUS_MARKSHEET')}
          onVerifyToggle={() => handleVerifyToggle('PREVIOUS_MARKSHEET')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
