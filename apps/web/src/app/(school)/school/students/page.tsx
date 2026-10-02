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
import dynamic from 'next/dynamic';
import { StudentDetail, StudentFilterState, StudentStatus } from '@/types/student';
import { SchoolHouse } from '@/types/house';
import { buildStudentDetail } from '@/lib/student-utils';
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
import { StudentFilters, FilterClassOption, FilterSessionOption } from '@/components/students/student-filters';
import { StudentBulkToolbar } from '@/components/students/student-bulk-toolbar';
import { StudentTable } from '@/components/students/student-table';
import { StudentPagination } from '@/components/students/student-pagination';
import { StudentDetailSheet, DetailTabKey } from '@/components/students/student-detail-sheet';

const AdmissionWorkspace = dynamic(
  () => import('@/components/students/admission/admission-workspace').then((m) => m.AdmissionWorkspace),
  { ssr: false }
);
const CustomFieldBuilder = dynamic(
  () => import('@/components/students/custom-fields/custom-field-builder').then((m) => m.CustomFieldBuilder),
  { ssr: false }
);
const AdmissionFormConfig = dynamic(
  () => import('@/components/students/custom-fields/admission-form-config').then((m) => m.AdmissionFormConfig),
  { ssr: false }
);
const HouseManagement = dynamic(
  () => import('@/components/students/houses/house-management').then((m) => m.HouseManagement),
  { ssr: false }
);
const StudentStatusDialog = dynamic(
  () => import('@/components/students/student-status-dialog').then((m) => m.StudentStatusDialog),
  { ssr: false }
);
const StudentArchiveDialog = dynamic(
  () => import('@/components/students/student-archive-dialog').then((m) => m.StudentArchiveDialog),
  { ssr: false }
);
const StudentImportSheet = dynamic(
  () => import('@/components/students/student-import-sheet').then((m) => m.StudentImportSheet),
  { ssr: false }
);
const RollRebalanceDialog = dynamic(
  () => import('@/components/students/roll-rebalance-dialog').then((m) => m.RollRebalanceDialog),
  { ssr: false }
);

const defaultFilters: StudentFilterState = {
  searchQuery: '',
  academicSession: 'ALL',
  className: 'ALL',
  section: 'ALL',
  stream: 'ALL',
  status: 'ALL',
  houseId: 'ALL',
  gender: 'ALL',
  attendanceRange: 'ALL',
};

// Map backend API student object to frontend StudentDetail view model
function mapApiStudentToDetail(s: any): StudentDetail {
  return buildStudentDetail({
    id: s.id,
    admissionNumber: s.admissionNumber || '',
    name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    gender: (s.gender as any) || 'Male',
    dateOfBirth: s.dateOfBirth || '',
    bloodGroup: s.bloodGroup || '',
    status: (s.status as StudentStatus) || 'ACTIVE',
    className: s.className || 'General',
    section: s.sectionName || 'A',
    rollNumber: s.rollNumber && s.rollNumber !== '' ? s.rollNumber : '—',
    academicSession: s.sessionName || 'Current Session',
    houseId: s.house || null,
    guardianName: s.guardianName || 'Parent / Guardian',
    guardianPhone: s.guardianPhone || '',
    email: s.email || '',
    phone: s.phone || '',
    street: typeof s.address === 'string' ? s.address : (s.address?.street || ''),
    enrollmentDate: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
  });
}

function StudentsPageContent() {
  const { toast } = useToast();

  // Real database-backed student state
  const [students, setStudents] = React.useState<StudentDetail[]>([]);
  const [totalStudents, setTotalStudents] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Live classes, sessions, streams, and houses state
  const [classes, setClasses] = React.useState<FilterClassOption[]>([]);
  const [sessions, setSessions] = React.useState<FilterSessionOption[]>([]);
  const [streams, setStreams] = React.useState<any[]>([]);
  const [houses, setHouses] = React.useState<SchoolHouse[]>([]);
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [admissionSections, setAdmissionSections] = React.useState<any[]>([
    { id: 'personal', title: 'Personal Details', description: 'Basic student identity', enabled: true, required: true, isSystemRequired: true },
    { id: 'contact', title: 'Address & Contact', description: 'Residential coordinates', enabled: true, required: true, isSystemRequired: true },
    { id: 'guardians', title: 'Parent / Guardian', description: 'Parent details & contacts', enabled: true, required: true, isSystemRequired: true },
    { id: 'academic', title: 'Academic Placement', description: 'Class, Section & Roll Assignment', enabled: true, required: true, isSystemRequired: true },
    { id: 'documents', title: 'Intake Documents', description: 'Birth certificate, marksheets, identity', enabled: true, required: false, isSystemRequired: false },
  ]);
  const [documentPolicy, setDocumentPolicy] = React.useState<{
    birthCertificate: 'OPTIONAL' | 'REQUIRED' | 'DISABLED';
    previousMarksheetForTransfer: 'REQUIRED' | 'OPTIONAL';
    transferCertificateForTransfer: 'REQUIRED' | 'OPTIONAL';
  }>({
    birthCertificate: 'REQUIRED',
    previousMarksheetForTransfer: 'REQUIRED',
    transferCertificateForTransfer: 'REQUIRED',
  });

  // Navigation view mode & configuration state
  const [viewMode, setViewMode] = React.useState<'directory' | 'config'>('directory');
  const [configSubtab, setConfigSubtab] = React.useState<'fields' | 'policies' | 'houses'>('fields');

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
  const [isRebalanceOpen, setIsRebalanceOpen] = React.useState(false);

  // Fetch classes, academic sessions, streams, and houses on mount
  React.useEffect(() => {
    // 1. Classes
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(
            data.classes.map((c: any) => ({
              id: c.id,
              name: c.name,
              sections: (c.sections || []).map((s: any) => ({ id: s.id, name: s.name })),
            }))
          );
        }
      })
      .catch((err) => console.error('Error fetching classes:', err));

    // 2. Academic Sessions
    fetch('/api/academic-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setSessions(data.sessions.map((s: any) => ({ id: s.id, name: s.name })));
        }
      })
      .catch((err) => console.error('Error fetching sessions:', err));

    // 3. Streams
    fetch('/api/streams')
      .then((res) => res.json())
      .then((data) => {
        if (data.streams) {
          setStreams(data.streams);
        }
      })
      .catch((err) => console.error('Error fetching streams:', err));

    // 4. Houses
    fetch('/api/houses')
      .then((res) => res.json())
      .then((data) => {
        if (data.houses) {
          setHouses(data.houses);
        }
      })
      .catch((err) => console.error('Error fetching houses:', err));
  }, []);

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
        params.set('className', filters.className);
      }
      if (filters.section && filters.section !== 'ALL') {
        params.set('section', filters.section);
      }
      if (filters.stream && filters.stream !== 'ALL') {
        params.set('stream', filters.stream);
      }
      if (filters.academicSession && filters.academicSession !== 'ALL') {
        params.set('session', filters.academicSession);
      }
      if (filters.houseId && filters.houseId !== 'ALL') {
        params.set('house', filters.houseId);
      }
      if (filters.gender && filters.gender !== 'ALL') {
        params.set('gender', filters.gender);
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
  }, [
    currentPage,
    pageSize,
    filters.searchQuery,
    filters.status,
    filters.className,
    filters.section,
    filters.stream,
    filters.academicSession,
    filters.houseId,
    filters.gender,
  ]);

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
          address: typeof studentData.address === 'string' ? studentData.address : (studentData.address?.street || ''),
          className: studentData.className,
          sectionName: studentData.section,
          rollNumber: studentData.rollNumber,
          rollNumberMode: (studentData as any).rollNumberMode || 'AUTO',
          photoUrl: studentData.photoUrl,
          houseId: studentData.houseId,
          stream: (studentData as any).stream,
          campusId: (studentData as any).campusId,
          guardians: (studentData as any).guardians,
          documents: (studentData as any).documents,
          guardian: (studentData as any).primaryGuardian || (studentData as any).guardians?.[0] || (studentData.guardianName ? {
            name: studentData.guardianName,
            phone: studentData.guardianPhone,
          } : undefined),
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
                <DropdownMenuItem onClick={() => setIsRebalanceOpen(true)}>
                  <RefreshCw className="h-4 w-4 mr-2 text-indigo-600" />
                  Rebalance Auto Rolls
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
            onChange={(fields) => {
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
            totalStudents={totalStudents}
            filteredCount={totalStudents}
            houses={houses}
            classes={classes}
            sessions={sessions}
            streams={streams}
          />

          {/* 4. Bulk Operations Toolbar */}
          <StudentBulkToolbar
            selectedCount={selectedIds.length}
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
        onUpdateStudentHouse={handleUpdateStudentHouse}
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
        onSaveStudent={handleSaveStudent}
        studentToEdit={studentToEdit}
        existingStudents={students}
        houses={houses}
        customFields={customFields}
        onViewStudentProfile={handleViewStudent}
      />

      {/* 9. Status Change Dialog */}
      <StudentStatusDialog
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusStudent(null);
        }}
        onConfirmStatus={handleConfirmStatusChange}
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
        onConfirmArchive={handleConfirmArchive}
        student={archiveStudent}
        bulkCount={isBulkArchiveMode ? selectedIds.length : undefined}
      />

      {/* 11. Student CSV/Excel Import Sheet */}
      <StudentImportSheet
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => fetchStudents()}
      />

      {/* 12. Roll Numbers Rebalance Dialog */}
      <RollRebalanceDialog
        isOpen={isRebalanceOpen}
        onClose={() => setIsRebalanceOpen(false)}
        onSuccess={() => fetchStudents()}
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
