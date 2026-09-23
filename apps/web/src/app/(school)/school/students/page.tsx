'use client';

import * as React from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  RefreshCw,
  MoreVertical,
  Download,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { initialMockHouses } from '@/data/mock-houses';
import {
  initialCustomFields,
  initialAdmissionSectionsConfig,
  initialDocumentPolicy,
} from '@/data/mock-custom-fields';
import { StudentDetail, StudentFilterState, StudentStatus } from '@/types/student';
import { SchoolHouse } from '@/types/house';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { StudentMetrics } from '@/components/students/student-metrics';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentBulkToolbar } from '@/components/students/student-bulk-toolbar';
import { StudentTable } from '@/components/students/student-table';
import { StudentPagination } from '@/components/students/student-pagination';
import { StudentDetailSheet, DetailTabKey } from '@/components/students/student-detail-sheet';
import { AdmissionWorkspace } from '@/components/students/admission/admission-workspace';
import { CustomFieldBuilder } from '@/components/students/custom-fields/custom-field-builder';
import { AdmissionFormConfig } from '@/components/students/custom-fields/admission-form-config';
import { HouseManagement } from '@/components/students/houses/house-management';
import { StudentStatusDialog } from '@/components/students/student-status-dialog';
import { StudentArchiveDialog } from '@/components/students/student-archive-dialog';
import { StudentImportSheet } from '@/components/students/student-import-sheet';

const defaultFilters: StudentFilterState = {
  searchQuery: '',
  academicSession: 'ALL',
  className: 'ALL',
  section: 'ALL',
  status: 'ALL',
  houseId: 'ALL',
  gender: 'ALL',
  attendanceRange: 'ALL',
};

// Map backend API student object to frontend StudentDetail view model
function mapApiStudentToDetail(s: any): StudentDetail {
  return {
    id: s.id,
    admissionNumber: s.admissionNumber || '',
    name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    gender: (s.gender as any) || 'OTHER',
    dateOfBirth: s.dateOfBirth || '',
    bloodGroup: s.bloodGroup || '',
    status: (s.status as StudentStatus) || 'ACTIVE',
    className: s.className || 'General',
    section: s.sectionName || 'A',
    rollNumber: s.rollNumber || '01',
    academicSession: s.sessionName || '2026-2027',
    houseId: s.house || null,
    stream: s.stream || null,
    guardianName: s.guardianName || 'Parent / Guardian',
    guardianPhone: s.guardianPhone || '',
    primaryGuardian: {
      id: `g-${s.id}`,
      name: s.guardianName || 'Parent / Guardian',
      relationship: 'Father',
      phone: s.guardianPhone || '',
    },
    guardians: s.guardianName
      ? [
          {
            id: `g-${s.id}`,
            name: s.guardianName,
            relationship: 'Father',
            phone: s.guardianPhone || '',
          },
        ]
      : [],
    email: s.email || '',
    phone: s.phone || '',
    address: typeof s.address === 'object' ? s.address : { line1: s.address || '' },
    attendancePercentage: 92,
    activityTimeline: [],
    documents: [],
    photoUrl: undefined,
  };
}

function StudentsPageContent() {
  const { toast } = useToast();

  // Real database-backed student state
  const [students, setStudents] = React.useState<StudentDetail[]>([]);
  const [totalStudents, setTotalStudents] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Navigation view mode & configuration state
  const [viewMode, setViewMode] = React.useState<'directory' | 'config'>('directory');
  const [configSubtab, setConfigSubtab] = React.useState<'fields' | 'policies' | 'houses'>('fields');
  const [houses, setHouses] = React.useState<SchoolHouse[]>(initialMockHouses);
  const [customFields, setCustomFields] = React.useState(initialCustomFields);
  const [admissionSections, setAdmissionSections] = React.useState(initialAdmissionSectionsConfig);
  const [documentPolicy, setDocumentPolicy] = React.useState(initialDocumentPolicy);

  // Filters state
  const [filters, setFilters] = React.useState<StudentFilterState>(defaultFilters);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Modals & Sheets state
  const [selectedStudent, setSelectedStudent] = React.useState<StudentDetail | null>(null);
  const [initialDetailTab, setInitialDetailTab] = React.useState<DetailTabKey>('overview');
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const [studentToEdit, setStudentToEdit] = React.useState<StudentDetail | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [statusStudent, setStatusStudent] = React.useState<StudentDetail | null>(null);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);

  const [archiveStudent, setArchiveStudent] = React.useState<StudentDetail | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false);
  const [isBulkArchiveMode, setIsBulkArchiveMode] = React.useState(false);

  const [isImportOpen, setIsImportOpen] = React.useState(false);

  // Fetch real students from API
  const fetchStudents = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      });

      if (filters.searchQuery.trim()) {
        params.set('search', filters.searchQuery.trim());
      }
      if (filters.status && filters.status !== 'ALL') {
        params.set('status', filters.status);
      }
      if (filters.className && filters.className !== 'ALL') {
        params.set('classId', filters.className);
      }
      if (filters.section && filters.section !== 'ALL') {
        params.set('sectionId', filters.section);
      }

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load student roster (${res.status})`);
      }
      const data = await res.json();
      const mapped = (data.students || []).map(mapApiStudentToDetail);
      setStudents(mapped);
      setTotalStudents(data.pagination?.total ?? mapped.length);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to students service');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters.searchQuery, filters.status, filters.className, filters.section]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter change handler
  const handleFilterChange = <K extends keyof StudentFilterState>(
    key: K,
    value: StudentFilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  // Bulk selection helpers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = students.map((s) => s.id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Student Detail View
  const handleViewStudent = (student: StudentDetail, initialTab: DetailTabKey = 'overview') => {
    setSelectedStudent(student);
    setInitialDetailTab(initialTab);
    setIsDetailOpen(true);
  };

  // Add / Edit Student
  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditStudent = (student: StudentDetail) => {
    setStudentToEdit(student);
    setIsFormOpen(true);
  };

  const handleSaveStudent = async (studentData: StudentDetail) => {
    try {
      const isEdit = Boolean(studentToEdit?.id);
      const url = isEdit ? `/api/students/${studentToEdit!.id}` : '/api/students';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionNumber: studentData.admissionNumber,
          firstName: studentData.firstName || studentData.name.split(' ')[0] || 'Student',
          lastName: studentData.lastName || studentData.name.split(' ').slice(1).join(' ') || '',
          gender: studentData.gender,
          dateOfBirth: studentData.dateOfBirth,
          bloodGroup: studentData.bloodGroup,
          status: studentData.status,
          email: studentData.email,
          phone: studentData.phone,
          address: typeof studentData.address === 'string' ? studentData.address : studentData.address?.line1,
          className: studentData.className,
          sectionName: studentData.section,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save student record');
      }

      setIsFormOpen(false);
      toast(
        isEdit ? 'Student Record Updated' : 'New Student Registered',
        `${studentData.name} has been synchronized with the database roster.`
      );
      fetchStudents();
    } catch (err: unknown) {
      toast('Operation Failed', err instanceof Error ? err.message : 'Could not save student');
    }
  };

  // Status Change
  const handleOpenStatusDialog = (student: StudentDetail) => {
    setStatusStudent(student);
    setIsStatusOpen(true);
  };

  const handleConfirmStatusChange = async (
    studentId: string,
    newStatus: StudentStatus,
    _reason: string,
  ) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update student status');
      }
      toast('Student Status Updated', `Student status has been marked as ${newStatus}.`);
      setIsStatusOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      toast('Status Update Failed', err instanceof Error ? err.message : 'Error updating status');
    }
  };

  // Student House Allocation Change
  const handleUpdateStudentHouse = (studentId: string, newHouseId: string | null) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, houseId: newHouseId } : s)),
    );
    toast('House Allocation Updated', 'Student house assignment updated.');
  };

  const handleViewStudentsByHouse = (houseId: string) => {
    setViewMode('directory');
    setFilters({
      ...defaultFilters,
      houseId,
    });
    setCurrentPage(1);
  };

  // Bulk Status Change
  const handleBulkChangeStatus = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/students/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        });
      }
      toast('Bulk Status Updated', `${selectedIds.length} students updated to Active status.`);
      setSelectedIds([]);
      fetchStudents();
    } catch (err: unknown) {
      toast('Bulk Action Failed', err instanceof Error ? err.message : 'Failed to update students');
    }
  };

  // Archive Flow
  const handleOpenArchiveDialog = (student: StudentDetail) => {
    setArchiveStudent(student);
    setIsBulkArchiveMode(false);
    setIsArchiveOpen(true);
  };

  const handleOpenBulkArchiveDialog = () => {
    if (selectedIds.length === 0) return;
    setIsBulkArchiveMode(true);
    setIsArchiveOpen(true);
  };

  const handleConfirmArchive = async () => {
    try {
      if (isBulkArchiveMode) {
        const count = selectedIds.length;
        for (const id of selectedIds) {
          await fetch(`/api/students/${id}`, { method: 'DELETE' });
        }
        setSelectedIds([]);
        toast('Students Archived', `${count} student records archived.`);
      } else if (archiveStudent) {
        await fetch(`/api/students/${archiveStudent.id}`, { method: 'DELETE' });
        toast('Student Archived', `${archiveStudent.name} moved to archive.`);
      }
      setIsArchiveOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      toast('Archive Failed', err instanceof Error ? err.message : 'Could not archive student');
    }
  };

  const handleBulkExport = () => {
    toast(
      'Export File Generated',
      `Export generated for ${selectedIds.length > 0 ? selectedIds.length : totalStudents} students.`,
    );
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Students"
        description="Manage student records, admission intake, and institutional compliance."
        icon={GraduationCap}
        badge={`${totalStudents.toLocaleString()} students`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={fetchStudents}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Import Students
            </Button>

            <Button
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleOpenAddStudent}
            >
              <Plus className="h-4 w-4" />
              New Student Admission
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setViewMode(viewMode === 'directory' ? 'config' : 'directory')}
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  {viewMode === 'directory' ? 'Custom Fields & Rules' : 'Student Directory'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={fetchStudents}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Sync Live Roster
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Roster
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to Load Students"
          message={error}
          onRetry={fetchStudents}
          className="my-6"
        />
      ) : viewMode === 'config' ? (
        /* Configuration Workspaces */
        configSubtab === 'fields' ? (
          <CustomFieldBuilder
            customFields={customFields}
            onFieldsChange={(fields) => {
              setCustomFields(fields);
              toast('Custom Fields Saved', 'Student admission schema updated.');
            }}
          />
        ) : configSubtab === 'policies' ? (
          <AdmissionFormConfig
            sections={admissionSections}
            onSectionsChange={(sections) => {
              setAdmissionSections(sections);
              toast('Form Config Saved', 'Admission workspace section requirements updated.');
            }}
            documentPolicy={documentPolicy}
            onDocumentPolicyChange={(policy) => {
              setDocumentPolicy(policy);
              toast('Document Policy Saved', 'Institutional document verification rules updated.');
            }}
          />
        ) : (
          <HouseManagement
            houses={houses}
            students={students}
            onHousesChange={setHouses}
            onViewStudentsByHouse={handleViewStudentsByHouse}
          />
        )
      ) : (
        <>
          {/* 2. Summary Metrics */}
          <StudentMetrics students={students} />

          {/* 3. Search & Filters Bar */}
          <StudentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalCount={totalStudents}
            filteredCount={totalStudents}
            houses={houses}
          />

          {/* 4. Bulk Operations Toolbar */}
          <StudentBulkToolbar
            selectedIds={selectedIds}
            onClearSelection={handleClearSelection}
            onBulkChangeStatus={handleBulkChangeStatus}
            onBulkExport={handleBulkExport}
            onBulkArchive={handleOpenBulkArchiveDialog}
          />

          {/* 5. Student Data Table */}
          <StudentTable
            students={students}
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onViewStudent={handleViewStudent}
            onEditStudent={handleOpenEditStudent}
            onChangeStatus={handleOpenStatusDialog}
            onArchiveStudent={handleOpenArchiveDialog}
            isLoading={isLoading}
            onClearFilters={handleClearFilters}
            houses={houses}
          />

          {/* 6. Pagination */}
          {totalStudents > 0 && (
            <StudentPagination
              currentPage={currentPage}
              totalItems={totalStudents}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      {/* 7. Student 360 Detail Sheet */}
      <StudentDetailSheet
        student={selectedStudent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStudent(null);
        }}
        onEdit={(student) => {
          setIsDetailOpen(false);
          handleOpenEditStudent(student);
        }}
        onChangeStatus={(student) => {
          handleOpenStatusDialog(student);
        }}
        onArchive={(student) => {
          handleOpenArchiveDialog(student);
        }}
        onUpdateHouse={handleUpdateStudentHouse}
        initialTab={initialDetailTab}
        houses={houses}
      />

      {/* 8. Admission / Edit Student Workspace Dialog */}
      <AdmissionWorkspace
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        existingStudents={students}
        houses={houses}
        customFields={customFields}
        admissionSections={admissionSections}
        documentPolicy={documentPolicy}
      />

      {/* 9. Status Change Dialog */}
      <StudentStatusDialog
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusStudent(null);
        }}
        onConfirm={handleConfirmStatusChange}
        student={statusStudent}
      />

      {/* 10. Archive Dialog */}
      <StudentArchiveDialog
        isOpen={isArchiveOpen}
        onClose={() => {
          setIsArchiveOpen(false);
          setArchiveStudent(null);
          setIsBulkArchiveMode(false);
        }}
        onConfirm={handleConfirmArchive}
        studentName={archiveStudent ? archiveStudent.name : undefined}
        selectedCount={isBulkArchiveMode ? selectedIds.length : undefined}
      />

      {/* 11. Student CSV/Excel Import Sheet */}
      <StudentImportSheet
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={fetchStudents}
      />
    </PageContainer>
  );
}

export default function StudentsPage() {
  return (
    <ToastProvider>
      <StudentsPageContent />
    </ToastProvider>
  );
}
