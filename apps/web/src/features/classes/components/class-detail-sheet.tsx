'use client';

import * as React from 'react';
import { ClassItem, SectionItem } from '../types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowLeft, Edit3, Users, BookOpen, Calendar, User, MapPin } from 'lucide-react';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { selectSubjectsForClass } from '@/shared/selectors';
import { cn } from '@/lib/utils';

interface ClassDetailSheetProps {
  classItem: ClassItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (classItem: ClassItem) => void;
  onViewSection: (classItem: ClassItem, section: SectionItem) => void;
}

type ClassTabKey = 'overview' | 'sections' | 'students' | 'subjects' | 'timetable';

const tabList: { key: ClassTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sections', label: 'Sections' },
  { key: 'students', label: 'Students' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'timetable', label: 'Timetable' },
];

export function ClassDetailSheet({
  classItem,
  isOpen,
  onClose,
  onEdit,
  onViewSection,
}: ClassDetailSheetProps) {
  const store = useSchoolStore();
  const [activeTab, setActiveTab] = React.useState<ClassTabKey>('overview');

  if (!classItem) return null;

  const classStudents = store.students.filter(
    (s) => s.classId === classItem.id || s.className?.toLowerCase() === classItem.className.toLowerCase(),
  );
  const classSubjects = selectSubjectsForClass(store, classItem.id).relevant;

  const avgSize = classItem.sections.length > 0
    ? Math.round(classItem.totalStudents / classItem.sections.length)
    : 0;

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
              Back to Classes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(classItem)}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Class
            </Button>
          </div>

          {/* Hero Banner */}
          <div className="rounded-xl border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{classItem.className}</h2>
                <StatusBadge status={classItem.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {classItem.displayName} • Session {classItem.academicSession}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                <User className="h-3 w-3 text-primary" /> Lead Teacher: {classItem.primaryClassTeacher}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              title="Sections"
              value={String(classItem.totalSections)}
              change="Active divisions"
              isPositive={true}
            />
            <StatCard
              title="Total Students"
              value={String(classItem.totalStudents)}
              change="Enrolled roster"
              isPositive={true}
            />
            <StatCard
              title="Avg Class Size"
              value={`${avgSize}`}
              change="Students / section"
              isPositive={avgSize <= 45}
            />
            <StatCard
              title="Curriculum"
              value="8"
              change="Core &amp; Electives"
              isPositive={true}
            />
          </div>

          {/* Tabs */}
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
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Class Division Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {classItem.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="rounded-lg border bg-muted/20 p-3 space-y-1.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground">Section {sec.name}</span>
                          <span className="font-mono text-xs font-semibold text-primary">
                            {sec.studentCount} students
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {sec.classTeacherName}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {sec.roomNumber}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSection(classItem, sec)}
                          className="h-7 text-[11px] w-full mt-2 font-medium"
                        >
                          View Section Roster →
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-3">
                {classItem.sections.map((sec) => (
                  <div key={sec.id} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Section {sec.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Class Teacher: <strong className="text-foreground">{sec.classTeacherName}</strong> • {sec.roomNumber}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {sec.studentCount} Students • {sec.subjectsCount} Subjects • {sec.attendanceRate}% Attendance
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewSection(classItem, sec)}
                      className="text-xs"
                    >
                      Open Roster
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'students' && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Enrolled Students ({classStudents.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Across all sections</span>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                        <th className="py-2 px-3">Roll</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Section</th>
                        <th className="py-2 px-3">Admission ID</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {classStudents.map((stu) => (
                        <tr key={stu.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-mono font-semibold text-primary">#{stu.classRollNumber || stu.rollNumber || '—'}</td>
                          <td className="py-2 px-3 font-medium text-foreground">{stu.name}</td>
                          <td className="py-2 px-3 font-mono">Sec {stu.sectionId?.replace('sec-', '').toUpperCase() || 'A'}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{stu.admissionNumber}</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={stu.status} />
                          </td>
                        </tr>
                      ))}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                            No students currently enrolled in this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Prescribed Curriculum
                </h4>
                {classSubjects.length === 0 ? (
                  <div className="p-6 rounded border border-dashed text-center text-xs text-muted-foreground">
                    No subjects configured for this class.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {classSubjects.map((sub) => (
                      <div key={sub.id} className="p-2.5 rounded border bg-muted/20 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{sub.name} ({sub.code})</span>
                        <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5 font-bold">{sub.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timetable' && (
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Master Weekly Schedule
                </h4>
                <p className="text-xs text-muted-foreground">
                  View and manage the scheduled timetable grid in the dedicated Timetable workspace.
                </p>
                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Weekly Period Load: 36 Periods / Week</span>
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
