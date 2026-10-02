'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  User,
  MapPin,
  Users,
  GraduationCap,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Camera,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Check,
  ArrowRight,
  Save,
  Hash,
  Phone,
  Mail,
  Briefcase,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormSection } from '@/components/ui/form-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StudentDetail, AdmissionType, StudentGuardian, StudentDocument } from '@/types/student';
import { CustomFieldDefinition } from '@/types/custom-fields';
import { SchoolHouse } from '@/types/house';
import { CustomFieldRenderer } from '../custom-fields/custom-field-renderer';
import { DuplicateDialog } from './duplicate-dialog';
import { UnsavedDialog } from './unsaved-dialog';
import { SubmitSuccessDialog } from './submit-success-dialog';
import { AdmissionReview } from './admission-review';
import { buildStudentDetail } from '@/lib/student-utils';

interface AdmissionWorkspaceProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaveStudent: (student: StudentDetail) => void;
  existingStudents?: StudentDetail[];
  customFields?: CustomFieldDefinition[];
  houses?: SchoolHouse[];
  studentToEdit?: StudentDetail | null;
  onViewStudentProfile?: (student: StudentDetail) => void;
  onManageHouses?: () => void;
  isModal?: boolean;
}

const GENDER_OPTIONS: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CAMPUS_OPTIONS = ['Main Campus', 'North Satellite Campus'];

export function AdmissionWorkspace({
  isOpen = true,
  onClose,
  onSaveStudent,
  existingStudents = [],
  customFields = [],
  houses = [],
  studentToEdit,
  onViewStudentProfile,
  onManageHouses,
  isModal = true,
}: AdmissionWorkspaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const isEditMode = Boolean(studentToEdit);

  // Database Master Data State
  const [storeClasses, setStoreClasses] = useState<any[]>([]);
  const [storeCampuses, setStoreCampuses] = useState<{ id: string; name: string }[]>([]);
  const [storeSessions, setStoreSessions] = useState<{ id: string; name: string }[]>([]);
  const [storeStreams, setStoreStreams] = useState<{ id: string; name: string }[]>([]);
  const [nextIdPreview, setNextIdPreview] = useState<string>('AUTO-GENERATED');
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  // Stepper State (1 to 6)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(studentToEdit?.lastSavedAt);

  // Dialog triggers
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMatchedStudent, setDuplicateMatchedStudent] = useState<StudentDetail | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdStudentResult, setCreatedStudentResult] = useState<StudentDetail | null>(null);

  // STEP 1: Student Identity & Demographics
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(studentToEdit?.photoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [middleName, setMiddleName] = useState(studentToEdit?.middleName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(studentToEdit?.gender || 'Male');
  const [dateOfBirth, setDateOfBirth] = useState(studentToEdit?.dateOfBirth || '');
  const [bloodGroup, setBloodGroup] = useState(studentToEdit?.bloodGroup || 'O+');
  const [nationality, setNationality] = useState(studentToEdit?.nationality || 'Indian');
  const [motherTongue, setMotherTongue] = useState(studentToEdit?.motherTongue || 'English');

  // STEP 2: Contact Information & Address
  const [email, setEmail] = useState(studentToEdit?.email || '');
  const [phone, setPhone] = useState(studentToEdit?.phone || '');
  const [street, setStreet] = useState(studentToEdit?.address?.street || '');
  const [city, setCity] = useState(studentToEdit?.address?.city || '');
  const [stateName, setStateName] = useState(studentToEdit?.address?.state || '');
  const [postalCode, setPostalCode] = useState(studentToEdit?.address?.postalCode || '');
  const [emergencyName, setEmergencyName] = useState(studentToEdit?.health?.doctorName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(studentToEdit?.health?.doctorPhone || '');

  // STEP 3: Multi-Guardian Architecture
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
  const [activeGuardianDialog, setActiveGuardianDialog] = useState(false);
  const [editingGuardianIndex, setEditingGuardianIndex] = useState<number | null>(null);
  const [gName, setGName] = useState('');
  const [gRel, setGRel] = useState<'Father' | 'Mother' | 'Legal Guardian' | 'Grandparent' | 'Other'>('Father');
  const [gPhone, setGPhone] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gOcc, setGOcc] = useState('');

  // STEP 4: Academic Placement
  const [className, setClassName] = useState(studentToEdit?.className || '');
  const [section, setSection] = useState(studentToEdit?.section || '');
  const [stream, setStream] = useState<string>((studentToEdit as any)?.stream || '');
  const [rollNumber, setRollNumber] = useState(studentToEdit?.rollNumber || '');
  const [rollNumberMode, setRollNumberMode] = useState<'AUTO' | 'MANUAL'>(
    (studentToEdit as any)?.rollNumberMode || 'AUTO'
  );
  const [academicSession, setAcademicSession] = useState(
    studentToEdit?.academicSession || '2026-27'
  );
  const [enrollmentDate, setEnrollmentDate] = useState(
    studentToEdit?.enrollmentDate || new Date().toISOString().split('T')[0]
  );
  const [currentCampus, setCurrentCampus] = useState(
    studentToEdit?.currentCampus || 'Main Campus'
  );
  const [houseId, setHouseId] = useState<string | null>(studentToEdit?.houseId ?? null);

  // STEP 5: Documents, Intake Category & Custom Fields
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
        isRequired: false,
        status: 'PENDING',
      },
      {
        id: 'doc-id',
        type: 'ID_PROOF',
        title: 'Aadhaar / National Identity Card',
        isRequired: true,
        status: 'PENDING',
      },
      {
        id: 'doc-tc',
        type: 'TRANSFER_CERTIFICATE',
        title: 'Transfer Certificate (TC)',
        isRequired: false,
        status: 'PENDING',
      },
      {
        id: 'doc-prevmarks',
        type: 'PREVIOUS_MARKSHEET',
        title: 'Previous Class Official Marksheet',
        isRequired: false,
        status: 'PENDING',
      },
    ]
  );
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>(
    studentToEdit?.customFields || {}
  );

  // Fetch Master Data on mount
  useEffect(() => {
    setIsLoadingMasterData(true);

    // 1. Classes
    const fClasses = fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes && Array.isArray(data.classes)) {
          const mapped = data.classes.map((c: any) => ({
            id: c.id,
            className: c.name,
            sections: (c.sections || []).map((s: any) => ({ id: s.id, name: s.name })),
          }));
          setStoreClasses(mapped);
          if (!studentToEdit?.className && mapped.length > 0) {
            setClassName(mapped[0].className);
            if (mapped[0].sections.length > 0) {
              setSection(mapped[0].sections[0].name);
            }
          }
        }
      })
      .catch(() => {});

    // 2. Campuses
    const fCampuses = fetch('/api/campuses')
      .then((res) => res.json())
      .then((data) => {
        if (data.campuses && Array.isArray(data.campuses) && data.campuses.length > 0) {
          setStoreCampuses(data.campuses.map((cp: any) => ({ id: cp.id, name: cp.name })));
        }
      })
      .catch(() => {});

    // 3. Academic Sessions
    const fSessions = fetch('/api/academic-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
          setStoreSessions(data.sessions.map((s: any) => ({ id: s.id, name: s.name })));
        }
      })
      .catch(() => {});

    // 4. Streams
    const fStreams = fetch('/api/streams')
      .then((res) => res.json())
      .then((data) => {
        if (data.streams && Array.isArray(data.streams)) {
          setStoreStreams(data.streams.map((st: any) => ({ id: st.id, name: st.name })));
        }
      })
      .catch(() => {});

    // 5. Next Student ID Preview
    const fNextId = !studentToEdit
      ? fetch('/api/students/next-id')
          .then((res) => res.json())
          .then((data) => {
            if (data.nextId) setNextIdPreview(data.nextId);
          })
          .catch(() => {})
      : Promise.resolve();

    Promise.all([fClasses, fCampuses, fSessions, fStreams, fNextId]).finally(() => {
      setIsLoadingMasterData(false);
    });
  }, [studentToEdit]);

  // Handle Photo File Upload
  const handlePhotoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo exceeds maximum 2MB size limit.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoFile(file);
    setPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/students/photo/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Photo upload failed');
      setPhotoUrl(data.photoUrl);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(err.message || 'Failed to upload photo to Azure storage');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Document Upload / Attach
  const handleDocumentAttach = (type: StudentDocument['type'], file: File) => {
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    setDocuments((prev) =>
      prev.map((d) =>
        d.type === type
          ? {
              ...d,
              fileName: file.name,
              fileSize: sizeStr,
              uploadedAt: nowStr,
              status: 'VERIFIED',
            }
          : d
      )
    );
  };

  const handleDocumentRemove = (type: StudentDocument['type']) => {
    setDocuments((prev) =>
      prev.map((d) =>
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

  // Construct Student Record view-model
  const buildCurrentStudentRecord = (status: StudentDetail['status']): StudentDetail => {
    const primaryGuardian =
      guardians.find((g) => g.isPrimary) ||
      guardians[0] || {
        id: 'grd-default',
        name: 'Parent / Guardian',
        relationship: 'Father' as const,
        phone: phone || '+91 00000 00000',
        isPrimary: true,
      };

    const secondaryGuardian = guardians.find((g) => !g.isPrimary);
    const studentId = studentToEdit?.id || `std-${Date.now().toString(36)}`;
    const admissionNo =
      studentToEdit?.admissionNumber ||
      (status === 'DRAFT' ? `${nextIdPreview}-DFT` : nextIdPreview);

    const rawInput = {
      id: studentId,
      admissionNumber: admissionNo,
      firstName: firstName.trim() || 'Candidate',
      lastName: lastName.trim() || 'Student',
      className: className || 'Class 10',
      section: section || 'A',
      rollNumber: rollNumber.trim() || '01',
      status,
      gender,
      dob: dateOfBirth || '2010-01-01',
      email: email.trim() || `${firstName.toLowerCase() || 'student'}@school.edu`,
      phone: phone.trim() || primaryGuardian.phone,
      bloodGroup,
      street: street.trim() || '',
      city: city.trim() || '',
      state: stateName.trim() || '',
      postalCode: postalCode.trim() || '',
      guardianName: primaryGuardian.name,
      guardianRelation: primaryGuardian.relationship,
      guardianPhone: primaryGuardian.phone,
      guardianEmail: primaryGuardian.email || '',
      guardianOccupation: primaryGuardian.occupation,
      secGuardianName: secondaryGuardian?.name,
      secGuardianRelation: secondaryGuardian?.relationship,
      secGuardianPhone: secondaryGuardian?.phone,
      enrollDate: enrollmentDate,
      admissionType,
      previousSchool: admissionType === 'TRANSFER' ? previousSchool : undefined,
      previousClass: admissionType === 'TRANSFER' ? previousClass : undefined,
      houseId: houseId || null,
      documents,
      health: {
        bloodGroup,
        allergies: 'None reported',
        medications: 'None',
        doctorName: emergencyName.trim() || undefined,
        doctorPhone: emergencyPhone.trim() || undefined,
      },
      identifiers: {
        studentId: admissionNo,
      },
      customFields: customFieldValues,
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const details = buildStudentDetail(rawInput);
    details.guardians = guardians;
    details.documents = documents;
    details.photoUrl = photoUrl;
    details.currentCampus = currentCampus;
    details.houseId = houseId || null;
    (details as any).stream = stream || undefined;
    (details as any).rollNumberMode = rollNumberMode;
    (details as any).campusId = storeCampuses.find((c) => c.name === currentCampus)?.id || undefined;
    (details as any).academicSessionId = storeSessions.find((s) => s.name === academicSession)?.id || undefined;
    return details;
  };

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!firstName.trim()) errs.firstName = 'First name is required.';
      if (!lastName.trim()) errs.lastName = 'Last name is required.';
      if (!dateOfBirth) errs.dateOfBirth = 'Date of birth is required.';
    }

    if (currentStep === 2) {
      if (!street.trim()) errs.street = 'Street address is required.';
      if (!city.trim()) errs.city = 'City is required.';
      if (!stateName.trim()) errs.stateName = 'State is required.';
    }

    if (currentStep === 3) {
      const primaryGrd = guardians.find((g) => g.isPrimary) || guardians[0];
      if (!primaryGrd || !primaryGrd.name.trim()) {
        errs.guardians = 'Primary guardian full name is required.';
      } else if (!primaryGrd.phone.trim()) {
        errs.guardians = 'Primary guardian phone number is required.';
      }
    }

    if (currentStep === 4) {
      if (!className) errs.className = 'Class selection is required.';
      if (!section) errs.section = 'Section allocation is required.';
      if (rollNumberMode === 'MANUAL' && !rollNumber.trim()) {
        errs.rollNumber = 'Roll number is required in Manual mode.';
      }
    }

    if (currentStep === 5) {
      if (admissionType === 'TRANSFER') {
        if (!previousSchool.trim()) {
          errs.previousSchool = 'Previous school name is required for transfer students.';
        }
        const tcDoc = documents.find((d) => d.type === 'TRANSFER_CERTIFICATE');
        if (!tcDoc?.fileName) {
          errs.transferDoc = 'Transfer Certificate (TC) is required for transfer students.';
        }
      }
      // Check required custom fields
      customFields
        .filter((cf) => cf.active && cf.required && cf.showInAdmission)
        .forEach((cf) => {
          const val = customFieldValues[cf.key];
          if (val === undefined || val === null || val === '') {
            errs[`cf_${cf.key}`] = `${cf.name} is a required institutional field.`;
          }
        });
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(6, s + 1) as any);
    }
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(1, s - 1) as any);
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
    }, 300);
  };

  // Final Execution Submission
  const handleFinalSubmit = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      alert('Please resolve all mandatory fields highlighted in the admission sections.');
      return;
    }

    // Duplicate Check
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

    executeEnrollment();
  };

  const executeEnrollment = () => {
    const finalizedStudent = buildCurrentStudentRecord('ACTIVE');
    onSaveStudent(finalizedStudent);
    setCreatedStudentResult(finalizedStudent);
    setShowSuccessDialog(true);
  };

  const handleCloseAttempt = () => {
    const isDirty = Boolean(firstName.trim() || lastName.trim() || street.trim());
    if (isDirty && !createdStudentResult) {
      setShowUnsavedDialog(true);
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student Admission Workspace"
      className={
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto'
          : 'w-full py-6 px-3 sm:px-6'
      }
    >
      <div className="relative w-full max-w-5xl bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden">
        {/* 1. HEADER BANNER (Matching Teacher Module) */}
        <header className="px-6 py-5 border-b bg-card/90 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Students Directory
              </button>
              <span>/</span>
              <span className="text-foreground font-medium">
                {isEditMode ? 'Edit Student Record' : 'Add Student Workspace'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {isEditMode ? `Edit Student — ${firstName} ${lastName}`.trim() : 'Add Student'}
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs py-0.5"
              >
                {isEditMode ? 'Mode: Editing Record' : 'Status: Ready to Enroll'}
              </Badge>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-muted/40 text-xs font-mono font-semibold text-slate-800">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>ID: {studentToEdit?.admissionNumber || nextIdPreview}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Register, allocate class &amp; section roster, and verify credentials for student onboarding.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="text-xs h-8.5 gap-1.5 border-slate-300"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
            </Button>

            {onClose && (
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
                title="Close Workspace"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* 2. HORIZONTAL STEP NAVIGATOR (Across Top - Full Width) */}
        <div className="px-6 py-3 border-b bg-muted/20 shrink-0">
          {/* Desktop Stepper */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto">
            {[
              { n: 1, label: 'Student Identity', icon: User },
              { n: 2, label: 'Contact & Address', icon: MapPin },
              { n: 3, label: 'Parent / Guardian', icon: Users },
              { n: 4, label: 'Academic Placement', icon: GraduationCap },
              { n: 5, label: 'Documents & Category', icon: FileText },
              { n: 6, label: 'Review & Enroll', icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.n;
              const isPassed = step > s.n;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    if (validateStep(step) || s.n < step) {
                      setStep(s.n as any);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-card text-muted-foreground border border-slate-200 hover:bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      isActive
                        ? 'border-white text-white'
                        : isPassed
                        ? 'border-emerald-600 text-emerald-600 bg-white'
                        : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : s.n}
                  </div>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Step {step} of 6
              </span>
              <span className="font-semibold text-slate-800">
                {step === 1 && 'Student Identity'}
                {step === 2 && 'Contact & Address'}
                {step === 3 && 'Parent / Guardian'}
                {step === 4 && 'Academic Placement'}
                {step === 5 && 'Documents & Category'}
                {step === 6 && 'Review & Enroll'}
              </span>
            </div>
            <span className="text-slate-400 text-[11px] font-mono">
              {Math.round((step / 6) * 100)}% Complete
            </span>
          </div>
        </div>

        {/* 3. FULL-WIDTH FORM WORKSPACE (No Side Panel) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-card/40">
          <AnimatePresence mode="wait">
            {/* STEP 1: STUDENT IDENTITY & DEMOGRAPHICS */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <Card className="border shadow-xs bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      Student Information &amp; Demographics
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Legal candidate identity, photograph, birth date, and linguistic background.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Portrait Photo Upload Box (Matching Teacher Module Style) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/30">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                        }}
                        disabled={photoUploading}
                      />
                      <div className="relative h-20 w-20 shrink-0 rounded-2xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center overflow-hidden bg-white shadow-xs">
                        {photoPreview || photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photoPreview || photoUrl}
                            alt="Student Portrait"
                            className="h-full w-full object-cover rounded-2xl"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-slate-400 stroke-[1.5]" />
                        )}
                        {photoUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={photoUploading}
                            className="h-8 text-xs gap-1.5 border-slate-300 cursor-pointer"
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-slate-600" />
                            <span>{photoUrl || photoPreview ? 'Change Photo' : 'Upload Student Photo'}</span>
                          </Button>
                          {(photoUrl || photoPreview) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPhotoUrl(undefined);
                                setPhotoPreview(null);
                                setPhotoFile(null);
                                if (photoInputRef.current) photoInputRef.current.value = '';
                              }}
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50 px-2 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          JPG, PNG, or WebP. Square aspect ratio recommended (up to 2MB).
                        </p>
                      </div>
                    </div>

                    {/* Name Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Rahul"
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.firstName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {validationErrors.firstName && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.firstName}</p>
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
                          placeholder="e.g. Kumar (Optional)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                          placeholder="e.g. Sharma"
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.lastName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {validationErrors.lastName && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Demographics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.dateOfBirth ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {validationErrors.dateOfBirth && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.dateOfBirth}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Nationality & Mother Tongue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="e.g. Indian"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                          placeholder="e.g. English, Hindi, Gujarati"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: CONTACT & RESIDENTIAL ADDRESS */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <Card className="border shadow-xs bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Contact Coordinates &amp; Residential Address
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Student electronic address, primary communication channels, and residential jurisdiction.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Electronic Coordinates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Student Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student.name@institution.edu"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Residential Street Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="e.g. 42 Orchid Heights, Sector 18"
                        className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                          validationErrors.street ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.street && (
                        <p className="text-[11px] text-rose-500 mt-1">{validationErrors.street}</p>
                      )}
                    </div>

                    {/* City, State, Postal Code Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Ahmedabad"
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.city ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {validationErrors.city && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          State / Province <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="e.g. Gujarat"
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.stateName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {validationErrors.stateName && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.stateName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Postal / PIN Code
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="e.g. 380015"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Emergency Medical Contact (Optional)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Doctor / Contact Name
                          </label>
                          <input
                            type="text"
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            placeholder="Dr. Rajesh Mehta"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Emergency Phone Number
                          </label>
                          <input
                            type="tel"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="+91 98000 00000"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3: PARENT / GUARDIAN ROSTER */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <Card className="border shadow-xs bg-card">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Parent &amp; Guardian Information
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure primary and secondary guardians for automated communications and emergency notifications.
                      </CardDescription>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingGuardianIndex(null);
                        setGName('');
                        setGRel('Mother');
                        setGPhone('');
                        setGEmail('');
                        setGOcc('');
                        setActiveGuardianDialog(true);
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Guardian
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {validationErrors.guardians && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{validationErrors.guardians}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {guardians.map((g, idx) => (
                        <div
                          key={g.id || idx}
                          className={`p-4 rounded-xl border transition-all ${
                            g.isPrimary
                              ? 'border-emerald-500/30 bg-emerald-50/20 shadow-xs'
                              : 'border-slate-200 bg-background'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{g.name || 'Unnamed Guardian'}</span>
                                <Badge variant="secondary" className="text-[11px] font-medium">
                                  {g.relationship}
                                </Badge>
                                {g.isPrimary && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] py-0">
                                    Primary Contact
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {g.phone || 'No phone'}
                                </span>
                                {g.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {g.email}
                                  </span>
                                )}
                                {g.occupation && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    {g.occupation}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {!g.isPrimary && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setGuardians((prev) =>
                                      prev.map((item, i) => ({
                                        ...item,
                                        isPrimary: i === idx,
                                      }))
                                    );
                                  }}
                                  className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8"
                                >
                                  Make Primary
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingGuardianIndex(idx);
                                  setGName(g.name);
                                  setGRel(g.relationship as any);
                                  setGPhone(g.phone);
                                  setGEmail(g.email || '');
                                  setGOcc(g.occupation || '');
                                  setActiveGuardianDialog(true);
                                }}
                                className="text-xs h-8 px-2.5"
                              >
                                Edit
                              </Button>

                              {guardians.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setGuardians((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="text-xs h-8 text-rose-600 hover:bg-rose-50 px-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 4: ACADEMIC PLACEMENT */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <Card className="border shadow-xs bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      Academic Enrollment &amp; Roster Allocation
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Assign campus, academic session, class division, stream, house, and roll sequence.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Class & Section (Cascading) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Enrolled Class / Grade <span className="text-rose-500">*</span>
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
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.className ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        >
                          {storeClasses.length > 0 ? (
                            storeClasses.map((c) => (
                              <option key={c.id} value={c.className}>
                                {c.className}
                              </option>
                            ))
                          ) : (
                            <option value="">No classes configured</option>
                          )}
                        </select>
                        {validationErrors.className && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.className}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Assigned Section / Division <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            validationErrors.section ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        >
                          {(storeClasses.find((c) => c.className === className)?.sections || []).length > 0 ? (
                            (storeClasses.find((c) => c.className === className)?.sections || []).map((s: any) => (
                              <option key={s.id} value={s.name}>
                                Section {s.name}
                              </option>
                            ))
                          ) : (
                            <option value="A">Section A</option>
                          )}
                        </select>
                        {validationErrors.section && (
                          <p className="text-[11px] text-rose-500 mt-1">{validationErrors.section}</p>
                        )}
                      </div>
                    </div>

                    {/* Stream & House Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Academic Stream (Optional)
                        </label>
                        {storeStreams.length > 0 ? (
                          <select
                            value={stream}
                            onChange={(e) => setStream(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          >
                            <option value="">General Curriculum / None</option>
                            {storeStreams.map((st) => (
                              <option key={st.id} value={st.name}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={stream}
                            onChange={(e) => setStream(e.target.value)}
                            placeholder="e.g. Science, Commerce, Arts (Optional)"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          School House Allocation (Optional)
                        </label>
                        <select
                          value={houseId || ''}
                          onChange={(e) => setHouseId(e.target.value === '' ? null : e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                      </div>
                    </div>

                    {/* Campus, Session & Effective Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Campus Location
                        </label>
                        <select
                          value={currentCampus}
                          onChange={(e) => setCurrentCampus(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          {storeCampuses.length > 0
                            ? storeCampuses.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))
                            : CAMPUS_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Academic Session
                        </label>
                        {storeSessions.length > 0 ? (
                          <select
                            value={academicSession}
                            onChange={(e) => setAcademicSession(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          >
                            {storeSessions.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={academicSession}
                            onChange={(e) => setAcademicSession(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Enrollment Effective Date
                        </label>
                        <input
                          type="date"
                          value={enrollmentDate}
                          onChange={(e) => setEnrollmentDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Roll Number Mode Selection */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-muted/20 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800">
                            Roll Number Allocation Mode
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Configure automatic alphabetical rank sequence or specify a manual roll number.
                          </p>
                        </div>

                        <div className="inline-flex rounded-lg border border-slate-200 bg-background p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setRollNumberMode('AUTO');
                              setRollNumber('');
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                              rollNumberMode === 'AUTO'
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Auto (Alphabetical A–Z)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRollNumberMode('MANUAL')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                              rollNumberMode === 'MANUAL'
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Manual Override
                          </button>
                        </div>
                      </div>

                      {rollNumberMode === 'AUTO' ? (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Deterministic alphabetical rank will be assigned on enrollment across active candidates in <strong>{className || 'Class'} - {section || 'Section'}</strong>.
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Manual Roll Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            placeholder="e.g. 15, 101, A-04"
                            className={`w-full max-w-xs px-3 py-2 text-sm rounded-lg border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                              validationErrors.rollNumber ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                            }`}
                          />
                          {validationErrors.rollNumber && (
                            <p className="text-[11px] text-rose-500 mt-1">{validationErrors.rollNumber}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 5: INTAKE CATEGORY, DOCUMENTS & CUSTOM FIELDS */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <Card className="border shadow-xs bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Admission Category &amp; Intake Documents
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Attach verified identity proofs, certificates, and school-configured fields.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Admission Category Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Admission Intake Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'FIRST_TIME', title: 'First-Time Admission', desc: 'New entrant or kindergarten' },
                          { id: 'TRANSFER', title: 'Lateral Transfer', desc: 'Joining with previous TC & marksheets' },
                          { id: 'RETURNING', title: 'Returning Student', desc: 'Re-enrollment or sabbatical' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setAdmissionType(cat.id as any)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                              admissionType === cat.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-background text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="block text-xs font-bold">{cat.title}</span>
                            <span
                              className={`block text-[11px] mt-0.5 ${
                                admissionType === cat.id ? 'text-emerald-100' : 'text-muted-foreground'
                              }`}
                            >
                              {cat.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conditional Transfer Fields */}
                    {admissionType === 'TRANSFER' && (
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Previous School Records (Required for Transfer)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Previous Institution Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={previousSchool}
                              onChange={(e) => setPreviousSchool(e.target.value)}
                              placeholder="e.g. St. Xavier's High School"
                              className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                validationErrors.previousSchool ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                              }`}
                            />
                            {validationErrors.previousSchool && (
                              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.previousSchool}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Previous Class Passed
                            </label>
                            <input
                              type="text"
                              value={previousClass}
                              onChange={(e) => setPreviousClass(e.target.value)}
                              placeholder="e.g. Grade 9 (CBSE)"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Document Uploads Grid */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Intake Verification Documents
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                          const isUploaded = Boolean(doc.fileName);
                          const isRequired =
                            doc.type === 'ID_PROOF' ||
                            (admissionType === 'TRANSFER' &&
                              (doc.type === 'TRANSFER_CERTIFICATE' || doc.type === 'PREVIOUS_MARKSHEET'));

                          return (
                            <div
                              key={doc.id || doc.type}
                              className={`p-4 rounded-xl border transition-all ${
                                isUploaded
                                  ? 'border-emerald-500/30 bg-emerald-50/10'
                                  : 'border-slate-200 bg-background'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                                    {isRequired ? (
                                      <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50">
                                        Required
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-slate-500">
                                        Optional
                                      </Badge>
                                    )}
                                  </div>

                                  {isUploaded ? (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-emerald-800 flex items-center gap-1 truncate">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{doc.fileName}</span>
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        Size: {doc.fileSize || 'Attached'} • {doc.uploadedAt || 'Ready'}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      Attach digital PDF or image scan for official records.
                                    </p>
                                  )}
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="application/pdf,image/jpeg,image/png"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDocumentAttach(doc.type, file);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="h-8 text-xs border-slate-300 cursor-pointer pointer-events-none"
                                    >
                                      <span>{isUploaded ? 'Replace' : 'Upload'}</span>
                                    </Button>
                                  </label>

                                  {isUploaded && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDocumentRemove(doc.type)}
                                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 px-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* School Custom Fields (if configured) */}
                    {customFields.filter((cf) => cf.active && cf.showInAdmission).length > 0 && (
                      <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>School Custom Fields</span>
                        </div>

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
                                error={validationErrors[`cf_${field.key}`]}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 6: REVIEW & FINAL SUBMIT */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <AdmissionReview
                  data={buildCurrentStudentRecord('ACTIVE')}
                  customFields={customFields.filter((cf) => cf.active && cf.showInAdmission)}
                  houses={houses}
                  onEditSection={(secId) => {
                    if (secId === 'personal') setStep(1);
                    else if (secId === 'contact') setStep(2);
                    else if (secId === 'family') setStep(3);
                    else if (secId === 'academic') setStep(4);
                    else if (secId === 'documents') setStep(5);
                  }}
                  onConfirmSubmit={handleFinalSubmit}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. CLEAN BOTTOM ACTION FOOTER (No Sidebar) */}
        <footer className="px-6 py-4 border-t bg-card/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseAttempt}
              className="text-xs border-slate-300 text-muted-foreground hover:text-foreground"
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
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>{lastSavedAt ? `Saved at ${lastSavedAt}` : 'Save Draft'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevStep}
                className="text-xs border-slate-300 text-slate-700 gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}

            {step < 6 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNextStep}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleFinalSubmit}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'Save Changes' : 'Confirm & Enroll Student'}</span>
              </Button>
            )}
          </div>
        </footer>
      </div>

      {/* GUARDIAN ADD/EDIT MODAL */}
      <Dialog open={activeGuardianDialog} onOpenChange={setActiveGuardianDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingGuardianIndex !== null ? 'Edit Guardian Details' : 'Add New Guardian'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Parent or legal guardian contact details for student notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder="e.g. Meera Sharma"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gRel}
                  onChange={(e) => setGRel(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {['Father', 'Mother', 'Legal Guardian', 'Grandparent', 'Other'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={gPhone}
                  onChange={(e) => setGPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={gEmail}
                  onChange={(e) => setGEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation (Optional)
                </label>
                <input
                  type="text"
                  value={gOcc}
                  onChange={(e) => setGOcc(e.target.value)}
                  placeholder="e.g. Engineer"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveGuardianDialog(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!gName.trim() || !gPhone.trim()) {
                  alert('Guardian name and phone number are required.');
                  return;
                }
                const newGrd: StudentGuardian = {
                  id:
                    editingGuardianIndex !== null
                      ? guardians[editingGuardianIndex].id
                      : `grd-${Date.now().toString(36)}`,
                  name: gName.trim(),
                  relationship: gRel,
                  phone: gPhone.trim(),
                  email: gEmail.trim() || undefined,
                  occupation: gOcc.trim() || undefined,
                  isPrimary: editingGuardianIndex !== null ? guardians[editingGuardianIndex].isPrimary : guardians.length === 0,
                  receiveSMS: true,
                  receiveEmail: true,
                  emergencyContact: true,
                };

                if (editingGuardianIndex !== null) {
                  setGuardians((prev) =>
                    prev.map((g, i) => (i === editingGuardianIndex ? newGrd : g))
                  );
                } else {
                  setGuardians((prev) => [...prev, newGrd]);
                }
                setActiveGuardianDialog(false);
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Save Guardian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DUPLICATE DETECTION MODAL */}
      <DuplicateDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        matchedStudent={duplicateMatchedStudent}
        onProceedAnyway={() => {
          setShowDuplicateDialog(false);
          executeEnrollment();
        }}
        onViewExisting={(student) => {
          setShowDuplicateDialog(false);
          if (onClose) onClose();
          if (onViewStudentProfile) onViewStudentProfile(student);
        }}
      />

      {/* UNSAVED CHANGES MODAL */}
      <UnsavedDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSaveDraft={() => {
          handleSaveDraft();
          setShowUnsavedDialog(false);
          if (onClose) onClose();
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          if (onClose) onClose();
        }}
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      <SubmitSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        createdStudent={createdStudentResult}
        onViewStudent={(student) => {
          setShowSuccessDialog(false);
          if (onClose) onClose();
          if (onViewStudentProfile) onViewStudentProfile(student);
        }}
        onAddAnother={() => {
          setShowSuccessDialog(false);
          setFirstName('');
          setLastName('');
          setMiddleName('');
          setPhotoUrl(undefined);
          setPhotoPreview(null);
          setStreet('');
          setStep(1);
          setCreatedStudentResult(null);
        }}
      />
    </div>
  );
}
