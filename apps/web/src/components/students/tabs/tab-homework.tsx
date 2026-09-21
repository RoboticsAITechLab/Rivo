'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { StatusBadge } from '@/components/ui/status-badge';
import { BookMarked, FileText } from 'lucide-react';

export function TabHomework({ student }: { student: StudentDetail }) {
  const completionPercentage = Math.round(
    (student.homeworkCompleted / student.homeworkTotal) * 100,
  );

  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* Completion Header Banner */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-foreground">Homework Completion</h4>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {student.homeworkCompleted} of {student.homeworkTotal} mandatory assignments submitted
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-bold text-base text-foreground">{completionPercentage}%</span>
            <p className="text-[10px] text-muted-foreground">Completion Rate</p>
          </div>
          <div className="h-2.5 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          Assigned Tasks & Problem Sets
        </h4>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                <th className="py-2.5 px-3">Assignment</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Score / Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {student.homeworkList.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    <p className="line-clamp-1">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Faculty: {item.teacherName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground font-medium">{item.subject}</td>
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                    {item.dueDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      status={item.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'}
                      customLabel={item.status}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                    {item.score || '—'}
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
