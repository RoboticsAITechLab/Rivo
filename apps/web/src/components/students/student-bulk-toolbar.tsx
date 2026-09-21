'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Archive, X } from 'lucide-react';

interface StudentBulkToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkChangeStatus: () => void;
  onBulkExport: () => void;
  onBulkArchive: () => void;
}

export function StudentBulkToolbar({
  selectedCount,
  onClearSelection,
  onBulkChangeStatus,
  onBulkExport,
  onBulkArchive,
}: StudentBulkToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-foreground">
          {selectedCount} {selectedCount === 1 ? 'student' : 'students'} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkChangeStatus}
          className="h-8 text-xs gap-1.5 bg-background"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Change Status
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkExport}
          className="h-8 text-xs gap-1.5 bg-background"
        >
          <Download className="h-3.5 w-3.5" />
          Export Records
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkArchive}
          className="h-8 text-xs gap-1.5"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
