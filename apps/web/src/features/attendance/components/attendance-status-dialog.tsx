'use client';

import * as React from 'react';
import { AttendanceRegisterItem } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

interface AttendanceStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: AttendanceRegisterItem | null;
  onSaveReason: (studentId: string, reason: string) => void;
}

export function AttendanceStatusDialog({
  isOpen,
  onClose,
  student,
  onSaveReason,
}: AttendanceStatusDialogProps) {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AttendanceStatusForm
        key={student.studentId}
        student={student}
        onClose={onClose}
        onSaveReason={onSaveReason}
      />
    </Dialog>
  );
}

function AttendanceStatusForm({
  student,
  onClose,
  onSaveReason,
}: {
  student: AttendanceRegisterItem;
  onClose: () => void;
  onSaveReason: (studentId: string, reason: string) => void;
}) {
  const [reason, setReason] = React.useState(student.reason || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReason(student.studentId, reason);
    onClose();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-base font-bold">
          Record Note / Reason for {student.studentName}
        </DialogTitle>
        <DialogDescription className="text-xs">
          Add context for {student.status.toLowerCase()} status (Roll No: {student.rollNumber}, {student.admissionNumber}).
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <FormField
          label="Reason / Explanation"
          description="E.g. Medical emergency, sick leave certificate submitted, bus delay"
        >
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason or reference note..."
            className="text-xs"
            autoFocus
          />
        </FormField>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground w-full mb-1">Quick Presets:</span>
          {['Medical Leave', 'Family Emergency', 'School Bus Delay', 'Doctor Appointment', 'Informed by Parent'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              className="text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Reason Note
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
