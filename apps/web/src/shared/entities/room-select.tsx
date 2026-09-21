'use client';

import * as React from 'react';
import { UniversalSelector, SelectorOption } from './universal-selector';
import { useSchoolStore, schoolStore } from '../mock-store/school-store';
import { selectRooms } from '../selectors';
import { Room, RoomId, RoomType } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Building2, AlertTriangle } from 'lucide-react';
import { detectRoomDuplicate } from '../validation/duplicate-detector';

export interface RoomSelectProps {
  value?: RoomId | null;
  onChange: (roomId: RoomId) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
}

export function RoomSelect({
  value,
  onChange,
  label = 'Room / Facility',
  required,
  disabled,
  allowClear = true,
  placeholder = 'Select room or lab...',
  className,
}: RoomSelectProps) {
  const store = useSchoolStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const options: SelectorOption<Room>[] = React.useMemo(() => {
    const rooms = selectRooms(store);
    return rooms.map((r) => ({
      id: r.id,
      title: r.name,
      subtitle: `${r.building} • ${r.floor} • Cap: ${r.capacity} (${r.type})`,
      badge:
        r.type === 'LAB' ? (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 font-semibold">
            Lab
          </span>
        ) : undefined,
      raw: r,
    }));
  }, [store]);

  const handleRoomCreated = (newRoom: Room) => {
    onChange(newRoom.id);
  };

  return (
    <>
      <UniversalSelector<Room>
        value={value}
        onChange={(id) => onChange(id)}
        options={options}
        label={label}
        required={required}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        searchPlaceholder="Search classroom, laboratory or hall..."
        emptyMessage="No rooms configured."
        noResultsMessage="No matching rooms found."
        addNewLabel="+ Add New Room"
        onAddNew={() => setIsAddModalOpen(true)}
        className={className}
      />

      <QuickRoomCreateDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleRoomCreated}
      />
    </>
  );
}

function QuickRoomCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <QuickRoomCreateModalInner onClose={onClose} onCreated={onCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickRoomCreateModalInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState<RoomType>('CLASSROOM');
  const [building, setBuilding] = React.useState('Main Wing');
  const [floor, setFloor] = React.useState('1st Floor');
  const [capacity, setCapacity] = React.useState(40);
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) return;

    const duplicate = detectRoomDuplicate(store, { name, code });
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate.message);
      return;
    }

    const newRoom = schoolStore.createRoom({
      name: name.trim(),
      code: code.trim().toUpperCase() || name.trim().replace(/\s+/g, '-').toUpperCase(),
      type,
      building: building.trim() || 'Main Wing',
      floor: floor.trim() || 'Ground Floor',
      capacity,
      status: 'ACTIVE',
    });

    onCreated(newRoom);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Add New Room / Facility</DialogTitle>
            <DialogDescription className="text-xs">
              Creates a reusable room or lab for conflict-free scheduling across the school.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="space-y-3 pt-2"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Room Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDuplicateWarning(null);
              }}
              placeholder="e.g. Room 204 or Physics Lab"
              className="h-8.5 text-xs"
              required
            />
          </FormField>
          <FormField label="Room Code">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setDuplicateWarning(null);
              }}
              placeholder="e.g. RM-204"
              className="h-8.5 text-xs font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Type" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RoomType)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Laboratory</option>
              <option value="AUDITORIUM">Auditorium</option>
              <option value="LIBRARY">Library</option>
              <option value="SPORTS">Sports Ground / Hall</option>
              <option value="OTHER">Other Facility</option>
            </select>
          </FormField>
          <FormField label="Capacity">
            <Input
              type="number"
              min={5}
              max={500}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="h-8.5 text-xs"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Building / Wing">
            <Input
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Main Wing"
              className="h-8.5 text-xs"
            />
          </FormField>
          <FormField label="Floor">
            <Input
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="2nd Floor"
              className="h-8.5 text-xs"
            />
          </FormField>
        </div>

        {duplicateWarning && (
          <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Possible duplicate detected:</span>
              <p className="mt-0.5 text-[11px]">{duplicateWarning}</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {duplicateWarning ? 'Create Anyway' : 'Save & Select Room'}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
