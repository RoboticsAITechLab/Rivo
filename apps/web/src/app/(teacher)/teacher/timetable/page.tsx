'use client';

import * as React from 'react';
import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimetableSlotItem {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
}

export default function TeacherTimetablePage() {
  const [slots, setSlots] = React.useState<TimetableSlotItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState('MONDAY');

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const fetchTimetable = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/timetable/school');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Error fetching teacher timetable:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const filteredSlots = slots.filter((s) => s.dayOfWeek.toUpperCase() === selectedDay);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-700" />
            Weekly Teaching Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your verified schedule synced directly from the institution&apos;s master timetable.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTimetable}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDay === day
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day.charAt(0) + day.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-700" />
            {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()} Routine
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Assigned classroom slots for {selectedDay.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading schedule...</div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700">No scheduled periods for {selectedDay.toLowerCase()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Contact the timetable administrator to assign periods.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSlots.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[11px] text-emerald-800 bg-emerald-50/80 border-emerald-200">
                      Period {p.periodNumber}
                    </Badge>
                    <span className="font-mono text-slate-600 font-semibold">
                      {p.startTime} - {p.endTime}
                    </span>
                  </div>

                  <div className="flex-1 font-bold text-slate-900 sm:px-4">
                    {p.className} - {p.sectionName} • <span className="text-emerald-700">{p.subjectName}</span>
                  </div>

                  <div className="text-slate-500 font-medium text-right font-mono text-[11px]">
                    {p.roomNumber}
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

