'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function StudentPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: StudentPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
      {/* Information text & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Showing <strong className="text-foreground">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-foreground">{totalItems}</strong> students
        </span>
        <span>•</span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded border border-input bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-7 px-2 text-xs"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
          Previous
        </Button>

        {getPageNumbers().map((p, i) =>
          typeof p === 'number' ? (
            <Button
              key={`page-${p}`}
              variant={currentPage === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(p)}
              className={cn(
                'h-7 w-7 text-xs p-0 font-medium',
                currentPage === p && 'pointer-events-none',
              )}
              aria-label={`Page ${p}`}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </Button>
          ) : (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground select-none">
              …
            </span>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-7 px-2 text-xs"
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
