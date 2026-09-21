'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeacherFilterState } from '../types';

interface TeacherFiltersProps {
  filters: TeacherFilterState;
  onFilterChange: <K extends keyof TeacherFilterState>(key: K, value: TeacherFilterState[K]) => void;
  onClearFilters: () => void;
  totalTeachers: number;
  filteredCount: number;
  departments: string[];
  subjects: string[];
  classes: string[];
}

export function TeacherFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalTeachers,
  filteredCount,
  departments,
  subjects,
  classes,
}: TeacherFiltersProps) {
  const activeFiltersCount = [
    filters.searchQuery !== '',
    filters.department !== 'ALL',
    filters.subject !== 'ALL',
    filters.className !== 'ALL',
    filters.status !== 'ALL',
    filters.employmentType !== 'ALL',
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3.5 shadow-2xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="Search teachers by name, employee ID, email, designation..."
            className="pl-8.5 h-9 text-xs"
            aria-label="Search teachers"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Dynamic Count Indicator */}
        <div className="text-xs text-muted-foreground shrink-0 font-medium flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{filteredCount}</strong> of{' '}
            {totalTeachers} educators
          </span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
              {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
            </span>
          )}
        </div>
      </div>

      {/* Filter Select Controls Grid */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
        {/* Department */}
        <select
          value={filters.department}
          onChange={(e) => onFilterChange('department', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Department"
        >
          <option value="ALL">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Subject */}
        <select
          value={filters.subject}
          onChange={(e) => onFilterChange('subject', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Subject"
        >
          <option value="ALL">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {/* Class */}
        <select
          value={filters.className}
          onChange={(e) => onFilterChange('className', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Class"
        >
          <option value="ALL">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Status"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Employment Type */}
        <select
          value={filters.employmentType}
          onChange={(e) => onFilterChange('employmentType', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Employment Type"
        >
          <option value="ALL">All Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="VISITING">Visiting</option>
        </select>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
