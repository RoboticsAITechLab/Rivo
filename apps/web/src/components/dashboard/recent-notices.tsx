import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Users } from 'lucide-react';
import { NoticeItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecentNotices({ notices }: { notices: NoticeItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Notices</CardTitle>
          <CardDescription className="text-xs">
            Official announcements and administrative circulars
          </CardDescription>
        </div>
        <Link
          href="/school/notices"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="rounded-lg border p-3.5 transition-colors hover:bg-muted/40 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-foreground leading-snug">
                {notice.title}
              </h4>
              <Badge
                variant={
                  notice.priority === 'URGENT'
                    ? 'destructive'
                    : notice.priority === 'HIGH'
                    ? 'warning'
                    : 'secondary'
                }
                className="shrink-0"
              >
                {notice.priority}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {notice.summary}
            </p>

            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Users className="h-3.5 w-3.5 text-primary" />
                Audience: {notice.audience}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {notice.date}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
