'use client';

import * as React from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { StudentDetail } from '@/types/student';

interface StudentMetricsProps {
  students: StudentDetail[];
}

export function StudentMetrics({ students }: StudentMetricsProps) {
  // Dynamically compute KPIs from the active student list
  const total = students.length;
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const newThisYear = students.filter((s) => s.enrollmentDate?.startsWith(new Date().getFullYear().toString())).length;

  const avgAttendance =
    total > 0
      ? (
          students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / total
        ).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        title="Total Students"
        value={total.toLocaleString()}
        change={total > 0 ? `${activeCount} active` : '—'}
        isPositive={total > 0}
      />
      <StatCard
        title="Active"
        value={activeCount.toLocaleString()}
        change={total > 0 ? `${Math.round((activeCount / total) * 100)}% active rate` : '—'}
        isPositive={total > 0}
      />
      <StatCard
        title="New This Year"
        value={newThisYear.toLocaleString()}
        change={total > 0 ? `${newThisYear} enrolled` : '—'}
        isPositive={total > 0}
      />
      <StatCard
        title="Avg Attendance"
        value={avgAttendance !== null ? `${avgAttendance}%` : '—'}
        change={avgAttendance !== null ? 'Calculated' : 'Awaiting records'}
        isPositive={avgAttendance !== null && Number(avgAttendance) >= 90}
      />
    </div>
  );
}
