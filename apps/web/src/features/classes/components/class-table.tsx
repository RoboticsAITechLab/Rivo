'use client';

import * as React from 'react';
import { ClassItem, SectionItem } from '../types';
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

interface ClassTableProps {
  classes: ClassItem[];
  onViewClass: (classItem: ClassItem) => void;
  onEditClass: (classItem: ClassItem) => void;
  onViewSection: (classItem: ClassItem, section: SectionItem) => void;
  isLoading?: boolean;
}

export function ClassTable({
  classes,
  onViewClass,
  onEditClass,
  onViewSection,
  isLoading = false,
}: ClassTableProps) {
  const columns: ColumnDef<ClassItem>[] = [
    {
      key: 'className',
      header: 'Class / Grade',
      width: '160px',
      sortable: true,
      render: (row) => (
        <div
          className="cursor-pointer group select-none"
          onClick={(e) => {
            e.stopPropagation();
            onViewClass(row);
          }}
        >
          <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
            {row.className}
          </div>
          <div className="text-[11px] text-muted-foreground">{row.displayName}</div>
        </div>
      ),
    },
    {
      key: 'sections',
      header: 'Sections & Rosters',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewSection(row, sec);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary text-xs font-semibold transition-colors cursor-pointer border border-border/50"
              title={`Section ${sec.name} • ${sec.studentCount} Students • Teacher: ${sec.classTeacherName}`}
            >
              <span>{sec.name}</span>
              <span className="text-[10px] text-muted-foreground font-normal font-mono">
                ({sec.studentCount})
              </span>
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'totalStudents',
      header: 'Enrolled',
      width: '110px',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          {row.totalStudents}
        </div>
      ),
    },
    {
      key: 'primaryClassTeacher',
      header: 'Head Teacher',
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">{row.primaryClassTeacher}</span>
          <div className="text-[11px] text-muted-foreground">Session {row.academicSession}</div>
        </div>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      width: '100px',
      render: (row) => {
        const subCount = row.sections[0]?.subjectsCount || 8;
        return (
          <span className="text-xs font-mono text-muted-foreground">
            {subCount} subjects
          </span>
        );
      },
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
            <DropdownMenuItem onClick={() => onViewClass(row)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Class 360 View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditClass(row)}>
              <Edit3 className="h-3.5 w-3.5 mr-2" />
              Edit Class Config
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
        data={classes}
        keyField="id"
        onRowClick={onViewClass}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No academic grades configured for this session."
      />
    </div>
  );
}
