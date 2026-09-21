'use client';

import * as React from 'react';
import { BookOpen, Plus, Search, X, Download } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { ToastProvider, useToast } from '@/components/ui/toast';

import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { SubjectDetail } from '@/features/subjects/types';
import { SubjectTable } from '@/features/subjects/components/subject-table';
import { SubjectFormDialog } from '@/features/subjects/components/subject-form-dialog';
import { SubjectDetailSheet } from '@/features/subjects/components/subject-detail-sheet';

function SubjectsPageContent() {
  const { toast } = useToast();
  const {
    subjects,
    filteredSubjects,
    filters,
    departments,
    classes,
    isLoading,
    handleFilterChange,
    handleClearFilters,
    handleSaveSubject,
  } = useSubjects();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [subjectToEdit, setSubjectToEdit] = React.useState<SubjectDetail | null>(null);

  const [selectedSubject, setSelectedSubject] = React.useState<SubjectDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const activeCount = subjects.filter((s) => s.status === 'ACTIVE').length;
  const classesUsingCount = new Set(subjects.flatMap((s) => s.applicableClassIds)).size * 3;
  const teachersCount = new Set(subjects.flatMap((s) => s.qualifiedTeacherIds)).size;

  const handleOpenAdd = () => {
    setSubjectToEdit(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (subject: SubjectDetail) => {
    setSubjectToEdit(subject);
    setIsAddOpen(true);
  };

  const handleViewSubject = (subject: SubjectDetail) => {
    setSelectedSubject(subject);
    setIsDetailOpen(true);
  };

  const handleSave = (subject: SubjectDetail) => {
    handleSaveSubject(subject);
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(subject);
    }
    toast(
      subjectToEdit ? 'Subject Updated' : 'Subject Created',
      `${subject.name} (${subject.code}) curriculum configuration saved.`,
    );
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Subjects & Curriculum"
        description="Manage academic subjects, department curriculum modules, and accredited educator allocations."
        icon={BookOpen}
        badge={`${subjects.length} courses`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => toast('Export Complete', 'Curriculum syllabus exported as CSV.')}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>
        }
      />

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          title="Total Subjects"
          value={String(subjects.length)}
          change="Curriculum courses"
          isPositive={true}
        />
        <StatCard
          title="Active Courses"
          value={String(activeCount)}
          change="Taught this session"
          isPositive={true}
        />
        <StatCard
          title="Classes Using"
          value={String(classesUsingCount)}
          change="Class allocations"
          isPositive={true}
        />
        <StatCard
          title="Accredited Faculty"
          value={String(teachersCount)}
          change="Assigned educators"
          isPositive={true}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-lg border bg-card p-3.5 shadow-2xs space-y-3 mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="Search subjects by name, code, or teacher..."
              className="pl-8.5 h-9 text-xs"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange('searchQuery', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Types</option>
            <option value="CORE">Core</option>
            <option value="ELECTIVE">Elective</option>
            <option value="OPTIONAL">Optional</option>
            <option value="LANGUAGE">Language</option>
            <option value="PRACTICAL">Practical / Lab</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={filters.className}
            onChange={(e) => handleFilterChange('className', e.target.value)}
            className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {(filters.searchQuery || filters.type !== 'ALL' || filters.department !== 'ALL' || filters.className !== 'ALL' || filters.status !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* 4. Subjects Table */}
      <SubjectTable
        subjects={filteredSubjects}
        onViewSubject={handleViewSubject}
        onEditSubject={handleOpenEdit}
        isLoading={isLoading}
      />

      {/* 5. Add / Edit Subject Modal */}
      <SubjectFormDialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setSubjectToEdit(null);
        }}
        subjectToEdit={subjectToEdit}
        existingSubjects={subjects}
        onSaveSubject={handleSave}
      />

      {/* 6. Subject 360 Sheet */}
      <SubjectDetailSheet
        subject={selectedSubject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSubject(null);
        }}
        onEdit={(sub) => {
          setIsDetailOpen(false);
          handleOpenEdit(sub);
        }}
      />
    </PageContainer>
  );
}

export default function SubjectsPage() {
  return (
    <ToastProvider>
      <SubjectsPageContent />
    </ToastProvider>
  );
}
