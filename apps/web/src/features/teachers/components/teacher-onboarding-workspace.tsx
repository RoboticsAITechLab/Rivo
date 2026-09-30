'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Briefcase,
  GraduationCap,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  Check,
  ArrowRight,
  ExternalLink,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  STANDARD_TEACHER_DOCUMENTS,
  DocumentDefinition,
  calculateDocumentChecklist,
  maskDocumentNumber,
} from '@/lib/teachers/document-catalog';

export interface StagedDocument {
  file: File;
  previewUrl: string;
  documentType: string;
  category: 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM';
  title: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  isRequired: boolean;
}

export interface TeacherAssignmentInput {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  streamId?: string;
  periodsPerWeek: number;
  isClassTeacher: boolean;
}

interface TeacherOnboardingWorkspaceProps {
  teacherIdToEdit?: string;
  onSuccess?: (createdOrUpdatedTeacher: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function TeacherOnboardingWorkspace({
  teacherIdToEdit,
  onSuccess,
  onCancel,
  isModal = false,
}: TeacherOnboardingWorkspaceProps) {
  const router = useRouter();
  const isEditMode = Boolean(teacherIdToEdit);

  // Master Data State from real Database
  const [subjects, setSubjects] = React.useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [classes, setClasses] = React.useState<Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }>>([]);
  const [campuses, setCampuses] = React.useState<Array<{ id: string; name: string; isMain: boolean }>>([]);
  const [sessions, setSessions] = React.useState<Array<{ id: string; name: string; isCurrent: boolean }>>([]);
  const [requiredDocTypes, setRequiredDocTypes] = React.useState<string[]>([
    'AADHAAR_CARD',
    'PAN_CARD',
    'CLASS_10_MARKSHEET',
    'GRADUATION_DEGREE',
    'BED_DEGREE',
    'APPOINTMENT_LETTER',
    'JOINING_LETTER',
  ]);
  const [customDocTypes, setCustomDocTypes] = React.useState<any[]>([]);
  const [nextIdPreview, setNextIdPreview] = React.useState<string>('AUTO-GENERATED');
  const [isLoadingMasterData, setIsLoadingMasterData] = React.useState(true);
  const [isLoadingTeacherData, setIsLoadingTeacherData] = React.useState(Boolean(teacherIdToEdit));
  const [subjectsError, setSubjectsError] = React.useState<string | null>(null);

  // Form State: Step 1 - Personal Information
  const [firstName, setFirstName] = React.useState('');
  const [middleName, setMiddleName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [gender, setGender] = React.useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = React.useState('O+');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Profile Photo Upload State
  const [photoUrl, setPhotoUrl] = React.useState('');
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  // Address
  const [street, setStreet] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateName, setStateName] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = React.useState('');
  const [emergencyRelation, setEmergencyRelation] = React.useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = React.useState('');

  // Form State: Step 2 - Professional Information
  const [employeeId, setEmployeeId] = React.useState('AUTO');
  const [joiningDate, setJoiningDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [employmentType, setEmploymentType] = React.useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING'>('FULL_TIME');
  const [department, setDepartment] = React.useState('Mathematics');
  const [designation, setDesignation] = React.useState('Senior PGT Teacher');
  const [experienceYears, setExperienceYears] = React.useState<number>(5);
  const [selectedCampusId, setSelectedCampusId] = React.useState<string>('');

  // Form State: Step 3 - Academic & Qualifications
  const [highestQualification, setHighestQualification] = React.useState('Post Graduation');
  const [qualificationDetails, setQualificationDetails] = React.useState('');
  const [specialization, setSpecialization] = React.useState('');
  const [universityName, setUniversityName] = React.useState('');
  const [passingYear, setPassingYear] = React.useState(new Date().getFullYear() - 5);
  const [tetCertification, setTetCertification] = React.useState<'NONE' | 'CTET_1' | 'CTET_2' | 'STATE_TET' | 'NET_SET'>('CTET_2');

  // Form State: Step 4 - Teaching Assignments
  const [assignments, setAssignments] = React.useState<TeacherAssignmentInput[]>([]);
  const [subjectSearchTerms, setSubjectSearchTerms] = React.useState<Record<string, string>>({});

  // Form State: Step 5 - Documents & KYC Staged Storage
  const [stagedDocuments, setStagedDocuments] = React.useState<Record<string, StagedDocument>>({});
  const [documentMetadata, setDocumentMetadata] = React.useState<Record<string, { documentNumber?: string; issueDate?: string; expiryDate?: string }>>({});
  const [activeDocCategory, setActiveDocCategory] = React.useState<'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM'>('KYC');
  const [previewDocUrl, setPreviewDocUrl] = React.useState<string | null>(null);

  // Step and Validation State
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [showExitModal, setShowExitModal] = React.useState(false);
  const [showMissingDocsModal, setShowMissingDocsModal] = React.useState(false);

  // Submission / Execution State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionProgress, setSubmissionProgress] = React.useState<{
    stage: 'CREATING_TEACHER' | 'UPLOADING_DOCS' | 'FINALIZING' | 'SUCCESS' | 'ERROR';
    currentDocIndex: number;
    totalDocs: number;
    currentDocName: string;
    errorMsg?: string;
  }>({
    stage: 'CREATING_TEACHER',
    currentDocIndex: 0,
    totalDocs: 0,
    currentDocName: '',
  });
  const [createdTeacherResult, setCreatedTeacherResult] = React.useState<any>(null);

  // Load Real School Master Data
  const loadMasterData = React.useCallback(async () => {
    setIsLoadingMasterData(true);
    setSubjectsError(null);
    try {
      const [subRes, clsRes, campRes, sessRes, docSettingsRes, nextIdRes] = await Promise.all([
        fetch('/api/subjects').then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.message || `Failed to fetch subjects (${r.status})`);
          }
          return r.json();
        }),
        fetch('/api/classes').then(async (r) => {
          if (!r.ok) return { classes: [] };
          return r.json();
        }).catch(() => ({ classes: [] })),
        fetch('/api/campuses').then(async (r) => {
          if (!r.ok) return { campuses: [] };
          return r.json();
        }).catch(() => ({ campuses: [] })),
        fetch('/api/academic-sessions').then(async (r) => {
          if (!r.ok) return { sessions: [] };
          return r.json();
        }).catch(() => ({ sessions: [] })),
        fetch('/api/school/settings/teacher-documents').then(async (r) => {
          if (!r.ok) return {};
          return r.json();
        }).catch(() => ({})),
        fetch('/api/teachers/next-id').then(async (r) => {
          if (!r.ok) return {};
          return r.json();
        }).catch(() => ({})),
      ]);

      const loadedSubjects: Array<{ id: string; name: string; code?: string }> = Array.isArray(subRes.subjects) ? subRes.subjects : [];
      const loadedClasses: Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }> = Array.isArray(clsRes.classes) ? clsRes.classes : [];

      setSubjects(loadedSubjects);
      setClasses(loadedClasses);

      if (Array.isArray(campRes.campuses)) {
        setCampuses(campRes.campuses);
        const main = campRes.campuses.find((c: any) => c.isMain);
        if (main) setSelectedCampusId(main.id);
      }
      if (Array.isArray(sessRes.sessions)) {
        setSessions(sessRes.sessions);
      }
      if (Array.isArray(docSettingsRes.requiredDocumentTypes)) {
        setRequiredDocTypes(docSettingsRes.requiredDocumentTypes);
      }
      if (Array.isArray(docSettingsRes.customDocumentTypes)) {
        setCustomDocTypes(docSettingsRes.customDocumentTypes);
      }
      if (nextIdRes.nextId) {
        setNextIdPreview(nextIdRes.nextId);
      }

      // Initialize default assignment if none exist or need initialization
      setAssignments((prev) => {
        if (prev.length > 0) {
          // If existing assignments have empty subjectId, fill with first valid subject
          return prev.map((a) => {
            if (!a.subjectId && loadedSubjects.length > 0) {
              return {
                ...a,
                subjectId: loadedSubjects[0].id,
                subjectName: loadedSubjects[0].name,
              };
            }
            return a;
          });
        }

        if (loadedSubjects.length > 0) {
          const firstCls = loadedClasses.length > 0 ? loadedClasses[0] : null;
          const firstSec = firstCls?.sections?.[0];
          const firstSub = loadedSubjects[0];
          return [
            {
              id: `asg-${Date.now()}`,
              classId: firstCls?.id || '',
              className: firstCls?.name || 'Class',
              sectionId: firstSec?.id || '',
              sectionName: firstSec?.name || 'A',
              subjectId: firstSub.id,
              subjectName: firstSub.name,
              periodsPerWeek: 6,
              isClassTeacher: false,
            },
          ];
        }
        return [];
      });
    } catch (err: any) {
      console.error('Failed loading school master data:', err);
      setSubjectsError(err.message || 'Unable to communicate with the subject catalog.');
    } finally {
      setIsLoadingMasterData(false);
    }
  }, []);

  React.useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load existing teacher for editing if teacherIdToEdit is provided
  React.useEffect(() => {
    if (!teacherIdToEdit) return;

    let isMounted = true;
    setIsLoadingTeacherData(true);

    fetch(`/api/teachers/${teacherIdToEdit}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Teacher record not found');
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data.teacher) return;
        const t = data.teacher;

        if (t.firstName) setFirstName(t.firstName);
        if (t.middleName) setMiddleName(t.middleName);
        if (t.lastName) setLastName(t.lastName);
        if (t.email) setEmail(t.email);
        if (t.phone) setPhone(t.phone);
        if (t.dateOfBirth) setDateOfBirth(t.dateOfBirth);
        if (t.gender) setGender(t.gender);
        if (t.bloodGroup) setBloodGroup(t.bloodGroup);
        if (t.photoUrl) setPhotoUrl(t.photoUrl);
        if (t.employeeId) setEmployeeId(t.employeeId);
        if (t.joiningDate) setJoiningDate(t.joiningDate);
        if (t.employmentType) setEmploymentType(t.employmentType);
        if (t.department) setDepartment(t.department);
        if (t.designation) setDesignation(t.designation);
        if (t.experienceYears !== undefined) setExperienceYears(Number(t.experienceYears));
        if (t.campusId) setSelectedCampusId(t.campusId);
        if (t.qualification) setQualificationDetails(t.qualification);
        if (t.specialization) setSpecialization(t.specialization);
        if (t.address) setStreet(t.address);
        if (t.emergencyContactName) setEmergencyName(t.emergencyContactName);
        if (t.emergencyContactPhone) setEmergencyPhone(t.emergencyContactPhone);
        if (t.emergencyContactRelation) setEmergencyRelation(t.emergencyContactRelation);

        if (Array.isArray(t.assignments) && t.assignments.length > 0) {
          setAssignments(
            t.assignments.map((a: any) => ({
              id: a.id || `asg-${Date.now()}-${Math.random()}`,
              classId: a.classId || '',
              className: a.className || '',
              sectionId: a.sectionId || '',
              sectionName: a.sectionName || '',
              subjectId: a.subjectId || '',
              subjectName: a.subjectName || '',
              streamId: a.streamId || '',
              periodsPerWeek: a.periodsPerWeek || 6,
              isClassTeacher: Boolean(a.isClassTeacher),
            }))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load teacher for editing:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTeacherData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [teacherIdToEdit]);

  // Photo Upload Handler with Azure
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo size must not exceed 2MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Invalid image format. Allowed: JPEG, PNG, WebP.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError(null);
    setPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/teachers/photo/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload photo');
      }
      setPhotoUrl(data.photoUrl || data.storageKey);
    } catch (err: any) {
      setPhotoError(err.message || 'Error uploading photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Document Staging Handler
  const handleStageDocument = (docDef: DocumentDefinition, file: File) => {
    if (file.size > docDef.maxSizeMb * 1024 * 1024) {
      alert(`File size exceeds maximum allowed limit of ${docDef.maxSizeMb}MB.`);
      return;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!docDef.allowedExtensions.includes(ext) && !docDef.allowedExtensions.includes('.' + file.type.split('/')[1])) {
      alert(`Invalid file extension. Allowed: ${docDef.allowedExtensions.join(', ')}`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const meta = documentMetadata[docDef.code] || {};
    const isRequired = requiredDocTypes.includes(docDef.code);

    setStagedDocuments((prev) => ({
      ...prev,
      [docDef.code]: {
        file,
        previewUrl,
        documentType: docDef.code,
        category: docDef.category,
        title: docDef.name,
        documentNumber: meta.documentNumber,
        issueDate: meta.issueDate,
        expiryDate: meta.expiryDate,
        isRequired,
      },
    }));
  };

  const handleRemoveStagedDocument = (docCode: string) => {
    setStagedDocuments((prev) => {
      const copy = { ...prev };
      if (copy[docCode]?.previewUrl) {
        URL.revokeObjectURL(copy[docCode].previewUrl);
      }
      delete copy[docCode];
      return copy;
    });
  };

  const handleMetadataChange = (docCode: string, field: 'documentNumber' | 'issueDate' | 'expiryDate', value: string) => {
    setDocumentMetadata((prev) => ({
      ...prev,
      [docCode]: {
        ...prev[docCode],
        [field]: value,
      },
    }));
    if (stagedDocuments[docCode]) {
      setStagedDocuments((prev) => ({
        ...prev,
        [docCode]: {
          ...prev[docCode],
          [field]: value,
        },
      }));
    }
  };

  // Assignment Helpers
  const handleAddAssignment = () => {
    if (subjects.length === 0) return;

    // Pick next unassigned subject or default to first
    const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId));
    const nextSubject = subjects.find((s) => !assignedSubjectIds.has(s.id)) || subjects[0];

    const defaultCls = classes.length > 0 ? classes[0] : null;
    const defaultSec = defaultCls?.sections?.[0];

    setAssignments((prev) => [
      ...prev,
      {
        id: `asg-${Date.now()}-${Math.random()}`,
        classId: defaultCls?.id || '',
        className: defaultCls?.name || 'Class',
        sectionId: defaultSec?.id || '',
        sectionName: defaultSec?.name || 'A',
        subjectId: nextSubject.id,
        subjectName: nextSubject.name,
        periodsPerWeek: 4,
        isClassTeacher: false,
      },
    ]);
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAssignmentChange = (
    id: string,
    field: keyof TeacherAssignmentInput,
    value: any
  ) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (field === 'classId') {
          const cls = classes.find((c) => c.id === value);
          const firstSec = cls?.sections?.[0];
          return {
            ...a,
            classId: value,
            className: cls?.name || 'Class',
            sectionId: firstSec?.id || '',
            sectionName: firstSec?.name || 'A',
          };
        }
        if (field === 'sectionId') {
          const cls = classes.find((c) => c.id === a.classId);
          const sec = cls?.sections?.find((s) => s.id === value);
          return {
            ...a,
            sectionId: value,
            sectionName: sec?.name || 'Section',
          };
        }
        if (field === 'subjectId') {
          const sub = subjects.find((s) => s.id === value);
          return {
            ...a,
            subjectId: value,
            subjectName: sub?.name || 'Subject',
          };
        }
        return { ...a, [field]: value };
      })
    );
  };

  // Validation Rules
  const validateCurrentStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!firstName.trim()) errs.firstName = 'First name is required';
      if (!lastName.trim()) errs.lastName = 'Last name is required';
      if (!email.trim()) {
        errs.email = 'Official email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errs.email = 'Invalid email address';
      }
      if (!phone.trim()) {
        errs.phone = 'Contact phone is required';
      } else if (phone.replace(/\D/g, '').length < 10) {
        errs.phone = 'Phone number must be at least 10 digits';
      }
      if (!dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    }

    if (currentStep === 2) {
      if (!department.trim()) errs.department = 'Academic department is required';
      if (!designation.trim()) errs.designation = 'Official designation is required';
      if (!joiningDate) errs.joiningDate = 'Date of joining is required';
    }

    if (currentStep === 4) {
      if (assignments.length === 0) {
        errs.assignments = 'At least one teaching assignment or subject allocation is required';
      }
      // Check duplicate assignment
      const keySet = new Set<string>();
      for (const a of assignments) {
        const key = `${a.classId}_${a.sectionId}_${a.subjectId}`;
        if (keySet.has(key)) {
          errs.assignments = `Duplicate assignment detected for ${a.className}-${a.sectionName} in ${a.subjectName}. Each division-subject pair must be unique.`;
          break;
        }
        keySet.add(key);
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(step)) {
      setStep((s) => Math.min(6, s + 1) as any);
    }
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(1, s - 1) as any);
  };

  // Document Checklist Computation
  const stagedDocsArray = Object.values(stagedDocuments).map((d) => ({
    documentType: d.documentType,
    status: 'UNDER_REVIEW',
  }));
  const checklist = calculateDocumentChecklist(stagedDocsArray, requiredDocTypes);

  // Full Execution Pipeline (Single 1-Click Action)
  const handleExecuteOnboarding = async () => {
    if (!validateCurrentStep(1) || !validateCurrentStep(2) || !validateCurrentStep(4)) {
      alert('Please fill all required personal, employment, and assignment details.');
      return;
    }

    // Check if missing required documents
    if (checklist.missingRequiredTypes.length > 0 && !showMissingDocsModal) {
      setShowMissingDocsModal(true);
      return;
    }

    setShowMissingDocsModal(false);
    setIsSubmitting(true);
    setSubmissionProgress({
      stage: 'CREATING_TEACHER',
      currentDocIndex: 0,
      totalDocs: Object.keys(stagedDocuments).length,
      currentDocName: 'Faculty Account & Records',
    });

    try {
      // Step 1: Create Teacher Profile & Assignments transactionally
      const teacherPayload = {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        phone: phone.trim(),
        photoUrl: photoUrl || null,
        gender,
        bloodGroup,
        dateOfBirth: dateOfBirth || null,
        joiningDate: joiningDate || null,
        employmentType,
        experienceYears: Number(experienceYears) || 0,
        department: department.trim(),
        designation: designation.trim(),
        qualification: `${highestQualification}${qualificationDetails ? ` (${qualificationDetails})` : ''} • ${specialization}`.trim(),
        specialization: specialization.trim() || null,
        campusId: selectedCampusId || null,
        street: street.trim() || null,
        city: city.trim() || null,
        state: stateName.trim() || null,
        postalCode: postalCode.trim() || null,
        emergencyContactName: emergencyName.trim() || null,
        emergencyContactRelation: emergencyRelation.trim() || null,
        emergencyContactPhone: emergencyPhone.trim() || null,
        assignments: assignments.map((a) => ({
          classId: a.classId || null,
          sectionId: a.sectionId || null,
          streamId: a.streamId || null,
          subjectId: a.subjectId,
          periodsPerWeek: a.periodsPerWeek,
          isClassTeacher: a.isClassTeacher,
        })),
      };

      let activeTeacherId = teacherIdToEdit;
      let resultingTeacher: any = null;

      if (isEditMode) {
        const updatePayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          photoUrl: photoUrl || null,
          gender,
          dateOfBirth: dateOfBirth || null,
          joiningDate: joiningDate || null,
          employmentType,
          experienceYears: Number(experienceYears) || 0,
          department: department.trim(),
          designation: designation.trim(),
          qualification: `${highestQualification}${qualificationDetails ? ` (${qualificationDetails})` : ''} • ${specialization}`.trim(),
          specialization: specialization.trim() || null,
          campusId: selectedCampusId || null,
          address: street.trim() || null,
          emergencyContactName: emergencyName.trim() || null,
          emergencyContactRelation: emergencyRelation.trim() || null,
          emergencyContactPhone: emergencyPhone.trim() || null,
          assignments: assignments.map((a) => ({
            classId: a.classId || null,
            sectionId: a.sectionId || null,
            streamId: a.streamId || null,
            subjectId: a.subjectId,
            periodsPerWeek: a.periodsPerWeek,
            isClassTeacher: a.isClassTeacher,
          })),
        };

        const res = await fetch(`/api/teachers/${teacherIdToEdit}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update teacher profile.');
        }
        resultingTeacher = data.teacher || { id: teacherIdToEdit, firstName, lastName };
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherPayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create teacher profile.');
        }

        resultingTeacher = data.teacher;
        activeTeacherId = resultingTeacher.id;
      }

      const stagedList = Object.values(stagedDocuments);

      // Step 2: Upload staged documents sequentially linked to teacher ID
      if (stagedList.length > 0 && activeTeacherId) {
        setSubmissionProgress((prev) => ({
          ...prev,
          stage: 'UPLOADING_DOCS',
        }));

        for (let i = 0; i < stagedList.length; i++) {
          const doc = stagedList[i];
          setSubmissionProgress((prev) => ({
            ...prev,
            currentDocIndex: i + 1,
            currentDocName: doc.title,
          }));

          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('documentType', doc.documentType);
          formData.append('category', doc.category);
          formData.append('title', doc.title);
          formData.append('isRequired', String(doc.isRequired));
          if (doc.documentNumber) formData.append('documentNumber', doc.documentNumber);
          if (doc.issueDate) formData.append('issueDate', doc.issueDate);
          if (doc.expiryDate) formData.append('expiryDate', doc.expiryDate);

          const docRes = await fetch(`/api/teachers/${activeTeacherId}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!docRes.ok) {
            const docErr = await docRes.json().catch(() => ({}));
            console.warn(`Warning: Could not upload document ${doc.title}:`, docErr.message);
          }
        }
      }

      // Step 3: Success state
      setSubmissionProgress({
        stage: 'SUCCESS',
        currentDocIndex: stagedList.length,
        totalDocs: stagedList.length,
        currentDocName: 'Complete',
      });
      setCreatedTeacherResult(resultingTeacher);

      if (onSuccess) {
        onSuccess(resultingTeacher);
      }
    } catch (err: any) {
      console.error('Teacher save execution error:', err);
      setSubmissionProgress((prev) => ({
        ...prev,
        stage: 'ERROR',
        errorMsg: err.message || 'An unexpected error occurred while saving teacher record.',
      }));
    }
  };

  // If successfully created, display rich success screen
  if (submissionProgress.stage === 'SUCCESS' && createdTeacherResult) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <Card className="border-emerald-200 dark:border-emerald-900 shadow-xl overflow-hidden bg-gradient-to-b from-card to-emerald-500/5">
          <div className="bg-emerald-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Teacher Onboarded Successfully</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
              {firstName} {lastName} has been successfully registered in your institutional ERP.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-muted/30">
                <span className="text-xs text-muted-foreground block font-medium">Employee Staff ID</span>
                <span className="text-base font-mono font-bold text-foreground">
                  {createdTeacherResult.employeeId || nextIdPreview}
                </span>
              </div>
              <div className="p-4 rounded-xl border bg-muted/30">
                <span className="text-xs text-muted-foreground block font-medium">Department & Role</span>
                <span className="text-base font-semibold text-foreground">
                  {department} • {designation}
                </span>
              </div>
              <div className="p-4 rounded-xl border bg-muted/30">
                <span className="text-xs text-muted-foreground block font-medium">Official Portal Email</span>
                <span className="text-base font-mono font-semibold text-foreground">
                  {email}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Compliance & Document Verification</span>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  {Object.keys(stagedDocuments).length} Documents Under Review
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All uploaded credentials, degrees, and identity records have been safely committed to Azure Blob storage with initial status <strong className="text-foreground">UNDER_REVIEW</strong>. Authorized administrators can inspect and verify them in the faculty detail console.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
              <span className="text-xs font-semibold text-foreground block">Allocated Teaching Subjects & Divisions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md bg-background border text-xs">
                    <span className="font-medium text-foreground">{a.className} - Section {a.sectionName}</span>
                    <Badge variant="secondary" className="font-mono text-[11px]">{a.subjectName}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Onboard Another Teacher
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs"
                onClick={() => {
                  router.push('/school/teachers');
                }}
              >
                Go to Teachers Directory
              </Button>
              <Button
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 cursor-pointer"
                onClick={() => {
                  router.push(`/school/teachers/${createdTeacherResult.id}`);
                }}
              >
                View Teacher 360 Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border bg-card/80 backdrop-blur-md shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/school/teachers" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Teachers Directory
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {isEditMode ? 'Edit Teacher Record' : 'Add Teacher Workspace'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isEditMode ? (firstName ? `Edit Teacher — ${firstName} ${lastName}` : 'Edit Teacher Record') : 'Add Teacher'}
            <Sparkles className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? 'Update faculty credentials, departmental details, teaching assignments, and compliance documents.'
              : 'Create, allocate workload, and verify credentials for faculty onboarding.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30 text-xs">
            <span className="text-muted-foreground">Employee ID:</span>
            <span className="font-mono font-bold text-primary">
              {employeeId === 'AUTO' ? nextIdPreview : employeeId}
            </span>
          </div>

          <Badge variant="outline" className={isEditMode ? 'bg-primary/10 text-primary border-primary/30 text-xs py-1' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs py-1'}>
            {isEditMode ? 'Mode: Editing Record' : 'Status: Ready to Create'}
          </Badge>

          {onCancel && (
            <Button variant="ghost" size="sm" onClick={() => setShowExitModal(true)} className="text-xs">
              Cancel
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleExecuteOnboarding}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm cursor-pointer font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isEditMode ? 'Saving Changes...' : 'Onboarding Faculty...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Save Changes' : 'Create Teacher'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Step Navigator */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 rounded-xl border bg-card/60">
        {[
          { n: 1, label: 'Personal Information', icon: User },
          { n: 2, label: 'Professional Details', icon: Briefcase },
          { n: 3, label: 'Academic Qualifications', icon: GraduationCap },
          { n: 4, label: 'Teaching Assignments', icon: BookOpen },
          { n: 5, label: 'Documents & KYC', icon: FileText },
          { n: 6, label: 'Review & Create', icon: CheckCircle2 },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.n;
          const isPassed = step > s.n;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => {
                if (validateCurrentStep(step) || s.n < step) {
                  setStep(s.n as any);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : isPassed
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                {isPassed ? <Check className="w-3 h-3" /> : s.n}
              </div>
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Form Container */}
      <Card className="shadow-xs border bg-card/90">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Identity & Demographics"
                description="Primary personal identity, portal login credentials, and contact details."
              >
                {/* Profile Photo Upload Box */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoFileChange}
                    disabled={photoUploading}
                  />
                  <div className="relative h-20 w-20 shrink-0 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-background shadow-xs">
                    {photoPreview || photoUrl ? (
                      <img
                        src={photoPreview || photoUrl}
                        alt="Teacher Portrait"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground stroke-[1.5]" />
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={photoUploading}
                        className="h-8 text-xs gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>{photoUrl || photoPreview ? 'Change Photo' : 'Upload Faculty Portrait'}</span>
                      </Button>
                      {(photoUrl || photoPreview) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPhotoUrl('');
                            setPhotoPreview(null);
                            setPhotoFile(null);
                            if (photoInputRef.current) photoInputRef.current.value = '';
                          }}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Directly uploaded to Azure secure media storage (JPEG, PNG, WebP up to 2MB).
                    </p>
                    {photoError && <p className="text-[11px] text-destructive font-medium">{photoError}</p>}
                  </div>
                </div>

                {/* Staff ID & Employment Commencement Box */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Staff Identification & Employment</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                      {employeeId === 'AUTO' ? `Next ID: ${nextIdPreview}` : `Custom: ${employeeId}`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Employee Staff ID / Code">
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                        placeholder={`AUTO (${nextIdPreview})`}
                        className="bg-background text-xs font-mono uppercase font-semibold"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Leave as &apos;AUTO&apos; for auto-generation (<strong className="text-primary font-mono">{nextIdPreview}</strong>) or type custom staff code.
                      </span>
                    </FormField>
                    <FormField label="Date of Joining" required error={validationErrors.joiningDate}>
                      <Input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="bg-background text-xs font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Official joining / commencement date at institution.
                      </span>
                    </FormField>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="First Name" required error={validationErrors.firstName}>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Rahul"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Middle Name">
                    <Input
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Optional"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Last Name" required error={validationErrors.lastName}>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      className="text-xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <FormField label="Date of Birth" required error={validationErrors.dateOfBirth}>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Gender" required>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>
                  <FormField label="Blood Group">
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FormField label="Contact Phone" required error={validationErrors.phone}>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="text-xs font-mono"
                    />
                  </FormField>
                  <FormField label="Official / Login Email" required error={validationErrors.email}>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul.sharma@rivoschool.edu"
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>

                {/* Account Login Password */}
                <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Teacher Portal Login Credentials</span>
                  </div>
                  <FormField
                    label="Account Initial Password"
                    description="Enter initial password or leave blank for secure auto-generated invite token."
                  >
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to auto-invite via email or enter strong password"
                        className="text-xs font-mono pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Residential Address" description="Official correspondence address.">
                <FormField label="Street Address">
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Apartment, building, sector, street..."
                    className="text-xs"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <FormField label="City">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="State">
                    <Input
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Delhi"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Postal Code / PIN">
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="110001"
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Emergency Contact" description="Designated family member or emergency contact.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Contact Person Name">
                    <Input
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Sunita Sharma"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Relationship">
                    <Input
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      placeholder="Spouse / Parent / Sibling"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Emergency Phone">
                    <Input
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98111 22233"
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>
          )}

          {/* STEP 2: Professional Information */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Employment & Institutional Allocation"
                description="Staff identification, employment status, tenure, and campus allocation."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Employee Staff ID / Code">
                    <Input
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder={`AUTO (${nextIdPreview})`}
                      className="bg-muted/40 text-xs font-mono uppercase font-semibold"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Leave as &apos;AUTO&apos; to use authoritative generator (<strong className="text-primary font-mono">{nextIdPreview}</strong>) or enter custom code.
                    </span>
                  </FormField>
                  <FormField label="Date of Joining" required error={validationErrors.joiningDate}>
                    <Input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <FormField label="Employment Type" required>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contractual</option>
                      <option value="VISITING">Visiting Faculty</option>
                    </select>
                  </FormField>

                  <FormField label="Academic Department" required error={validationErrors.department}>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Science">Science (General)</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science & IT</option>
                      <option value="Social Studies">Social Studies</option>
                      <option value="Hindi">Hindi / Regional Languages</option>
                      <option value="Physical Education">Physical Education & Sports</option>
                      <option value="Arts & Music">Arts, Music & Culture</option>
                      <option value="General">General Faculty</option>
                    </select>
                  </FormField>

                  <FormField label="Designation" required error={validationErrors.designation}>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior PGT Teacher / HOD"
                      className="text-xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FormField label="Assigned School Campus">
                    <select
                      value={selectedCampusId}
                      onChange={(e) => setSelectedCampusId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      {campuses.length === 0 && <option value="">Main Campus (Default)</option>}
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.isMain ? '(Main Campus)' : ''}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Total Teaching Experience (Years)">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>
          )}

          {/* STEP 3: Academic Qualifications */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Academic Qualifications & Teacher Certifications"
                description="Educational background, degrees, teacher eligibility tests, and subject specializations."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Highest Academic Qualification" required>
                    <select
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Secondary (10th)">10th (Secondary)</option>
                      <option value="Higher Secondary (12th)">12th (Higher Secondary)</option>
                      <option value="Diploma">Diploma / Polytech</option>
                      <option value="Graduation">Bachelor&apos;s Degree / Graduation (B.A, B.Sc, B.Com, B.Tech)</option>
                      <option value="Post Graduation">Master&apos;s Degree / Post Graduation (M.A, M.Sc, M.Com, M.Tech)</option>
                      <option value="B.Ed">B.Ed (Bachelor of Education)</option>
                      <option value="M.Ed">M.Ed (Master of Education)</option>
                      <option value="D.El.Ed">D.El.Ed / D.Ed Diploma</option>
                      <option value="Doctorate / Ph.D">Doctorate / Ph.D</option>
                      <option value="Other">Other Certification</option>
                    </select>
                  </FormField>

                  <FormField label="Degree / Diploma Title & Specialization">
                    <Input
                      value={qualificationDetails}
                      onChange={(e) => setQualificationDetails(e.target.value)}
                      placeholder="e.g. M.Sc Pure Mathematics, B.Ed (Physics/Maths)"
                      className="text-xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <FormField label="Subject Specialization">
                    <Input
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Calculus & Algebra"
                      className="text-xs"
                    />
                  </FormField>

                  <FormField label="University / Institute Name">
                    <Input
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      placeholder="e.g. University of Delhi"
                      className="text-xs"
                    />
                  </FormField>

                  <FormField label="Graduation / Passing Year">
                    <Input
                      type="number"
                      min={1970}
                      max={new Date().getFullYear()}
                      value={passingYear}
                      onChange={(e) => setPassingYear(Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>

                <div className="mt-4 p-4 rounded-xl border bg-muted/20">
                  <FormField
                    label="Teacher Eligibility Certification (TET / CTET / NET)"
                    description="Select state or central teacher eligibility test qualification status."
                  >
                    <select
                      value={tetCertification}
                      onChange={(e) => setTetCertification(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="CTET_2">CTET Paper 2 Qualified (Classes 6–8 / Secondary)</option>
                      <option value="CTET_1">CTET Paper 1 Qualified (Primary)</option>
                      <option value="STATE_TET">State TET / REET / UPTET Qualified</option>
                      <option value="NET_SET">UGC NET / SET Qualified</option>
                      <option value="NONE">Not Applicable / In Progress</option>
                    </select>
                  </FormField>
                </div>
              </FormSection>
            </div>
          )}

          {/* STEP 4: Teaching Assignments with LIVE Database Subject Combobox */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Teaching Assignments & Workload Allocation"
                description="Allocate class divisions and real subjects from the institutional master curriculum."
                action={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMasterData()}
                    disabled={isLoadingMasterData}
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMasterData ? 'animate-spin' : ''}`} />
                    <span>Refresh Subjects</span>
                  </Button>
                }
              >
                {validationErrors.assignments && (
                  <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationErrors.assignments}</span>
                  </div>
                )}

                {/* State 1: Loading State */}
                {isLoadingMasterData ? (
                  <div className="p-8 rounded-xl border bg-muted/20 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Loading School Curriculum Subjects</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fetching live courses and class divisions from the academic database...
                      </p>
                    </div>
                  </div>
                ) : subjectsError && subjects.length === 0 ? (
                  /* State 2: Error State */
                  <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                    <div>
                      <h4 className="font-semibold text-sm text-destructive">Unable to Load School Subjects</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {subjectsError}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMasterData()}
                      className="text-xs gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Loading Subjects
                    </Button>
                  </div>
                ) : subjects.length === 0 ? (
                  /* State 3: Truly Empty State */
                  <div className="p-6 rounded-xl border border-amber-200 bg-amber-500/10 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">No Subjects Configured for this Institution</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create subjects in Academic Setup before assigning teaching responsibilities.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMasterData()}
                        className="text-xs gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Check Again
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push('/school/subjects')}
                        className="text-xs gap-1.5 bg-primary text-primary-foreground"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Go to Subjects Setup
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* State 4: Success / Ready State with Searchable Select */
                  <div className="space-y-4">
                    {assignments.map((asg, index) => {
                      const selectedClass = classes.find((c) => c.id === asg.classId);
                      const availableSections = selectedClass?.sections || [];
                      const searchKey = asg.id;
                      const currentSearchTerm = (subjectSearchTerms[searchKey] || '').toLowerCase().trim();

                      const filteredSubjectOptions = currentSearchTerm
                        ? subjects.filter((s) => s.name.toLowerCase().includes(currentSearchTerm) || (s.code && s.code.toLowerCase().includes(currentSearchTerm)))
                        : subjects;

                      return (
                        <div key={asg.id} className="rounded-xl border bg-card p-4 shadow-2xs space-y-3 relative group">
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                {index + 1}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                Assignment #{index + 1}: {asg.className || 'General'} - {asg.sectionName ? `Section ${asg.sectionName}` : 'All Sections'} ({asg.subjectName || 'Subject'})
                              </span>
                            </div>

                            {assignments.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                                onClick={() => handleRemoveAssignment(asg.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            {/* Class Selector */}
                            <FormField label="Class / Grade">
                              <select
                                value={asg.classId}
                                onChange={(e) => handleAssignmentChange(asg.id, 'classId', e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                              >
                                {classes.length === 0 && <option value="">General / All Classes</option>}
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </FormField>

                            {/* Section Selector */}
                            <FormField label="Division / Section">
                              <select
                                value={asg.sectionId}
                                onChange={(e) => handleAssignmentChange(asg.id, 'sectionId', e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                              >
                                {availableSections.length === 0 && <option value="">Section A (Default)</option>}
                                {availableSections.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Section {s.name}
                                  </option>
                                ))}
                              </select>
                            </FormField>

                            {/* Real Live Database Subject Dropdown with Searchable Combobox */}
                            <div className="sm:col-span-1 space-y-1">
                              <label className="text-xs font-medium text-foreground block">
                                Subject <span className="text-destructive">*</span>
                              </label>
                              <select
                                value={asg.subjectId}
                                onChange={(e) => handleAssignmentChange(asg.id, 'subjectId', e.target.value)}
                                className="w-full h-9 rounded-md border border-primary/50 bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary shadow-2xs"
                              >
                                {subjects.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name} {sub.code ? `[${sub.code}]` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Periods per Week */}
                            <FormField label="Periods / Week">
                              <Input
                                type="number"
                                min={1}
                                max={35}
                                value={asg.periodsPerWeek}
                                onChange={(e) => handleAssignmentChange(asg.id, 'periodsPerWeek', Number(e.target.value))}
                                className="h-9 text-xs font-mono"
                              />
                            </FormField>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={asg.isClassTeacher}
                                onChange={(e) => handleAssignmentChange(asg.id, 'isClassTeacher', e.target.checked)}
                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span>Designate as Primary Class Teacher for this section</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAssignment}
                      className="w-full gap-2 text-xs border-dashed h-10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      <span>+ Add Another Teaching Subject / Section Assignment</span>
                    </Button>
                  </div>
                )}
              </FormSection>
            </div>
          )}

          {/* STEP 5: Documents & KYC (Directly Inside Add Teacher Workspace) */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Legal, KYC, Educational & Employment Documents"
                description="Upload official identity credentials and degrees directly during initial faculty onboarding."
              >
                {/* Document Category Tabs */}
                <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
                  {[
                    { key: 'KYC', label: '1. Identity & KYC', count: STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'KYC').length },
                    { key: 'EDUCATIONAL', label: '2. Academic & Degrees', count: STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'EDUCATIONAL').length },
                    { key: 'EMPLOYMENT', label: '3. Employment & Letters', count: STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === 'EMPLOYMENT').length },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveDocCategory(cat.key as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeDocCategory === cat.key
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>

                {/* Document Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === activeDocCategory).map((docDef) => {
                    const isRequired = requiredDocTypes.includes(docDef.code);
                    const staged = stagedDocuments[docDef.code];
                    const meta = documentMetadata[docDef.code] || {};

                    return (
                      <div
                        key={docDef.code}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          staged
                            ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10'
                            : isRequired
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-border/80 bg-card'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                {docDef.name}
                                {isRequired ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0">
                                    Required
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground text-[10px] py-0">
                                    Optional
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                {docDef.description}
                              </p>
                            </div>

                            {staged && (
                              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 shrink-0">
                                <Check className="w-2.5 h-2.5" />
                                Ready to Upload
                              </Badge>
                            )}
                          </div>

                          {/* Inputs if hasNumber or hasExpiry */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {docDef.hasNumber && (
                              <FormField label="Document / Registration Number">
                                <Input
                                  value={meta.documentNumber || ''}
                                  onChange={(e) => handleMetadataChange(docDef.code, 'documentNumber', e.target.value)}
                                  placeholder="e.g. XXXX-XXXX-1234"
                                  className="h-8 text-xs font-mono"
                                />
                              </FormField>
                            )}

                            {docDef.hasExpiry && (
                              <FormField label="Expiry Date">
                                <Input
                                  type="date"
                                  value={meta.expiryDate || ''}
                                  onChange={(e) => handleMetadataChange(docDef.code, 'expiryDate', e.target.value)}
                                  className="h-8 text-xs font-mono"
                                />
                              </FormField>
                            )}
                          </div>
                        </div>

                        {/* File Upload / Staged File Display */}
                        <div className="mt-4 pt-3 border-t border-border/50">
                          {staged ? (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border text-xs">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-medium text-foreground truncate block">{staged.file.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {(staged.file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewDocUrl(staged.previewUrl)}
                                  className="h-7 text-xs px-2 cursor-pointer"
                                >
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStagedDocument(docDef.code)}
                                  className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              <UploadCloud className="w-4 h-4 text-primary" />
                              <span>Select Document File (PDF / JPG up to {docDef.maxSizeMb}MB)</span>
                              <input
                                type="file"
                                accept={docDef.allowedExtensions.join(',')}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleStageDocument(docDef, f);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormSection>
            </div>
          )}

          {/* STEP 6: Review & Create */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FormSection
                title="Review Faculty Dossier & Complete Onboarding"
                description="Verify identity, departmental credentials, workload allocation, and compliance completeness before saving."
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Personal Summary */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Personal Identity
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-6 text-[11px] px-2">
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Full Name:</span>
                        <span className="font-semibold text-foreground">{firstName} {middleName} {lastName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Email & Phone:</span>
                        <span className="font-mono text-foreground">{email} • {phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Date of Birth & Gender:</span>
                        <span className="text-foreground">{dateOfBirth} • {gender} ({bloodGroup})</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-primary" />
                        Employment & Post
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-[11px] px-2">
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Employee ID:</span>
                        <span className="font-mono font-bold text-primary">{employeeId === 'AUTO' ? nextIdPreview : employeeId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Department & Role:</span>
                        <span className="font-semibold text-foreground">{department} • {designation}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Experience & Type:</span>
                        <span className="text-foreground">{experienceYears} Years • {employmentType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications Summary */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                        Qualifications & TET
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="h-6 text-[11px] px-2">
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Highest Qualification:</span>
                        <span className="font-semibold text-foreground">{highestQualification} {qualificationDetails ? `(${qualificationDetails})` : ''}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Eligibility Status:</span>
                        <span className="text-foreground">{tetCertification}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workload Table */}
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Allocated Teaching Workload</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {assignments.length} assignments assigned •{' '}
                        {assignments.reduce((acc, a) => acc + (a.periodsPerWeek || 0), 0)} weekly periods total
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep(4)} className="h-6 text-[11px] px-2">
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
                        <div>
                          <span className="font-semibold text-foreground block">{a.className} - Section {a.sectionName}</span>
                          <span className="text-[10px] text-muted-foreground">{a.subjectName}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {a.periodsPerWeek} Periods/wk
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Compliance Progress Box */}
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Document Compliance & KYC Completeness</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {checklist.submittedRequired} of {checklist.totalRequired} required documents staged ({checklist.completionPercentage}%)
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep(5)} className="h-6 text-[11px] px-2">
                      Edit
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        checklist.completionPercentage === 100 ? 'bg-emerald-600' : 'bg-primary'
                      }`}
                      style={{ width: `${checklist.completionPercentage}%` }}
                    />
                  </div>

                  {checklist.missingRequiredTypes.length > 0 ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Missing Required Documents ({checklist.missingRequiredTypes.length})</span>
                        <span className="text-[11px]">
                          {checklist.missingRequiredTypes.map((code) => {
                            const match = STANDARD_TEACHER_DOCUMENTS.find((d) => d.code === code);
                            return match?.name || code;
                          }).join(', ')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      All mandatory institution documents staged for upload.
                    </div>
                  )}
                </div>
              </FormSection>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div>
              {step > 1 ? (
                <Button type="button" variant="outline" size="sm" onClick={handlePrevStep} className="text-xs gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous Step
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowExitModal(true)} className="text-xs">
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 6 ? (
                <Button type="button" size="sm" onClick={handleNextStep} className="text-xs gap-1 bg-primary text-primary-foreground">
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExecuteOnboarding}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Faculty Record...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Teacher Record</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Confirmation Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle>Discard Onboarding Draft?</DialogTitle>
            <DialogDescription>
              You have entered faculty details in this workspace. If you leave now, unstored modifications will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowExitModal(false)}>
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowExitModal(false);
                if (onCancel) onCancel();
                else router.push('/school/teachers');
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Required Documents Warning Modal */}
      <Dialog open={showMissingDocsModal} onOpenChange={setShowMissingDocsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle>Incomplete Document Requirements</DialogTitle>
            <DialogDescription>
              {checklist.missingRequiredTypes.length} mandatory documents have not been uploaded yet:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-muted/40 text-xs">
            {checklist.missingRequiredTypes.map((code) => {
              const match = STANDARD_TEACHER_DOCUMENTS.find((d) => d.code === code);
              return (
                <div key={code} className="flex items-center gap-2 text-foreground font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span>{match?.name || code}</span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Do you wish to return to the Documents tab to attach them, or proceed with teacher creation and collect documents later?
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMissingDocsModal(false);
                setStep(5);
              }}
            >
              Go Back to Documents
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setShowMissingDocsModal(false);
                handleExecuteOnboarding();
              }}
            >
              Create Teacher Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Progress Overlay */}
      {isSubmitting && (
        <Dialog open={isSubmitting} onOpenChange={() => {}}>
          <DialogContent className="max-w-md [&>button]:hidden">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <DialogTitle className="text-center">Onboarding Faculty Member</DialogTitle>
              <DialogDescription className="text-center">
                Please wait while we persist records and securely transmit documents to Azure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-foreground">
                  {submissionProgress.stage === 'CREATING_TEACHER' && 'Creating Teacher Account & Assignments...'}
                  {submissionProgress.stage === 'UPLOADING_DOCS' && `Uploading Document: ${submissionProgress.currentDocName}`}
                  {submissionProgress.stage === 'ERROR' && 'Onboarding Error'}
                </span>
                {submissionProgress.totalDocs > 0 && submissionProgress.stage === 'UPLOADING_DOCS' && (
                  <span className="font-mono text-muted-foreground">
                    {submissionProgress.currentDocIndex} / {submissionProgress.totalDocs}
                  </span>
                )}
              </div>

              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width:
                      submissionProgress.stage === 'CREATING_TEACHER'
                        ? '30%'
                        : submissionProgress.totalDocs > 0
                        ? `${30 + (submissionProgress.currentDocIndex / submissionProgress.totalDocs) * 70}%`
                        : '80%',
                  }}
                />
              </div>

              {submissionProgress.stage === 'ERROR' && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                  {submissionProgress.errorMsg}
                </div>
              )}
            </div>

            {submissionProgress.stage === 'ERROR' && (
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsSubmitting(false)}>
                  Close & Retry
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Document Staged Preview Modal */}
      {previewDocUrl && (
        <Dialog open={Boolean(previewDocUrl)} onOpenChange={() => setPreviewDocUrl(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] p-4 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm">Document File Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full h-[65vh] rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center">
              <iframe src={previewDocUrl} className="w-full h-full border-0" title="Staged Document Preview" />
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => setPreviewDocUrl(null)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
