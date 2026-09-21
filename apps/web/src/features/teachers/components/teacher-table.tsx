'use client';

import * as React from 'react';
import { TeacherDetail } from '../types';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Eye, UserCheck, ShieldAlert, Shield } from 'lucide-react';

interface TeacherTableProps {
  teachers: TeacherDetail[];
  selectedIds: string[];
  onSelectRow: (id: string) => void;
  onSelectAll: () => void;
  onViewTeacher: (teacher: TeacherDetail) => void;
  onEditTeacher: (teacher: TeacherDetail) => void;
  onChangeStatus: (teacher: TeacherDetail) => void;
  onArchiveTeacher: (teacher: TeacherDetail) => void;
  isLoading?: boolean;
  onClearFilters?: () => void;
}

export function TeacherTable({
  teachers,
  selectedIds,
  onSelectRow,
  onSelectAll,
  onViewTeacher,
  onEditTeacher,
  onChangeStatus,
  onArchiveTeacher,
  isLoading = false,
}: TeacherTableProps) {
  const columns: ColumnDef<TeacherDetail>[] = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      width: '120px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.employment.employeeId}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Teacher',
      sortable: true,
      render: (row) => {
        const initials = `${row.personal.firstName[0]}${row.personal.lastName[0]}`.toUpperCase();
        return (
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            onClick={(e) => {
              e.stopPropagation();
              onViewTeacher(row);
            }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold transition-transform group-hover:scale-105">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {row.personal.firstName} {row.personal.lastName}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                <span>{row.employment.designation}</span>
                <span>•</span>
                <span className="font-mono">{row.personal.phone}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'department',
      header: 'Department',
      width: '140px',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-foreground">
          {row.employment.department}
        </span>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (row) => {
        const distinctSubjects = Array.from(new Set(row.assignments.map((a) => a.subjectName)));
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {distinctSubjects.map((sub) => (
              <span
                key={sub}
                className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground"
              >
                {sub}
              </span>
            ))}
            {distinctSubjects.length === 0 && (
              <span className="text-xs text-muted-foreground italic">None assigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'classes',
      header: 'Classes',
      width: '140px',
      render: (row) => {
        const classSections = Array.from(new Set(row.assignments.map((a) => `${a.className.replace('Class ', '')}-${a.sectionName}`)));
        return (
          <div className="flex flex-wrap gap-1">
            {classSections.slice(0, 3).map((cs) => (
              <span
                key={cs}
                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold"
              >
                {cs}
              </span>
            ))}
            {classSections.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{classSections.length - 3} more
              </span>
            )}
            {classSections.length === 0 && (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'weeklyPeriods',
      header: 'Workload',
      width: '110px',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold font-mono text-foreground">{row.weeklyPeriods}</span>
          <span className="text-muted-foreground text-[11px]"> periods/wk</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={`Actions for ${row.personal.firstName} ${row.personal.lastName}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewTeacher(row)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              View Profile (360)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTeacher(row)}>
              <Edit3 className="h-3.5 w-3.5 mr-2" />
              Edit Information
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/school/teachers/${row.id}/permissions`} className="flex items-center w-full cursor-pointer">
                <Shield className="h-3.5 w-3.5 mr-2 text-primary" />
                Manage Permissions
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatus(row)}>
              <UserCheck className="h-3.5 w-3.5 mr-2" />
              Change Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onArchiveTeacher(row)}
              className="text-destructive focus:text-destructive"
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-2" />
              Deactivate / Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
      <DataTable
        columns={columns}
        data={teachers}
        keyField="id"
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectRow={onSelectRow}
        onSelectAll={onSelectAll}
        onRowClick={onViewTeacher}
        isLoading={isLoading}
        emptyTitle="No teachers found"
        emptyDescription="No faculty records match your active search filters or department criteria."
      />
    </div>
  );
}
