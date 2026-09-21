'use client';

import React, { useState } from 'react';
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

interface AddEditHouseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (house: SchoolHouse) => void;
  houseToEdit?: SchoolHouse | null;
  existingHouses: SchoolHouse[];
}

export function AddEditHouseDialog({
  isOpen,
  onClose,
  onSave,
  houseToEdit,
  existingHouses,
}: AddEditHouseDialogProps) {
  const [name, setName] = useState(houseToEdit?.name || '');
  const [shortName, setShortName] = useState(houseToEdit?.shortName || '');
  const [description, setDescription] = useState(houseToEdit?.description || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(houseToEdit?.status || 'ACTIVE');
  const [color, setColor] = useState(houseToEdit?.color || '#2563eb');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('House Name is required.');
      return;
    }

    // Check duplicate house names within the school (excluding the one being edited)
    const isDuplicate = existingHouses.some(
      (h) => h.id !== houseToEdit?.id && h.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError(`A house named "${trimmedName}" already exists for this school.`);
      return;
    }

    const savedHouse: SchoolHouse = {
      id: houseToEdit?.id || `house-${Date.now().toString(36)}`,
      name: trimmedName,
      shortName: shortName.trim() || undefined,
      description: description.trim() || undefined,
      status,
      color,
    };

    onSave(savedHouse);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{houseToEdit ? 'Edit House' : 'Add House'}</DialogTitle>
          <DialogDescription>
            Configure institutional house details for inter-house sporting, cultural, and academic
            competitions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              House Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Blue House, Tiger House, Phoenix House"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Short Name / Code</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. Blue, TIG"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Theme Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                />
                <span className="font-mono text-xs text-slate-600 uppercase">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. House motto, mascot, or allocation notes..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="block font-semibold text-slate-700">House Operational Status</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="house-status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Active (Available for new students)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="house-status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-500">Inactive</span>
              </label>
            </div>
            {status === 'INACTIVE' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
                Inactive houses will not appear in the dropdown for new admissions, but existing student
                memberships remain visible.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {houseToEdit ? 'Save Changes' : 'Create House'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
