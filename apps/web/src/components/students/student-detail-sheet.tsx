'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { SchoolHouse } from '@/types/house';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Edit3, MoreVertical, Archive, RefreshCw } from 'lucide-react';
import { ChangeHouseDialog } from './houses/change-house-dialog';
import { TabOverview } from './tabs/tab-overview';
import { TabPersonal } from './tabs/tab-personal';
import { TabGuardian } from './tabs/tab-guardian';
import { TabEnrollment } from './tabs/tab-enrollment';
import { TabAttendance } from './tabs/tab-attendance';
import { TabHomework } from './tabs/tab-homework';
import { TabAcademic } from './tabs/tab-academic';
import { TabResults } from './tabs/tab-results';
import { TabActivity } from './tabs/tab-activity';
import { TabDocuments } from './tabs/tab-documents';
import { TabCustomFields } from './tabs/tab-custom-fields';
import { TabRollNumbers } from './tabs/tab-roll-numbers';
import { cn } from '@/lib/utils';

export type DetailTabKey =
  | 'overview'
  | 'personal'
  | 'guardian'
  | 'enrollment'
  | 'roll_numbers'
  | 'attendance'
  | 'homework'
  | 'academic'
  | 'results'
  | 'documents'
  | 'activity'
  | 'custom_fields';

interface StudentDetailSheetProps {
  student: StudentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: StudentDetail) => void;
  onChangeStatus: (student: StudentDetail) => void;
  onArchive: (student: StudentDetail) => void;
  initialTab?: DetailTabKey;
  houses?: SchoolHouse[];
  onUpdateStudentHouse?: (studentId: string, houseId: string | null) => void;
}

const tabList: { key: DetailTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal' },
  { key: 'guardian', label: 'Guardian' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'roll_numbers', label: 'Roll Numbers' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'homework', label: 'Homework' },
  { key: 'academic', label: 'Academic' },
  { key: 'results', label: 'Results' },
  { key: 'documents', label: 'Documents' },
  { key: 'activity', label: 'Activity' },
  { key: 'custom_fields', label: 'Custom Fields' },
];

export function StudentDetailSheet({
  student,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onArchive,
  initialTab = 'overview',
  houses = [],
  onUpdateStudentHouse,
}: StudentDetailSheetProps) {
  const [selectedTab, setSelectedTab] = React.useState<DetailTabKey | null>(null);
  const activeTab = selectedTab ?? initialTab;
  const setActiveTab = (tab: DetailTabKey) => setSelectedTab(tab);
  const [isChangeHouseOpen, setIsChangeHouseOpen] = React.useState(false);

  // Reset tab selection when student changes
  const prevStudentIdRef = React.useRef(student?.id);
  if (student?.id !== prevStudentIdRef.current) {
    prevStudentIdRef.current = student?.id;
    if (selectedTab !== null) {
      setSelectedTab(null);
    }
  }

  if (!student) return null;

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const studentHouse = houses.find((h) => h.id === student.houseId);
  const houseDisplayName = studentHouse ? studentHouse.name : 'Not assigned';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-y-auto flex flex-col h-full bg-background"
      >
        <div className="p-6 space-y-6 flex-1">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Directory
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(student)}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Record
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onChangeStatus(student)}>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Change Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onArchive(student)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    Archive Student
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Student Profile Identity Hero */}
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-xs">
              {initials}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground truncate">{student.name}</h2>
                <StatusBadge status={student.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-primary">{student.admissionNumber}</span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {student.className}-{student.section} (Roll #{student.rollNumber})
                </span>
                <span>•</span>
                <span>Mentor: {student.currentTeacher}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span>
                    House:{' '}
                    <strong className={studentHouse ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'}>
                      {houseDisplayName}
                    </strong>
                  </span>
                  {studentHouse && studentHouse.status === 'INACTIVE' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                      Inactive
                    </span>
                  )}
                  {onUpdateStudentHouse && (
                    <button
                      type="button"
                      onClick={() => setIsChangeHouseOpen(true)}
                      className="text-[11px] text-primary hover:underline font-medium ml-0.5 cursor-pointer"
                    >
                      [Change]
                    </button>
                  )}
                </span>
              </div>

              <div className="text-xs text-muted-foreground truncate">
                Guardian: <span className="font-medium text-foreground">{student.guardianName}</span> •{' '}
                <span className="font-mono">{student.guardianPhone}</span>
              </div>
            </div>
          </div>

          {/* 4 Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              title="Attendance"
              value={`${student.attendancePercentage}%`}
              change="Academic term"
              isPositive={student.attendancePercentage >= 90}
            />
            <StatCard
              title="Homework"
              value={`${student.homeworkCompleted} / ${student.homeworkTotal}`}
              change="Completed"
              isPositive={student.homeworkCompleted >= 12}
            />
            <StatCard
              title="Average"
              value={`${student.averageMarks}%`}
              change="Mid-Term GPA"
              isPositive={student.averageMarks >= 80}
            />
            <StatCard
              title="Enrollment"
              value={student.enrollmentDate}
              change={student.academicSession}
              isPositive={true}
            />
          </div>

          {/* 9 Interactive Tabs Navigation */}
          <div className="border-b border-border/80 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 min-w-max pb-0" aria-label="Student Profile Tabs">
              {tabList.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer select-none whitespace-nowrap',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Tab Content Render */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && <TabOverview student={student} />}
            {activeTab === 'personal' && <TabPersonal student={student} />}
            {activeTab === 'guardian' && (
              <TabGuardian
                student={student}
                onEditGuardian={() => onEdit(student)}
              />
            )}
            {activeTab === 'enrollment' && (
              <TabEnrollment student={student} houseName={houseDisplayName} />
            )}
            {activeTab === 'roll_numbers' && <TabRollNumbers student={student} />}
            {activeTab === 'attendance' && <TabAttendance student={student} />}
            {activeTab === 'homework' && <TabHomework student={student} />}
            {activeTab === 'academic' && <TabAcademic student={student} />}
            {activeTab === 'results' && <TabResults student={student} />}
            {activeTab === 'documents' && <TabDocuments student={student} />}
            {activeTab === 'activity' && <TabActivity student={student} />}
            {activeTab === 'custom_fields' && <TabCustomFields student={student} />}
          </div>
        </div>

        {/* Change House Dialog */}
        {onUpdateStudentHouse && (
          <ChangeHouseDialog
            isOpen={isChangeHouseOpen}
            onClose={() => setIsChangeHouseOpen(false)}
            student={student}
            houses={houses}
            onConfirmChangeHouse={onUpdateStudentHouse}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
