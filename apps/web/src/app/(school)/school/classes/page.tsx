'use client';

import * as React from 'react';
import { Layers, Plus, Search, X, Download } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { ToastProvider, useToast } from '@/components/ui/toast';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { ClassItem, SectionItem } from '@/features/classes/types';
import { ClassTable } from '@/features/classes/components/class-table';
import { ClassFormDialog } from '@/features/classes/components/class-form-dialog';
import { ClassDetailSheet } from '@/features/classes/components/class-detail-sheet';
import { SectionDetailDialog } from '@/features/classes/components/section-detail-dialog';

function ClassesPageContent() {
  const { toast } = useToast();
  const { classes, filteredClasses, filters, isLoading, handleFilterChange, handleSaveClass } =
    useClasses();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [classToEdit, setClassToEdit] = React.useState<ClassItem | null>(null);

  const [selectedClass, setSelectedClass] = React.useState<ClassItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const [selectedSectionClass, setSelectedSectionClass] = React.useState<ClassItem | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<SectionItem | null>(null);
  const [isSectionOpen, setIsSectionOpen] = React.useState(false);

  // Derived KPI metrics
  const totalClasses = classes.length;
  const totalSections = classes.reduce((acc, c) => acc + c.totalSections, 0);
  const totalStudents = classes.reduce((acc, c) => acc + c.totalStudents, 0);
  const avgClassSize = totalSections > 0 ? Math.round(totalStudents / totalSections) : 0;

  const handleOpenAdd = () => {
    setClassToEdit(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (classItem: ClassItem) => {
    setClassToEdit(classItem);
    setIsAddOpen(true);
  };

  const handleViewClass = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsDetailOpen(true);
  };

  const handleViewSection = (classItem: ClassItem, section: SectionItem) => {
    setSelectedSectionClass(classItem);
    setSelectedSection(section);
    setIsSectionOpen(true);
  };

  const handleSave = (classItem: ClassItem) => {
    handleSaveClass(classItem);
    if (selectedClass?.id === classItem.id) {
      setSelectedClass(classItem);
    }
    toast(
      classToEdit ? 'Class Updated' : 'Class Created',
      `${classItem.className} configured with ${classItem.totalSections} divisions.`,
    );
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Classes & Sections"
        description="Manage academic grade structures, division sections, enrolled student capacity, and class teachers."
        icon={Layers}
        badge={`Session ${filters.session}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => toast('Export Complete', 'Class structures exported as CSV.')}
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
              Add Class
            </Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          title="Total Classes"
          value={String(totalClasses)}
          change="Grades configured"
          isPositive={true}
        />
        <StatCard
          title="Total Sections"
          value={String(totalSections)}
          change="Class divisions"
          isPositive={true}
        />
        <StatCard
          title="Enrolled Students"
          value={totalStudents.toLocaleString()}
          change="Active school roster"
          isPositive={true}
        />
        <StatCard
          title="Avg Class Size"
          value={`${avgClassSize}`}
          change="Students / division"
          isPositive={avgClassSize <= 45}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-lg border bg-card p-3.5 shadow-2xs space-y-3 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="Search classes by name, section, or teacher..."
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

          <div className="flex items-center gap-2">
            <select
              value={filters.session}
              onChange={(e) => handleFilterChange('session', e.target.value)}
              className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="2026-27">Session 2026-27</option>
              <option value="2025-26">Session 2025-26</option>
              <option value="ALL">All Sessions</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <ClassTable
        classes={filteredClasses}
        onViewClass={handleViewClass}
        onEditClass={handleOpenEdit}
        onViewSection={handleViewSection}
        isLoading={isLoading}
      />

      {/* 5. Add / Edit Modal */}
      <ClassFormDialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setClassToEdit(null);
        }}
        classToEdit={classToEdit}
        existingClasses={classes}
        onSaveClass={handleSave}
      />

      {/* 6. Class 360 Sheet */}
      <ClassDetailSheet
        classItem={selectedClass}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClass(null);
        }}
        onEdit={(classItem) => {
          setIsDetailOpen(false);
          handleOpenEdit(classItem);
        }}
        onViewSection={handleViewSection}
      />

      {/* 7. Section Detail Dialog */}
      <SectionDetailDialog
        classItem={selectedSectionClass}
        section={selectedSection}
        isOpen={isSectionOpen}
        onClose={() => {
          setIsSectionOpen(false);
          setSelectedSectionClass(null);
          setSelectedSection(null);
        }}
      />
    </PageContainer>
  );
}

export default function ClassesPage() {
  return (
    <ToastProvider>
      <ClassesPageContent />
    </ToastProvider>
  );
}
