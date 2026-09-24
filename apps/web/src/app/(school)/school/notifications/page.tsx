'use client';

import * as React from 'react';
import {
  Award,
  CalendarCheck,
  CheckCheck,
  FileText,
  Inbox,
  Settings,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'GENERAL' | 'NOTICE' | 'RESULT' | 'ATTENDANCE' | 'EXAM';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (selectedCategory !== 'ALL' && selectedCategory !== 'UNREAD') {
        url.searchParams.set('category', selectedCategory);
      }
      if (selectedCategory === 'UNREAD') {
        url.searchParams.set('unreadOnly', 'true');
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <CalendarCheck className="h-4 w-4 text-blue-500" />;
      case 'NOTICE':
        return <Bell className="h-4 w-4 text-indigo-500" />;
      case 'EXAM':
        return <Award className="h-4 w-4 text-purple-500" />;
      case 'RESULT':
        return <Award className="h-4 w-4 text-emerald-500" />;
      default:
        return <Settings className="h-4 w-4 text-primary" />;
    }
  };

  const categories = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: `Unread (${unreadCount})` },
    { key: 'NOTICE', label: 'Notices' },
    { key: 'RESULT', label: 'Results' },
    { key: 'ATTENDANCE', label: 'Attendance' },
    { key: 'EXAM', label: 'Exams' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Institutional Notification Hub"
        description="Review system dispatches, circular alerts, exam results publications, and operational updates."
        icon={Inbox}
        badge="Activity Center"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={fetchNotifications}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b">
        {categories.map((cat) => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications to display"
          description="You are completely up to date. Broadcasts and system activity will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'transition-colors cursor-pointer hover:border-primary/50',
                !n.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
              )}
              onClick={() => {
                if (!n.isRead) markSingleRead(n.id);
                if (n.linkUrl) window.location.href = n.linkUrl;
              }}
            >
              <CardContent className="p-3.5 flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-md bg-muted/60 shrink-0">
                  {getCategoryIcon(n.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
