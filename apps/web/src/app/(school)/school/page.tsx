'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Info,
  Layers,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  mockCurrentUser,
  mockAttentionItems,
  mockAttendanceSummary,
  mockLowAttendanceClasses,
  mockUpcomingExams,
  mockRecentNotices,
  mockRecentActivity,
} from '@/data/mock-data';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SchoolDashboardPage() {
  const store = useSchoolStore();
  const studentsCount = store.students?.length ?? 0;
  const teachersCount = store.teachers?.length ?? 0;
  const classesCount = store.classes?.length ?? 0;
  const activeSession = store.academicSessions?.find((s) => s.status === 'ACTIVE')?.name || '2026-2027';
  const pendingHomeworkCount = store.homework?.filter((h) => h.status === 'PUBLISHED').length ?? 0;

  const attendanceRegisters = Object.values(store.attendanceRegisters || {});
  const allAttendanceRecords = attendanceRegisters.flatMap((reg) => reg?.records || []);
  const totalAttendanceRecords = allAttendanceRecords.length;
  const presentAttendanceRecords = allAttendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const attendancePercentage = totalAttendanceRecords > 0
    ? `${((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(1)}%`
    : '0.0%';

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
  };

  return (
    <PageContainer>
      {/* 1. Header: School Dashboard */}
      <PageHeader
        title="School Dashboard"
        badge={
          <Badge variant="success" className="gap-1 hidden sm:inline-flex">
            <Sparkles className="h-3 w-3" />
            Live Session
          </Badge>
        }
        description={
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              {mockCurrentUser.schoolName}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Session {activeSession}
            </span>
            <span>•</span>
            <span>Institutional Overview</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" asChild>
              <Link href="/school/students">
                <Plus className="h-3.5 w-3.5" />
                Add Student
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. ATTENTION REQUIRED SECTION */}
      <Card className="border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/10 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Attention Required
              </CardTitle>
            </div>
            <Link
              href="/school/notifications"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/50">
          {mockAttentionItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              All systems operational — no urgent administrative alerts require action.
            </div>
          ) : (
            mockAttentionItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {getSeverityIcon(item.severity)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {item.title}
                      </span>
                      {item.context && (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 h-4 border', getSeverityBadgeClass(item.severity))}
                        >
                          {item.context}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end sm:self-auto h-7 px-2.5 text-xs text-primary font-medium hover:text-primary hover:bg-primary/10 shrink-0"
                  asChild
                >
                  <Link href={item.href}>{item.actionLabel}</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 3. CORE METRICS (5 TILES) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Students"
          value={studentsCount.toLocaleString()}
          change={studentsCount === 0 ? 'No students enrolled' : `${studentsCount} enrolled`}
          isPositive={studentsCount > 0}
          timeframe="Total active"
          icon={GraduationCap}
        />
        <StatCard
          title="Teachers"
          value={teachersCount.toLocaleString()}
          change={teachersCount === 0 ? 'No faculty onboarded' : `${teachersCount} faculty`}
          isPositive={teachersCount > 0}
          timeframe="Active staff"
          icon={Users}
        />
        <StatCard
          title="Attendance"
          value={attendancePercentage}
          change={totalAttendanceRecords === 0 ? 'No records today' : `${presentAttendanceRecords} present`}
          isPositive={totalAttendanceRecords > 0}
          timeframe="Session rate"
          icon={CalendarCheck}
        />
        <StatCard
          title="Classes"
          value={classesCount.toLocaleString()}
          change={classesCount === 0 ? 'No classes created' : `${classesCount} cohorts`}
          isPositive={classesCount > 0}
          timeframe="Active rosters"
          icon={Layers}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingHomeworkCount.toString()}
          change={pendingHomeworkCount === 0 ? 'Queue clear' : 'Needs review'}
          isPositive={pendingHomeworkCount === 0}
          timeframe="Homework tasks"
          icon={FileText}
        />
      </div>

      {/* 4. TODAY / THIS WEEK (ATTENDANCE + UPCOMING EXAMS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Today Attendance Progress & Low Attendance Classes */}
        <Card className="lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Today&apos;s Attendance Overview
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/school/attendance">
                  Open Register
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-muted-foreground">
                  Recorded Headcount
                </span>
                <span className="text-sm font-bold text-foreground">
                  {mockAttendanceSummary.presentCount} / {mockAttendanceSummary.totalEnrolled} students
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${mockAttendanceSummary.todayPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {mockAttendanceSummary.todayPercentage}% Present ({mockAttendanceSummary.presentCount})
                </span>
                <span className="text-muted-foreground font-medium">
                  {mockAttendanceSummary.absentCount} Absent
                </span>
              </div>
            </div>

            {/* Low attendance classes list */}
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Low Attendance Alerts
              </div>
              {mockLowAttendanceClasses.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No attendance exceptions flagged. All cohorts meeting institutional threshold.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {mockLowAttendanceClasses.map((cls: any) => (
                    <div
                      key={cls.className}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground">
                          {cls.className}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          Teacher: {cls.teacher} ({cls.absentCount} absent)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {cls.percentage}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          asChild
                        >
                          <Link href="/school/attendance">Review →</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Exams Card */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Upcoming Assessments
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/school/exams">
                  View Timetable
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {store.exams.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <p>No upcoming examinations scheduled.</p>
                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link href="/school/exams">+ Create Assessment Cycle</Link>
                </Button>
              </div>
            ) : (
              store.exams.slice(0, 2).map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/40 space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-xs text-foreground">
                      {exam.name}
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {exam.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span>{exam.startDate} – {exam.endDate}</span>
                    <span>•</span>
                    <span>{exam.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Academic Session {activeSession}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. QUICK ACTIONS & IMPORTANT NOTICES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Quick Actions Launchpad */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">
              Administrative Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/students">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">+ Add Student</span>
                  <span className="text-[10px] text-muted-foreground">New admission</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/teachers">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">+ Add Teacher</span>
                  <span className="text-[10px] text-muted-foreground">Faculty roster</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/attendance">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">Mark Attendance</span>
                  <span className="text-[10px] text-muted-foreground">Daily roll call</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/homework">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">Create Homework</span>
                  <span className="text-[10px] text-muted-foreground">Assignment queue</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/exams">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">Create Exam</span>
                  <span className="text-[10px] text-muted-foreground">Datesheet &amp; halls</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border bg-card hover:bg-accent transition-colors"
                asChild
              >
                <Link href="/school/notices">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">Publish Notice</span>
                  <span className="text-[10px] text-muted-foreground">Circular broadcast</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notices */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Important Circulars &amp; Notices
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/school/notices">
                  View all notices
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {mockRecentNotices.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <p>No institutional notices or circulars published yet.</p>
                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link href="/school/notices">+ Draft Notice</Link>
                </Button>
              </div>
            ) : (
              mockRecentNotices.slice(0, 2).map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/40 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          notice.priority === 'URGENT'
                            ? 'bg-red-500'
                            : notice.priority === 'HIGH'
                            ? 'bg-amber-500'
                            : 'bg-blue-500',
                        )}
                      />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {notice.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {notice.date}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notice.summary}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. RECENT SCHOOL ACTIVITY TIMELINE */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent School Activity Log
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Automated audit trail
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {mockRecentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No system activity logged for this session yet.
            </div>
          ) : (
            mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start sm:items-center justify-between gap-4 p-3.5 hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 sm:mt-0" />
                  <div>
                    <span className="font-semibold text-foreground">
                      {activity.title}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {activity.description}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                  {activity.timestamp}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
