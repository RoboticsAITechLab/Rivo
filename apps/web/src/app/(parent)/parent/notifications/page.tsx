'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  Award,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function ParentNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedFilter, setSelectedFilter] = React.useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (selectedFilter === 'UNREAD') {
        url.searchParams.set('unreadOnly', 'true');
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

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
      console.error('Failed to mark all read:', err);
    }
  };

  const markSingleRead = async (id: string, linkUrl?: string | null) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <CalendarCheck className="h-4 w-4 text-blue-500" />;
      case 'NOTICE':
        return <Bell className="h-4 w-4 text-indigo-500" />;
      case 'RESULT':
        return <Award className="h-4 w-4 text-emerald-500" />;
      default:
        return <Settings className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Alerts &amp; Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct communications, circular broadcasts, and evaluation updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-1 border-b">
        <Button
          variant={selectedFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedFilter('ALL')}
        >
          All
        </Button>
        <Button
          variant={selectedFilter === 'UNREAD' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedFilter('UNREAD')}
        >
          Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={selectedFilter === 'UNREAD' ? 'No unread alerts' : 'No notifications'}
          description="You are caught up. Future announcements and result broadcasts will appear here."
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
              onClick={() => markSingleRead(n.id, n.linkUrl)}
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
    </div>
  );
}
