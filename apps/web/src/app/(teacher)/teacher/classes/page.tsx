'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TeacherClassesPage() {
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/teacher/dashboard');
        if (res.ok) {
          const json = await res.json();
          setAssignments(json.assignments || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="h-6 w-6 text-emerald-700" />
          My Assigned Classes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Classes, sections, and subjects assigned to you for the active academic session.
        </p>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Teaching Roster</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Click Take Attendance to manage daily roll calls for any assigned section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading your classes...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-slate-50">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">No classes assigned yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border bg-card p-4 space-y-3 hover:border-emerald-500/50 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {a.className} - {a.sectionName}
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        {a.subjectName}
                      </p>
                    </div>
                    {a.isClassTeacher && (
                      <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                        Class Teacher
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Session: {a.sessionName}</span>
                    <Link
                      href={`/teacher/attendance?classId=${a.classId}&sectionId=${a.sectionId}`}
                      className="font-medium text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      Take Attendance <ArrowRight className="h-3 w-3" />
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
