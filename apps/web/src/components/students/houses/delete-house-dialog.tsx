'use client';

import React from 'react';
import { SchoolHouse } from '@/types/house';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Trash2 } from 'lucide-react';

interface DeleteHouseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  house: SchoolHouse | null;
  assignedStudentCount: number;
  onConfirmDelete: (houseId: string) => void;
  onViewStudents: (houseId: string) => void;
}

export function DeleteHouseDialog({
  isOpen,
  onClose,
  house,
  assignedStudentCount,
  onConfirmDelete,
  onViewStudents,
}: DeleteHouseDialogProps) {
  if (!house) return null;

  const hasAssignedStudents = assignedStudentCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              hasAssignedStudents ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {hasAssignedStudents ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </div>
          <DialogTitle>
            {hasAssignedStudents ? 'Cannot Delete House' : `Delete ${house.name}?`}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {hasAssignedStudents ? (
              <>
                <strong className="text-slate-900">{house.name}</strong> currently has{' '}
                <strong className="text-slate-900">{assignedStudentCount} students</strong> assigned.
                Reassign students to another house or deactivate the house instead to preserve roster
                integrity.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{house.name}</strong>? This action cannot be
                undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasAssignedStudents && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 my-2">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Direct deletion is protected while active or past memberships exist.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          {hasAssignedStudents ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onViewStudents(house.id);
                }}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                View {assignedStudentCount} Students
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onConfirmDelete(house.id);
                  onClose();
                }}
                className="text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete House
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
