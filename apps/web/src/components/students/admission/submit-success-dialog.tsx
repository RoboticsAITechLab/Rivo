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
import { CheckCircle2, User, PlusCircle, ArrowRight } from 'lucide-react';
import { StudentDetail } from '@/types/student';

interface SubmitSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  createdStudent: StudentDetail | null;
  onViewStudent: (student: StudentDetail) => void;
  onAddAnother: () => void;
}

export function SubmitSuccessDialog({
  isOpen,
  onClose,
  createdStudent,
  onViewStudent,
  onAddAnother,
}: SubmitSuccessDialogProps) {
  if (!createdStudent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-center sm:text-left">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto sm:mx-0 mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Admission Completed Successfully</DialogTitle>
          <DialogDescription>
            The student has been officially registered and enrolled into the academic roster.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 my-2 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="text-slate-500 font-medium">Admission Number:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {createdStudent.admissionNumber}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="text-slate-500 font-medium">Student Name:</span>
            <span className="font-bold text-slate-900">{createdStudent.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="text-slate-500 font-medium">Class &amp; Section:</span>
            <span className="font-semibold text-slate-800">
              {createdStudent.className} - {createdStudent.section}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Primary Guardian:</span>
            <span className="font-medium text-slate-700">{createdStudent.guardianName}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAnother}
            className="w-full sm:w-auto gap-1.5 text-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Admit Another Student
          </Button>
          <Button
            size="sm"
            onClick={() => onViewStudent(createdStudent)}
            className="w-full sm:w-auto gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <User className="w-4 h-4" />
            View Student 360
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
