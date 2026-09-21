'use client';

import * as React from 'react';
import {
  Bell,
  Calendar,
  Paperclip,
  Plus,
  Search,
} from 'lucide-react';
import { mockRecentNotices } from '@/data/mock-data';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { EmptyState } from '@/components/ui/empty-state';

export default function NoticesPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('ALL');
  const [audienceFilter, setAudienceFilter] = React.useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: '',
    priority: 'NORMAL',
    audience: 'ALL',
    message: '',
    publishImmediately: true,
  });

  const filteredNotices = React.useMemo(() => {
    return mockRecentNotices.filter((notice) => {
      const matchesSearch =
        searchQuery === '' ||
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'ALL' || notice.priority === priorityFilter;

      const matchesAudience =
        audienceFilter === 'ALL' || notice.audience === audienceFilter;

      return matchesSearch && matchesPriority && matchesAudience;
    });
  }, [searchQuery, priorityFilter, audienceFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <Badge variant="destructive" className="text-[10px] uppercase">
            🔴 Urgent
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="warning" className="text-[10px] uppercase">
            🟠 High
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase">
            ⚪ Normal
          </Badge>
        );
    }
  };

  const [selectedNotice, setSelectedNotice] = React.useState<(typeof mockRecentNotices)[0] | null>(null);

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Notice Board"
        description="Official institutional circulars, department memos and school-wide broadcasts."
        icon={Bell}
        badge="Active Bulletins"
        actions={
          <Button
            size="sm"
            className="gap-1.5 text-xs shadow-xs"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Notice
          </Button>
        }
      />

      {/* 2. Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars..."
              className="pl-8 h-9 text-xs bg-surface-subtle/50"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by Priority"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="NORMAL">⚪ Normal</option>
          </select>

          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            aria-label="Filter by Audience"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">All Audiences</option>
            <option value="ALL">Whole School</option>
            <option value="TEACHERS">Teachers Only</option>
            <option value="PARENTS">Parents Only</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto font-mono">
          Showing {filteredNotices.length} notices
        </div>
      </div>

      {/* 3. NOTICES LIST CARDS */}
      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notices published"
            description="There are no official institutional notices or circulars matching your filter criteria."
            actionLabel="Draft Notice"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="group rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-primary/50 hover:shadow-xs space-y-3 cursor-pointer select-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {getPriorityBadge(notice.priority)}
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    Audience: {notice.audience}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{notice.date}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                  {notice.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {notice.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">
                  Click to inspect full document &amp; dispatch status
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNotice(notice);
                    }}
                  >
                    <span>View Full Notice</span>
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notice Detail Modal */}
      <Sheet open={Boolean(selectedNotice)} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedNotice && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getPriorityBadge(selectedNotice.priority)}
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Audience: {selectedNotice.audience}
                  </Badge>
                </div>
                <SheetTitle className="text-lg font-bold text-foreground leading-snug">
                  {selectedNotice.title}
                </SheetTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Published on {selectedNotice.date}</span>
                </div>
              </SheetHeader>

              <div className="rounded-lg border border-border/80 bg-surface-subtle/50 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Communication
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.summary}
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span>Dispatch Authority</span>
                  <span className="font-semibold text-foreground">Principal &amp; Administration</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span>Channel</span>
                  <span className="font-semibold text-foreground">In-App Circular, Email &amp; Noticeboard</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span>Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Delivered to Audience</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedNotice(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 4. CREATE NOTICE SHEET */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Draft Official Notice</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Issue a new institutional circular to students, teachers or parents.
              </p>
            </SheetHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCreateOpen(false);
              }}
              className="space-y-4"
            >
              <FormSection
                title="Circular Headline"
                description="Notice title and dispatch priority."
              >
                <div className="space-y-3">
                  <FormField label="Notice Title" required htmlFor="notice-title">
                    <Input
                      id="notice-title"
                      placeholder="e.g. Schedule for Annual Science Exhibition 2026"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Priority" required htmlFor="notice-priority">
                      <select
                        id="notice-priority"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </FormField>

                    <FormField label="Target Audience" required htmlFor="notice-audience">
                      <select
                        id="notice-audience"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        value={formData.audience}
                        onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      >
                        <option value="ALL">All School</option>
                        <option value="TEACHERS">Teachers Only</option>
                        <option value="PARENTS">Parents Only</option>
                        <option value="STUDENTS">Students Only</option>
                      </select>
                    </FormField>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Circular Message"
                description="Detailed official message copy."
              >
                <FormField label="Message Body" required htmlFor="notice-body">
                  <textarea
                    id="notice-body"
                    rows={4}
                    placeholder="Enter official circular message..."
                    className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </FormField>
              </FormSection>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach PDF
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Publish Circular
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
