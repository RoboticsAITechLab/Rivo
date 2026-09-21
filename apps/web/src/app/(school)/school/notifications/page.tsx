'use client';

import * as React from 'react';
import {
  Award,
  CalendarCheck,
  CheckCheck,
  FileText,
  Inbox,
  Settings,
} from 'lucide-react';
import { mockNotificationsList } from '@/data/mock-data';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState(mockNotificationsList);
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)),
    );
  };

  const filteredNotifications = React.useMemo(() => {
    if (selectedCategory === 'ALL') return notifications;
    if (selectedCategory === 'UNREAD') return notifications.filter((n) => n.unread);
    return notifications.filter((n) => n.category === selectedCategory);
  }, [notifications, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <CalendarCheck className="h-4 w-4 text-blue-500" />;
      case 'HOMEWORK':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'EXAMS':
        return <Award className="h-4 w-4 text-purple-500" />;
      case 'RESULTS':
        return <Award className="h-4 w-4 text-emerald-500" />;
      default:
        return <Settings className="h-4 w-4 text-primary" />;
    }
  };

  const categories = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: 'Unread' },
    { key: 'ATTENDANCE', label: 'Attendance' },
    { key: 'HOMEWORK', label: 'Homework' },
    { key: 'EXAMS', label: 'Exams' },
    { key: 'RESULTS', label: 'Results' },
    { key: 'SYSTEM', label: 'System' },
  ];

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Notifications"
        description="System activity alerts, operational workflow updates and administrative notifications."
        icon={Inbox}
        badge={`${notifications.filter((n) => n.unread).length} Unread`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      {/* 2. Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer',
              selectedCategory === cat.key
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Notification List Items */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-xs text-muted-foreground">
              You&apos;re all caught up! No notifications in this category.
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-colors cursor-pointer',
                notif.unread
                  ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                  : 'hover:border-border/80',
              )}
              onClick={() => toggleRead(notif.id)}
            >
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {notif.unread ? (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                      )}
                      <span className="font-semibold text-xs text-foreground truncate">
                        {notif.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {notif.timestamp}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(notif.id);
                    }}
                  >
                    {notif.unread ? 'Mark read' : 'Mark unread'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}
