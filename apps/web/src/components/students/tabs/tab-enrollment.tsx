'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { StatusBadge } from '@/components/ui/status-badge';
import { School, History, CheckCircle2 } from 'lucide-react';

export function TabEnrollment({
  student,
  houseName,
}: {
  student: StudentDetail;
  houseName?: string;
}) {
  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* Current Active Enrollment */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 text-primary" />
            Current Academic Allocation
          </h4>
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Active Term
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Academic Session</span>
            <p className="font-semibold text-foreground">{student.academicSession}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Class & Division</span>
            <p className="font-semibold text-foreground">
              {student.className} - {student.section}
            </p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Roll Number</span>
            <p className="font-mono font-bold text-primary">#{student.rollNumber}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">House Allocation</span>
            <p className="font-semibold text-foreground">
              {houseName || 'Not assigned'}
            </p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Admission Date</span>
            <p className="font-medium text-foreground">{student.enrollmentDate}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Class Mentor</span>
            <p className="font-medium text-foreground">{student.currentTeacher}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Current Status</span>
            <div className="pt-0.5">
              <StatusBadge status={student.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment History Table */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-primary" />
          Enrollment History & Progression
        </h4>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Class & Section</th>
                <th className="py-2.5 px-3">Roll</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {student.enrollmentHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/30">
                  <td className="py-2 px-3 font-semibold text-foreground">{rec.session}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {rec.className} - {rec.section}
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-foreground">#{rec.rollNumber}</td>
                  <td className="py-2 px-3">
                    <StatusBadge
                      status={rec.status === 'CURRENT' ? student.status : 'COMPLETED'}
                      customLabel={rec.status}
                    />
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-[11px]">
                    {rec.startDate} {rec.endDate ? `to ${rec.endDate}` : '(Ongoing)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
