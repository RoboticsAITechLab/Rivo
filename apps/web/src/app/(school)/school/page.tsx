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
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface DashboardData {
  school: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  stats: {
    studentsCount: number;
    totalStudentsCount: number;
    teachersCount: number;
    classesCount: number;
    sectionsCount: number;
    activeSession: string;
    attendancePercentage: string;
    attendanceBreakdown: {
      total: number;
      present: number;
      absent: number;
      late: number;
      registersCompleted: number;
    };
  };
  lowAttendanceClasses: Array<{
    className: string;
    sectionName: string;
    percentage: number;
  }>;
  upcomingExams: Array<{
    id: string;
    name: string;
    code?: string;
    startDate: string;
    endDate: string;
    papersCount: number;
    isPublished: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    event: string;
    details: string | null;
    createdAt: string;
  }>;
}

export default function SchoolDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/school/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to load school dashboard metrics (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to dashboard service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-muted rounded-md" />
          <div className="h-20 w-full bg-muted/60 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-muted/70 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 h-64 bg-muted/60 rounded-xl" />
            <div className="lg:col-span-5 h-64 bg-muted/60 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <ErrorState
          title="Dashboard Unavailable"
          message={error || 'Unable to load real-time institutional dashboard metrics.'}
          onRetry={fetchDashboard}
        />
      </PageContainer>
    );
  }

  const { school, stats, lowAttendanceClasses, upcomingExams, recentActivity } = data;

  const totalAttendance = stats.attendanceBreakdown.total;
  const presentAttendance = stats.attendanceBreakdown.present;
  const attendanceRateNum = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

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
              {school.name}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Session {stats.activeSession}
            </span>
            <span>•</span>
            <span>Institutional Overview</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={fetchDashboard}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
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
      <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/15 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/15">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-950 dark:text-amber-200">
              Administrative Status Overview
            </h2>
          </div>
          <Link
            href="/school/notifications"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 hover:underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1.5 py-0.5"
          >
            <span>View notifications</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="divide-y divide-amber-500/15">
          {lowAttendanceClasses.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              All systems operational — institutional rosters and cohorts are meeting standard operational criteria.
            </div>
          ) : (
            lowAttendanceClasses.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Low Attendance Flagged: {item.className} - {item.sectionName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      >
                        {item.percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Attendance rate is below the institutional 85% threshold.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-end sm:self-auto h-7 px-3 text-xs bg-card/80 hover:bg-card text-foreground font-medium shrink-0 border-amber-500/25"
                  asChild
                >
                  <Link href="/school/attendance">Review Cohort</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. CORE METRICS (5 TILES) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Students"
          value={stats.studentsCount.toLocaleString()}
          change={stats.studentsCount === 0 ? 'No active students' : `${stats.studentsCount} active`}
          isPositive={stats.studentsCount > 0}
          timeframe="Total active"
          icon={GraduationCap}
        />
        <StatCard
          title="Teachers"
          value={stats.teachersCount.toLocaleString()}
          change={stats.teachersCount === 0 ? 'No faculty onboarded' : `${stats.teachersCount} active`}
          isPositive={stats.teachersCount > 0}
          timeframe="Active staff"
          icon={Users}
        />
        <StatCard
          title="Attendance"
          value={stats.attendancePercentage}
          change={totalAttendance === 0 ? 'No roll calls today' : `${presentAttendance} present`}
          isPositive={totalAttendance > 0}
          timeframe="Today rate"
          icon={CalendarCheck}
        />
        <StatCard
          title="Classes"
          value={stats.classesCount.toLocaleString()}
          change={stats.classesCount === 0 ? 'No active classes' : `${stats.classesCount} active`}
          isPositive={stats.classesCount > 0}
          timeframe="Active cohorts"
          icon={Layers}
        />
        <StatCard
          title="Sections"
          value={stats.sectionsCount.toLocaleString()}
          change={stats.sectionsCount === 0 ? 'No active sections' : `${stats.sectionsCount} divisions`}
          isPositive={stats.sectionsCount > 0}
          timeframe="Class sections"
          icon={FileText}
        />
      </div>

      {/* 4. TODAY / THIS WEEK (ATTENDANCE + UPCOMING EXAMS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Today Attendance Progress */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Today&apos;s Attendance Overview
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Session roll call summary</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-primary font-medium hover:text-primary hover:bg-primary/10 group"
                asChild
              >
                <Link href="/school/attendance">
                  <span>Open Register</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            <div className="pt-4 space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs text-muted-foreground">
                    Recorded Headcount
                  </span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {presentAttendance} / {totalAttendance} students
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${attendanceRateNum}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {stats.attendancePercentage} Present ({presentAttendance})
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {stats.attendanceBreakdown.absent} Absent • {stats.attendanceBreakdown.late} Late
                  </span>
                </div>
              </div>

              {/* Attendance registers completed */}
              <div className="rounded-lg border border-border/70 bg-surface-subtle/80 p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Today&apos;s Registers Completed: {stats.attendanceBreakdown.registersCompleted}
                </div>
                {lowAttendanceClasses.length === 0 ? (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    {totalAttendance === 0
                      ? 'No roll call registers recorded yet for today.'
                      : 'All completed registers are operating within healthy attendance margins.'}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {lowAttendanceClasses.map((cls, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            {cls.className} ({cls.sectionName})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                            {cls.percentage}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2.5 text-[11px] hover:text-primary hover:border-primary/40"
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
            </div>
          </div>
        </div>

        {/* Upcoming Exams Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Award className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Upcoming Assessments
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Cycle dates &amp; schedules</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-primary font-medium hover:text-primary hover:bg-primary/10 group"
                asChild
              >
                <Link href="/school/exams">
                  <span>View Cycles</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            <div className="pt-4 space-y-3">
              {upcomingExams.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-3">
                  <p>No upcoming examination cycles scheduled.</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/school/exams">+ Create Assessment Cycle</Link>
                  </Button>
                </div>
              ) : (
                upcomingExams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-lg border border-border/70 bg-surface-subtle/50 p-3.5 transition-colors hover:border-primary/40 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-foreground">
                        {exam.name}
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
                        {exam.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                      <span>{new Date(exam.startDate).toLocaleDateString()} – {new Date(exam.endDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{exam.papersCount} Papers</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS & IMPORTANT NOTICES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Quick Actions Launchpad */}
        <div className="lg:col-span-6 rounded-xl border border-border/80 bg-card p-5 shadow-2xs">
          <div className="pb-3 border-b border-border/60">
            <h2 className="text-sm font-bold text-foreground">
              Administrative Quick Actions
            </h2>
            <p className="text-[11px] text-muted-foreground">Shortcuts for routine operational tasks</p>
          </div>
          <div className="pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/students">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">+ Add Student</span>
                  <span className="text-[10px] text-muted-foreground">New admission</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/teachers">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">+ Add Teacher</span>
                  <span className="text-[10px] text-muted-foreground">Faculty roster</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/attendance">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Mark Attendance</span>
                  <span className="text-[10px] text-muted-foreground">Daily roll call</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/classes">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Manage Classes</span>
                  <span className="text-[10px] text-muted-foreground">Cohorts &amp; sections</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/exams">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Create Exam</span>
                  <span className="text-[10px] text-muted-foreground">Cycles &amp; papers</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-3.5 px-3.5 flex flex-col items-start gap-1.5 text-left border-border/80 bg-surface-subtle/50 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all group"
                asChild
              >
                <Link href="/school/timetable">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Timetable</span>
                  <span className="text-[10px] text-muted-foreground">Weekly slots</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Audit Trail / Security Logs */}
        <div className="lg:col-span-6 rounded-xl border border-border/80 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Security &amp; Audit Trail
                </h2>
                <p className="text-[11px] text-muted-foreground">Real-time system event logs</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
              Verified Events
            </span>
          </div>

          <div className="pt-4 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <p>No recent security audit logs recorded for this institution.</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-border/70 bg-surface-subtle/50 p-3 transition-colors hover:border-primary/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {activity.event}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {activity.details}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
