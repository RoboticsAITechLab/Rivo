'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StudentDetail } from '@/types/student';
import { FileText, Download, CheckCircle2, AlertCircle, Info, ExternalLink, UploadCloud, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface TabDocumentsProps {
  student: StudentDetail;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BIRTH_CERTIFICATE: 'Birth Certificate',
  PREVIOUS_MARKSHEET: 'Previous Marksheet',
  TRANSFER_CERTIFICATE: 'Transfer Certificate (TC)',
  IDENTITY_PROOF: 'Identity Proof (Aadhaar / National ID)',
  MEDICAL_RECORD: 'Medical Record / Certificate',
  OTHER: 'General Institutional Document',
};

export function TabDocuments({ student }: TabDocumentsProps) {
  const { admissionType, previousSchool, previousClass } = student;
  const [docs, setDocs] = useState<any[]>(student.documents || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('IDENTITY_PROOF');
  const [docTitle, setDocTitle] = useState<string>('');

  const fetchLiveDocuments = useCallback(async () => {
    if (!student?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}/documents`);
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          setDocs(data.documents);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    fetchLiveDocuments();
  }, [fetchLiveDocuments]);

  const handleOpenDoc = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Document URL is not currently accessible.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !student?.id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', docType);
      formData.append('title', docTitle.trim() || selectedFile.name);

      const res = await fetch(`/api/students/${student.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to upload document');
      }

      setIsUploadOpen(false);
      setSelectedFile(null);
      setDocTitle('');
      await fetchLiveDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* INTAKE CATEGORY BANNER */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Admission Intake Category:
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {admissionType === 'TRANSFER'
                ? 'Transfer Student'
                : admissionType === 'RETURNING'
                ? 'Returning Student'
                : 'First-Time Admission'}
            </span>
          </div>

          {admissionType === 'TRANSFER' && (
            <p className="text-xs text-slate-600 mt-1">
              Previous School: <strong>{previousSchool || 'Verified Institution'}</strong> • Grade:{' '}
              <strong>{previousClass || 'Class 9'}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs h-8 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* POLICY CALLOUT */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-blue-900 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Compliance &amp; Storage Architecture:</span>
          <p className="text-blue-800 mt-0.5">
            Institutional records are stored securely in Azure Blob Storage with short-lived signed access tokens (15-min TTL).
            Birth certificate is officially verified as an <strong>Optional</strong> intake document.
          </p>
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      {isLoading ? (
        <div className="p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          Loading student documents from secure storage...
        </div>
      ) : docs.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs space-y-2">
          <FileText className="w-6 h-6 mx-auto text-slate-300" />
          <p>No institutional documents attached to this student record.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs h-7 gap-1"
          >
            <Plus className="w-3 h-3" />
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {docs.map((doc) => {
            const isVerified = doc.status === 'VERIFIED';
            const accessUrl = doc.accessUrl || doc.fileUrl;
            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title || doc.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {DOCUMENT_TYPE_LABELS[doc.documentType || doc.type] || doc.documentType || doc.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {doc.status || 'VERIFIED'}
                      </span>
                    </div>
                  </div>

                  {doc.fileName ? (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-mono font-medium truncate max-w-[180px]">
                          {doc.fileName}
                        </span>
                        {doc.fileSize && <span className="text-slate-400 text-[11px]">{doc.fileSize}</span>}
                      </div>
                      {doc.uploadedAt && (
                        <p className="text-[10px] text-slate-400">
                          Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No document file metadata attached.</p>
                  )}
                </div>

                {accessUrl && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDoc(accessUrl)}
                      className="text-xs h-7 px-2.5 gap-1 border-slate-200 text-slate-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Document
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDoc(accessUrl)}
                      className="text-xs h-7 px-2.5 gap-1 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Upload Student Document
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
              >
                <option value="IDENTITY_PROOF">Identity Proof (Aadhaar / National ID)</option>
                <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                <option value="PREVIOUS_MARKSHEET">Previous Marksheet</option>
                <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                <option value="MEDICAL_RECORD">Medical Record / Health Document</option>
                <option value="OTHER">Other Institutional Document</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Aadhaar Card Front & Back"
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select File (PDF, PNG, JPG)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
                className="w-full text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedFile || uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                {uploading ? 'Uploading to Azure...' : 'Upload File'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
