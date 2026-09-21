'use client';

import * as React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { time: '08:00 - 08:50', name: '1st Period', class: 'Class 10 - A', subject: 'Mathematics', room: 'Room 201' },
    { time: '09:00 - 09:50', name: '2nd Period', class: 'Class 10 - B', subject: 'Mathematics', room: 'Room 202' },
    { time: '10:00 - 10:30', name: 'Recess', class: '', subject: 'Break', room: '' },
    { time: '10:30 - 11:20', name: '3rd Period', class: 'Class 10 - A', subject: 'Math Lab', room: 'Computer Lab 1' },
    { time: '11:30 - 12:20', name: '4th Period', class: '', subject: 'Planning / Free', room: 'Staff Room' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-emerald-700" />
          Weekly Teaching Timetable
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your regular weekly schedule across all assigned academic divisions.
        </p>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-700" />
            Active Schedule
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Current teaching routine for Academic Session 2026-27.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-3 min-w-[500px]">
              {periods.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    p.class ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200/60'
                  }`}
                >
                  <div className="w-32 font-mono text-[11px] font-semibold text-slate-600">
                    {p.time}
                  </div>
                  <div className="w-28 font-medium text-slate-800">{p.name}</div>
                  <div className="flex-1 font-bold text-slate-900">
                    {p.class ? `${p.class} • ${p.subject}` : p.subject}
                  </div>
                  <div className="w-32 text-right text-slate-500 font-medium">{p.room}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
