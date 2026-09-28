import * as React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FeeFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Academic Session
  sessions?: FilterOption[];
  selectedSessionId?: string;
  onSessionChange?: (val: string) => void;

  // Campus
  campuses?: FilterOption[];
  selectedCampusId?: string;
  onCampusChange?: (val: string) => void;

  // Class
  classes?: FilterOption[];
  selectedClassId?: string;
  onClassChange?: (val: string) => void;

  // Status
  statusOptions?: FilterOption[];
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;

  // Reset
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FeeFilterBar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  sessions,
  selectedSessionId,
  onSessionChange,
  campuses,
  selectedCampusId,
  onCampusChange,
  classes,
  selectedClassId,
  onClassChange,
  statusOptions,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  hasActiveFilters = false,
  className,
}: FeeFilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-2.5 p-3 rounded-lg border bg-card/60 shadow-2xs', className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8.5 pr-8 h-9 text-xs sm:text-sm bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Academic Session Selector */}
        {sessions && sessions.length > 0 && onSessionChange && (
          <div className="w-[160px]">
            <select
              value={selectedSessionId || ''}
              onChange={(e) => onSessionChange(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campus Selector */}
        {campuses && campuses.length > 0 && onCampusChange && (
          <div className="w-[150px]">
            <select
              value={selectedCampusId || ''}
              onChange={(e) => onCampusChange(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Class Selector */}
        {classes && classes.length > 0 && onClassChange && (
          <div className="w-[150px]">
            <select
              value={selectedClassId || ''}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Classes</option>
              {classes.map((cl) => (
                <option key={cl.value} value={cl.value}>
                  {cl.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {statusOptions && statusOptions.length > 0 && onStatusChange && (
          <div className="w-[150px]">
            <select
              value={selectedStatus || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filters */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}
