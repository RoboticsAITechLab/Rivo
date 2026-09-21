'use client';

import React from 'react';
import { StudentDetail } from '@/types/student';
import { CustomFieldDefinition } from '@/types/custom-fields';
import { SchoolHouse } from '@/types/house';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Users,
  GraduationCap,
  FileText,
  HeartPulse,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Sparkles,
} from 'lucide-react';

interface AdmissionReviewProps {
  data: Partial<StudentDetail>;
  customFields: CustomFieldDefinition[];
  houses?: SchoolHouse[];
  onEditSection: (sectionId: string) => void;
  onConfirmSubmit: () => void;
  isSubmitting?: boolean;
}

export function AdmissionReview({
  data,
  customFields,
  houses = [],
  onEditSection,
  onConfirmSubmit,
  isSubmitting,
}: AdmissionReviewProps) {
  const isTransfer = data.admissionType === 'TRANSFER';
  const birthCert = data.documents?.find((d) => d.type === 'BIRTH_CERTIFICATE');
  const tcDoc = data.documents?.find((d) => d.type === 'TRANSFER_CERTIFICATE');
  const marksDoc = data.documents?.find((d) => d.type === 'PREVIOUS_MARKSHEET');

  // Review validation check
  const missingFields: string[] = [];
  if (!data.firstName?.trim()) missingFields.push('First Name');
  if (!data.lastName?.trim()) missingFields.push('Last Name');
  if (!data.className) missingFields.push('Grade / Class');
  if (!data.section) missingFields.push('Section');
  if (!data.primaryGuardian?.name) missingFields.push('Primary Guardian Name');
  if (!data.primaryGuardian?.phone) missingFields.push('Primary Guardian Phone');
  if (isTransfer && !tcDoc?.fileName) missingFields.push('Transfer Certificate (TC)');
  if (isTransfer && !marksDoc?.fileName) missingFields.push('Previous Marksheet');

  const canSubmit = missingFields.length === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Pre-Submission Intake Review
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review all collected candidate data, guardian contacts, and compliance attachments before
            final enrollment.
          </p>
        </div>

        <Button
          onClick={onConfirmSubmit}
          disabled={!canSubmit || isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Enrolling Candidate...' : 'Confirm & Enroll Student'}
        </Button>
      </div>

      {/* MISSING FIELDS WARNING */}
      {!canSubmit && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Mandatory Fields Missing</span>
            <p className="mt-0.5 text-rose-700">
              Please resolve the following required items before confirming enrollment:
            </p>
            <ul className="list-disc list-inside mt-1 font-semibold space-y-0.5 text-rose-800">
              {missingFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: PERSONAL */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <User className="w-4 h-4 text-emerald-600" />
              Personal Demographics
            </div>
            <button
              type="button"
              onClick={() => onEditSection('personal')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-bold text-slate-800">
                {data.firstName} {data.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="font-medium text-slate-800">{data.dateOfBirth || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gender:</span>
              <span className="font-medium text-slate-800">{data.gender || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blood Group:</span>
              <span className="font-medium text-slate-800">{data.bloodGroup || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* CARD 2: ACADEMIC PLACEMENT */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Academic Allocation
            </div>
            <button
              type="button"
              onClick={() => onEditSection('academic')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Enrolled Class:</span>
              <span className="font-bold text-slate-800">{data.className || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Section:</span>
              <span className="font-bold text-slate-800">{data.section || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Roll Number:</span>
              <span className="font-mono font-bold text-slate-800">{data.rollNumber || 'Auto'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Academic Session:</span>
              <span className="font-medium text-slate-800">
                {data.academicSession || '2026-27'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">House Allocation:</span>
              <span className="font-semibold text-slate-800">
                {houses.find((h) => h.id === data.houseId)?.name || 'Not assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: GUARDIANS */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Users className="w-4 h-4 text-emerald-600" />
              Guardians &amp; Contacts
            </div>
            <button
              type="button"
              onClick={() => onEditSection('family')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Primary Guardian:</span>
              <span className="font-bold text-slate-800">
                {data.primaryGuardian?.name} ({data.primaryGuardian?.relationship})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-mono font-medium text-slate-800">
                {data.primaryGuardian?.phone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-700 truncate max-w-[200px]">
                {data.primaryGuardian?.email || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Guardians:</span>
              <span className="font-semibold text-slate-800">
                {data.guardians?.length || 1} registered
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: DOCUMENTS & ADMISSION CATEGORY */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-600" />
              Documents &amp; Intake Category
            </div>
            <button
              type="button"
              onClick={() => onEditSection('documents')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Admission Type:</span>
              <span className="font-bold text-slate-800">
                {data.admissionType === 'TRANSFER'
                  ? 'Transfer from Another School'
                  : data.admissionType === 'RETURNING'
                  ? 'Returning Student'
                  : 'First-Time Admission'}
              </span>
            </div>
            {isTransfer && (
              <div className="flex justify-between">
                <span className="text-slate-400">Previous School:</span>
                <span className="font-medium text-slate-800">{data.previousSchool || '—'}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Birth Certificate:</span>
              <span className="font-medium text-slate-700 flex items-center gap-1">
                {birthCert?.fileName ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                  </>
                ) : (
                  <span className="text-slate-400">Optional (Deferred)</span>
                )}
              </span>
            </div>
            {isTransfer && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transfer Certificate (TC):</span>
                <span className="font-medium flex items-center gap-1">
                  {tcDoc?.fileName ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing (Required)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 5: ADDRESS */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Address Coordinates
            </div>
            <button
              type="button"
              onClick={() => onEditSection('contact')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1 text-slate-600">
            <p className="font-medium text-slate-800">{data.address?.street || '—'}</p>
            <p>
              {data.address?.city}, {data.address?.state} {data.address?.postalCode}
            </p>
          </div>
        </div>

        {/* CARD 6: HEALTH & TRANSPORT */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              Medical &amp; Logistics
            </div>
            <button
              type="button"
              onClick={() => onEditSection('health')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Allergies:</span>
              <span className="font-medium text-slate-800">
                {data.health?.allergies || 'None reported'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">School Transport:</span>
              <span className="font-medium text-slate-800">
                {data.transport?.usesSchoolTransport
                  ? `Yes (${data.transport.route || 'Assigned'})`
                  : 'Self / Parent Commute'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 7: CUSTOM FIELDS */}
      {customFields.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Institutional Custom Fields
            </div>
            <button
              type="button"
              onClick={() => onEditSection('custom_fields')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {customFields.map((cf) => {
              const val = data.customFields?.[cf.key];
              return (
                <div key={cf.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {cf.name}
                  </span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">
                    {val === true
                      ? 'Yes'
                      : val === false
                      ? 'No'
                      : Array.isArray(val)
                      ? val.join(', ')
                      : (val as string) || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
