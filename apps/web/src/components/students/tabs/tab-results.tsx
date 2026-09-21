'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TabResults({ student }: { student: StudentDetail }) {
  return (
    <div className="space-y-4 pt-1 text-xs">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-primary" />
            Official Published Assessment Roster
          </h4>
          <span className="text-[11px] text-muted-foreground">
            Academic Session {student.academicSession}
          </span>
        </div>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                <th className="py-2.5 px-3">Examination Name</th>
                <th className="py-2.5 px-3">Term</th>
                <th className="py-2.5 px-3 text-center">Max Marks</th>
                <th className="py-2.5 px-3 text-center">Obtained</th>
                <th className="py-2.5 px-3 text-center">Percentage</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-right">Published Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {student.resultsHistory.map((res) => (
                <tr key={res.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    <p className="line-clamp-1">{res.examName}</p>
                    {res.rank && (
                      <span className="text-[10px] text-primary font-normal">
                        Class Rank: #{res.rank}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{res.term}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {res.totalMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                    {res.obtainedMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-foreground">
                    {res.percentage}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-0.5 text-[10px] font-bold',
                        res.grade.startsWith('A')
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      {res.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground text-[11px] font-mono">
                    {res.publishedDate}
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
