'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Users,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StudentItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  rollNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';
  reason?: string;
}

interface TeacherAssignment {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectName: string;
}

export default function TeacherAttendancePage() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSectionId = searchParams.get('sectionId') || '';

  const [assignments, setAssignments] = React.useState<TeacherAssignment[]>([]);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = React.useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoadingAssignments, setIsLoadingAssignments] = React.useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; isError: boolean } | null>(null);

  // 1. Load teacher assignments
  React.useEffect(() => {
    async function loadAssignments() {
      try {
        setIsLoadingAssignments(true);
        const res = await fetch('/api/teacher/dashboard');
        if (!res.ok) throw new Error('Failed to load assignments');
        const json = await res.json();
        const list: TeacherAssignment[] = json.assignments || [];
        setAssignments(list);

        if (list.length > 0) {
          // Check if URL params match an assignment
          const matched = list.find(
            (a) => a.classId === initialClassId && a.sectionId === initialSectionId
          );
          const active = matched || list[0];
          setSelectedAssignmentKey(`${active.classId}:${active.sectionId}`);
        }
      } catch (err: any) {
        setStatusMessage({ text: 'Unable to load your assigned classes.', isError: true });
      } finally {
        setIsLoadingAssignments(false);
      }
    }
    loadAssignments();
  }, [initialClassId, initialSectionId]);

  // 2. Load students roster whenever assignment or date changes
  React.useEffect(() => {
    if (!selectedAssignmentKey) return;
    const [classId, sectionId] = selectedAssignmentKey.split(':');
    if (!classId || !sectionId) return;

    async function loadRoster() {
      try {
        setIsLoadingStudents(true);
        setStatusMessage(null);
        const res = await fetch(
          `/api/teacher/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`
        );
        if (!res.ok) {
          throw new Error('Failed to load student attendance register');
        }
        const json = await res.json();
        setStudents(json.students || []);
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Error loading attendance roster.', isError: true });
      } finally {
        setIsLoadingStudents(false);
      }
    }
    loadRoster();
  }, [selectedAssignmentKey, date]);

  // Update status for single student
  const handleUpdateStatus = (studentId: string, newStatus: StudentItem['status']) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Mark all students
  const handleMarkAll = (status: StudentItem['status']) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  // Save Attendance to real database
  const handleSave = async () => {
    if (!selectedAssignmentKey || students.length === 0) return;
    const [classId, sectionId] = selectedAssignmentKey.split(':');

    try {
      setIsSaving(true);
      setStatusMessage(null);

      const payload = {
        classId,
        sectionId,
        date,
        records: students.map((s) => ({
          studentId: s.id,
          status: s.status,
          reason: s.reason,
        })),
      };

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save attendance');
      }

      setStatusMessage({
        text: `Attendance roll-call saved successfully for ${date}!`,
        isError: false,
      });

      setTimeout(() => {
        setStatusMessage((curr) => (!curr?.isError ? null : curr));
      }, 4000);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'An error occurred while saving attendance.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics calculation
  const total = students.length;
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-emerald-700" />
          Attendance & Roll Call
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Take daily attendance for your authorized classes and divisions. Records are directly persisted to institutional storage.
        </p>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-3 text-xs rounded-lg flex items-center gap-2.5 border shadow-2xs ${
            statusMessage.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Selector & Metric Panel */}
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Class/Section Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Assigned Class & Section
              </label>
              {isLoadingAssignments ? (
                <div className="h-9 flex items-center text-xs text-slate-400">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <p className="text-xs text-amber-700">No classes assigned to you.</p>
              ) : (
                <select
                  value={selectedAssignmentKey}
                  onChange={(e) => setSelectedAssignmentKey(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={`${a.classId}:${a.sectionId}`}>
                      {a.className} - Section {a.sectionName} ({a.subjectName})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Attendance Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Presence Rate
                </span>
                <span className="text-xl font-bold text-emerald-700">{attendanceRate}%</span>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-1" />
              <div className="text-right">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Present / Enrolled
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {presentCount} / {total}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster & Attendance Marking */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Student Roster
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Mark status for each student. Click Save Attendance when finished.
              </CardDescription>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('PRESENT')}
                className="h-8 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                All Present
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingStudents ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading student roster...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">
                No active students found in this class section.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="p-3 w-14 text-center">Roll</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {student.rollNumber}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {student.admissionNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((st) => {
                            const isSelected = student.status === st;
                            const colors = {
                              PRESENT: isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700',
                              ABSENT: isSelected
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700',
                              LATE: isSelected
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700',
                              LEAVE: isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700',
                            };

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStatus(student.id, st)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${colors[st]}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with Save Action */}
          <div className="p-4 border-t bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {students.length} students enrolled • {absentCount} absent
            </span>

            <Button
              disabled={isSaving || students.length === 0}
              onClick={handleSave}
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
