'use client';

import * as React from 'react';
import { AttendanceAttentionItem } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

interface AttendanceAlertsCardProps {
  alerts: AttendanceAttentionItem[];
  onSelectStudent: (studentId: string, studentName: string, admissionNumber: string) => void;
}

export function AttendanceAlertsCard({ alerts, onSelectStudent }: AttendanceAlertsCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Low Attendance & Chronic Absence Card */}
      <Card className="border-amber-500/30 bg-amber-500/5 shadow-2xs">
        <CardHeader className="pb-3 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Students Requiring Attendance Intervention ({alerts.length})
              </CardTitle>
            </div>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              Threshold &lt; 75%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2.5">
          {alerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No students currently flagged below the minimum attendance threshold.
            </div>
          ) : (
            alerts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-2xs gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate">{item.studentName}</span>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">{item.admissionNumber}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{item.className}-{item.section}</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm text-destructive">{item.rate}%</div>
                    <div className="text-[10px] text-muted-foreground">Session Rate</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectStudent(item.studentId, item.studentName, item.admissionNumber)}
                    className="h-8 text-xs gap-1"
                  >
                    <span>Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 2. Roll Call Submission Compliance Card */}
      <Card className="border-blue-500/30 bg-blue-500/5 shadow-2xs">
        <CardHeader className="pb-3 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <UserCheck className="h-4 w-4 shrink-0" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Daily Faculty Roll-Call Compliance
              </CardTitle>
            </div>
            <Badge variant="info" className="text-[10px] px-1.5 py-0">
              Session Today
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="py-6 text-center text-xs text-muted-foreground">
            No pending faculty roll-call exceptions recorded for today.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
