import * as React from 'react';
import {
  Award,
  Bell,
  CalendarCheck,
  FileText,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { ActivityItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const categoryConfig = {
  STUDENT: {
    icon: GraduationCap,
    bgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  HOMEWORK: {
    icon: FileText,
    bgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  ATTENDANCE: {
    icon: CalendarCheck,
    bgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  RESULT: {
    icon: Award,
    bgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  NOTICE: {
    icon: Bell,
    bgColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  },
};

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent School Activity</CardTitle>
        <CardDescription className="text-xs">
          Operational log of academic updates and staff actions
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
          {activities.map((item) => {
            const config = categoryConfig[item.category] || categoryConfig.STUDENT;
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative flex items-start gap-3 text-sm">
                <div
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${config.bgColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 space-y-0.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {item.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
