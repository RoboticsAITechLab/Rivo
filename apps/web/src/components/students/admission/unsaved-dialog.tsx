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
import { AlertCircle } from 'lucide-react';

interface UnsavedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
}

export function UnsavedDialog({
  isOpen,
  onClose,
  onSaveDraft,
  onDiscard,
}: UnsavedDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <DialogTitle>Unsaved Admission Changes</DialogTitle>
          <DialogDescription>
            You have unsaved details in this admission form. Would you like to preserve your progress as
            a draft before exiting?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          <Button
            size="sm"
            onClick={onSaveDraft}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Save as Draft &amp; Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full border-slate-300 text-slate-700"
          >
            Keep Editing
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
