'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Award,
  ChevronRight,
  GraduationCap,
  Calendar,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Child {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  campus?: { id: string; name: string; city: string } | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
}

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  priority: string;
  publishedAt: string;
  isRead: boolean;
}

interface ExamResultItem {
  id: string;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string | null;
  overallStatus: string;
  publishedAt: string;
  examTerm: { name: string };
}

export default function ParentHomePage() {
  const [activeChild, setActiveChild] = React.useState<Child | null>(null);
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [latestResult, setLatestResult] = React.useState<ExamResultItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(async (childId?: string) => {
    setIsLoading(true);
    try {
      // 1. Get Children
      const childRes = await fetch('/api/parent/children');
      if (childRes.ok) {
        const cData = await childRes.json();
        const children = cData.children || [];
        const savedChildId = childId || localStorage.getItem('rivo_parent_selected_child');
        const current = children.find((c: Child) => c.id === savedChildId) || children[0] || null;
        setActiveChild(current);

        // 2. If child exists, fetch results
        if (current) {
          const resRes = await fetch(`/api/results/student/${current.id}`);
          if (resRes.ok) {
            const rData = await resRes.json();
            const results = rData.results || [];
            setLatestResult(results[0] || null);
          } else {
            setLatestResult(null);
          }
        }
      }

      // 3. Fetch Notices for parent
      const noticeRes = await fetch('/api/notices?limit=3');
      if (noticeRes.ok) {
        const nData = await noticeRes.json();
        setNotices(nData.notices || []);
      }
    } catch (err) {
      console.error('Failed to load parent home data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();

    // Listen to child switch from layout
    const handleSwitch = (e: any) => {
      loadData(e.detail?.childId);
    };
    window.addEventListener('parentChildSwitched', handleSwitch);
    return () => window.removeEventListener('parentChildSwitched', handleSwitch);
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No linked student profile found"
        description="Your parent account is not currently linked to any enrolled student in this school. Please contact the school administration."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Student Identity Header */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base shrink-0">
              {activeChild.firstName[0]}
              {activeChild.lastName[0]}
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                {activeChild.firstName} {activeChild.lastName}
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-foreground">
                  {activeChild.class?.name || 'Class'}-{activeChild.section?.name || 'Sec'}
                </span>
                <span>•</span>
                <span className="font-mono">Adm: {activeChild.admissionNumber}</span>
              </div>
              {activeChild.campus && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Building className="h-3 w-3" />
                  <span>{activeChild.campus.name}</span>
                </div>
              )}
            </div>
          </div>

          <Link href="/parent/profile">
            <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted">
              Profile
            </Badge>
          </Link>
        </div>
      </Card>

      {/* 2. Latest Published Academic Result */}
      <div>
        <div className="flex items-center justify-between pb-1.5 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Academic Performance
          </h2>
          <Link href="/parent/results" className="text-xs text-primary font-medium hover:underline">
            View All
          </Link>
        </div>

        {latestResult ? (
          <Card className="p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {latestResult.examTerm.name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Published on {new Date(latestResult.publishedAt).toLocaleDateString()}
                </div>
              </div>
              <Badge
                variant={latestResult.overallStatus === 'PASS' ? 'default' : 'destructive'}
                className="text-[10px]"
              >
                {latestResult.overallStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                <div className="text-sm font-bold font-mono">
                  {latestResult.totalMarks} / {latestResult.maxTotalMarks}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <div className="text-[10px] text-muted-foreground uppercase">Percentage</div>
                <div className="text-sm font-bold font-mono text-primary">
                  {latestResult.percentage}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Grade</div>
                <div className="text-sm font-bold font-mono">
                  {latestResult.grade || '—'}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t flex justify-end">
              <Link href="/parent/results">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                  Full Marksheet <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <Award className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-40" />
            <div className="text-xs font-semibold text-foreground">No Published Results Yet</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Official term marks and evaluation cards will appear here once published by the school.
            </div>
          </Card>
        )}
      </div>

      {/* 3. Recent School Circulars / Notices */}
      <div>
        <div className="flex items-center justify-between pb-1.5 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            School Notices &amp; Circulars
          </h2>
          <Link href="/parent/notices" className="text-xs text-primary font-medium hover:underline">
            View All
          </Link>
        </div>

        {notices.length === 0 ? (
          <Card className="p-4 text-center">
            <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-40" />
            <div className="text-xs font-semibold text-foreground">No Active Circulars</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Important school announcements and circulars will be displayed here.
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {notices.map((notice) => (
              <Link key={notice.id} href="/parent/notices" className="block">
                <Card
                  className={`p-3 transition-colors hover:border-primary/40 ${
                    !notice.isRead ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {!notice.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-foreground truncate">
                          {notice.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {notice.body}
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/parent/notices">
          <Card className="p-3 hover:bg-muted/40 transition-colors flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Circulars</div>
              <div className="text-[10px] text-muted-foreground">School notices</div>
            </div>
          </Card>
        </Link>

        <Link href="/parent/results">
          <Card className="p-3 hover:bg-muted/40 transition-colors flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Results</div>
              <div className="text-[10px] text-muted-foreground">Official marksheets</div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
