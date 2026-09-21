'use client';

import * as React from 'react';
import { GraduationCap, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherStudentsPage() {
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [selectedKey, setSelectedKey] = React.useState('');
  const [students, setStudents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await fetch('/api/teacher/dashboard');
        if (res.ok) {
          const json = await res.json();
          const list = json.assignments || [];
          setAssignments(list);
          if (list.length > 0) {
            setSelectedKey(`${list[0].classId}:${list[0].sectionId}`);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadAssignments();
  }, []);

  React.useEffect(() => {
    if (!selectedKey) return;
    const [classId, sectionId] = selectedKey.split(':');
    async function loadStudents() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/teacher/attendance?classId=${classId}&sectionId=${sectionId}`);
        if (res.ok) {
          const json = await res.json();
          setStudents(json.students || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, [selectedKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-700" />
          Enrolled Students
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Students currently enrolled in your assigned classes and sections. Read-only view.
        </p>
      </div>

      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Class Roster</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Select a class to view enrolled students.
              </CardDescription>
            </div>

            {assignments.length > 0 && (
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={`${a.classId}:${a.sectionId}`}>
                    {a.className} - {a.sectionName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading student roster...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="p-3 w-16 text-center">Roll</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-center font-semibold text-slate-700">{s.rollNumber}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{s.admissionNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{s.name}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
