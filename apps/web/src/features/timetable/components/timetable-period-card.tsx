'use client';

import * as React from 'react';
import { TimetablePeriod } from '../types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit3, Copy, Trash2, MapPin, User } from 'lucide-react';

interface TimetablePeriodCardProps {
  period: TimetablePeriod;
  onEdit: (period: TimetablePeriod) => void;
  onDuplicate: (period: TimetablePeriod) => void;
  onDelete: (period: TimetablePeriod) => void;
}

export function TimetablePeriodCard({
  period,
  onEdit,
  onDuplicate,
  onDelete,
}: TimetablePeriodCardProps) {
  if (period.isBreak) {
    return (
      <div className="h-full w-full rounded-lg bg-muted/40 border border-dashed border-border/80 flex items-center justify-center p-2 text-center text-xs text-muted-foreground select-none">
        <span className="font-semibold">{period.breakLabel || 'Recess Break'}</span>
      </div>
    );
  }

  return (
    <div className="group relative h-full w-full rounded-lg border bg-card p-2.5 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-1">
          <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
            {period.subjectName}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 text-xs">
              <DropdownMenuItem onClick={() => onEdit(period)}>
                <Edit3 className="h-3 w-3 mr-2" />
                Edit Period
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(period)}>
                <Copy className="h-3 w-3 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(period)} className="text-destructive">
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Period
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
          <User className="h-3 w-3 text-primary shrink-0" />
          <span className="truncate">{period.teacherName}</span>
        </p>

        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span>{period.room}</span>
        </p>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[10px] font-mono text-muted-foreground mt-1">
        <span className="font-semibold text-foreground">{period.className}-{period.sectionName}</span>
        <span>{period.periodSlot}</span>
      </div>
    </div>
  );
}
