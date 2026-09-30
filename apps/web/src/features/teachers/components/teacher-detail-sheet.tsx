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
  { key: 'documents', label: 'Documents' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'workload', label: 'Workload' },
  { key: 'activity', label: 'Activity' },
];

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
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadCategory, setUploadCategory] = React.useState('RESUME');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = React.useState<string | null>(null);

  // Sync documents when teacher prop changes
  React.useEffect(() => {
    if (teacher) {
      setDocuments(teacher.documents || []);
    }
  }, [teacher]);

  if (!teacher) return null;

  const initials = `${teacher.personal.firstName[0] || 'T'}${teacher.personal.lastName[0] || ''}`.toUpperCase();
  const distinctSubjects = Array.from(new Set(teacher.assignments.map((a) => a.subjectName)));

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
      formData.append('title', uploadTitle.trim() || uploadFile.name);
      formData.append('category', uploadCategory);

      const res = await fetch(`/api/teachers/${teacher.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      setDocuments((prev) => [data.document, ...prev]);
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading document');
    } finally {
      setUploading(false);
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
                title="Weekly Load"
                value={`${teacher.weeklyPeriods}`}
                change="Periods / week"
                isPositive={teacher.weeklyPeriods <= 26}
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
                        <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px]">
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

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Teacher Documents &amp; Certificates
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Securely stored in Azure Blob Storage with temporary signed SAS authorization.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsUploadOpen(true)}
                      className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Upload Document
                    </Button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="font-medium text-foreground">No Documents Uploaded</p>
                      <p className="text-[11px] text-muted-foreground">
                        Upload ID proofs, educational credentials, or contracts for this faculty member.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-xs truncate">{doc.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-primary">{doc.category || doc.documentType}</span> • {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt || doc.uploadedAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.fileUrl && (
                              <>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-7 px-2 rounded-md border text-[11px] font-medium text-foreground hover:bg-accent"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </a>
                                <a
                                  href={doc.fileUrl}
                                  download
                                  className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingDocId === doc.id}
                              onClick={() => handleDocumentDelete(doc.id)}
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            >
                              {deletingDocId === doc.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Teacher Document</DialogTitle>
            <DialogDescription>
              Upload credentials or official documentation for {teacher.personal.firstName} {teacher.personal.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDocumentUpload} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-foreground">Document Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Master's Degree Certificate"
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Document Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="RESUME">Curriculum Vitae / Resume</option>
                <option value="GOVERNMENT_ID">National ID / Passport</option>
                <option value="CERTIFICATE">Academic Degree / Certificate</option>
                <option value="CONTRACT">Employment Contract</option>
                <option value="OTHER">Other Official Document</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Select File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Accepted: PDF, PNG, JPG, DOCX (up to 10MB).
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
                Upload to Azure
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
