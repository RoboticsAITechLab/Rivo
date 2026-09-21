'use client';

import * as React from 'react';
import { SubjectDetail } from '../types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowLeft, Edit3, Users, Layers, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubjectDetailSheetProps {
  subject: SubjectDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (subject: SubjectDetail) => void;
}

type SubjectTabKey = 'overview' | 'classes' | 'teachers' | 'timetable';

const tabList: { key: SubjectTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'classes', label: 'Classes Using' },
  { key: 'teachers', label: 'Qualified Teachers' },
  { key: 'timetable', label: 'Timetable' },
];

export function SubjectDetailSheet({
  subject,
  isOpen,
  onClose,
  onEdit,
}: SubjectDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<SubjectTabKey>('overview');

  if (!subject) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-y-auto flex flex-col h-full bg-background"
      >
        <div className="p-6 space-y-6 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between border-b pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Subjects
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(subject)}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Subject
            </Button>
          </div>

          {/* Hero Banner */}
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10">
                  {subject.code}
                </span>
                <h2 className="text-xl font-bold text-foreground">{subject.name}</h2>
                <StatusBadge status={subject.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subject.department} Department • <span className="font-semibold">{subject.type}</span> Curriculum
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              title="Applicable Grades"
              value={String(subject.applicableClassIds.length)}
              change="Grade levels"
              isPositive={true}
            />
            <StatCard
              title="Instructors"
              value={String(subject.qualifiedTeacherNames.length)}
              change="Qualified teachers"
              isPositive={true}
            />
            <StatCard
              title="Weekly Load"
              value={`${subject.weeklyPeriods}`}
              change="Periods / week"
              isPositive={true}
            />
            <StatCard
              title="Department"
              value={subject.department}
              change="Academic wing"
              isPositive={true}
            />
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border/80 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 min-w-max pb-0">
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
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[280px] text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Curriculum Description &amp; Objectives
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {subject.description || 'Comprehensive standard curriculum following institutional academic guidelines.'}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Course Allocation Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Weekly Period Requirement</span>
                      <p className="font-semibold text-foreground font-mono">{subject.weeklyPeriods} Periods per Class</p>
                    </div>
                    <div className="rounded border bg-muted/20 p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Classification</span>
                      <p className="font-semibold text-foreground">{subject.type} Course</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'classes' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Classes Undergoing This Course
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subject.applicableClassNames.map((c) => (
                    <div key={c} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-foreground">{c}</h5>
                        <p className="text-[11px] text-muted-foreground">Sections A &amp; B • ~88 Students</p>
                      </div>
                      <span className="font-mono text-xs text-primary font-bold">{subject.weeklyPeriods} periods/wk</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Qualified &amp; Assigned Instructors
                </h4>
                <div className="space-y-2">
                  {subject.qualifiedTeacherNames.map((teacherName) => (
                    <div key={teacherName} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {teacherName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-foreground">{teacherName}</h5>
                          <p className="text-[11px] text-muted-foreground">{subject.department} Faculty</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                        Accredited Instructor
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timetable' && (
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Timetable Periods Schedule
                </h4>
                <p className="text-xs text-muted-foreground">
                  Scheduled across Class 10-A, 10-B, 11-A, 12-A during morning blocks.
                </p>
                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between mt-2">
                  <span className="font-semibold text-foreground">Total Weekly Periods: 24 Periods</span>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                    <a href="/school/timetable">Open Timetable →</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
