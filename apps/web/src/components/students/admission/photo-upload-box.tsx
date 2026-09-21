'use client';

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadBoxProps {
  photoUrl?: string;
  onChange: (url?: string) => void;
  disabled?: boolean;
}

export function PhotoUploadBox({ photoUrl, onChange, disabled }: PhotoUploadBoxProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>(
    photoUrl ? 'idle' : 'idle'
  );
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateUpload = (file: File) => {
    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setUploadState('error');
      setErrorMessage('File size exceeds maximum allowed 5MB.');
      return;
    }

    setUploadState('uploading');
    setProgress(15);
    setErrorMessage('');

    // Simulate realistic upload progress in frontend mock
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            // Create a local object URL for preview
            const objectUrl = URL.createObjectURL(file);
            onChange(objectUrl);
            setUploadState('idle');
            setProgress(100);
          }, 400);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSimulateUpload(file);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setUploadState('idle');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* AVATAR DISPLAY */}
      <div className="relative group shrink-0">
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shadow-xs">
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoUrl}
              alt="Student Preview"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Camera className="w-8 h-8 stroke-[1.5]" />
              <span className="text-[10px] mt-1 font-medium">No Photo</span>
            </div>
          )}
        </div>

        {photoUrl && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 transition-colors"
            title="Remove Photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* CONTROLS & STATUS */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div>
          <h4 className="text-xs font-bold text-slate-800">Student Profile Photograph</h4>
          <p className="text-[11px] text-slate-500">
            JPG, PNG, or WebP. Recommended square aspect ratio (min 400x400px), up to 5MB.
          </p>
        </div>

        {uploadState === 'uploading' && (
          <div className="space-y-1.5 max-w-xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                Optimizing &amp; Uploading...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadState === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadState === 'idle' && (
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8 gap-1.5 border-slate-300"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              {photoUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>

            {photoUrl && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Attached
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
