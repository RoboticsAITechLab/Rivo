'use client';

import * as React from 'react';
import { SubjectDetail } from '../types';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit3, Users } from 'lucide-react';

interface SubjectTableProps {
  subjects: SubjectDetail[];
  onViewSubject: (subject: SubjectDetail) => void;
  onEditSubject: (subject: SubjectDetail) => void;
  isLoading?: boolean;
}

export function SubjectTable({
  subjects,
  onViewSubject,
  onEditSubject,
  isLoading = false,
}: SubjectTableProps) {
  const columns: ColumnDef<SubjectDetail>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '110px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Subject',
      sortable: true,
      render: (row) => (
        <div
          className="cursor-pointer group select-none"
          onClick={(e) => {
            e.stopPropagation();
            onViewSubject(row);
          }}
        >
          <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
            {row.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate max-w-[260px]">
            {row.description || `${row.department} curriculum module`}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '110px',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground border">
          {row.type}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '130px',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-foreground font-medium">{row.department}</span>
      ),
    },
    {
      key: 'classes',
      header: 'Applicable Classes',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.applicableClassNames.map((c) => (
            <span
              key={c}
              className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-medium text-muted-foreground"
            >
              {c.replace('Class ', 'Gr ')}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'teachers',
      header: 'Teachers',
      width: '110px',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3 text-primary" />
          <span className="font-mono font-semibold text-foreground">
            {row.qualifiedTeacherNames.length}
          </span>{' '}
          educators
        </div>
      ),
    },
    {
      key: 'weeklyPeriods',
      header: 'Load',
      width: '100px',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono font-medium text-foreground">
          {row.weeklyPeriods} periods/wk
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onViewSubject(row)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Subject 360 View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditSubject(row)}>
              <Edit3 className="h-3.5 w-3.5 mr-2" />
              Edit Subject
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
        data={subjects}
        keyField="id"
        onRowClick={onViewSubject}
        isLoading={isLoading}
        emptyTitle="No subjects found"
        emptyDescription="No subjects match your active search filters or department criteria."
      />
    </div>
  );
}
