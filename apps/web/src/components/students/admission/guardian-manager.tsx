'use client';

import React, { useState } from 'react';
import { StudentGuardian } from '@/types/student';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  User,
  Phone,
  Mail,
  Briefcase,
  Trash2,
  Edit2,
  ShieldCheck,
  BellRing,
} from 'lucide-react';

interface GuardianManagerProps {
  guardians: StudentGuardian[];
  onChange: (guardians: StudentGuardian[]) => void;
  disabled?: boolean;
}

const RELATIONSHIPS: ('Father' | 'Mother' | 'Legal Guardian' | 'Grandparent' | 'Other')[] = [
  'Father',
  'Mother',
  'Legal Guardian',
  'Grandparent',
  'Other',
];

export function GuardianManager({ guardians, onChange, disabled }: GuardianManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form state for add/edit modal
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<'Father' | 'Mother' | 'Legal Guardian' | 'Grandparent' | 'Other'>('Father');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [receiveSMS, setReceiveSMS] = useState(true);
  const [receiveEmail, setReceiveEmail] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setName('');
    setRelationship(guardians.length === 0 ? 'Father' : 'Mother');
    setPhone('');
    setEmail('');
    setOccupation('');
    setIsPrimary(guardians.length === 0); // Default to primary if first guardian
    setReceiveSMS(true);
    setReceiveEmail(true);
    setEmergencyContact(true);
    setErrorMsg('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    const g = guardians[index];
    setEditingIndex(index);
    setName(g.name);
    setRelationship(g.relationship);
    setPhone(g.phone);
    setEmail(g.email || '');
    setOccupation(g.occupation || '');
    setIsPrimary(Boolean(g.isPrimary));
    setReceiveSMS(g.receiveSMS ?? true);
    setReceiveEmail(g.receiveEmail ?? true);
    setEmergencyContact(g.emergencyContact ?? true);
    setErrorMsg('');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Guardian full name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Guardian primary phone number is required');
      return;
    }

    const updatedGuardian: StudentGuardian = {
      id: editingIndex !== null ? guardians[editingIndex].id : `grd-${Date.now().toString(36)}`,
      name: name.trim(),
      relationship,
      phone: phone.trim(),
      email: email.trim() || undefined,
      occupation: occupation.trim() || undefined,
      isPrimary,
      receiveSMS,
      receiveEmail,
      emergencyContact,
    };

    let updatedList = [...guardians];

    if (editingIndex !== null) {
      updatedList[editingIndex] = updatedGuardian;
    } else {
      updatedList.push(updatedGuardian);
    }

    // If marked as primary, ensure no other guardian is marked primary
    if (isPrimary) {
      updatedList = updatedList.map((g, idx) => ({
        ...g,
        isPrimary: editingIndex !== null ? idx === editingIndex : idx === updatedList.length - 1,
      }));
    } else {
      // Ensure at least one primary exists
      const hasPrimary = updatedList.some((g) => g.isPrimary);
      if (!hasPrimary && updatedList.length > 0) {
        updatedList[0].isPrimary = true;
      }
    }

    onChange(updatedList);
    setIsDialogOpen(false);
  };

  const handleRemove = (index: number) => {
    if (guardians.length <= 1) {
      alert('At least one guardian is required for admission records.');
      return;
    }
    const toRemove = guardians[index];
    const updatedList = guardians.filter((_, i) => i !== index);

    // If we removed the primary, promote the first remaining guardian
    if (toRemove.isPrimary && updatedList.length > 0) {
      updatedList[0].isPrimary = true;
    }

    onChange(updatedList);
  };

  const handleMakePrimary = (index: number) => {
    const updatedList = guardians.map((g, i) => ({
      ...g,
      isPrimary: i === index,
    }));
    onChange(updatedList);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Parents &amp; Guardians Roster
          </h4>
          <p className="text-[11px] text-slate-500">
            Define parents, legal guardians, and designated emergency contacts.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleOpenAdd}
          className="text-xs h-8 gap-1.5 border-slate-300"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          Add Guardian
        </Button>
      </div>

      {guardians.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
          <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-medium">No guardians listed yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            At least one primary guardian must be attached before submitting.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenAdd}
            className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Add Primary Guardian
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guardians.map((g, idx) => (
            <div
              key={g.id || idx}
              className={`p-4 rounded-xl border transition-all ${
                g.isPrimary
                  ? 'border-emerald-300/80 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{g.name}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {g.relationship}
                    </span>
                    {g.isPrimary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-0.5 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        Primary
                      </span>
                    )}
                  </div>
                  {g.occupation && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{g.occupation}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(idx)}
                    disabled={disabled}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Edit Guardian"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={disabled || guardians.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove Guardian"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700">{g.phone}</span>
                </div>
                {g.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{g.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-slate-500">
                  <span
                    className={`flex items-center gap-0.5 ${
                      g.receiveSMS ? 'text-emerald-700 font-medium' : 'text-slate-400'
                    }`}
                  >
                    <BellRing className="w-3 h-3" />
                    SMS
                  </span>
                  <span>•</span>
                  <span
                    className={g.receiveEmail ? 'text-emerald-700 font-medium' : 'text-slate-400'}
                  >
                    Email
                  </span>
                  {g.emergencyContact && (
                    <>
                      <span>•</span>
                      <span className="text-amber-700 font-medium">Emergency</span>
                    </>
                  )}
                </div>

                {!g.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(idx)}
                    disabled={disabled}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GUARDIAN MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Guardian Details' : 'Add Guardian / Emergency Contact'}
            </DialogTitle>
            <DialogDescription>
              Record legal identity, contact channels, and school alert delivery preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Patel"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(
                      e.target.value as 'Father' | 'Mother' | 'Legal Guardian' | 'Grandparent' | 'Other'
                    )
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Architect, Teacher"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">
                  Designate as Primary Guardian
                </span>
              </label>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveSMS}
                    onChange={(e) => setReceiveSMS(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Receive SMS</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveEmail}
                    onChange={(e) => setReceiveEmail(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Receive Email</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Emergency Contact</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editingIndex !== null ? 'Save Changes' : 'Add Guardian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
