'use client';

import React, { useRef } from 'react';
import { StudentDocument } from '@/types/student';
import { FileText, UploadCloud, CheckCircle2, AlertCircle, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  document: StudentDocument;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onVerifyToggle?: () => void;
  isNotApplicable?: boolean;
  notApplicableReason?: string;
  disabled?: boolean;
}

export function DocumentCard({
  document,
  onUpload,
  onRemove,
  onVerifyToggle,
  isNotApplicable = false,
  notApplicableReason,
  disabled = false,
}: DocumentCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploaded = Boolean(document.fileName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  if (isNotApplicable) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-start gap-3 opacity-60">
        <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">{document.title}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-600">
              Not Applicable
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {notApplicableReason || 'Not required for this admission category.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isUploaded
          ? 'border-emerald-200 bg-emerald-50/20'
          : document.isRequired
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-slate-200 bg-white'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isUploaded
                ? 'bg-emerald-100 text-emerald-700'
                : document.isRequired
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{document.title}</span>
              {document.isRequired ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                  Required
                </span>
              ) : (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  Optional
                </span>
              )}

              {isUploaded && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    document.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : document.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {document.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {document.status}
                </span>
              )}
            </div>

            {isUploaded ? (
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <span className="font-mono text-slate-800 font-medium">{document.fileName}</span>
                {document.fileSize && <span>({document.fileSize})</span>}
                {document.uploadedAt && <span>• Uploaded {document.uploadedAt}</span>}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                {document.isRequired
                  ? 'Mandatory credential. Must be uploaded prior to final submission.'
                  : 'Optional during initial intake. Can be furnished subsequently.'}
              </p>
            )}

            {document.verificationNotes && (
              <p className="text-[10px] text-slate-500 italic mt-0.5">
                Note: {document.verificationNotes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {isUploaded ? (
            <>
              {onVerifyToggle && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={onVerifyToggle}
                  className="text-xs h-7 px-2 border-slate-200"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {document.status === 'VERIFIED' ? 'Mark Pending' : 'Verify'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-7 px-2 border-slate-200"
              >
                Replace
              </Button>
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Remove Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8 gap-1.5 border-slate-300"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              Upload Document
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
