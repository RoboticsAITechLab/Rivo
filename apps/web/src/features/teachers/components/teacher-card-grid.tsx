'use client';

import * as React from 'react';
import { TeacherDetail } from '../types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, MoreVertical, BookOpen, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface TeacherCardGridProps {
  teachers: TeacherDetail[];
  onViewTeacher: (teacher: TeacherDetail) => void;
  onEditTeacher: (teacher: TeacherDetail) => void;
  onChangeStatus: (teacher: TeacherDetail) => void;
  onArchiveTeacher: (teacher: TeacherDetail) => void;
}

export function TeacherCardGrid({
  teachers,
  onViewTeacher,
  onEditTeacher,
  onChangeStatus,
  onArchiveTeacher,
}: TeacherCardGridProps) {
  if (teachers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
      {teachers.map((teacher) => {
        const initials = `${teacher.personal.firstName[0]}${teacher.personal.lastName[0]}`.toUpperCase();
        const subjects = Array.from(new Set(teacher.assignments.map((a) => a.subjectName)));

        return (
          <div
            key={teacher.id}
            className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {teacher.personal.firstName} {teacher.personal.lastName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {teacher.employment.employeeId} • {teacher.employment.designation}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onViewTeacher(teacher)}>
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTeacher(teacher)}>
                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                    Edit Record
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeStatus(teacher)}>
                    Change Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onArchiveTeacher(teacher)}
                    className="text-destructive"
                  >
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{teacher.employment.department}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {teacher.weeklyPeriods} periods/wk
              </span>
            </div>

            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {subjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground flex items-center gap-1"
                  >
                    <BookOpen className="h-2.5 w-2.5 text-primary" />
                    {sub}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <StatusBadge status={teacher.status} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTeacher(teacher)}
                className="h-7 text-xs font-semibold"
              >
                View 360
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
