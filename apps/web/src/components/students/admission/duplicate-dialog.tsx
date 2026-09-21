'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, User, ExternalLink } from 'lucide-react';
import { StudentDetail } from '@/types/student';

interface DuplicateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchedStudent: StudentDetail | null;
  onProceedAnyway: () => void;
  onViewExisting: (student: StudentDetail) => void;
}

export function DuplicateDialog({
  isOpen,
  onClose,
  matchedStudent,
  onProceedAnyway,
  onViewExisting,
}: DuplicateDialogProps) {
  if (!matchedStudent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle>Potential Duplicate Student Detected</DialogTitle>
          <DialogDescription>
            An existing student record matches this candidate&apos;s name or birth details in institutional register.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3 text-xs my-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 text-sm">{matchedStudent.name}</span>
              <p className="text-slate-600 font-mono text-[11px]">
                {matchedStudent.admissionNumber} • {matchedStudent.className}-{matchedStudent.section}
              </p>
              <p className="text-slate-500 text-[11px]">
                DOB: {matchedStudent.dateOfBirth} • Guardian: {matchedStudent.guardianName}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewExisting(matchedStudent)}
            className="w-full sm:w-auto gap-1 text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Existing Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-slate-600"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
