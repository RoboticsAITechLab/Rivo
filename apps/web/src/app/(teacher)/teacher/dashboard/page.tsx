'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  GraduationCap,
  Layers,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';

interface DashboardData {
  teacher: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    schoolName: string;
  };
  assignments: Array<{
    id: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    subjectId: string;
    subjectName: string;
    isClassTeacher: boolean;
    sessionName: string;
  }>;
  stats: {
    assignedClassesCount: number;
    totalStudentsCount: number;
    attendanceDoneToday: number;
  };
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/teacher/dashboard');
        if (!res.ok) {
          throw new Error('Failed to load teacher dashboard data');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading dashboard.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-xs text-muted-foreground">Loading teacher dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-semibold text-red-900">Dashboard Unavailable</h3>
        <p className="text-xs text-red-700">{error || 'Could not load your teacher details.'}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white p-6 border shadow-xs">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Faculty Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Welcome back, {data.teacher.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {data.teacher.schoolName} • Employee ID: {data.teacher.employeeId || 'N/A'}
          </p>
        </div>

        <Link href="/teacher/attendance">
          <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
            <CalendarCheck className="h-4 w-4" />
            Take Attendance
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Assigned Classes</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {data.stats.assignedClassesCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3 text-emerald-600" />
              Active divisions under your schedule
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Enrolled Students</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {data.stats.totalStudentsCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-blue-600" />
              Students in your assigned sections
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Attendance Submitted Today</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {data.stats.attendanceDoneToday} / {data.stats.assignedClassesCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              Daily registers completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Classes Roster */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                My Assigned Classes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authorized classes, sections, and subjects for the current academic session
              </CardDescription>
            </div>
            <Link href="/teacher/attendance">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-700 gap-1">
                Mark Attendance <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.assignments.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-slate-50">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                No classes have been assigned to you for the current academic session.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Please contact your school administrator to allocate your teaching timetable.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl border bg-card p-4 space-y-3 hover:border-emerald-500/50 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {assignment.className} - {assignment.sectionName}
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        {assignment.subjectName}
                      </p>
                    </div>
                    {assignment.isClassTeacher && (
                      <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                        Class Teacher
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Session: {assignment.sessionName}</span>
                    <Link
                      href={`/teacher/attendance?classId=${assignment.classId}&sectionId=${assignment.sectionId}`}
                      className="font-medium text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      Roll Call <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
