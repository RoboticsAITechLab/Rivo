import * as React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { UpcomingExamItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function UpcomingExams({ exams }: { exams: UpcomingExamItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming Exams</CardTitle>
          <CardDescription className="text-xs">
            Assessments scheduled for next 14 days
          </CardDescription>
        </div>
        <Link
          href="/school/exams"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/40 gap-2"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {exam.name}
                </span>
                <Badge variant={exam.status === 'SCHEDULED' ? 'info' : 'warning'}>
                  {exam.status}
                </Badge>
              </div>
              <div className="text-xs font-medium text-primary">
                {exam.subject} • <span className="text-muted-foreground">{exam.className}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {exam.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {exam.room}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
