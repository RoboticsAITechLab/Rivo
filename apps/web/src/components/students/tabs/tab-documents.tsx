'use client';

import React from 'react';
import { StudentDetail } from '@/types/student';
import { FileText, Download, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabDocumentsProps {
  student: StudentDetail;
}

export function TabDocuments({ student }: TabDocumentsProps) {
  const { documents = [], admissionType, previousSchool, previousClass } = student;

  const handleSimulateDownload = (fileName: string) => {
    alert(`Downloading verified copy of: ${fileName}`);
  };

  const handleSimulateView = (title: string) => {
    alert(`Opening document viewer preview for: ${title}`);
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

        <div className="text-[11px] text-slate-500 font-medium">
          Total Documents: <strong>{documents.length}</strong>
        </div>
      </div>

      {/* POLICY CALLOUT */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-blue-900 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Compliance Policy Adherence:</span>
          <p className="text-blue-800 mt-0.5">
            Birth certificate is officially verified as an <strong>Optional</strong> intake document.
            Transfer credentials (TC and previous marksheet) are maintained on permanent record.
          </p>
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      {documents.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
          No institutional documents attached to this student record.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {documents.map((doc) => {
            const isVerified = doc.status === 'VERIFIED';
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
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {doc.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.isRequired ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          Optional
                        </span>
                      )}

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
                        {doc.status}
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
                        <p className="text-[10px] text-slate-400">Uploaded on {doc.uploadedAt}</p>
                      )}
                      {doc.verificationNotes && (
                        <p className="text-[10px] text-emerald-800 font-medium pt-0.5">
                          ✓ {doc.verificationNotes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No document file uploaded yet.</p>
                  )}
                </div>

                {doc.fileName && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulateView(doc.title || doc.name || 'Document')}
                      className="text-xs h-7 px-2.5 gap-1 border-slate-200 text-slate-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSimulateDownload(doc.fileName!)}
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
    </div>
  );
}
