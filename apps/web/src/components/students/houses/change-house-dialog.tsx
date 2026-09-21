'use client';

import React, { useState } from 'react';
import { SchoolHouse } from '@/types/house';
import { StudentDetail } from '@/types/student';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface ChangeHouseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail | null;
  houses: SchoolHouse[];
  onConfirmChangeHouse: (studentId: string, newHouseId: string | null) => void;
}

export function ChangeHouseDialog({
  isOpen,
  onClose,
  student,
  houses,
  onConfirmChangeHouse,
}: ChangeHouseDialogProps) {
  const [selectedHouseId, setSelectedHouseId] = useState<string>(student?.houseId || '');
  const [prevStudentId, setPrevStudentId] = useState<string | undefined>(student?.id);

  // Sync selected house if student changes
  if (student?.id !== prevStudentId) {
    setPrevStudentId(student?.id);
    setSelectedHouseId(student?.houseId || '');
  }

  if (!student) return null;

  const currentHouse = houses.find((h) => h.id === student.houseId);
  const activeHouses = houses.filter((h) => h.status === 'ACTIVE' || h.id === student.houseId);

  const handleUpdate = () => {
    onConfirmChangeHouse(student.id, selectedHouseId === '' ? null : selectedHouseId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <DialogTitle>Change House Allocation</DialogTitle>
          <DialogDescription>
            Update inter-house competition assignment for{' '}
            <strong className="text-slate-900">{student.name}</strong> ({student.admissionNumber}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium block">Current House:</span>
            <span className="text-sm font-bold text-slate-800">
              {currentHouse ? currentHouse.name : 'No House Assigned'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">New House Assignment</label>
            <select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">No House Assigned</option>
              {activeHouses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.status === 'INACTIVE' ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpdate}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            Update House
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
