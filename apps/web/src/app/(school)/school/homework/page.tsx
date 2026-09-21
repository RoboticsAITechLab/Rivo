'use client';

import * as React from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { useHomework } from '@/features/homework/hooks/use-homework';
import { HomeworkFilters } from '@/features/homework/components/homework-filters';
import { HomeworkTable } from '@/features/homework/components/homework-table';
import { HomeworkFormSheet } from '@/features/homework/components/homework-form-sheet';
import { HomeworkDetailSheet } from '@/features/homework/components/homework-detail-sheet';
import { HomeworkDeleteDialog } from '@/features/homework/components/homework-delete-dialog';
import { HomeworkItem } from '@/features/homework/types';

export default function HomeworkPage() {
  const {
    filteredHomework,
    filters,
    metrics,
    setFilters,
    resetFilters,
    saveHomework,
    deleteHomework,
    toggleStatus,
  } = useHomework();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingHomework, setEditingHomework] = React.useState<HomeworkItem | null>(null);
  const [detailHomework, setDetailHomework] = React.useState<HomeworkItem | null>(null);
  const [deletingHomework, setDeletingHomework] = React.useState<HomeworkItem | null>(null);

  const handleOpenCreate = () => {
    setEditingHomework(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: HomeworkItem) => {
    setEditingHomework(item);
    setIsFormOpen(true);
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Homework & Problem Sets"
        description="Distribute curriculum assignments, track submission progress, and evaluate academic cohort performance."
        icon={FileText}
        badge="Active Term 2025-26"
        actions={
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 text-xs shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Assignment</span>
          </Button>
        }
      />

      {/* 2. Live Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{metrics.totalCount}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Total Assignments</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.publishedCount}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Active & Published</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.draftsCount}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Pending Drafts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.avgCompletion}%
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Cohort Submission Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filters Toolbar */}
      <HomeworkFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* 4. Homework Assignments Table */}
      <HomeworkTable
        items={filteredHomework}
        onView={(hw) => setDetailHomework(hw)}
        onEdit={handleOpenEdit}
        onDelete={(hw) => setDeletingHomework(hw)}
        onToggleStatus={toggleStatus}
      />

      {/* 5. Department Review Queue & Due Soon Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Review Queue Card */}
        <Card className="border-border/60 shadow-2xs">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Department Submission Review Queue
              </CardTitle>
              <Badge variant={filteredHomework.length > 0 ? 'warning' : 'outline'} className="text-[10px]">
                {filteredHomework.length > 0 ? `${filteredHomework.length} Active Tasks` : 'Queue Clear'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs text-muted-foreground">
              {filteredHomework.length > 0
                ? 'Submitted student problem sets awaiting grading approval and teacher feedback release.'
                : 'No pending student homework submissions awaiting department review.'}
            </p>
            {filteredHomework[0] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailHomework(filteredHomework[0])}
                className="w-full text-xs h-8 font-medium gap-1 justify-between border-border"
              >
                <span>Review {filteredHomework[0].title}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Due Soon Highlights */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Due Within 72 Hours
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                0 Tasks Approaching
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs text-muted-foreground">
              No assignments approaching submission deadlines within the next 72 hours.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 6. Form Sheet (Create / Edit Assignment) */}
      <HomeworkFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        homeworkToEdit={editingHomework}
        onSave={(hw, isPublish) => {
          saveHomework(hw, isPublish);
          setIsFormOpen(false);
        }}
      />

      {/* 7. Detail Sheet (Homework 360 & Submissions) */}
      <HomeworkDetailSheet
        isOpen={Boolean(detailHomework)}
        onClose={() => setDetailHomework(null)}
        homework={detailHomework}
        onEdit={(hw) => {
          setDetailHomework(null);
          handleOpenEdit(hw);
        }}
        onToggleStatus={toggleStatus}
      />

      {/* 8. Delete Confirmation Dialog */}
      <HomeworkDeleteDialog
        isOpen={Boolean(deletingHomework)}
        onClose={() => setDeletingHomework(null)}
        homework={deletingHomework}
        onConfirmDelete={deleteHomework}
      />
    </PageContainer>
  );
}
