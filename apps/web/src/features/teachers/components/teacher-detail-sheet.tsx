'use client';

import * as React from 'react';
import { TeacherDetail, TeacherDocumentItem } from '../types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  ArrowLeft,
  Edit3,
  UserCheck,
  ShieldAlert,
  Calendar,
  BookOpen,
  Phone,
  Mail,
  FileText,
  UploadCloud,
  Download,
  ExternalLink,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Check,
  X,
  FileCheck,
  Lock,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { STANDARD_TEACHER_DOCUMENTS } from '@/lib/teachers/document-catalog';

interface TeacherDetailSheetProps {
  teacher: TeacherDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (teacher: TeacherDetail) => void;
  onChangeStatus: (teacher: TeacherDetail) => void;
  onArchive: (teacher: TeacherDetail) => void;
}

type TeacherTabKey =
  | 'overview'
  | 'personal'
  | 'employment'
  | 'subjects'
  | 'classes'
  | 'timetable'
  | 'documents'
  | 'attendance'
  | 'workload'
  | 'activity';

const tabList: { key: TeacherTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal' },
  { key: 'employment', label: 'Employment' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'classes', label: 'Classes' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'documents', label: 'Documents & KYC' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'workload', label: 'Workload' },
  { key: 'activity', label: 'Activity' },
];

interface ChecklistData {
  totalRequired: number;
  submittedRequired: number;
  verifiedRequired: number;
  completionPercentage: number;
  missingRequiredTypes: string[];
}

export function TeacherDetailSheet({
  teacher,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onArchive,
}: TeacherDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<TeacherTabKey>('overview');
  const [documents, setDocuments] = React.useState<TeacherDocumentItem[]>([]);
  const [checklist, setChecklist] = React.useState<ChecklistData | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(false);

  // Filters & Search
  const [docCategoryFilter, setDocCategoryFilter] = React.useState<'ALL' | 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM'>('ALL');
  const [docStatusFilter, setDocStatusFilter] = React.useState<'ALL' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'MISSING'>('ALL');
  const [docRequiredFilter, setDocRequiredFilter] = React.useState<'ALL' | 'REQUIRED' | 'OPTIONAL'>('ALL');
  const [docSearchQuery, setDocSearchQuery] = React.useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadCategory, setUploadCategory] = React.useState<'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM'>('KYC');
  const [uploadDocType, setUploadDocType] = React.useState('AADHAAR_CARD');
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadDocNumber, setUploadDocNumber] = React.useState('');
  const [uploadIssueDate, setUploadIssueDate] = React.useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = React.useState('');
  const [uploadIsRequired, setUploadIsRequired] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Review & Verification Modal states
  const [reviewDoc, setReviewDoc] = React.useState<TeacherDocumentItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);

  // Two-step Confirmation Verify modal
  const [isConfirmVerifyOpen, setIsConfirmVerifyOpen] = React.useState(false);
  const [docToVerify, setDocToVerify] = React.useState<TeacherDocumentItem | null>(null);
  const [verificationNote, setVerificationNote] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  // Reject modal
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [docToReject, setDocToReject] = React.useState<TeacherDocumentItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectError, setRejectError] = React.useState<string | null>(null);

  const [deletingDocId, setDeletingDocId] = React.useState<string | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    if (!teacher) return;
    try {
      setIsLoadingDocs(true);
      const res = await fetch(`/api/teachers/${teacher.id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setChecklist(data.checklist || null);
      } else {
        setDocuments(teacher.documents || []);
      }
    } catch {
      setDocuments(teacher.documents || []);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [teacher]);

  // Sync documents when teacher prop changes or sheet opens
  React.useEffect(() => {
    if (teacher && isOpen) {
      fetchDocuments();
    }
  }, [teacher, isOpen, fetchDocuments]);

  // Update default document type when upload category changes
  React.useEffect(() => {
    const matching = STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === uploadCategory);
    if (matching.length > 0) {
      setUploadDocType(matching[0].code);
      setUploadTitle(matching[0].name);
      setUploadIsRequired(matching[0].defaultRequired);
    } else {
      setUploadDocType('OTHER');
      setUploadTitle('');
      setUploadIsRequired(false);
    }
  }, [uploadCategory]);

  if (!teacher) return null;

  const initials = `${teacher.personal.firstName[0] || 'T'}${teacher.personal.lastName[0] || ''}`.toUpperCase();
  const distinctSubjects = Array.from(new Set(teacher.assignments.map((a) => a.subjectName)));

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    // Category filter
    if (docCategoryFilter !== 'ALL' && (d.category || 'KYC').toUpperCase() !== docCategoryFilter) {
      return false;
    }
    // Status filter
    if (docStatusFilter !== 'ALL') {
      if (docStatusFilter === 'UNDER_REVIEW' && d.status !== 'UNDER_REVIEW' && d.status !== 'SUBMITTED') {
        return false;
      }
      if (docStatusFilter === 'VERIFIED' && d.status !== 'VERIFIED') {
        return false;
      }
      if (docStatusFilter === 'REJECTED' && d.status !== 'REJECTED') {
        return false;
      }
      if (docStatusFilter === 'EXPIRED' && d.expiryStatus !== 'EXPIRED') {
        return false;
      }
    }
    // Required filter
    if (docRequiredFilter === 'REQUIRED' && !d.isRequired) return false;
    if (docRequiredFilter === 'OPTIONAL' && d.isRequired) return false;

    // Search query
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchNum = d.documentNumberMasked?.toLowerCase().includes(q) || false;
      const matchType = d.documentType?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchNum && !matchType) return false;
    }

    return true;
  });

  // Calculate 7 core metrics
  const totalUploaded = documents.length;
  const totalVerified = documents.filter((d) => d.status === 'VERIFIED').length;
  const totalUnderReview = documents.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'SUBMITTED').length;
  const totalRejected = documents.filter((d) => d.status === 'REJECTED').length;
  const totalMissing = checklist?.missingRequiredTypes.length || 0;
  const totalExpired = documents.filter((d) => d.expiryStatus === 'EXPIRED').length;
  const requiredCompletionPercent = checklist ? checklist.completionPercentage : (totalVerified > 0 ? 100 : 0);

  const handleOpenUploadForType = (typeCode: string, cat: 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM', defaultName: string) => {
    setUploadCategory(cat);
    setUploadDocType(typeCode);
    setUploadTitle(defaultName);
    setUploadDocNumber('');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setUploadIsRequired(true);
    setUploadFile(null);
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('documentType', uploadDocType);
      formData.append('title', uploadTitle.trim() || uploadFile.name);
      if (uploadDocNumber.trim()) formData.append('documentNumber', uploadDocNumber.trim());
      if (uploadIssueDate) formData.append('issueDate', uploadIssueDate);
      if (uploadExpiryDate) formData.append('expiryDate', uploadExpiryDate);
      formData.append('isRequired', String(uploadIsRequired));

      const res = await fetch(`/api/teachers/${teacher.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDocNumber('');
      setUploadIssueDate('');
      setUploadExpiryDate('');
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  // Open Review Dialog
  const handleOpenReview = (doc: TeacherDocumentItem) => {
    setReviewDoc(doc);
    setIsReviewOpen(true);
  };

  // Trigger 2-Step Verify
  const handleStartVerify = (doc: TeacherDocumentItem) => {
    setDocToVerify(doc);
    setVerificationNote('');
    setVerifyError(null);
    setIsConfirmVerifyOpen(true);
  };

  // Execute Verification
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToVerify) return;

    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/documents/${docToVerify.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY',
          verificationNote: verificationNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification update failed');
      }

      setIsConfirmVerifyOpen(false);
      if (reviewDoc?.id === docToVerify.id) {
        setReviewDoc((prev) => (prev ? { ...prev, status: 'VERIFIED', verifiedAt: data.document.verifiedAt, verifiedByName: data.document.verifiedByName, verificationNote: data.document.verificationNote } : null));
      }
      await fetchDocuments();
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to submit verification');
    } finally {
      setVerifying(false);
    }
  };

  // Trigger Rejection Dialog
  const handleStartReject = (doc: TeacherDocumentItem) => {
    setDocToReject(doc);
    setRejectionReason('');
    setRejectError(null);
    setIsRejectOpen(true);
  };

  // Execute Rejection
  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToReject) return;
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a mandatory reason for rejecting this document.');
      return;
    }

    setRejecting(true);
    setRejectError(null);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/documents/${docToReject.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Rejection failed');
      }

      setIsRejectOpen(false);
      if (reviewDoc?.id === docToReject.id) {
        setReviewDoc((prev) => (prev ? { ...prev, status: 'REJECTED', rejectionReason: data.document.rejectionReason } : null));
      }
      await fetchDocuments();
    } catch (err: any) {
      setRejectError(err.message || 'Failed to reject document');
    } finally {
      setRejecting(false);
    }
  };

  const handleDocumentDelete = async (docId: string) => {
    setDeletingDocId(docId);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (reviewDoc?.id === docId) {
          setIsReviewOpen(false);
          setReviewDoc(null);
        }
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingDocId(null);
    }
  };

  const formatFileSize = (bytes?: number | string | null) => {
    if (bytes === undefined || bytes === null || bytes === '') return 'Unknown size';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num) || num <= 0) return 'Unknown size';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-y-auto flex flex-col h-full bg-background"
        >
          <div className="p-6 space-y-6 flex-1">
            {/* Header Action Bar */}
            <div className="flex items-center justify-between border-b pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Teachers
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <a href={`/school/teachers/${teacher.id}/permissions`}>
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Permissions
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(teacher)}
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Record
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeStatus(teacher)}
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Change Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchive(teacher)}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                  Deactivate
                </Button>
              </div>
            </div>

            {/* Teacher Profile Identity Hero */}
            <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {teacher.personal.photoUrl ? (
                <img
                  src={teacher.personal.photoUrl}
                  alt={`${teacher.personal.firstName} ${teacher.personal.lastName}`}
                  className="h-16 w-16 shrink-0 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-xs">
                  {initials}
                </div>
              )}

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {teacher.personal.firstName} {teacher.personal.middleName ? `${teacher.personal.middleName} ` : ''}
                    {teacher.personal.lastName}
                  </h2>
                  <StatusBadge status={teacher.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-primary">{teacher.employment.employeeId}</span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{teacher.employment.department}</span>
                  <span>•</span>
                  <span>{teacher.employment.designation}</span>
                  <span>•</span>
                  <span>Experience: {teacher.employment.experienceYears} yrs</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3" /> {teacher.personal.phone || 'No phone recorded'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {teacher.personal.email || 'No email recorded'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Overview Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatCard
                title="Classes"
                value={String(teacher.totalClassesCount)}
                change="Assigned sections"
                isPositive={true}
              />
              <StatCard
                title="Subjects"
                value={String(distinctSubjects.length)}
                change="Academic subjects"
                isPositive={true}
              />
              <StatCard
                title="KYC &amp; Docs"
                value={`${totalVerified}/${documents.length}`}
                change={`${totalUnderReview} pending review`}
                isPositive={totalUnderReview === 0}
              />
              <StatCard
                title="Total Students"
                value={String(teacher.totalStudentsCount || 0)}
                change="Enrolled candidates"
                isPositive={true}
              />
            </div>

            {/* 10 Interactive Tabs Navigation */}
            <div className="border-b border-border/80 overflow-x-auto scrollbar-none">
              <nav className="flex space-x-1 min-w-max pb-0" aria-label="Teacher Profile Tabs">
                {tabList.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer select-none whitespace-nowrap',
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40',
                      )}
                    >
                      {tab.label}
                      {tab.key === 'documents' && documents.length > 0 && (
                        <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                          totalUnderReview > 0
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-primary/10 text-primary font-medium'
                        }`}>
                          {documents.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Active Tab Content Render */}
            <div className="min-h-[280px] text-xs">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      Current Teaching Assignments
                    </h4>
                    {teacher.assignments.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                        No active class assignments allocated.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                              <th className="py-2 px-3">Class</th>
                              <th className="py-2 px-3">Section</th>
                              <th className="py-2 px-3">Subject</th>
                              <th className="py-2 px-3">Periods / Wk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {teacher.assignments.map((asg) => (
                              <tr key={asg.id} className="hover:bg-muted/30">
                                <td className="py-2 px-3 font-semibold text-foreground">{asg.className}</td>
                                <td className="py-2 px-3 font-mono">Section {asg.sectionName}</td>
                                <td className="py-2 px-3 text-primary font-medium">{asg.subjectName}</td>
                                <td className="py-2 px-3 font-mono">{asg.periodsPerWeek}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Personal &amp; Contact Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Date of Birth</span>
                      <p className="font-semibold text-foreground">{teacher.personal.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Gender</span>
                      <p className="font-semibold text-foreground">{teacher.personal.gender || 'Not specified'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Blood Group</span>
                      <p className="font-semibold text-foreground">{teacher.personal.bloodGroup || 'N/A'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Residential Address</span>
                      <p className="font-medium text-foreground">
                        {teacher.address.street || 'Address not recorded'}
                      </p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Emergency Contact</span>
                      <p className="font-medium text-foreground">
                        {teacher.emergencyContact.name
                          ? `${teacher.emergencyContact.name} (${teacher.emergencyContact.relationship || 'Contact'}) • ${teacher.emergencyContact.phone || ''}`
                          : 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Employment Records &amp; Accreditation
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Employee ID</span>
                      <p className="font-mono font-bold text-primary">{teacher.employment.employeeId}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Joining Date</span>
                      <p className="font-semibold text-foreground">{teacher.employment.joiningDate || 'N/A'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Employment Type</span>
                      <p className="font-semibold text-foreground">{teacher.employment.employmentType.replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Qualifications</span>
                      <p className="font-semibold text-foreground">{teacher.employment.qualification || 'N/A'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Teaching Experience</span>
                      <p className="font-semibold text-foreground">{teacher.employment.experienceYears} Years</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subjects &amp; Curriculum Domain
                  </h4>
                  {distinctSubjects.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                      No subjects currently allocated.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {distinctSubjects.map((sub) => (
                        <div key={sub} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                          <div>
                            <h5 className="font-bold text-sm text-foreground">{sub}</h5>
                            <p className="text-[11px] text-muted-foreground">{teacher.employment.department} Department</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                            Active Instructor
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Student Divisions
                  </h4>
                  {teacher.assignments.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                      No class divisions assigned to this educator.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teacher.assignments.map((asg) => (
                        <div key={asg.id} className="p-3 rounded-lg border bg-card space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">
                              {asg.className} - {asg.sectionName}
                            </span>
                            <span className="font-mono text-xs text-primary font-semibold">
                              {asg.periodsPerWeek} periods/wk
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Subject: {asg.subjectName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TIMETABLE TAB */}
              {activeTab === 'timetable' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Weekly Schedule Slots
                  </h4>
                  {(!teacher.timetableSlots || teacher.timetableSlots.length === 0) ? (
                    <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="font-medium text-foreground">No Timetable Slots Scheduled</p>
                      <p className="text-[11px] text-muted-foreground">
                        Timetable periods assigned to this educator will appear here automatically when configured in the Timetable builder.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teacher.timetableSlots.map((slot) => (
                        <div key={slot.id} className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground">
                              {slot.dayOfWeek}: {slot.startTime} - {slot.endTime}
                            </span>
                            <p className="text-muted-foreground text-[11px]">
                              {slot.className} - {slot.sectionName} • {slot.subjectName}
                              {slot.roomNumber || slot.roomName ? ` • Room ${slot.roomNumber || slot.roomName}` : ''}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                            {slot.periodName || `Period ${slot.periodNumber}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS & KYC TAB */}
              {activeTab === 'documents' && (
                <div className="space-y-5">
                  {/* Top 7 Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Docs</span>
                      <p className="text-xl font-bold text-foreground font-mono">{totalUploaded}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-emerald-500/20 bg-emerald-50/10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified
                      </span>
                      <p className="text-xl font-bold text-emerald-700 font-mono">{totalVerified}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-amber-500/20 bg-amber-50/10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" /> Under Review
                      </span>
                      <p className="text-xl font-bold text-amber-700 font-mono">{totalUnderReview}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-destructive/20 bg-destructive/10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-destructive" /> Rejected
                      </span>
                      <p className="text-xl font-bold text-destructive font-mono">{totalRejected}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-slate-300">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-slate-500" /> Missing
                      </span>
                      <p className="text-xl font-bold text-foreground font-mono">{totalMissing}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-amber-300">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" /> Expired
                      </span>
                      <p className="text-xl font-bold text-amber-800 font-mono">{totalExpired}</p>
                    </div>

                    <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-1 border-primary/20 bg-primary/5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-primary" /> Req. Complete
                      </span>
                      <p className="text-xl font-bold text-primary font-mono">{requiredCompletionPercent}%</p>
                    </div>
                  </div>

                  {/* Required Document Checklist Widget */}
                  {checklist && (
                    <div className="p-4 rounded-xl border bg-card space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FileCheck className="h-4 w-4 text-emerald-600" />
                            Required Document Compliance Checklist
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Institutional onboarding compliance overview: {checklist.verifiedRequired} of {checklist.totalRequired} mandatory records verified.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsUploadOpen(true)}
                          className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Upload Document
                        </Button>
                      </div>

                      {/* Checklist items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t text-xs">
                        {STANDARD_TEACHER_DOCUMENTS.filter((d) => d.defaultRequired).map((reqDoc) => {
                          const matching = documents.find((d) => d.documentType === reqDoc.code);
                          const isVer = matching?.status === 'VERIFIED';
                          const isRej = matching?.status === 'REJECTED';
                          const isUnder = matching?.status === 'UNDER_REVIEW' || matching?.status === 'SUBMITTED';
                          const isMiss = !matching;

                          return (
                            <div
                              key={reqDoc.code}
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                                isVer
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950'
                                  : isUnder
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-950'
                                  : isRej
                                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                  : 'bg-muted/30 border-dashed text-muted-foreground'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-xs truncate text-foreground">{reqDoc.name}</p>
                                <span className="text-[10px] font-semibold">
                                  {isVer && '✓ Verified'}
                                  {isUnder && '⏳ Under Review'}
                                  {isRej && '✕ Rejected'}
                                  {isMiss && '— Missing'}
                                </span>
                              </div>

                              {isMiss ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenUploadForType(reqDoc.code, reqDoc.category, reqDoc.name)}
                                  className="h-6 px-2 text-[10px] font-semibold text-primary hover:bg-primary/10 border-primary/30"
                                >
                                  Upload
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenReview(matching)}
                                  className="h-6 px-2 text-[10px] font-semibold hover:bg-accent"
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Filter & Search Bar */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={docSearchQuery}
                          onChange={(e) => setDocSearchQuery(e.target.value)}
                          placeholder="Search document title or masked ID..."
                          className="w-full h-8 pl-3 pr-8 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground"
                        />
                        {docSearchQuery && (
                          <button
                            onClick={() => setDocSearchQuery('')}
                            className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Status and Requirement dropdowns */}
                      <div className="flex items-center gap-2">
                        <select
                          value={docStatusFilter}
                          onChange={(e) => setDocStatusFilter(e.target.value as any)}
                          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="EXPIRED">Expired</option>
                        </select>

                        <select
                          value={docRequiredFilter}
                          onChange={(e) => setDocRequiredFilter(e.target.value as any)}
                          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                        >
                          <option value="ALL">All Requirements</option>
                          <option value="REQUIRED">Required Only</option>
                          <option value="OPTIONAL">Optional Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {[
                        { key: 'ALL', label: 'All Documents' },
                        { key: 'KYC', label: 'Identity / KYC' },
                        { key: 'EDUCATIONAL', label: 'Educational' },
                        { key: 'EMPLOYMENT', label: 'Employment' },
                        { key: 'CUSTOM', label: 'Custom / Other' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDocCategoryFilter(tab.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                            docCategoryFilter === tab.key
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Documents View: Desktop Table + Mobile Cards */}
                  {isLoadingDocs ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Loading teacher legal records...</p>
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="font-medium text-foreground">No Documents Found</p>
                      <p className="text-[11px] text-muted-foreground">
                        No documents matched the selected filters. Click Upload Document to add records.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block rounded-xl border bg-card overflow-hidden shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-3.5">Document</th>
                              <th className="py-3 px-3">Category</th>
                              <th className="py-3 px-2 text-center">Required</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Uploaded</th>
                              <th className="py-3 px-3">Verified By</th>
                              <th className="py-3 px-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredDocs.map((doc) => {
                              const isVerified = doc.status === 'VERIFIED';
                              const isRejected = doc.status === 'REJECTED';
                              const isReview = doc.status === 'UNDER_REVIEW' || doc.status === 'SUBMITTED';

                              return (
                                <tr
                                  key={doc.id}
                                  className={`hover:bg-muted/20 transition-colors ${
                                    isRejected ? 'bg-destructive/5' : isVerified ? 'bg-emerald-500/5' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                          isVerified
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : isRejected
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary'
                                        }`}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-foreground text-xs">{doc.title}</p>
                                        {doc.documentNumberMasked && (
                                          <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Lock className="h-2.5 w-2.5" />
                                            {doc.documentNumberMasked}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-muted-foreground font-medium">
                                    {doc.category || 'KYC'}
                                  </td>

                                  <td className="py-3 px-2 text-center">
                                    {doc.isRequired ? (
                                      <span className="rounded bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5">
                                        Required
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-[10px]">Optional</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 ${
                                        isVerified
                                          ? 'bg-emerald-500/15 text-emerald-700'
                                          : isRejected
                                          ? 'bg-destructive/15 text-destructive'
                                          : 'bg-amber-500/15 text-amber-800'
                                      }`}
                                    >
                                      {isVerified && <Check className="h-2.5 w-2.5" />}
                                      {isRejected && <X className="h-2.5 w-2.5" />}
                                      {isReview && <Clock className="h-2.5 w-2.5" />}
                                      {(doc.status || 'UNDER_REVIEW').replace('_', ' ')}
                                    </span>
                                    {doc.expiryStatus === 'EXPIRED' && (
                                      <span className="ml-1 text-destructive font-bold text-[9px]">EXPIRED</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-muted-foreground text-[11px]">
                                    {new Date(doc.createdAt || doc.uploadedAt || Date.now()).toLocaleDateString()}
                                  </td>

                                  <td className="py-3 px-3 text-xs">
                                    {isVerified && doc.verifiedByName ? (
                                      <div>
                                        <p className="font-medium text-foreground text-[11px]">{doc.verifiedByName}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : ''}
                                        </p>
                                      </div>
                                    ) : isRejected ? (
                                      <span className="text-destructive font-medium text-[11px]">Rejected</span>
                                    ) : (
                                      <span className="text-muted-foreground text-[11px]">Pending Review</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenReview(doc)}
                                        className="h-7 px-2 text-xs font-medium cursor-pointer"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Review
                                      </Button>

                                      {!isVerified && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStartVerify(doc)}
                                          className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300 font-semibold cursor-pointer"
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Verify
                                        </Button>
                                      )}

                                      {!isRejected && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleStartReject(doc)}
                                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 font-semibold cursor-pointer"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                      )}

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={deletingDocId === doc.id}
                                        onClick={() => handleDocumentDelete(doc.id)}
                                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                                      >
                                        {deletingDocId === doc.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Stacked Cards View */}
                      <div className="md:hidden space-y-3">
                        {filteredDocs.map((doc) => {
                          const isVerified = doc.status === 'VERIFIED';
                          const isRejected = doc.status === 'REJECTED';

                          return (
                            <div
                              key={doc.id}
                              className={`rounded-xl border p-4 transition-colors space-y-3 bg-card ${
                                isRejected
                                  ? 'border-destructive/40 bg-destructive/5'
                                  : isVerified
                                  ? 'hover:border-emerald-500/40'
                                  : 'hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      isVerified
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : isRejected
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-primary/10 text-primary'
                                    }`}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p className="font-bold text-xs text-foreground">{doc.title}</p>
                                      {doc.isRequired && (
                                        <span className="rounded bg-primary/10 text-primary text-[9px] font-semibold px-1 py-0.2">
                                          Required
                                        </span>
                                      )}
                                      <span
                                        className={`rounded-full text-[9px] font-semibold px-2 py-0.2 ${
                                          isVerified
                                            ? 'bg-emerald-500/15 text-emerald-700'
                                            : isRejected
                                            ? 'bg-destructive/15 text-destructive'
                                            : 'bg-amber-500/15 text-amber-800'
                                        }`}
                                      >
                                        {(doc.status || 'UNDER_REVIEW').replace('_', ' ')}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground pt-0.5">
                                      <span>{doc.category || 'KYC'}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                      {doc.documentNumberMasked && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-foreground">{doc.documentNumberMasked}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Actions */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenReview(doc)}
                                  className="h-7 px-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Review
                                </Button>

                                {!isVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartVerify(doc)}
                                    className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 font-semibold"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Verify
                                  </Button>
                                )}

                                {!isRejected && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartReject(doc)}
                                    className="h-7 px-2 text-xs text-destructive font-semibold"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingDocId === doc.id}
                                  onClick={() => handleDocumentDelete(doc.id)}
                                  className="h-7 w-7 p-0 text-destructive ml-auto"
                                >
                                  {deletingDocId === doc.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Faculty Attendance &amp; Presence Summary
                  </h4>
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                    <p className="font-semibold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Faculty Status: Active &amp; Verified
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Educator is currently active in the school management roster and authorized to conduct classes and mark student attendance.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'workload' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Weekly Teaching Load Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Allocated Teaching Periods</span>
                      <span className="font-bold text-foreground font-mono">{teacher.weeklyPeriods} / 26 periods max</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, (teacher.weeklyPeriods / 26) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Educator is at {Math.round((teacher.weeklyPeriods / 26) * 100)}% institutional capacity allocation.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Educator Audit Record
                  </h4>
                  <div className="rounded-lg border bg-muted/20 p-4 text-xs space-y-1">
                    <p className="text-muted-foreground">
                      Profile created: <span className="font-medium text-foreground">{new Date(teacher.createdAt).toLocaleDateString()}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Last profile modification: <span className="font-medium text-foreground">{new Date(teacher.updatedAt || teacher.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 1. Review Document Modal with Live SAS File Preview */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {reviewDoc?.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Reviewing official records for {teacher.personal.firstName} {teacher.personal.lastName} ({teacher.employeeCode}).
                </DialogDescription>
              </div>
              {reviewDoc && (
                <span
                  className={`rounded-full text-[10px] font-semibold px-2.5 py-1 ${
                    reviewDoc.status === 'VERIFIED'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : reviewDoc.status === 'REJECTED'
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-amber-500/15 text-amber-800'
                  }`}
                >
                  {(reviewDoc.status || 'UNDER_REVIEW').replace('_', ' ')}
                </span>
              )}
            </div>
          </DialogHeader>

          {reviewDoc && (
            <div className="space-y-4 py-2 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-muted/20 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Document Category</span>
                  <p className="font-medium text-foreground">{reviewDoc.category || 'KYC'}</p>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Document ID Number</span>
                  <p className="font-mono font-medium text-foreground">{reviewDoc.documentNumberMasked || 'Not provided'}</p>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Uploaded Date</span>
                  <p className="font-medium text-foreground">{new Date(reviewDoc.createdAt || reviewDoc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">File Size</span>
                  <p className="font-medium text-foreground">{formatFileSize(reviewDoc.fileSize)}</p>
                </div>

                {reviewDoc.issueDate && (
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Issue Date</span>
                    <p className="font-medium text-foreground">{reviewDoc.issueDate}</p>
                  </div>
                )}

                {reviewDoc.expiryDate && (
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Expiry Date</span>
                    <p className="font-medium text-foreground">
                      {reviewDoc.expiryDate}
                      {reviewDoc.expiryStatus === 'EXPIRED' && (
                        <span className="ml-1 text-destructive font-bold text-[10px]">(EXPIRED)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Secure Document Preview */}
              <div className="rounded-xl border overflow-hidden bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Encrypted Cloud Document Preview
                  </span>
                  {reviewDoc.fileUrl && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={reviewDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium text-foreground hover:bg-accent"
                      >
                        <ExternalLink className="h-3 w-3" /> Open in Tab
                      </a>
                      <a
                        href={reviewDoc.fileUrl}
                        download
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </div>
                  )}
                </div>

                {/* Inline Preview (PDF or Image) */}
                {reviewDoc.fileUrl && (reviewDoc.mimeType?.includes('pdf') || reviewDoc.fileName?.toLowerCase().endsWith('.pdf')) ? (
                  <div className="w-full h-80 rounded-lg border bg-white overflow-hidden shadow-inner">
                    <iframe
                      src={`${reviewDoc.fileUrl}#toolbar=0`}
                      className="w-full h-full border-0"
                      title={reviewDoc.title}
                    />
                  </div>
                ) : reviewDoc.fileUrl && (reviewDoc.mimeType?.startsWith('image/') || reviewDoc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                  <div className="w-full max-h-80 rounded-lg border bg-slate-900/5 flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={reviewDoc.fileUrl}
                      alt={reviewDoc.title}
                      className="max-h-76 max-w-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg bg-card space-y-2">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="font-semibold text-xs text-foreground">{reviewDoc.fileName || 'Attached File'}</p>
                    <p className="text-[11px] text-muted-foreground">Click &quot;Open in Tab&quot; or &quot;Download&quot; to inspect this document format.</p>
                  </div>
                )}
              </div>

              {/* Verification & Audit History Timeline */}
              <div className="rounded-xl border bg-card p-4 space-y-2.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Verification &amp; Audit History</h5>
                <div className="space-y-2">
                  {reviewDoc.status === 'VERIFIED' && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          VERIFIED
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {reviewDoc.verifiedAt ? new Date(reviewDoc.verifiedAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900 font-medium">
                        Verified by: {reviewDoc.verifiedByName || 'School Administrator'}
                      </p>
                      {reviewDoc.verificationNote && (
                        <p className="text-[11px] text-emerald-800 italic">&quot;{reviewDoc.verificationNote}&quot;</p>
                      )}
                    </div>
                  )}

                  {reviewDoc.status === 'REJECTED' && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-destructive flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          REJECTED
                        </span>
                        <span className="text-[10px] text-destructive/80">
                          {reviewDoc.verifiedAt ? new Date(reviewDoc.verifiedAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-destructive">
                        Reason: {reviewDoc.rejectionReason || 'Document did not meet institutional standards.'}
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg border bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Uploaded by Educator / Administration</span>
                    <span>{new Date(reviewDoc.createdAt || reviewDoc.uploadedAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
            >
              Close
            </Button>
            {reviewDoc && reviewDoc.status !== 'REJECTED' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsReviewOpen(false);
                  handleStartReject(reviewDoc);
                }}
                className="text-destructive hover:bg-destructive/10 border-destructive/30 font-semibold cursor-pointer"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reject Document
              </Button>
            )}
            {reviewDoc && reviewDoc.status !== 'VERIFIED' && (
              <Button
                type="button"
                onClick={() => {
                  setIsReviewOpen(false);
                  handleStartVerify(reviewDoc);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Verify Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Two-Step Verification Confirmation Modal */}
      <Dialog open={isConfirmVerifyOpen} onOpenChange={setIsConfirmVerifyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-700 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Verify this document?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will mark <span className="font-semibold text-foreground">{docToVerify?.title}</span> as <strong>VERIFIED</strong> and record your administrative account as the authenticated verifier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmVerification} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-medium text-foreground">Verification Note (Optional)</label>
              <input
                type="text"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="e.g. Original physical copy inspected and authenticated"
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              />
            </div>

            {verifyError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmVerifyOpen(false)}
                disabled={verifying}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifying}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
              >
                {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Rejection Modal with Mandatory Reason */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rejecting <span className="font-semibold text-foreground">{docToReject?.title}</span>. A clear reason is required so the faculty member can upload a compliant replacement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRejection} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-medium text-destructive">Reason for Rejection *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Document image is blurry and ID number is not clearly legible. Please upload a clear scan."
                className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-xs focus:ring-1 focus:ring-destructive"
                required
              />
            </div>

            {rejectError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectOpen(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rejecting || !rejectionReason.trim()}
                className="bg-destructive hover:bg-destructive/90 text-white gap-1.5 font-semibold"
              >
                {rejecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Legal / Educational / Employment Document</DialogTitle>
            <DialogDescription>
              Submit verified documentation for {teacher.personal.firstName} {teacher.personal.lastName}. Files are secured in encrypted cloud storage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDocumentUpload} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="KYC">Identity / KYC</option>
                  <option value="EDUCATIONAL">Educational Degree</option>
                  <option value="EMPLOYMENT">Employment &amp; Verification</option>
                  <option value="CUSTOM">Custom / Other</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setUploadDocType(selected);
                    const match = STANDARD_TEACHER_DOCUMENTS.find((d) => d.code === selected);
                    if (match) {
                      setUploadTitle(match.name);
                      setUploadIsRequired(match.defaultRequired);
                    }
                  }}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === uploadCategory).map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                  <option value="OTHER">Other Custom Document</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Document Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Aadhaar Card (Front & Back)"
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-foreground">Document ID No. (Optional)</label>
                <input
                  type="text"
                  value={uploadDocNumber}
                  onChange={(e) => setUploadDocNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-foreground">Issue Date</label>
                <input
                  type="date"
                  value={uploadIssueDate}
                  onChange={(e) => setUploadIssueDate(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground">Expiry Date</label>
                <input
                  type="date"
                  value={uploadExpiryDate}
                  onChange={(e) => setUploadExpiryDate(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="uploadIsRequired"
                checked={uploadIsRequired}
                onChange={(e) => setUploadIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="uploadIsRequired" className="text-xs text-foreground cursor-pointer">
                Mark as mandatory requirement for institutional faculty onboarding
              </label>
            </div>

            <div>
              <label className="font-medium text-foreground">Select Document File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Accepted: PDF, PNG, JPG, DOCX (up to 10MB). Encrypted storage.
              </p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || !uploadFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
