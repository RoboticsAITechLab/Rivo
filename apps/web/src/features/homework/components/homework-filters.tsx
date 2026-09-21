'use client';

import * as React from 'react';
import { HomeworkFilterState } from '../types';
import { mockRepository } from '@/features/shared/mock-repository';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface HomeworkFiltersProps {
  filters: HomeworkFilterState;
  onFilterChange: (updates: Partial<HomeworkFilterState>) => void;
  onReset: () => void;
}

export function HomeworkFilters({ filters, onFilterChange, onReset }: HomeworkFiltersProps) {
  const classes = React.useMemo(() => mockRepository.getClasses(), []);
  const subjects = React.useMemo(() => mockRepository.getSubjects(), []);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.classId !== '' ||
    filters.subjectId !== '' ||
    filters.status !== 'ALL';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card border rounded-xl p-3 shadow-2xs">
      {/* Search Input */}
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Search assignments or topics..."
          className="pl-8 h-8 text-xs bg-background"
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
        {/* Class Filter */}
        <select
          value={filters.classId}
          onChange={(e) => onFilterChange({ classId: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </select>

        {/* Subject Filter */}
        <select
          value={filters.subjectId}
          onChange={(e) => onFilterChange({ subjectId: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="CLOSED">Closed</option>
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
