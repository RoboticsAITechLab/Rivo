'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface UnsavedChangesDialogProps {
  open: boolean;
  onDiscard?: () => void;
  onContinueEditing?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onDiscard,
  onContinueEditing,
  onConfirm,
  onCancel,
  onSave,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  const handleDiscard = onDiscard || onConfirm || (() => {});
  const handleContinue = onContinueEditing || onCancel || (() => {});

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleContinue()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle>Unsaved changes</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            You have unsaved changes that will be lost if you leave this page. Do you want to save or discard your modifications?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="text-xs text-destructive hover:bg-destructive/10"
          >
            Discard Changes
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onContinueEditing}
              className="text-xs"
            >
              Continue Editing
            </Button>
            {onSave && (
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="text-xs"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
