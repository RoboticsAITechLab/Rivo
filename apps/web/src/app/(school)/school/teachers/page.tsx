'use client';

import * as React from 'react';
import { Users, Plus, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorState } from '@/components/ui/error-state';
import { ToastProvider, useToast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import { TeacherDetail } from '@/features/teachers/types';
import { TeacherFilters } from '@/features/teachers/components/teacher-filters';
import { TeacherTable } from '@/features/teachers/components/teacher-table';
import { TeacherCardGrid } from '@/features/teachers/components/teacher-card-grid';
import { TeacherFormSheet } from '@/features/teachers/components/teacher-form-sheet';
import { TeacherDetailSheet } from '@/features/teachers/components/teacher-detail-sheet';
import { TeacherStatusDialog, TeacherArchiveDialog } from '@/features/teachers/components/teacher-actions-dialogs';

function TeachersPageContent() {
  const { toast } = useToast();
  const {
    teachers,
    filteredTeachers,
    filters,
    selectedIds,
    departments,
    subjects,
    classes,
    isLoading,
    simulatedError,
    setSimulatedError,
    setIsLoading,
    handleFilterChange,
    handleClearFilters,
    handleSelectRow,
    handleSelectAll,
    handleSaveTeacher,
    handleUpdateStatus,
    handleArchiveTeacher,
  } = useTeachers();

  // Modals & Sheets
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<TeacherDetail | null>(null);

  const [selectedTeacher, setSelectedTeacher] = React.useState<TeacherDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const [statusTeacher, setStatusTeacher] = React.useState<TeacherDetail | null>(null);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);

  const [archiveTeacher, setArchiveTeacher] = React.useState<TeacherDetail | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false);

  // Derived KPI metrics
  const activeCount = teachers.filter((t) => t.status === 'ACTIVE').length;
  const onLeaveCount = teachers.filter((t) => t.status === 'ON_LEAVE').length;
  const avgClasses = teachers.length > 0
    ? (teachers.reduce((acc, t) => acc + t.totalClassesCount, 0) / teachers.length).toFixed(1)
    : '0';

  const handleOpenAddTeacher = () => {
    setTeacherToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditTeacher = (teacher: TeacherDetail) => {
    setTeacherToEdit(teacher);
    setIsFormOpen(true);
  };

  const handleViewTeacher = (teacher: TeacherDetail) => {
    setSelectedTeacher(teacher);
    setIsDetailOpen(true);
  };

  const handleOpenStatus = (teacher: TeacherDetail) => {
    setStatusTeacher(teacher);
    setIsStatusOpen(true);
  };

  const handleOpenArchive = (teacher: TeacherDetail) => {
    setArchiveTeacher(teacher);
    setIsArchiveOpen(true);
  };

  const handleSave = (teacher: TeacherDetail) => {
    handleSaveTeacher(teacher);
    if (selectedTeacher?.id === teacher.id) {
      setSelectedTeacher(teacher);
    }
    toast(
      teacherToEdit ? 'Teacher Record Updated' : 'Teacher Created',
      `${teacher.personal.firstName} ${teacher.personal.lastName} (${teacher.employment.employeeId}) has been updated in the faculty roster.`,
    );
  };

  const handleConfirmStatus = (id: string, status: TeacherDetail['status'], reason: string) => {
    handleUpdateStatus(id, status);
    if (selectedTeacher?.id === id) {
      setSelectedTeacher((prev) => (prev ? { ...prev, status } : null));
    }
    toast(
      'Educator Status Changed',
      `Status transitioned to ${status}.${reason ? ` Reason: ${reason}` : ''}`,
    );
  };

  const handleConfirmArchive = (id: string) => {
    handleArchiveTeacher(id);
    if (selectedTeacher?.id === id) {
      setIsDetailOpen(false);
      setSelectedTeacher(null);
    }
    toast('Educator Deactivated', 'Teacher record moved to inactive faculty archive.');
  };

  const handleSimulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast('Roster Refreshed', 'Teacher directory synchronized with central academic state.');
    }, 500);
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Teachers"
        description="Manage teachers, subject allocations, student divisions, and faculty workload."
        icon={Users}
        badge={`${teachers.length} faculty`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => toast('Export Complete', 'Teacher roster exported as CSV.')}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>

            <Button
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              onClick={handleOpenAddTeacher}
            >
              <Plus className="h-4 w-4" />
              Add Teacher
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSimulateRefresh}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Refresh Roster
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSimulatedError(!simulatedError)}>
                  <AlertCircle className="h-3.5 w-3.5 mr-2" />
                  {simulatedError ? 'Dismiss Error State' : 'Simulate Error State'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          title="Total Faculty"
          value={String(teachers.length)}
          change="Accredited teachers"
          isPositive={true}
        />
        <StatCard
          title="Active On Duty"
          value={String(activeCount)}
          change="Available for classes"
          isPositive={true}
        />
        <StatCard
          title="On Leave"
          value={String(onLeaveCount)}
          change="Approved sabbaticals"
          isPositive={onLeaveCount <= 5}
        />
        <StatCard
          title="Avg Classes / Teacher"
          value={avgClasses}
          change="Workload balance"
          isPositive={true}
        />
      </div>

      {simulatedError ? (
        <ErrorState
          title="Unable to Load Teachers"
          message="An error occurred while fetching teacher profiles. Please verify network status and try again."
          onRetry={() => {
            setSimulatedError(false);
            handleSimulateRefresh();
          }}
          className="my-6"
        />
      ) : (
        <div className="space-y-4">
          {/* 3. Search & Filter Bar */}
          <TeacherFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalTeachers={teachers.length}
            filteredCount={filteredTeachers.length}
            departments={departments}
            subjects={subjects}
            classes={classes}
          />

          {/* 4. Desktop Table View */}
          <div className="hidden md:block">
            <TeacherTable
              teachers={filteredTeachers}
              selectedIds={selectedIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              onViewTeacher={handleViewTeacher}
              onEditTeacher={handleOpenEditTeacher}
              onChangeStatus={handleOpenStatus}
              onArchiveTeacher={handleOpenArchive}
              isLoading={isLoading}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* 5. Mobile & Tablet Card Grid View */}
          <TeacherCardGrid
            teachers={filteredTeachers}
            onViewTeacher={handleViewTeacher}
            onEditTeacher={handleOpenEditTeacher}
            onChangeStatus={handleOpenStatus}
            onArchiveTeacher={handleOpenArchive}
          />
        </div>
      )}

      {/* 6. Add / Edit Teacher Workspace Drawer */}
      <TeacherFormSheet
        key={teacherToEdit?.id || (isFormOpen ? 'open' : 'closed')}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTeacherToEdit(null);
        }}
        teacherToEdit={teacherToEdit}
        existingTeachers={teachers}
        onSaveTeacher={handleSave}
      />

      {/* 7. Teacher 360 Detail Sheet */}
      <TeacherDetailSheet
        teacher={selectedTeacher}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTeacher(null);
        }}
        onEdit={(teacher) => {
          setIsDetailOpen(false);
          handleOpenEditTeacher(teacher);
        }}
        onChangeStatus={(teacher) => {
          handleOpenStatus(teacher);
        }}
        onArchive={(teacher) => {
          handleOpenArchive(teacher);
        }}
      />

      {/* 8. Status Change Modal */}
      <TeacherStatusDialog
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusTeacher(null);
        }}
        teacher={statusTeacher}
        onConfirmStatus={handleConfirmStatus}
      />

      {/* 9. Deactivate / Archive Modal */}
      <TeacherArchiveDialog
        isOpen={isArchiveOpen}
        onClose={() => {
          setIsArchiveOpen(false);
          setArchiveTeacher(null);
        }}
        teacher={archiveTeacher}
        onConfirmArchive={handleConfirmArchive}
      />
    </PageContainer>
  );
}

export default function TeachersPage() {
  return (
    <ToastProvider>
      <TeachersPageContent />
    </ToastProvider>
  );
}
