'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StudentFilterState } from '@/types/student';
import { SchoolHouse } from '@/types/house';

interface StudentFiltersProps {
  filters: StudentFilterState;
  onFilterChange: <K extends keyof StudentFilterState>(key: K, value: StudentFilterState[K]) => void;
  onClearFilters: () => void;
  totalStudents: number;
  filteredCount: number;
  houses?: SchoolHouse[];
}

export function StudentFilters({
  filters,
  onFilterChange,
  onClearFilters,
  totalStudents,
  filteredCount,
  houses = [],
}: StudentFiltersProps) {
  // Compute active filters count
  const activeFiltersCount = [
    filters.searchQuery !== '',
    filters.academicSession !== 'ALL',
    filters.className !== 'ALL',
    filters.section !== 'ALL',
    filters.status !== 'ALL',
    filters.houseId !== 'ALL',
    filters.gender !== 'ALL',
    filters.attendanceRange !== 'ALL',
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
            placeholder="Search students by name, admission ID, email, guardian..."
            className="pl-8.5 h-9 text-xs"
            aria-label="Search students"
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
            {totalStudents} students
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
        {/* Session */}
        <select
          value={filters.academicSession}
          onChange={(e) => onFilterChange('academicSession', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Academic Session"
        >
          <option value="ALL">All Sessions</option>
          <option value="2026-27">Session 2026-27</option>
          <option value="2025-26">Session 2025-26</option>
        </select>

        {/* Class */}
        <select
          value={filters.className}
          onChange={(e) => onFilterChange('className', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Class"
        >
          <option value="ALL">All Classes</option>
          <option value="Class 9">Class 9</option>
          <option value="Class 10">Class 10</option>
          <option value="Class 11">Class 11</option>
          <option value="Class 12">Class 12</option>
        </select>

        {/* Section */}
        <select
          value={filters.section}
          onChange={(e) => onFilterChange('section', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Section"
        >
          <option value="ALL">All Sections</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
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
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="GRADUATED">Graduated</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* House Filter */}
        <select
          value={filters.houseId || 'ALL'}
          onChange={(e) => onFilterChange('houseId', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by House"
        >
          <option value="ALL">All Houses</option>
          <option value="NONE">No House Assigned</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name} {house.status === 'INACTIVE' ? '(Inactive)' : ''}
            </option>
          ))}
        </select>

        {/* Gender */}
        <select
          value={filters.gender}
          onChange={(e) => onFilterChange('gender', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Gender"
        >
          <option value="ALL">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        {/* Attendance Range */}
        <select
          value={filters.attendanceRange}
          onChange={(e) => onFilterChange('attendanceRange', e.target.value)}
          className="h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by Attendance Range"
        >
          <option value="ALL">All Attendance</option>
          <option value="HIGH">High (≥ 90%)</option>
          <option value="MEDIUM">Average (80% – 89%)</option>
          <option value="LOW">Low (&lt; 80%)</option>
        </select>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
