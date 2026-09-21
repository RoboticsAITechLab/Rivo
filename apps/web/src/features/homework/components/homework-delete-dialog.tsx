'use client';

import * as React from 'react';
import { HomeworkItem } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface HomeworkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  homework: HomeworkItem | null;
  onConfirmDelete: (id: string) => void;
}

export function HomeworkDeleteDialog({
  isOpen,
  onClose,
  homework,
  onConfirmDelete,
}: HomeworkDeleteDialogProps) {
  if (!homework) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-base font-bold">Delete Assignment?</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{homework.title}&quot;</span>?
            This will permanently remove the assignment and all associated student submissions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirmDelete(homework.id);
              onClose();
            }}
          >
            Delete Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
