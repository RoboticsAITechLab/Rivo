'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { SchoolHouse } from '@/types/house';
import { DetailTabKey } from './student-detail-sheet';
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
import { MoreHorizontal, User, Edit3, Calendar, Award, RefreshCw, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentTableProps {
  students: StudentDetail[];
  selectedIds: string[];
  onSelectRow: (id: string) => void;
  onSelectAll: () => void;
  onViewStudent: (student: StudentDetail, initialTab?: DetailTabKey) => void;
  onEditStudent: (student: StudentDetail) => void;
  onChangeStatus: (student: StudentDetail) => void;
  onArchiveStudent: (student: StudentDetail) => void;
  isLoading?: boolean;
  onClearFilters?: () => void;
  houses?: SchoolHouse[];
}

export function StudentTable({
  students,
  selectedIds,
  onSelectRow,
  onSelectAll,
  onViewStudent,
  onEditStudent,
  onChangeStatus,
  onArchiveStudent,
  isLoading = false,
  onClearFilters,
  houses = [],
}: StudentTableProps) {
  const sortedData = React.useMemo(() => {
    return [...students];
  }, [students]);

  const columns: ColumnDef<StudentDetail>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission No',
      width: '130px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.admissionNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      render: (row) => {
        const initials = row.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('');
        return (
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            onClick={(e) => {
              e.stopPropagation();
              onViewStudent(row);
            }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold transition-transform group-hover:scale-105">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {row.name}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span>{row.gender}</span>
                <span>•</span>
                <span>Roll #{row.rollNumber}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'className',
      header: 'Class / Sec',
      width: '120px',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-foreground">
          {row.className}-{row.section}
        </span>
      ),
    },
    {
      key: 'guardianName',
      header: 'Parent / Guardian',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-foreground truncate max-w-[180px]">
            {row.guardianName}
          </div>
          <div className="text-muted-foreground text-[11px] font-mono">{row.guardianPhone}</div>
        </div>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance',
      width: '130px',
      sortable: true,
      render: (row) => {
        const isHigh = row.attendancePercentage >= 90;
        const isMed = row.attendancePercentage >= 80;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-semibold text-xs font-mono w-9',
                isHigh
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isMed
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {row.attendancePercentage}%
            </span>
            <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500',
                )}
                style={{ width: `${row.attendancePercentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'houseId',
      header: 'House',
      width: '130px',
      render: (row) => {
        const house = houses.find((h) => h.id === row.houseId);
        if (!house) {
          return <span className="text-xs text-muted-foreground italic">Not assigned</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            {house.color && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: house.color }}
              />
            )}
            <span className="text-xs font-medium text-foreground truncate max-w-[110px]">
              {house.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'enrollmentDate',
      header: 'Enrollment',
      width: '110px',
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">{row.enrollmentDate}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      align: 'right',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label={`Actions for ${row.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onViewStudent(row)}>
                <User className="h-3.5 w-3.5 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditStudent(row)}>
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Edit Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewStudent(row, 'attendance')}>
                <Calendar className="h-3.5 w-3.5 mr-2" />
                View Attendance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewStudent(row, 'results')}>
                <Award className="h-3.5 w-3.5 mr-2" />
                View Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeStatus(row)}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onArchiveStudent(row)}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="h-3.5 w-3.5 mr-2" />
                Archive Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="relative">
      <DataTable
        columns={columns}
        data={sortedData}
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectRow={onSelectRow}
        onSelectAll={onSelectAll}
        keyField="id"
        isLoading={isLoading}
        loadingRowCount={8}
        onRowClick={(row) => onViewStudent(row)}
        emptyTitle="No Students Found"
        emptyDescription="No student records match your search criteria and filter selections. Try clearing filters to see all enrolled students."
      />
      {sortedData.length === 0 && onClearFilters && !isLoading && (
        <div className="flex justify-center -mt-6 pb-6">
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
