'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Archive } from 'lucide-react';

interface StudentArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
  bulkCount?: number;
  onConfirmArchive: () => void;
}

export function StudentArchiveDialog({
  isOpen,
  onClose,
  student,
  bulkCount = 0,
  onConfirmArchive,
}: StudentArchiveDialogProps) {
  const isBulk = bulkCount > 1;

  const handleConfirm = () => {
    onConfirmArchive();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Archive className="h-5 w-5" />
            </div>
            <DialogTitle className="text-foreground">
              {isBulk ? `Archive ${bulkCount} Students?` : `Archive Student?`}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 leading-relaxed">
            {isBulk ? (
              <>
                The <span className="font-semibold text-foreground">{bulkCount} selected students</span> will no longer appear in the active student directory or regular roster rosters. Their historical records remain safely accessible in school archives.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{student?.name}</span> ({student?.admissionNumber}) will no longer appear in the active student directory.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="leading-snug">
            Archived students are excluded from attendance taking, fee billing, and grading reports until explicitly restored by a school administrator.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <Archive className="h-3.5 w-3.5" />
            {isBulk ? `Archive ${bulkCount} Students` : 'Archive Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
