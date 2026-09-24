'use client';

import * as React from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Search,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType: string;
  publishedAt: string;
  isRead: boolean;
}

export default function ParentNoticesPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [selectedNotice, setSelectedNotice] = React.useState<NoticeItem | null>(null);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'UNREAD'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNotices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/notices', window.location.origin);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleOpenNotice = async (notice: NoticeItem) => {
    setSelectedNotice(notice);
    if (!notice.isRead) {
      try {
        await fetch(`/api/notices/${notice.id}/read`, { method: 'POST' });
        setNotices((prev) =>
          prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark notice read:', err);
      }
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent Alert</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">High</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Notice</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-foreground">Official School Circulars</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Announcements, holiday circulars, and cohort notices relevant to your ward.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant={activeTab === 'ALL' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveTab('ALL')}
          >
            All
          </Button>
          <Button
            variant={activeTab === 'UNREAD' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveTab('UNREAD')}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Notices List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={activeTab === 'UNREAD' ? 'No unread circulars' : 'No notices published'}
          description="You are caught up with all institutional communications."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotices.map((notice) => (
            <Card
              key={notice.id}
              className={`p-3.5 cursor-pointer transition-colors hover:border-primary/50 ${
                !notice.isRead ? 'bg-primary/5 border-primary/25' : ''
              }`}
              onClick={() => handleOpenNotice(notice)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!notice.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    {getPriorityBadge(notice.priority)}
                    <h2 className="text-xs font-bold text-foreground truncate">
                      {notice.title}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notice.body}
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 pt-0.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(notice.publishedAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notice Detail Dialog */}
      {selectedNotice && (
        <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {getPriorityBadge(selectedNotice.priority)}
                <span className="text-[11px] text-muted-foreground">
                  {new Date(selectedNotice.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <DialogTitle className="text-sm font-bold">
                {selectedNotice.title}
              </DialogTitle>
            </DialogHeader>

            <div className="p-3 bg-muted/20 rounded-md text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {selectedNotice.body}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedNotice(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
