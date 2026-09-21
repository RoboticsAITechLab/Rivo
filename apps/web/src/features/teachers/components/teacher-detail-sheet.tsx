'use client';

import * as React from 'react';
import { TeacherDetail } from '../types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowLeft, Edit3, UserCheck, ShieldAlert, Calendar, BookOpen, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherDetailSheetProps {
  teacher: TeacherDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (teacher: TeacherDetail) => void;
  onChangeStatus: (teacher: TeacherDetail) => void;
  onArchive: (teacher: TeacherDetail) => void;
}

type TeacherTabKey =
  | 'overview'
  | 'personal'
  | 'employment'
  | 'subjects'
  | 'classes'
  | 'timetable'
  | 'attendance'
  | 'workload'
  | 'activity';

const tabList: { key: TeacherTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal' },
  { key: 'employment', label: 'Employment' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'classes', label: 'Classes' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'workload', label: 'Workload' },
  { key: 'activity', label: 'Activity' },
];

export function TeacherDetailSheet({
  teacher,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onArchive,
}: TeacherDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<TeacherTabKey>('overview');

  if (!teacher) return null;

  const initials = `${teacher.personal.firstName[0]}${teacher.personal.lastName[0]}`.toUpperCase();
  const distinctSubjects = Array.from(new Set(teacher.assignments.map((a) => a.subjectName)));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-y-auto flex flex-col h-full bg-background"
      >
        <div className="p-6 space-y-6 flex-1">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Teachers
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(teacher)}
                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeStatus(teacher)}
                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Change Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onArchive(teacher)}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                Deactivate
              </Button>
            </div>
          </div>

          {/* Teacher Profile Identity Hero */}
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-xs">
              {initials}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground truncate">
                  {teacher.personal.firstName} {teacher.personal.middleName ? `${teacher.personal.middleName} ` : ''}{teacher.personal.lastName}
                </h2>
                <StatusBadge status={teacher.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-primary">{teacher.employment.employeeId}</span>
                <span>•</span>
                <span className="font-medium text-foreground">{teacher.employment.department}</span>
                <span>•</span>
                <span>{teacher.employment.designation}</span>
                <span>•</span>
                <span>Experience: {teacher.employment.experienceYears} yrs</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3 w-3" /> {teacher.personal.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {teacher.personal.email}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              title="Classes"
              value={String(teacher.totalClassesCount)}
              change="Assigned sections"
              isPositive={true}
            />
            <StatCard
              title="Subjects"
              value={String(distinctSubjects.length)}
              change="Academic subjects"
              isPositive={true}
            />
            <StatCard
              title="Weekly Load"
              value={`${teacher.weeklyPeriods}`}
              change="Periods / week"
              isPositive={teacher.weeklyPeriods <= 26}
            />
            <StatCard
              title="Attendance"
              value={`${teacher.attendanceRate}%`}
              change="Current session"
              isPositive={teacher.attendanceRate >= 95}
            />
          </div>

          {/* 9 Interactive Tabs Navigation */}
          <div className="border-b border-border/80 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 min-w-max pb-0" aria-label="Teacher Profile Tabs">
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
          <div className="min-h-[280px] text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Current Teaching Assignments
                  </h4>
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                          <th className="py-2 px-3">Class</th>
                          <th className="py-2 px-3">Section</th>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">Periods / Wk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {teacher.assignments.map((asg) => (
                          <tr key={asg.id} className="hover:bg-muted/30">
                            <td className="py-2 px-3 font-semibold text-foreground">{asg.className}</td>
                            <td className="py-2 px-3 font-mono">Section {asg.sectionName}</td>
                            <td className="py-2 px-3 text-primary font-medium">{asg.subjectName}</td>
                            <td className="py-2 px-3 font-mono">{asg.periodsPerWeek}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Personal &amp; Contact Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Date of Birth</span>
                    <p className="font-semibold text-foreground">{teacher.personal.dateOfBirth}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Gender</span>
                    <p className="font-semibold text-foreground">{teacher.personal.gender}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Blood Group</span>
                    <p className="font-semibold text-foreground">{teacher.personal.bloodGroup || 'N/A'}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Residential Address</span>
                    <p className="font-medium text-foreground">
                      {teacher.address.street}, {teacher.address.city}, {teacher.address.state} - {teacher.address.postalCode}
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Emergency Contact</span>
                    <p className="font-medium text-foreground">
                      {teacher.emergencyContact.name} ({teacher.emergencyContact.relationship}) • {teacher.emergencyContact.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'employment' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Employment Records &amp; Accreditation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Employee ID</span>
                    <p className="font-mono font-bold text-primary">{teacher.employment.employeeId}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Joining Date</span>
                    <p className="font-semibold text-foreground">{teacher.employment.joiningDate}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Employment Type</span>
                    <p className="font-semibold text-foreground">{teacher.employment.employmentType.replace('_', ' ')}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Qualifications</span>
                    <p className="font-semibold text-foreground">{teacher.employment.qualification}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Teaching Experience</span>
                    <p className="font-semibold text-foreground">{teacher.employment.experienceYears} Years</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subjects &amp; Curriculum Domain
                </h4>
                <div className="space-y-2">
                  {distinctSubjects.map((sub) => (
                    <div key={sub} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div>
                        <h5 className="font-bold text-sm text-foreground">{sub}</h5>
                        <p className="text-[11px] text-muted-foreground">{teacher.employment.department} Department</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                        Active Instructor
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'classes' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Student Divisions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teacher.assignments.map((asg) => (
                    <div key={asg.id} className="p-3 rounded-lg border bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{asg.className} - {asg.sectionName}</span>
                        <span className="font-mono text-xs text-primary font-semibold">{asg.periodsPerWeek} periods/wk</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Subject: {asg.subjectName}</p>
                      <p className="text-[11px] text-muted-foreground">Approx. 44 Students Enrolled</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timetable' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Weekly Schedule Slots
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">Monday: 08:00 - 08:45</span>
                      <p className="text-muted-foreground text-[11px]">Class 10-A • Mathematics • Room 204</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">Period 1</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">Tuesday: 08:00 - 08:45</span>
                      <p className="text-muted-foreground text-[11px]">Class 10-A • Mathematics • Room 204</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">Period 1</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">Wednesday: 08:50 - 09:35</span>
                      <p className="text-muted-foreground text-[11px]">Class 10-A • Mathematics • Room 204</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">Period 2</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Faculty Attendance Metrics
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/30 p-2.5 border">
                    <p className="text-muted-foreground text-[11px]">Attendance Rate</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{teacher.attendanceRate}%</p>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2.5 border">
                    <p className="text-muted-foreground text-[11px]">Leaves Taken</p>
                    <p className="text-base font-bold text-foreground mt-0.5">3 Days</p>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2.5 border">
                    <p className="text-muted-foreground text-[11px]">Punch Punctuality</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">99.1%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workload' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Weekly Teaching Load Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Allocated Teaching Periods</span>
                    <span className="font-bold text-foreground font-mono">{teacher.weeklyPeriods} / 26 periods max</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (teacher.weeklyPeriods / 26) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Educator is at {Math.round((teacher.weeklyPeriods / 26) * 100)}% institutional capacity allocation.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Educator Activity Log
                </h4>
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No recent activity logged for this educator.
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
