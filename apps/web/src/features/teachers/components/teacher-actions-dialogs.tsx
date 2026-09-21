'use client';

import * as React from 'react';
import { TeacherDetail } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, UserCheck } from 'lucide-react';

interface TeacherStatusDialogProps {
  teacher: TeacherDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmStatus: (teacherId: string, newStatus: TeacherDetail['status'], reason: string) => void;
}

export function TeacherStatusDialog({
  teacher,
  isOpen,
  onClose,
  onConfirmStatus,
}: TeacherStatusDialogProps) {
  if (!teacher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <TeacherStatusContent
        key={teacher.id}
        teacher={teacher}
        onClose={onClose}
        onConfirmStatus={onConfirmStatus}
      />
    </Dialog>
  );
}

function TeacherStatusContent({
  teacher,
  onClose,
  onConfirmStatus,
}: {
  teacher: TeacherDetail;
  onClose: () => void;
  onConfirmStatus: (teacherId: string, newStatus: TeacherDetail['status'], reason: string) => void;
}) {
  const [status, setStatus] = React.useState<TeacherDetail['status']>(teacher.status);
  const [reason, setReason] = React.useState('');

  const handleConfirm = () => {
    onConfirmStatus(teacher.id, status, reason);
    onClose();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <UserCheck className="w-5 h-5" />
        </div>
        <DialogTitle>Update Educator Status</DialogTitle>
        <DialogDescription>
          Change operational availability status for{' '}
          <strong className="text-foreground">
            {teacher.personal.firstName} {teacher.personal.lastName}
          </strong>{' '}
          ({teacher.employment.employeeId}).
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2 text-xs">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Status Transition</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TeacherDetail['status'])}
            className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ACTIVE">Active (On Duty)</option>
            <option value="ON_LEAVE">On Leave (Sabbatical / Medical)</option>
            <option value="INACTIVE">Inactive (Suspended / Relieved)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Administrative Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved maternity leave until next semester."
            className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} className="bg-primary text-primary-foreground">
          Save Status
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface TeacherArchiveDialogProps {
  teacher: TeacherDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmArchive: (teacherId: string) => void;
}

export function TeacherArchiveDialog({
  teacher,
  isOpen,
  onClose,
  onConfirmArchive,
}: TeacherArchiveDialogProps) {
  if (!teacher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <DialogTitle>Deactivate &amp; Archive Educator</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate{' '}
            <strong className="text-foreground">
              {teacher.personal.firstName} {teacher.personal.lastName}
            </strong>{' '}
            ({teacher.employment.employeeId})? This will mark the educator as inactive and archive historical assignments without deleting audit records.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirmArchive(teacher.id);
              onClose();
            }}
          >
            Deactivate Educator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
