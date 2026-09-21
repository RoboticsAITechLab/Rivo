'use client';

import * as React from 'react';
import { StudentDetail, StudentStatus } from '@/types/student';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { RefreshCw } from 'lucide-react';

interface StudentStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
  onConfirmStatus: (studentId: string, newStatus: StudentStatus, reason: string) => void;
}

const statusOptions: { status: StudentStatus; label: string; description: string }[] = [
  {
    status: 'ACTIVE',
    label: 'Active',
    description: 'Enrolled pupil participating in active classes, examinations, and attendance.',
  },
  {
    status: 'INACTIVE',
    label: 'Inactive',
    description: 'Temporarily inactive or on approved medical/personal leave of absence.',
  },
  {
    status: 'SUSPENDED',
    label: 'Suspended',
    description: 'Barred from active instructional sessions pending administrative review.',
  },
  {
    status: 'GRADUATED',
    label: 'Graduated',
    description: 'Successfully concluded senior academic program and alumni cohort.',
  },
  {
    status: 'TRANSFERRED',
    label: 'Transferred',
    description: 'Formal transfer certificate issued; transferred to another institution.',
  },
];

export function StudentStatusDialog({
  isOpen,
  onClose,
  student,
  onConfirmStatus,
}: StudentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<StudentStatus>(
    student ? student.status : 'ACTIVE',
  );
  const [reason, setReason] = React.useState('');

  const prevStudentIdRef = React.useRef(student?.id);
  if (student?.id !== prevStudentIdRef.current) {
    prevStudentIdRef.current = student?.id;
    if (student) {
      setSelectedStatus(student.status);
      setReason('');
    }
  }

  if (!student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmStatus(student.id, selectedStatus, reason);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <RefreshCw className="h-5 w-5" />
            <DialogTitle>Change Student Status</DialogTitle>
          </div>
          <DialogDescription>
            Update enrollment standing for <span className="font-semibold text-foreground">{student.name}</span> ({student.admissionNumber}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* Current Status Pill */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <span className="text-muted-foreground font-medium">Current Status:</span>
            <StatusBadge status={student.status} />
          </div>

          {/* New Status Radios */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Select New Operational Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.status;
                return (
                  <label
                    key={opt.status}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="studentStatus"
                      value={opt.status}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(opt.status)}
                      className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">{opt.label}</span>
                        <StatusBadge status={opt.status} className="scale-90 origin-left" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="reason" className="text-xs font-semibold text-foreground">
              Administrative Reason / Audit Note (Optional)
            </label>
            <input
              id="reason"
              type="text"
              placeholder="e.g. Parental transfer request, medical leave certificate"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm Status Change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
