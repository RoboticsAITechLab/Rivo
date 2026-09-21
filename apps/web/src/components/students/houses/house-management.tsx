'use client';

import React, { useState } from 'react';
import { SchoolHouse } from '@/types/house';
import { StudentDetail } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Plus, Edit3, Trash2, Shield, Users, ShieldAlert } from 'lucide-react';
import { AddEditHouseDialog } from './add-edit-house-dialog';
import { DeleteHouseDialog } from './delete-house-dialog';

interface HouseManagementProps {
  houses: SchoolHouse[];
  students: StudentDetail[];
  onHousesChange: (houses: SchoolHouse[]) => void;
  onViewStudentsByHouse: (houseId: string) => void;
}

export function HouseManagement({
  houses,
  students,
  onHousesChange,
  onViewStudentsByHouse,
}: HouseManagementProps) {
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [houseToEdit, setHouseToEdit] = useState<SchoolHouse | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState<SchoolHouse | null>(null);

  // Compute student count per house
  const getStudentCount = (houseId: string) =>
    students.filter((s) => s.houseId === houseId).length;

  const totalAssignedStudents = students.filter((s) => Boolean(s.houseId)).length;
  const totalUnassignedStudents = students.length - totalAssignedStudents;

  const handleOpenAdd = () => {
    setHouseToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleOpenEdit = (house: SchoolHouse) => {
    setHouseToEdit(house);
    setIsAddEditDialogOpen(true);
  };

  const handleOpenDelete = (house: SchoolHouse) => {
    setHouseToDelete(house);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = (houseId: string) => {
    onHousesChange(
      houses.map((h) =>
        h.id === houseId
          ? { ...h, status: h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : h
      )
    );
  };

  const handleSaveHouse = (savedHouse: SchoolHouse) => {
    const exists = houses.some((h) => h.id === savedHouse.id);
    if (exists) {
      onHousesChange(houses.map((h) => (h.id === savedHouse.id ? savedHouse : h)));
    } else {
      onHousesChange([...houses, savedHouse]);
    }
  };

  const handleConfirmDelete = (houseId: string) => {
    onHousesChange(houses.filter((h) => h.id !== houseId));
  };

  return (
    <div className="space-y-6">
      {/* HEADER & SUMMARY CARDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">School House System</h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Configure houses used for inter-house athletics, arts, and competitive school activities.
            Houses configured here appear dynamically in the Student Admission form and directory filters.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5 shadow-sm text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add House
        </Button>
      </div>

      {/* QUICK STATS METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Configured Houses</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{houses.length}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Houses</span>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">
            {houses.filter((h) => h.status === 'ACTIVE').length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Assigned Students</span>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{totalAssignedStudents}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Unassigned Students</span>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{totalUnassignedStudents}</div>
        </div>
      </div>

      {/* HOUSES TABLE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Configured School Houses
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
              {houses.length}
            </span>
          </h4>
        </div>

        {houses.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
            <h5 className="text-sm font-bold text-slate-800">No Houses Configured</h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This school does not have a house system configured yet. Student admission remains 100%
              optional and unblocked.
            </p>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Configure First House
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {houses.map((house) => {
              const studentCount = getStudentCount(house.id);
              const isActive = house.status === 'ACTIVE';

              return (
                <div
                  key={house.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isActive ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {house.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: house.color }}
                        />
                      )}
                      <span className="text-sm font-bold text-slate-900">{house.name}</span>

                      {house.shortName && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {house.shortName}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {house.description && (
                      <p className="text-xs text-slate-500">{house.description}</p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onViewStudentsByHouse(house.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {studentCount} {studentCount === 1 ? 'student' : 'students'} assigned
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(house.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(house)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="Edit House"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(house)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete House"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT DIALOG */}
      <AddEditHouseDialog
        key={houseToEdit?.id ?? (isAddEditDialogOpen ? 'open' : 'closed')}
        isOpen={isAddEditDialogOpen}
        onClose={() => setIsAddEditDialogOpen(false)}
        onSave={handleSaveHouse}
        houseToEdit={houseToEdit}
        existingHouses={houses}
      />

      {/* DELETE PROTECTION DIALOG */}
      <DeleteHouseDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        house={houseToDelete}
        assignedStudentCount={houseToDelete ? getStudentCount(houseToDelete.id) : 0}
        onConfirmDelete={handleConfirmDelete}
        onViewStudents={onViewStudentsByHouse}
      />
    </div>
  );
}
