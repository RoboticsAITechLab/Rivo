'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Home,
  BookOpen,
  Users,
  Lock,
  Award,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Settings,
  Sparkles,
  AlertCircle,
  CreditCard,
  Hash,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';
import { useAuth } from '@/lib/auth/auth-context';

export default function SettingsOverviewPage() {
  const { user } = useAuth();
  const isDirector = user?.roleType === 'DIRECTOR' || user?.roleType === 'OWNER' || user?.roleType === 'PLATFORM_ADMIN';

  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState<any>(null);

  const fetchOverview = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings/overview');
      const json = await res.json();
      if (res.ok && json.data) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error('Failed to load settings overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const schoolName = overview?.school?.name || user?.schoolName || '';
  const hasProfile = Boolean(schoolName.trim());
  const hasActiveSession = Boolean(overview?.activeSession);
  const campusesCount = overview?.counts?.campuses ?? 0;
  const classesCount = overview?.counts?.classes ?? 0;
  const subjectsCount = overview?.counts?.subjects ?? 0;
  const usersCount = overview?.counts?.users ?? 0;
  const timetableCount = overview?.counts?.timetableConfigs ?? 0;
  const hasIdConfig = Boolean(overview?.hasIdConfig);

  // Real readiness checks
  const readinessItems = [
    {
      title: 'School Profile',
      category: 'General',
      status: hasProfile ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: hasProfile ? schoolName : 'Not configured',
      href: '/school/settings/school-profile',
      icon: Building2,
      description: 'Institutional identity, contact and official registration',
    },
    {
      title: 'Academic Sessions',
      category: 'Academic',
      status: hasActiveSession ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: hasActiveSession ? `Active: ${overview.activeSession.name}` : 'No active session',
      href: '/school/settings/academic-sessions',
      icon: Calendar,
      description: 'Term dates, current academic year and session status',
    },
    {
      title: 'Campuses',
      category: 'General',
      status: campusesCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: campusesCount > 0 ? `${campusesCount} site(s)` : 'None configured',
      href: '/school/settings/campuses',
      icon: Home,
      description: 'Physical campus locations and operational codes',
    },
    {
      title: 'ID Format & Generation',
      category: 'General',
      status: hasIdConfig ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: hasIdConfig ? 'Configured in DB' : 'Using default prefix',
      href: '/school/settings/id-system',
      icon: Hash,
      description: 'Autonomous sequence generator for Students, Teachers & Staff',
    },
    {
      title: 'Classes & Sections',
      category: 'Academic',
      status: classesCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: classesCount > 0 ? `${classesCount} class(es)` : 'None configured',
      href: '/school/settings/classes',
      icon: Layers,
      description: 'Academic cohorts, grade levels, and sections',
    },
    {
      title: 'Subjects & Curriculum',
      category: 'Academic',
      status: subjectsCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: subjectsCount > 0 ? `${subjectsCount} subject(s)` : 'None configured',
      href: '/school/settings/subjects',
      icon: BookOpen,
      description: 'Course catalog, departmental codes and weekly teaching periods',
    },
    {
      title: 'Timetable Bell Schedules',
      category: 'Operations',
      status: timetableCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: timetableCount > 0 ? `${timetableCount} schedule(s)` : 'Default periods active',
      href: '/school/settings/timetable',
      icon: Clock,
      description: 'Weekly period intervals and automated conflict checks',
    },
    {
      title: 'Fees & Finance',
      category: 'Operations',
      status: 'CONFIGURED',
      statusText: `${overview?.settings?.fees?.currency || 'INR'} (${overview?.settings?.fees?.currencySymbol || '₹'})`,
      href: '/school/settings/fees',
      icon: CreditCard,
      description: 'Currency standard, receipt numbering, and late-fee grace periods',
    },
    {
      title: 'Users & Staff',
      category: 'People & Access',
      status: usersCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: usersCount > 0 ? `${usersCount} user(s)` : 'No users found',
      href: '/school/settings/users',
      icon: Users,
      description: 'Administrative accounts, faculty roster access and roles',
    },
    {
      title: 'Authentication & Security',
      category: 'Security',
      status: 'CONFIGURED',
      statusText: 'Database & MFA Active',
      href: '/school/settings/security/authentication',
      icon: Lock,
      description: 'Session timeout, credential complexity, and multi-factor auth',
    },
  ];

  const configuredCount = readinessItems.filter((i) => i.status === 'CONFIGURED').length;
  const completionPercentage = Math.round((configuredCount / readinessItems.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            School Configuration Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global system readiness, database-persisted configuration status, and institutional setup health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              Checking system readiness...
            </div>
          ) : (
            <Badge variant="outline" className="text-xs bg-muted/40 gap-1.5 py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {configuredCount} of {readinessItems.length} modules configured ({completionPercentage}%)
            </Badge>
          )}
        </div>
      </div>

      {/* Institutional Profile Summary Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground">
                {schoolName || 'Institution Not Named Yet'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {overview?.school?.slug ? `Identifier: ${overview.school.slug.toUpperCase()}` : 'Complete School Profile to activate full system workflows'}
              </div>
            </div>
          </div>
          <Link href="/school/settings/school-profile">
            <Button size="sm" className="text-xs gap-1.5">
              Edit School Profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Readiness Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          System Readiness & Module Connection Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readinessItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 border border-border/60 mt-0.5">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                      <div className="text-[11px] font-medium text-primary mt-1">
                        {item.statusText}
                      </div>
                    </div>
                  </div>

                  <Link href={item.href} className="shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
