'use client';

import * as React from 'react';
import { HomeworkItem } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Paperclip,
  Calendar,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeworkTableProps {
  items: HomeworkItem[];
  onView: (item: HomeworkItem) => void;
  onEdit: (item: HomeworkItem) => void;
  onDelete: (item: HomeworkItem) => void;
  onToggleStatus: (item: HomeworkItem) => void;
}

export function HomeworkTable({
  items,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: HomeworkTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center bg-card shadow-2xs">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-bold text-sm text-foreground">No Homework Assignments Found</h3>
        <p className="text-xs text-muted-foreground mt-1">
          No assignments match your active search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Assignment</th>
              <th className="py-3 px-3">Subject</th>
              <th className="py-3 px-3">Class</th>
              <th className="py-3 px-3">Faculty</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-4 w-44">Completion Rate</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-2 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((hw) => {
              const completionPercent =
                hw.totalStudents > 0
                  ? Math.round((hw.completedCount / hw.totalStudents) * 100)
                  : 0;

              return (
                <tr key={hw.id} className="hover:bg-muted/15 transition-colors">
                  {/* Assignment Title & Details */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => onView(hw)}
                          className="font-bold text-foreground text-xs hover:text-primary transition-colors text-left truncate block w-full"
                        >
                          {hw.title}
                        </button>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {hw.description}
                        </p>
                        {hw.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
                            <Paperclip className="h-2.5 w-2.5" />
                            <span>{hw.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground">{hw.subjectName}</span>
                  </td>

                  {/* Class & Section */}
                  <td className="py-3 px-3">
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {hw.className}-{hw.sectionName}
                    </Badge>
                  </td>

                  {/* Faculty */}
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="font-medium text-foreground">{hw.teacherName}</span>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                      <Calendar className="h-3 w-3 text-muted-foreground/70" />
                      <span>{hw.dueDate}</span>
                    </div>
                    {hw.priority === 'HIGH' && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 mt-1">
                        Urgent Priority
                      </Badge>
                    )}
                  </td>

                  {/* Completion Rate & Progress Bar */}
                  <td className="py-3 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">
                          {hw.completedCount} / {hw.totalStudents}
                        </span>
                        <span className="text-muted-foreground font-mono">{completionPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            completionPercent >= 80
                              ? 'bg-emerald-500'
                              : completionPercent >= 50
                              ? 'bg-primary'
                              : 'bg-amber-500'
                          )}
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    {hw.status === 'PUBLISHED' && (
                      <Badge variant="success" className="text-[10px] px-2 py-0.5">
                        Published
                      </Badge>
                    )}
                    {hw.status === 'DRAFT' && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        Draft
                      </Badge>
                    )}
                    {hw.status === 'CLOSED' && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        Closed
                      </Badge>
                    )}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3 px-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuItem onClick={() => onView(hw)}>
                          <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(hw)}>
                          <Edit3 className="h-3.5 w-3.5 mr-2" />
                          Edit Assignment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(hw)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                          {hw.status === 'CLOSED' ? 'Reopen Assignment' : 'Mark as Closed'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(hw)} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Assignment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
        <span>Showing {items.length} assignment(s)</span>
        <span className="font-medium text-foreground">Active Term 2025-26</span>
      </div>
    </div>
  );
}
