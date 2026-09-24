'use client';

import React, { useState, useMemo } from 'react';
import { StudentDetail, AdmissionType, StudentGuardian, StudentDocument } from '@/types/student';
import { CustomFieldDefinition } from '@/types/custom-fields';
import { SchoolHouse } from '@/types/house';
import { Button } from '@/components/ui/button';
import { X, Save, CheckCircle2, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { PhotoUploadBox } from './photo-upload-box';
import { GuardianManager } from './guardian-manager';
import { DocumentManager } from './document-manager';
import { AdmissionProgress, AdmissionSectionStatus } from './admission-progress';
import { CustomFieldRenderer } from '../custom-fields/custom-field-renderer';
import { DuplicateDialog } from './duplicate-dialog';
import { UnsavedDialog } from './unsaved-dialog';
import { SubmitSuccessDialog } from './submit-success-dialog';
import { AdmissionReview } from './admission-review';
import { buildStudentDetail } from '@/lib/student-utils';
interface AdmissionWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: StudentDetail) => void;
  existingStudents: StudentDetail[];
  customFields: CustomFieldDefinition[];
  houses?: SchoolHouse[];
  studentToEdit?: StudentDetail | null;
  onViewStudentProfile: (student: StudentDetail) => void;
  onManageHouses?: () => void;
}

const GENDER_OPTIONS: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CAMPUS_OPTIONS = ['Main Campus', 'North Satellite Campus'];

export function AdmissionWorkspace({
  isOpen,
  onClose,
  onSaveStudent,
  existingStudents,
  customFields,
  houses = [],
  studentToEdit,
  onViewStudentProfile,
  onManageHouses,
}: AdmissionWorkspaceProps) {
  const [storeClasses, setStoreClasses] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setStoreClasses(
            data.classes.map((c: any) => ({
              id: c.id,
              className: c.name,
              sections: (c.sections || []).map((s: any) => ({ id: s.id, name: s.name })),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Mode: Form editing vs Pre-submission Review
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('personal');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(
    studentToEdit?.lastSavedAt
  );

  // Dialog triggers
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMatchedStudent, setDuplicateMatchedStudent] = useState<StudentDetail | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdStudentResult, setCreatedStudentResult] = useState<StudentDetail | null>(null);

  // SECTION 1: Personal
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(studentToEdit?.photoUrl);
  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [middleName, setMiddleName] = useState(studentToEdit?.middleName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(studentToEdit?.gender || 'Male');
  const [dateOfBirth, setDateOfBirth] = useState(studentToEdit?.dateOfBirth || '2010-05-15');
  const [bloodGroup, setBloodGroup] = useState(studentToEdit?.bloodGroup || 'O+');
  const [nationality, setNationality] = useState(studentToEdit?.nationality || 'Indian');
  const [motherTongue, setMotherTongue] = useState(studentToEdit?.motherTongue || 'Gujarati');

  // SECTION 2: Contact & Address
  const [email, setEmail] = useState(studentToEdit?.email || '');
  const [phone, setPhone] = useState(studentToEdit?.phone || '');
  const [street, setStreet] = useState(studentToEdit?.address?.street || '');
  const [city, setCity] = useState(studentToEdit?.address?.city || 'Ahmedabad');
  const [stateName, setStateName] = useState(studentToEdit?.address?.state || 'Gujarat');
  const [postalCode, setPostalCode] = useState(studentToEdit?.address?.postalCode || '380015');
  const [samePermanentAddress, setSamePermanentAddress] = useState(
    studentToEdit?.permanentAddressSameAsCurrent ?? true
  );

  // SECTION 3: Guardians Roster
  const [guardians, setGuardians] = useState<StudentGuardian[]>(
    studentToEdit?.guardians?.length
      ? studentToEdit.guardians
      : [
          {
            id: 'grd-init-1',
            name: studentToEdit?.primaryGuardian?.name || '',
            relationship: studentToEdit?.primaryGuardian?.relationship || 'Father',
            phone: studentToEdit?.primaryGuardian?.phone || '',
            email: studentToEdit?.primaryGuardian?.email || '',
            occupation: studentToEdit?.primaryGuardian?.occupation || '',
            isPrimary: true,
            receiveSMS: true,
            receiveEmail: true,
            emergencyContact: true,
          },
        ]
  );

  // SECTION 4: Academic Placement
  const [className, setClassName] = useState(studentToEdit?.className || 'Class 10');
  const [section, setSection] = useState(studentToEdit?.section || 'A');
  const [rollNumber, setRollNumber] = useState(studentToEdit?.rollNumber || '');
  const [academicSession, setAcademicSession] = useState(
    studentToEdit?.academicSession || '2026-27'
  );
  const [enrollmentDate, setEnrollmentDate] = useState(
    studentToEdit?.enrollmentDate || '2026-09-19'
  );
  const [currentCampus, setCurrentCampus] = useState(
    studentToEdit?.currentCampus || 'Main Campus'
  );
  const [houseId, setHouseId] = useState<string | null>(studentToEdit?.houseId ?? null);

  // SECTION 5: Documents & Intake Type
  const [admissionType, setAdmissionType] = useState<AdmissionType>(
    studentToEdit?.admissionType || 'FIRST_TIME'
  );
  const [previousSchool, setPreviousSchool] = useState(studentToEdit?.previousSchool || '');
  const [previousClass, setPreviousClass] = useState(studentToEdit?.previousClass || '');
  const [documents, setDocuments] = useState<StudentDocument[]>(
    studentToEdit?.documents || [
      {
        id: 'doc-birth',
        type: 'BIRTH_CERTIFICATE',
        title: 'Municipal Birth Certificate',
        isRequired: false, // ALWAYS optional per specification
        status: 'PENDING',
      },
      {
        id: 'doc-id',
        type: 'ID_PROOF',
        title: 'Aadhaar / National Identity Card',
        isRequired: true,
        status: 'PENDING',
      },
    ]
  );

  // SECTION 6: Health
  const [allergies, setAllergies] = useState<string>(
    Array.isArray(studentToEdit?.health?.allergies)
      ? studentToEdit.health.allergies.join(', ')
      : typeof studentToEdit?.health?.allergies === 'string'
      ? studentToEdit.health.allergies
      : ''
  );
  const [medications, setMedications] = useState(studentToEdit?.health?.medications || '');
  const [doctorName, setDoctorName] = useState(studentToEdit?.health?.doctorName || '');
  const [doctorPhone, setDoctorPhone] = useState(studentToEdit?.health?.doctorPhone || '');
  const [hasEmergencyMedicalInstructions, setHasEmergencyMedicalInstructions] = useState(
    studentToEdit?.health?.hasEmergencyMedicalInstructions ?? false
  );

  // SECTION 7: Transport
  const [usesSchoolTransport, setUsesSchoolTransport] = useState(
    studentToEdit?.transport?.usesSchoolTransport ?? false
  );
  const [route, setRoute] = useState(studentToEdit?.transport?.route || 'Route 14 - Satellite');
  const [pickupPoint, setPickupPoint] = useState(studentToEdit?.transport?.pickupPoint || '');
  const [dropPoint, setDropPoint] = useState(studentToEdit?.transport?.dropPoint || '');

  // SECTION 8: Communication
  const [preferredLanguage, setPreferredLanguage] = useState(
    studentToEdit?.communication?.preferredLanguage || 'English'
  );
  const [commsAnnouncements, setCommsAnnouncements] = useState(
    studentToEdit?.communication?.parentCommunication?.announcements ?? true
  );
  const [commsAcademic, setCommsAcademic] = useState(
    studentToEdit?.communication?.parentCommunication?.academic ?? true
  );
  const [commsAttendance, setCommsAttendance] = useState(
    studentToEdit?.communication?.parentCommunication?.attendance ?? true
  );
  const [commsResults, setCommsResults] = useState(
    studentToEdit?.communication?.parentCommunication?.results ?? true
  );

  // SECTION 9: Identifiers
  const [apaarId, setApaarId] = useState(studentToEdit?.identifiers?.apaarId || '');
  const [nationalId, setNationalId] = useState(studentToEdit?.identifiers?.nationalId || '');

  // SECTION 10: Custom Fields values
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>(
    studentToEdit?.customFields || {
      secondLanguage: 'Hindi',
      scholarshipCategory: 'None',
      hasSiblingInSchool: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 10 Section live status calculation
  const sectionStatuses: AdmissionSectionStatus[] = useMemo(() => {
    const isTransfer = admissionType === 'TRANSFER';
    const primaryGrd = guardians.find((g) => g.isPrimary);
    const tcDoc = documents.find((d) => d.type === 'TRANSFER_CERTIFICATE');
    const marksDoc = documents.find((d) => d.type === 'PREVIOUS_MARKSHEET');

    return [
      {
        id: 'personal',
        title: 'Personal Demographics',
        isComplete: Boolean(firstName.trim() && lastName.trim() && dateOfBirth),
        isRequired: true,
        hasErrors: Boolean(errors.firstName || errors.lastName),
      },
      {
        id: 'contact',
        title: 'Contact & Address',
        isComplete: Boolean(street.trim() && city.trim() && stateName.trim()),
        isRequired: true,
        hasErrors: Boolean(errors.street || errors.city),
      },
      {
        id: 'family',
        title: 'Family & Guardians',
        isComplete: Boolean(primaryGrd?.name.trim() && primaryGrd?.phone.trim()),
        isRequired: true,
        hasErrors: Boolean(errors.guardians),
      },
      {
        id: 'academic',
        title: 'Academic Allocation',
        isComplete: Boolean(className && section),
        isRequired: true,
      },
      {
        id: 'documents',
        title: 'Documents & Intake',
        isComplete: isTransfer
          ? Boolean(previousSchool.trim() && tcDoc?.fileName && marksDoc?.fileName)
          : true,
        isRequired: isTransfer,
        hasErrors: Boolean(isTransfer && (!previousSchool.trim() || !tcDoc?.fileName)),
      },
      {
        id: 'health',
        title: 'Health & Medical',
        isComplete: true,
        isRequired: false,
      },
      {
        id: 'transport',
        title: 'Logistics & Transport',
        isComplete: true,
        isRequired: false,
      },
      {
        id: 'communication',
        title: 'Communication Preferences',
        isComplete: true,
        isRequired: false,
      },
      {
        id: 'identifiers',
        title: 'National & APAAR IDs',
        isComplete: true,
        isRequired: false,
      },
      {
        id: 'custom_fields',
        title: 'Institutional Custom Fields',
        isComplete: true,
        isRequired: false,
      },
    ];
  }, [
    firstName,
    lastName,
    dateOfBirth,
    street,
    city,
    stateName,
    guardians,
    className,
    section,
    admissionType,
    previousSchool,
    documents,
    errors,
  ]);

  const completionPercentage = useMemo(() => {
    const completedCount = sectionStatuses.filter((s) => s.isComplete).length;
    return Math.round((completedCount / sectionStatuses.length) * 100);
  }, [sectionStatuses]);

  // Construct consolidated student detail object
  const buildCurrentStudentRecord = (status: StudentDetail['status']): StudentDetail => {
    const primaryGuardian =
      guardians.find((g) => g.isPrimary) ||
      guardians[0] || {
        id: 'grd-default',
        name: 'Parent',
        relationship: 'Father' as const,
        phone: '+91 00000 00000',
        isPrimary: true,
      };

    const secondaryGuardian = guardians.find((g) => !g.isPrimary);

    // If editing, preserve ID and admissionNumber; if new, generate realistic credentials
    const studentId = studentToEdit?.id || `std-${Date.now().toString(36)}`;
    const admissionNo =
      studentToEdit?.admissionNumber ||
      (status === 'DRAFT'
        ? `ADM-${Math.floor(2050 + Math.random() * 50)}-DFT`
        : `ADM-${Math.floor(2050 + Math.random() * 50)}`);

    const rawInput = {
      id: studentId,
      admissionNumber: admissionNo,
      firstName: firstName.trim() || 'Candidate',
      lastName: lastName.trim() || 'Student',
      className,
      section,
      rollNumber: rollNumber.trim() || '15',
      status,
      gender,
      dob: dateOfBirth,
      email: email.trim() || `${firstName.toLowerCase() || 'student'}@institution.edu`,
      phone: phone.trim() || primaryGuardian.phone,
      bloodGroup,
      street: street.trim() || 'Campus Avenue',
      city: city.trim() || 'Ahmedabad',
      state: stateName.trim() || 'Gujarat',
      postalCode: postalCode.trim() || '380015',
      guardianName: primaryGuardian.name,
      guardianRelation: primaryGuardian.relationship,
      guardianPhone: primaryGuardian.phone,
      guardianEmail: primaryGuardian.email || '',
      guardianOccupation: primaryGuardian.occupation,
      secGuardianName: secondaryGuardian?.name,
      secGuardianRelation: secondaryGuardian?.relationship,
      secGuardianPhone: secondaryGuardian?.phone,
      teacher: 'Assigned on Term Roster',
      attendance: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      hwCompleted: 0,
      hwTotal: 0,
      avgMarks: 0,
      enrollDate: enrollmentDate,
      admissionType,
      previousSchool: admissionType === 'TRANSFER' ? previousSchool : undefined,
      previousClass: admissionType === 'TRANSFER' ? previousClass : undefined,
      houseId: houseId || null,
      documents,
      health: {
        bloodGroup,
        allergies: allergies.trim() || 'None reported',
        medications: medications.trim() || 'None',
        doctorName: doctorName.trim() || undefined,
        doctorPhone: doctorPhone.trim() || undefined,
        hasEmergencyMedicalInstructions,
      },
      transport: {
        usesSchoolTransport,
        route: usesSchoolTransport ? route : undefined,
        pickupPoint: usesSchoolTransport ? pickupPoint : undefined,
        dropPoint: usesSchoolTransport ? dropPoint : undefined,
      },
      communication: {
        preferredLanguage,
        parentCommunication: {
          announcements: commsAnnouncements,
          academic: commsAcademic,
          attendance: commsAttendance,
          results: commsResults,
        },
      },
      identifiers: {
        apaarId: apaarId.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
        studentId: admissionNo,
      },
      customFields: customFieldValues,
      draftProgress: status === 'DRAFT' ? completionPercentage : undefined,
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const details = buildStudentDetail(rawInput);
    // Explicitly enforce guardians array & photoUrl
    details.guardians = guardians;
    details.photoUrl = photoUrl;
    details.currentCampus = currentCampus;
    details.houseId = houseId || null;
    return details;
  };

  // Draft saving
  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedAt(nowTime);

    setTimeout(() => {
      const draftStudent = buildCurrentStudentRecord('DRAFT');
      onSaveStudent(draftStudent);
      setIsSavingDraft(false);
    }, 400);
  };

  // Final submit validation
  const validateBeforeSubmit = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!street.trim()) errs.street = 'Street address is required.';
    if (!city.trim()) errs.city = 'City is required.';

    const primaryGrd = guardians.find((g) => g.isPrimary);
    if (!primaryGrd || !primaryGrd.name.trim() || !primaryGrd.phone.trim()) {
      errs.guardians = 'A primary guardian with valid name and phone is required.';
    }

    if (admissionType === 'TRANSFER') {
      if (!previousSchool.trim()) {
        errs.previousSchool = 'Previous School Name is required for transfer students.';
      }
      const tcDoc = documents.find((d) => d.type === 'TRANSFER_CERTIFICATE');
      if (!tcDoc?.fileName) {
        errs.transferDoc = 'Transfer Certificate (TC) is strictly required for transfer admissions.';
      }
      const marksDoc = documents.find((d) => d.type === 'PREVIOUS_MARKSHEET');
      if (!marksDoc?.fileName) {
        errs.marksDoc = 'Previous Marksheet is required for transfer admissions.';
      }
    }

    // Check custom fields that are required
    customFields
      .filter((cf) => cf.active && cf.required && cf.showInAdmission)
      .forEach((cf) => {
        const val = customFieldValues[cf.key];
        if (val === undefined || val === null || val === '') {
          errs[`cf_${cf.key}`] = `${cf.name} is a required institutional field.`;
        }
      });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validateBeforeSubmit();
    if (!isValid) {
      alert('Please complete all mandatory admission fields highlighted in red.');
      return;
    }

    // Check for duplicate candidates (Name match + DOB or same ID)
    const match = existingStudents.find(
      (s) =>
        s.id !== studentToEdit?.id &&
        s.firstName.toLowerCase() === firstName.trim().toLowerCase() &&
        s.lastName.toLowerCase() === lastName.trim().toLowerCase() &&
        s.dateOfBirth === dateOfBirth
    );

    if (match) {
      setDuplicateMatchedStudent(match);
      setShowDuplicateDialog(true);
      return;
    }

    executeFinalSubmit();
  };

  const executeFinalSubmit = () => {
    const finalizedStudent = buildCurrentStudentRecord('ACTIVE');
    onSaveStudent(finalizedStudent);
    setCreatedStudentResult(finalizedStudent);
    setShowSuccessDialog(true);
  };

  const handleCloseAttempt = () => {
    const isDirty = Boolean(firstName.trim() || lastName.trim() || street.trim());
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student Admission Workspace"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
    >
      <div className="relative w-full max-w-6xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* WORKSPACE TOP HEADER */}
        <header className="px-6 py-4 border-b border-slate-200/80 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {studentToEdit ? `Edit Student: ${studentToEdit.name}` : 'New Student Admission'}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Complete student intake, compliance verification, and institutional onboarding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="text-xs h-8.5 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Button>

            <button
              type="button"
              onClick={handleCloseAttempt}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2-COLUMN MAIN BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: LIVE PROGRESS SIDEBAR */}
          <AdmissionProgress
            sections={sectionStatuses}
            activeSectionId={activeSectionId}
            onSelectSection={(id) => {
              setIsReviewMode(false);
              setActiveSectionId(id);
              const element = document.getElementById(`section-${id}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            completionPercentage={completionPercentage}
            lastSavedAt={lastSavedAt}
            isSavingDraft={isSavingDraft}
          />

          {/* RIGHT COLUMN: FORM WORKSPACE OR PRE-SUBMISSION REVIEW */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white">
            {isReviewMode ? (
              <AdmissionReview
                data={buildCurrentStudentRecord('ACTIVE')}
                customFields={customFields.filter((cf) => cf.active && cf.showInAdmission)}
                houses={houses}
                onEditSection={(secId) => {
                  setIsReviewMode(false);
                  setActiveSectionId(secId);
                  const element = document.getElementById(`section-${secId}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onConfirmSubmit={handleSubmit}
              />
            ) : (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-10 max-w-3xl mx-auto">
                {/* SECTION 1: PERSONAL INFORMATION */}
                <section id="section-personal" className="space-y-4 pt-2">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      01. Personal Information &amp; Demographics
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Legal candidate identity, photograph, birth date, and linguistic background.
                    </p>
                  </div>

                  <PhotoUploadBox photoUrl={photoUrl} onChange={setPhotoUrl} />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Aarav"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      {errors.firstName && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="e.g. Rajesh"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Patel"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      {errors.lastName && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value as 'Male' | 'Female' | 'Other')
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="e.g. Indian"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mother Tongue
                      </label>
                      <input
                        type="text"
                        value={motherTongue}
                        onChange={(e) => setMotherTongue(e.target.value)}
                        placeholder="e.g. Gujarati, Hindi, English"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2: CONTACT & ADDRESS */}
                <section id="section-contact" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      02. Contact Information &amp; Address
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Student electronic addresses, residential street, city, and state jurisdiction.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student.name@student.institution.edu"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Residential Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 42 Orchid Heights, Sector 18"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {errors.street && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.street}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Ahmedabad"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. Gujarat"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Postal Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="380015"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 pt-1">
                    <input
                      type="checkbox"
                      checked={samePermanentAddress}
                      onChange={(e) => setSamePermanentAddress(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Permanent address is identical to current residential address</span>
                  </label>
                </section>

                {/* SECTION 3: FAMILY & GUARDIANS */}
                <section id="section-family" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      03. Family &amp; Guardians Roster
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Parents, legal guardians, emergency coordinates, and notification access rights.
                    </p>
                  </div>

                  {errors.guardians && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {errors.guardians}
                    </div>
                  )}

                  <GuardianManager guardians={guardians} onChange={setGuardians} />
                </section>

                {/* SECTION 4: ACADEMIC ALLOCATION */}
                <section id="section-academic" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      04. Academic Allocation &amp; Session
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Grade enrollment, section roster, roll assignment, and academic calendar term.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class / Grade <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={className}
                        onChange={(e) => {
                          const newCls = e.target.value;
                          setClassName(newCls);
                          const clsObj = storeClasses.find((c) => c.className === newCls);
                          if (clsObj && clsObj.sections.length > 0) {
                            if (!clsObj.sections.some((s: any) => s.name === section)) {
                              setSection(clsObj.sections[0].name);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {storeClasses.map((c) => (
                          <option key={c.id} value={c.className}>
                            {c.className} ({c.gradeLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Section <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {(storeClasses.find((c) => c.className === className)?.sections || []).map((s: any) => (
                          <option key={s.id} value={s.name}>
                            Section {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="Auto-generated if empty"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Session
                      </label>
                      <input
                        type="text"
                        value={academicSession}
                        onChange={(e) => setAcademicSession(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enrollment Effective Date
                      </label>
                      <input
                        type="date"
                        value={enrollmentDate}
                        onChange={(e) => setEnrollmentDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Campus Location
                      </label>
                      <select
                        value={currentCampus}
                        onChange={(e) => setCurrentCampus(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {CAMPUS_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* House Allocation (Optional & Configurable) */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800">
                        House Allocation
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Optional • Assign the student to a school house for inter-house activities and competitions.
                      </p>
                    </div>

                    {houses.length === 0 ? (
                      <div className="space-y-2">
                        <select
                          disabled
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                          <option>No House Assigned</option>
                        </select>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                          <span>No houses have been configured for this school. You can continue without assigning a house.</span>
                          {onManageHouses && (
                            <button
                              type="button"
                              onClick={onManageHouses}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline shrink-0 cursor-pointer"
                            >
                              Manage Houses
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <select
                          value={houseId || ''}
                          onChange={(e) => setHouseId(e.target.value === '' ? null : e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="">No House Assigned</option>
                          {houses
                            .filter((h) => h.status === 'ACTIVE' || h.id === houseId)
                            .map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} {h.status === 'INACTIVE' ? '(Inactive)' : ''}
                              </option>
                            ))}
                        </select>

                        {houseId && (
                          <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                            ✓ Student will be assigned to {houses.find((h) => h.id === houseId)?.name || 'selected house'}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* SECTION 5: DOCUMENTS & INTAKE COMPLIANCE */}
                <section id="section-documents" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      05. Documents &amp; Admission Category
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Intake classification rules. Birth certificate is optional; transfer documents are required for lateral transfers.
                    </p>
                  </div>

                  <DocumentManager
                    admissionType={admissionType}
                    onAdmissionTypeChange={setAdmissionType}
                    previousSchool={previousSchool}
                    onPreviousSchoolChange={setPreviousSchool}
                    previousClass={previousClass}
                    onPreviousClassChange={setPreviousClass}
                    documents={documents}
                    onDocumentsChange={setDocuments}
                  />
                </section>

                {/* SECTION 6: HEALTH & MEDICAL */}
                <section id="section-health" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      06. Health &amp; Emergency Medical Instructions
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Allergies, ongoing medications, physician contacts, and first-aid authorizations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Known Allergies
                      </label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Peanuts, Penicillin, Dust mites"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chronic Conditions / Ongoing Medications
                      </label>
                      <input
                        type="text"
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        placeholder="e.g. Inhaler for exercise-induced asthma"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Family Physician / Doctor Name
                      </label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="e.g. Dr. Arvind Mehra, MD"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Doctor Emergency Phone
                      </label>
                      <input
                        type="tel"
                        value={doctorPhone}
                        onChange={(e) => setDoctorPhone(e.target.value)}
                        placeholder="+91 98230 11223"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasEmergencyMedicalInstructions}
                      onChange={(e) => setHasEmergencyMedicalInstructions(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">
                      Authorize school medical officer to administer emergency first-aid in critical events
                    </span>
                  </label>
                </section>

                {/* SECTION 7: TRANSPORT */}
                <section id="section-transport" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      07. Logistics &amp; School Transportation
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bus fleet route allocation, pickup coordinates, and transit supervision.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usesSchoolTransport}
                        onChange={(e) => setUsesSchoolTransport(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Student utilizes Institutional Transport Bus Service
                      </span>
                    </label>

                    {usesSchoolTransport && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Assigned Bus Route
                          </label>
                          <input
                            type="text"
                            value={route}
                            onChange={(e) => setRoute(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Morning Pickup Point
                          </label>
                          <input
                            type="text"
                            value={pickupPoint}
                            onChange={(e) => setPickupPoint(e.target.value)}
                            placeholder="e.g. Orchid Heights Gate 2"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Afternoon Drop Point
                          </label>
                          <input
                            type="text"
                            value={dropPoint}
                            onChange={(e) => setDropPoint(e.target.value)}
                            placeholder="e.g. Orchid Heights Gate 2"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* SECTION 8: COMMUNICATION */}
                <section id="section-communication" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      08. Parent Communication &amp; Language
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Language preferences and broadcast subscription channels.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Communication Language
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Gujarati">Gujarati</option>
                      </select>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block uppercase">
                        Notification Subscriptions
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commsAnnouncements}
                            onChange={(e) => setCommsAnnouncements(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>Announcements</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commsAcademic}
                            onChange={(e) => setCommsAcademic(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>Academic</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commsAttendance}
                            onChange={(e) => setCommsAttendance(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>Attendance</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commsResults}
                            onChange={(e) => setCommsResults(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>Results</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 9: IDENTIFIERS */}
                <section id="section-identifiers" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      09. Government &amp; APAAR / National Identifiers
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National One Nation One Student ID (APAAR) and Aadhaar UIDAI register coordinates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        APAAR ID (Automated Permanent Academic Account Registry)
                      </label>
                      <input
                        type="text"
                        value={apaarId}
                        onChange={(e) => setApaarId(e.target.value)}
                        placeholder="e.g. APAAR-2026-99128"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        National Identity / Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 10: CUSTOM FIELDS */}
                <section id="section-custom_fields" className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      10. Institutional Custom Fields
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      School-configured parameters, house allocations, clubs, and scholarship criteria.
                    </p>
                  </div>

                  {customFields.filter((cf) => cf.active && cf.showInAdmission).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center italic">
                      No custom fields enabled for intake. Administrators can configure custom fields in School Configuration tab.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customFields
                        .filter((cf) => cf.active && cf.showInAdmission)
                        .map((field) => (
                          <CustomFieldRenderer
                            key={field.id}
                            field={field}
                            value={customFieldValues[field.key]}
                            onChange={(val) =>
                              setCustomFieldValues((prev) => ({ ...prev, [field.key]: val }))
                            }
                            error={errors[`cf_${field.key}`]}
                          />
                        ))}
                    </div>
                  )}
                </section>
              </form>
            )}
          </div>
        </div>

        {/* WORKSPACE FOOTER */}
        <footer className="px-6 py-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseAttempt}
              className="text-xs border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="text-xs text-slate-600 gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isReviewMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewMode(false)}
                  className="text-xs border-slate-300"
                >
                  Back to Form
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Enroll Student
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewMode(true)}
                  className="text-xs gap-1.5 border-slate-300 text-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Review Intake Summary
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                >
                  Enroll Student
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </footer>
      </div>

      {/* DUPLICATE DETECTION MODAL */}
      <DuplicateDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        matchedStudent={duplicateMatchedStudent}
        onProceedAnyway={() => {
          setShowDuplicateDialog(false);
          executeFinalSubmit();
        }}
        onViewExisting={(student) => {
          setShowDuplicateDialog(false);
          onClose();
          onViewStudentProfile(student);
        }}
      />

      {/* UNSAVED CHANGES MODAL */}
      <UnsavedDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSaveDraft={() => {
          handleSaveDraft();
          setShowUnsavedDialog(false);
          onClose();
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          onClose();
        }}
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      <SubmitSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        createdStudent={createdStudentResult}
        onViewStudent={(student) => {
          setShowSuccessDialog(false);
          onClose();
          onViewStudentProfile(student);
        }}
        onAddAnother={() => {
          setShowSuccessDialog(false);
          // Reset fields for another student
          setFirstName('');
          setLastName('');
          setPhotoUrl(undefined);
          setStreet('');
          setIsReviewMode(false);
          setActiveSectionId('personal');
        }}
      />
    </div>
  );
}
