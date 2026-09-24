'use client';

import * as React from 'react';
import {
  Bell,
  Calendar,
  Plus,
  Search,
  Send,
  Archive,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
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
  SheetDescription,
} from '@/components/ui/sheet';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { EmptyState } from '@/components/ui/empty-state';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType: 'ALL_SCHOOL' | 'CLASS' | 'SECTION' | 'TEACHERS' | 'PARENTS' | 'STUDENTS';
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
  publishedAt?: string | null;
  createdAt: string;
  isRead: boolean;
}

interface SchoolClass {
  id: string;
  name: string;
  sections?: Array<{ id: string; name: string }>;
}

export default function NoticesPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: '',
    body: '',
    priority: 'NORMAL',
    targetType: 'ALL_SCHOOL',
    classId: '',
    sectionId: '',
    publishImmediately: true,
  });

  // Fetch notices
  const fetchNotices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/notices', window.location.origin);
      if (priorityFilter !== 'ALL') url.searchParams.set('priority', priorityFilter);
      if (targetTypeFilter !== 'ALL') url.searchParams.set('targetType', targetTypeFilter);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter, targetTypeFilter, statusFilter, searchQuery]);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Fetch classes for audience dropdown
  React.useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    }
    loadClasses();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          priority: formData.priority,
          targetType: formData.targetType,
          classId: formData.targetType === 'CLASS' || formData.targetType === 'SECTION' ? formData.classId : undefined,
          sectionId: formData.targetType === 'SECTION' ? formData.sectionId : undefined,
          publishImmediately: formData.publishImmediately,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setFormData({
          title: '',
          body: '',
          priority: 'NORMAL',
          targetType: 'ALL_SCHOOL',
          classId: '',
          sectionId: '',
          publishImmediately: true,
        });
        fetchNotices();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create notice');
      }
    } catch {
      alert('Network error creating notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishNotice = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}/publish`, { method: 'POST' });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {
      console.error('Failed to publish notice:', err);
    }
  };

  const handleArchiveNotice = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}/archive`, { method: 'POST' });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {
      console.error('Failed to archive notice:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">High</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const selectedClass = classes.find((c) => c.id === formData.classId);
  const sections = selectedClass?.sections || [];

  return (
    <PageContainer>
      <PageHeader
        title="Notice Board &amp; Institutional Circulars"
        description="Broadcast school-wide announcements, cohort directives, or target specific classes and faculty."
        icon={Bell}
        badge="Official Announcements"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Notice
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search circulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="ALL">All Audiences</option>
              <option value="ALL_SCHOOL">Entire School</option>
              <option value="PARENTS">All Parents</option>
              <option value="TEACHERS">All Teachers</option>
              <option value="CLASS">Class-Specific</option>
              <option value="SECTION">Section-Specific</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={fetchNotices}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Notices List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No circular notices published"
          description="There are currently no active announcements matching your query. Create a notice to communicate with students, parents, or staff."
          actionLabel="Create First Notice"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-3.5">
          {notices.map((notice) => (
            <Card key={notice.id} className="p-4 hover:border-primary/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(notice.priority)}
                  <h3 className="font-semibold text-sm text-foreground">{notice.title}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {notice.targetType.replace('_', ' ')}
                    {notice.class ? ` (${notice.class.name}${notice.section ? `-${notice.section.name}` : ''})` : ''}
                  </Badge>
                  <Badge
                    variant={
                      notice.status === 'PUBLISHED'
                        ? 'default'
                        : notice.status === 'DRAFT'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {notice.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {notice.publishedAt
                    ? new Date(notice.publishedAt).toLocaleDateString()
                    : new Date(notice.createdAt).toLocaleDateString()}
                </div>
              </div>

              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mb-4">
                {notice.body}
              </p>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>Target: {notice.targetType.toLowerCase().replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {notice.status === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300"
                      onClick={() => handlePublishNotice(notice.id)}
                    >
                      <Send className="h-3 w-3" /> Publish
                    </Button>
                  )}
                  {notice.status !== 'ARCHIVED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                      onClick={() => handleArchiveNotice(notice.id)}
                    >
                      <Archive className="h-3 w-3" /> Archive
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Notice Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Institutional Notice</SheetTitle>
            <SheetDescription>
              Draft and publish circular announcements to targeted school audiences.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateNotice} className="space-y-4 pt-4">
            <FormField label="Notice Title" required>
              <Input
                placeholder="e.g. Annual Sports Meet 2026 Schedule"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Priority" required>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Alert</option>
                  <option value="LOW">Low</option>
                </select>
              </FormField>

              <FormField label="Target Audience" required>
                <select
                  value={formData.targetType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetType: e.target.value,
                      classId: '',
                      sectionId: '',
                    })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="ALL_SCHOOL">Entire School</option>
                  <option value="PARENTS">All Parents</option>
                  <option value="TEACHERS">All Teachers</option>
                  <option value="CLASS">Class-Specific</option>
                  <option value="SECTION">Section-Specific</option>
                </select>
              </FormField>
            </div>

            {(formData.targetType === 'CLASS' || formData.targetType === 'SECTION') && (
              <FormField label="Target Class" required>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {formData.targetType === 'SECTION' && formData.classId && (
              <FormField label="Target Section" required>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Notice Message" required>
              <textarea
                placeholder="Enter detailed message body..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={5}
                className="w-full rounded-md border border-input bg-background p-3 text-xs resize-none"
                required
              />
            </FormField>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="publishImmediately"
                checked={formData.publishImmediately}
                onChange={(e) =>
                  setFormData({ ...formData, publishImmediately: e.target.checked })
                }
                className="rounded border-input h-4 w-4"
              />
              <label htmlFor="publishImmediately" className="text-xs font-medium cursor-pointer">
                Publish immediately &amp; dispatch notifications
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : formData.publishImmediately ? 'Publish Notice' : 'Save as Draft'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
