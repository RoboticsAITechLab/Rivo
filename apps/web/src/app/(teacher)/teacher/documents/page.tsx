'use client';

import * as React from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  Download,
  ExternalLink,
  UploadCloud,
  FileText,
  Lock,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TeacherDocumentItem } from '@/features/teachers/types';
import { STANDARD_TEACHER_DOCUMENTS } from '@/lib/teachers/document-catalog';

interface ChecklistData {
  totalRequired: number;
  submittedRequired: number;
  verifiedRequired: number;
  completionPercentage: number;
  missingRequiredTypes: string[];
}

export default function TeacherDocumentsPage() {
  const [documents, setDocuments] = React.useState<TeacherDocumentItem[]>([]);
  const [checklist, setChecklist] = React.useState<ChecklistData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState<'ALL' | 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM'>('ALL');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadCategory, setUploadCategory] = React.useState<'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM'>('KYC');
  const [uploadDocType, setUploadDocType] = React.useState('AADHAAR_CARD');
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadDocNumber, setUploadDocNumber] = React.useState('');
  const [uploadIssueDate, setUploadIssueDate] = React.useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = React.useState('');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/teacher/documents');
      if (!res.ok) {
        throw new Error('Failed to load your documents');
      }
      const data = await res.json();
      setDocuments(data.documents || []);
      setChecklist(data.checklist || null);
    } catch (err: any) {
      setError(err.message || 'Error loading documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Update default document type when upload category changes
  React.useEffect(() => {
    const matching = STANDARD_TEACHER_DOCUMENTS.filter((d) => d.category === uploadCategory);
    if (matching.length > 0) {
      setUploadDocType(matching[0].code);
      setUploadTitle(matching[0].name);
    } else {
      setUploadDocType('OTHER');
      setUploadTitle('');
    }
  }, [uploadCategory]);

  const handleOpenUploadForType = (docType: string, category: 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM', defaultTitle: string) => {
    setUploadCategory(category);
    setUploadDocType(docType);
    setUploadTitle(defaultTitle);
    setUploadDocNumber('');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setUploadFile(null);
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
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

      const res = await fetch('/api/teacher/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      setIsUploadOpen(false);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
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

  const filteredDocs = documents.filter((d) => {
    if (categoryFilter === 'ALL') return true;
    return (d.category || 'KYC').toUpperCase() === categoryFilter;
  });

  const totalVerified = documents.filter((d) => d.status === 'VERIFIED').length;
  const totalPending = documents.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'SUBMITTED').length;
  const totalRejected = documents.filter((d) => d.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-emerald-700" />
            Legal, KYC &amp; Employment Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload and track your institutional identity, educational degrees, and employment verification status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setUploadCategory('KYC');
              setUploadDocType('AADHAAR_CARD');
              setUploadTitle('Aadhaar Card');
              setUploadFile(null);
              setUploadError(null);
              setIsUploadOpen(true);
            }}
            className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Compliance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Required Compliance</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {checklist?.verifiedRequired || 0} / {checklist?.totalRequired || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {checklist?.completionPercentage || 0}% required verified
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Verified Documents</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700">{totalVerified}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Approved by school administration
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Under Review</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700">{totalPending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              Queued for admin review
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Action Required</CardDescription>
            <CardTitle className="text-2xl font-bold text-destructive">
              {totalRejected + (checklist?.missingRequiredTypes.length || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              {totalRejected} rejected, {checklist?.missingRequiredTypes.length || 0} missing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Required Checklist Banner if items missing */}
      {checklist && checklist.missingRequiredTypes.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-950 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Institutional Documentation Action Required: Missing Mandatory Records</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            The school policy requires the following document records for full faculty onboarding compliance:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {checklist.missingRequiredTypes.map((code) => {
              const def = STANDARD_TEACHER_DOCUMENTS.find((d) => d.code === code);
              const label = def?.name || code.replace(/_/g, ' ');
              const cat = def?.category || 'KYC';
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleOpenUploadForType(code, cat, label)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Upload {label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1.5 border-b pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Documents' },
          { key: 'KYC', label: 'Identity / KYC' },
          { key: 'EDUCATIONAL', label: 'Educational Degrees' },
          { key: 'EMPLOYMENT', label: 'Employment & Verification' },
          { key: 'CUSTOM', label: 'Custom / Other' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
              categoryFilter === tab.key
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Your Uploaded Documents</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            All files are stored privately in encrypted cloud storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading your documents...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive text-xs border border-destructive/20 bg-destructive/5 rounded-lg">
              {error}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-slate-50 space-y-2">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-xs text-slate-700">No documents found in this category.</p>
              <p className="text-[11px] text-slate-500">
                Click &quot;Upload Document&quot; above to submit your credentials.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const isVerified = doc.status === 'VERIFIED';
                const isRejected = doc.status === 'REJECTED';
                const isReview = doc.status === 'UNDER_REVIEW' || doc.status === 'SUBMITTED';

                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl border p-4 transition-colors space-y-3 bg-white ${
                      isRejected
                        ? 'border-red-300 bg-red-50/40'
                        : isVerified
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-700'
                              : isRejected
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                            <span
                              className={`rounded-full text-[10px] font-semibold px-2 py-0.5 ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {(doc.status || 'UNDER_REVIEW').replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                            <span className="font-medium text-slate-700">{doc.category || 'KYC'}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded: {new Date(doc.createdAt || doc.uploadedAt || Date.now()).toLocaleDateString()}</span>
                            {doc.documentNumberMasked && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-700 flex items-center gap-1">
                                  <Lock className="h-3 w-3 text-slate-400" />
                                  {doc.documentNumberMasked}
                                </span>
                              </>
                            )}
                          </div>

                          {doc.expiryDate && (
                            <div className="pt-1 flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500">Valid until: {doc.expiryDate}</span>
                              {doc.expiryStatus === 'EXPIRED' && (
                                <span className="text-red-700 font-bold text-[10px]">EXPIRED</span>
                              )}
                              {doc.expiryStatus === 'EXPIRING_SOON' && (
                                <span className="text-amber-700 font-bold text-[10px]">
                                  Expiring in {doc.daysUntilExpiry} days
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions for teacher */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-start">
                        {doc.fileUrl && (
                          <>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download
                              className="inline-flex items-center justify-center h-8 px-2.5 rounded-md bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 shadow-2xs"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Download
                            </a>
                          </>
                        )}

                        {isRejected && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleOpenUploadForType(
                                doc.documentType,
                                (doc.category as any) || 'KYC',
                                doc.title
                              )
                            }
                            className="h-8 text-xs bg-red-700 hover:bg-red-800 text-white gap-1"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Replace Document
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection notice banner */}
                    {isRejected && doc.rejectionReason && (
                      <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-900 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-red-800">
                          <XCircle className="h-4 w-4 text-red-700" />
                          Document Rejected by Administration
                        </p>
                        <p className="text-[11px] text-red-900 font-medium">
                          Reason: {doc.rejectionReason}
                        </p>
                        <p className="text-[10px] text-red-700 pt-0.5">
                          Please click &quot;Replace Document&quot; above to submit an updated copy.
                        </p>
                      </div>
                    )}

                    {/* Verification confirmation stamp */}
                    {isVerified && doc.verifiedAt && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-[11px] text-emerald-900">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                          Verified on {new Date(doc.verifiedAt).toLocaleDateString()}
                          {doc.verifiedByName ? ` by ${doc.verifiedByName}` : ''}
                        </span>
                        {doc.verificationNote && (
                          <span className="text-[11px] text-emerald-800 italic">
                            &quot;{doc.verificationNote}&quot;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload / Replace Document Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Legal / Educational / Employment Document</DialogTitle>
            <DialogDescription>
              Submit verified credentials for administrator review. Files are stored securely in encrypted cloud storage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-900">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="KYC">Identity / KYC</option>
                  <option value="EDUCATIONAL">Educational Degree</option>
                  <option value="EMPLOYMENT">Employment &amp; Verification</option>
                  <option value="CUSTOM">Custom / Other</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-900">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setUploadDocType(selected);
                    const match = STANDARD_TEACHER_DOCUMENTS.find((d) => d.code === selected);
                    if (match) {
                      setUploadTitle(match.name);
                    }
                  }}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
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
              <label className="font-medium text-slate-900">Document Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Aadhaar Card (Front & Back)"
                className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-slate-900">Document ID No. (Optional)</label>
                <input
                  type="text"
                  value={uploadDocNumber}
                  onChange={(e) => setUploadDocNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-900">Issue Date</label>
                <input
                  type="date"
                  value={uploadIssueDate}
                  onChange={(e) => setUploadIssueDate(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-900">Expiry Date</label>
                <input
                  type="date"
                  value={uploadExpiryDate}
                  onChange={(e) => setUploadExpiryDate(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-900">Select Document File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Accepted: PDF, PNG, JPG, DOCX (up to 10MB).
              </p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
              >
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit for Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
