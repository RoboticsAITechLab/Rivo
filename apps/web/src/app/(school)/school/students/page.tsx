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
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { initialMockStudents } from '@/data/mock-students';
import { initialMockHouses } from '@/data/mock-houses';
import {
  initialCustomFields,
  initialAdmissionSectionsConfig,
  initialDocumentPolicy,
} from '@/data/mock-custom-fields';
import { StudentDetail, StudentFilterState, StudentStatus } from '@/types/student';
import { SchoolHouse } from '@/types/house';
import { schoolStore } from '@/shared/mock-store/school-store';
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
import { cn } from '@/lib/utils';

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

function StudentsPageContent() {
  const { toast } = useToast();

  // Primary mock dataset state
  const [students, setStudents] = React.useState<StudentDetail[]>(initialMockStudents);

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

  // Simulated loading & error states
  const [isLoading, setIsLoading] = React.useState(false);
  const [simulatedError, setSimulatedError] = React.useState(false);

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

  // Client-side filtering
  const filteredStudents = React.useMemo(() => {
    return students.filter((student) => {
      // 1. Search Query (Name, Admission No, Email, Guardian)
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesAdmission = student.admissionNumber.toLowerCase().includes(query);
        const matchesEmail = student.email.toLowerCase().includes(query);
        const matchesGuardian =
          student.guardianName.toLowerCase().includes(query) ||
          student.primaryGuardian.name.toLowerCase().includes(query);

        if (!matchesName && !matchesAdmission && !matchesEmail && !matchesGuardian) {
          return false;
        }
      }

      // 2. Academic Session
      if (filters.academicSession !== 'ALL' && student.academicSession !== filters.academicSession) {
        return false;
      }

      // 3. Class
      if (filters.className !== 'ALL' && student.className !== filters.className) {
        return false;
      }

      // 4. Section
      if (filters.section !== 'ALL' && student.section !== filters.section) {
        return false;
      }

      // 5. Status
      if (filters.status !== 'ALL' && student.status !== filters.status) {
        return false;
      }

      // 6. House Filter
      if (filters.houseId && filters.houseId !== 'ALL') {
        if (filters.houseId === 'NONE') {
          if (student.houseId) return false;
        } else {
          if (student.houseId !== filters.houseId) return false;
        }
      }

      // 7. Gender
      if (filters.gender !== 'ALL' && student.gender !== filters.gender) {
        return false;
      }

      // 8. Attendance Range
      if (filters.attendanceRange !== 'ALL') {
        if (filters.attendanceRange === 'HIGH' && student.attendancePercentage < 90) return false;
        if (
          filters.attendanceRange === 'MEDIUM' &&
          (student.attendancePercentage < 80 || student.attendancePercentage >= 90)
        )
          return false;
        if (filters.attendanceRange === 'LOW' && student.attendancePercentage >= 80) return false;
      }

      return true;
    });
  }, [students, filters]);

  // Paginated students slice
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Bulk selection helpers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedStudents.map((s) => s.id);
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

  const handleSaveStudent = (studentData: StudentDetail) => {
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === studentData.id);
      if (exists) {
        return prev.map((s) => (s.id === studentData.id ? studentData : s));
      }
      return [studentData, ...prev];
    });

    // Also update detail sheet if open
    if (selectedStudent?.id === studentData.id) {
      setSelectedStudent(studentData);
    }

    // Sync to central relational mock store
    const store = schoolStore.getSnapshot();
    const matchedClass = store.classes.find((c) => c.className === studentData.className);
    const classId = matchedClass?.id || 'cls-10';
    const matchedSection = matchedClass?.sections.find((s) => s.name === studentData.section);
    const sectionId = matchedSection?.id || 'sec-10-a';

    const existsInStore = store.students.some((s) => s.id === studentData.id);
    if (existsInStore) {
      schoolStore.updateStudent({
        id: studentData.id,
        admissionNumber: studentData.admissionNumber,
        academicSessionId: store.activeSessionId,
        classId,
        sectionId,
        houseId: studentData.houseId || null,
        name: studentData.name,
        firstName: studentData.firstName,
        middleName: studentData.middleName,
        lastName: studentData.lastName,
        gender: studentData.gender,
        dateOfBirth: studentData.dateOfBirth,
        bloodGroup: studentData.bloodGroup,
        status: studentData.status,
        email: studentData.email,
        phone: studentData.phone,
        address: { ...studentData.address },
        guardians: studentData.guardians ? [...studentData.guardians] : [],
        attendancePercentage: studentData.attendancePercentage,
        photoUrl: studentData.photoUrl,
        lastSavedAt: new Date().toISOString(),
      });
    } else {
      schoolStore.createStudent({
        id: studentData.id,
        admissionNumber: studentData.admissionNumber,
        academicSessionId: store.activeSessionId,
        classId,
        sectionId,
        houseId: studentData.houseId || null,
        name: studentData.name,
        firstName: studentData.firstName,
        middleName: studentData.middleName,
        lastName: studentData.lastName,
        gender: studentData.gender,
        dateOfBirth: studentData.dateOfBirth,
        bloodGroup: studentData.bloodGroup,
        status: studentData.status,
        email: studentData.email,
        phone: studentData.phone,
        address: { ...studentData.address },
        guardians: studentData.guardians ? [...studentData.guardians] : [],
        attendancePercentage: studentData.attendancePercentage,
        photoUrl: studentData.photoUrl,
        lastSavedAt: new Date().toISOString(),
      });
    }

    setIsFormOpen(false);
    toast(
      studentToEdit ? 'Student Record Updated' : 'New Student Registered',
      `${studentData.name} (${studentData.admissionNumber}) has been updated in the academic roster.`,
    );
  };

  // Status Change
  const handleOpenStatusDialog = (student: StudentDetail) => {
    setStatusStudent(student);
    setIsStatusOpen(true);
  };

  const handleConfirmStatusChange = (
    studentId: string,
    newStatus: StudentStatus,
    reason: string,
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedTimeline = [
            {
              id: `act-${Date.now()}`,
              action: `Status Changed to ${newStatus}`,
              description: reason || `Administrative status transition executed.`,
              timestamp: 'Just now',
              category: 'STATUS' as const,
            },
            ...s.activityTimeline,
          ];
          return { ...s, status: newStatus, activityTimeline: updatedTimeline };
        }
        return s;
      }),
    );

    if (selectedStudent?.id === studentId) {
      setSelectedStudent((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    toast(
      'Student Status Updated',
      `Student status has been marked as ${newStatus}.`,
    );
  };

  // Student House Allocation Change
  const handleUpdateStudentHouse = (studentId: string, newHouseId: string | null) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const houseObj = houses.find((h) => h.id === newHouseId);
          const houseLabel = houseObj ? houseObj.name : 'Not assigned';
          const updatedTimeline = [
            {
              id: `act-${Date.now()}`,
              action: `House Allocation Changed`,
              description: `Assigned to ${houseLabel}.`,
              timestamp: 'Just now',
              category: 'ENROLLMENT' as const,
            },
            ...s.activityTimeline,
          ];
          return { ...s, houseId: newHouseId, activityTimeline: updatedTimeline };
        }
        return s;
      }),
    );

    if (selectedStudent?.id === studentId) {
      setSelectedStudent((prev) => (prev ? { ...prev, houseId: newHouseId } : null));
    }

    const targetHouse = houses.find((h) => h.id === newHouseId);
    toast(
      'House Allocation Updated',
      targetHouse
        ? `Student assigned to ${targetHouse.name}.`
        : 'Student house assignment cleared.',
    );
  };

  // Switch to directory filtered by house (from HouseManagement view)
  const handleViewStudentsByHouse = (houseId: string) => {
    setViewMode('directory');
    setFilters({
      ...defaultFilters,
      houseId,
    });
    setCurrentPage(1);
  };

  // Bulk Status Change
  const handleBulkChangeStatus = () => {
    if (selectedIds.length === 0) return;
    setStudents((prev) =>
      prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status: 'ACTIVE' } : s)),
    );
    toast(
      'Bulk Status Updated',
      `${selectedIds.length} students updated to Active status.`,
    );
    setSelectedIds([]);
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

  const handleConfirmArchive = () => {
    if (isBulkArchiveMode) {
      const count = selectedIds.length;
      setStudents((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      toast('Students Archived', `${count} student records moved to archive storage.`);
    } else if (archiveStudent) {
      setStudents((prev) => prev.filter((s) => s.id !== archiveStudent.id));
      schoolStore.archiveStudent(archiveStudent.id);
      if (selectedStudent?.id === archiveStudent.id) {
        setIsDetailOpen(false);
        setSelectedStudent(null);
      }
      toast(
        'Student Archived',
        `${archiveStudent.name} (${archiveStudent.admissionNumber}) has been moved to archive.`,
      );
    }
  };

  // Bulk Export Mock
  const handleBulkExport = () => {
    toast(
      'Export File Generated',
      `Export generated for ${selectedIds.length} selected students (.xlsx).`,
    );
  };

  // Import Ingest
  const handleImportComplete = (newStudents: StudentDetail[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
    toast(
      'Import Successful',
      `${newStudents.length} student records ingested into institution directory.`,
    );
  };

  // Reset to initial mock dataset
  const handleResetData = () => {
    setStudents(initialMockStudents);
    setHouses(initialMockHouses);
    setSelectedIds([]);
    setFilters(defaultFilters);
    toast('Data Reset', 'Student directory and houses reset to baseline mock dataset.');
  };

  // Simulate loading delay
  const handleSimulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast('Roster Refreshed', 'Student directory data synchronised.');
    }, 600);
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        title="Students"
        description="Manage student records, admission intake, and institutional compliance."
        icon={GraduationCap}
        badge={`${students.length.toLocaleString()} students`}
        actions={
          <div className="flex items-center gap-2">
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
                <DropdownMenuItem onClick={handleSimulateLoading}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Refresh Roster
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast('Directory Exported', 'Full student directory exported as CSV.')
                  }
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export Entire Directory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSimulatedError(!simulatedError)}>
                  <AlertCircle className="h-3.5 w-3.5 mr-2" />
                  {simulatedError ? 'Dismiss Error Simulation' : 'Simulate Error State'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleResetData}>
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Reset Mock Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Navigation View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('directory')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer',
              viewMode === 'directory'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Student Directory ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('config')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5',
              viewMode === 'config'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            School Intake &amp; Field Configuration
          </button>
        </div>

        {viewMode === 'config' && (
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setConfigSubtab('fields')}
              className={cn(
                'px-3 py-1 text-xs rounded-lg transition-all cursor-pointer',
                configSubtab === 'fields'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              )}
            >
              Custom Fields ({customFields.length})
            </button>
            <button
              type="button"
              onClick={() => setConfigSubtab('policies')}
              className={cn(
                'px-3 py-1 text-xs rounded-lg transition-all cursor-pointer',
                configSubtab === 'policies'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              )}
            >
              Sections &amp; Document Policies
            </button>
            <button
              type="button"
              onClick={() => setConfigSubtab('houses')}
              className={cn(
                'px-3 py-1 text-xs rounded-lg transition-all cursor-pointer',
                configSubtab === 'houses'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              )}
            >
              School Houses ({houses.length})
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE: CONFIGURATION */}
      {viewMode === 'config' ? (
        configSubtab === 'fields' ? (
          <CustomFieldBuilder
            customFields={customFields}
            onChange={(fields) => {
              setCustomFields(fields);
              toast('Custom Fields Updated', 'Student schema extensions updated for the institution.');
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
      ) : simulatedError ? (
        /* Simulated Error State */
        <ErrorState
          title="Unable to Load Students"
          message="An error occurred while synchronizing student roster records from the institutional server. Please retry."
          onRetry={() => {
            setSimulatedError(false);
            handleSimulateLoading();
          }}
          className="my-6"
        />
      ) : (
        <>
          {/* 2. Summary Metrics */}
          <StudentMetrics students={students} />

          {/* 3. Search & Filters Bar */}
          <StudentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalStudents={students.length}
            filteredCount={filteredStudents.length}
            houses={houses}
          />

          {/* 4. Bulk Action Toolbar */}
          <StudentBulkToolbar
            selectedCount={selectedIds.length}
            onClearSelection={handleClearSelection}
            onBulkChangeStatus={handleBulkChangeStatus}
            onBulkExport={handleBulkExport}
            onBulkArchive={handleOpenBulkArchiveDialog}
          />

          {/* 5. Student Data Table */}
          <StudentTable
            students={paginatedStudents}
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
          {filteredStudents.length > 0 && (
            <StudentPagination
              currentPage={currentPage}
              totalItems={filteredStudents.length}
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

      {/* 7. Student 360 Detail Sheet (10 tabs) */}
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
        initialTab={initialDetailTab}
        houses={houses}
        onUpdateStudentHouse={handleUpdateStudentHouse}
      />

      {/* 8. Admission Workspace Drawer */}
      <AdmissionWorkspace
        key={studentToEdit?.id ?? (isFormOpen ? 'open' : 'closed')}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
        existingStudents={students}
        customFields={customFields}
        houses={houses}
        onManageHouses={() => {
          setIsFormOpen(false);
          setViewMode('config');
          setConfigSubtab('houses');
        }}
        onSaveStudent={handleSaveStudent}
        onViewStudentProfile={(student) => {
          setSelectedStudent(student);
          setIsDetailOpen(true);
        }}
      />

      {/* 9. Status Change Dialog */}
      <StudentStatusDialog
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusStudent(null);
        }}
        student={statusStudent}
        onConfirmStatus={handleConfirmStatusChange}
      />

      {/* 10. Archive Confirmation Dialog */}
      <StudentArchiveDialog
        isOpen={isArchiveOpen}
        onClose={() => {
          setIsArchiveOpen(false);
          setArchiveStudent(null);
          setIsBulkArchiveMode(false);
        }}
        student={archiveStudent}
        bulkCount={isBulkArchiveMode ? selectedIds.length : 0}
        onConfirmArchive={handleConfirmArchive}
      />

      {/* 11. Import Students Wizard Sheet */}
      <StudentImportSheet
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
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
