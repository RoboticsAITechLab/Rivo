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
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function SettingsOverviewPage() {
  const store = useSchoolStore();

  const hasProfile = Boolean(store.schoolProfile?.schoolName?.trim());
  const hasActiveSession = Boolean(store.academicSessions?.some((s) => s.status === 'ACTIVE'));
  const campusesCount = store.campuses?.length ?? 0;
  const classesCount = store.classes?.length ?? 0;
  const subjectsCount = store.subjects?.length ?? 0;
  const usersCount = store.users?.length ?? 0;
  const gradingCount = store.gradingSchemes?.length ?? 0;

  // Real readiness checks
  const readinessItems = [
    {
      title: 'School Profile',
      category: 'General',
      status: hasProfile ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: hasProfile ? store.schoolProfile.schoolName : 'Not configured',
      href: '/school/settings/school-profile',
      icon: Building2,
      description: 'Institutional identity, contact and official registration',
    },
    {
      title: 'Academic Sessions',
      category: 'Academic',
      status: hasActiveSession ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: hasActiveSession ? `${store.academicSessions.length} session(s)` : 'No active session',
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
      title: 'Subjects & Curriculum',
      category: 'Academic',
      status: subjectsCount > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      statusText: subjectsCount > 0 ? `${subjectsCount} subject(s)` : 'None configured',
      href: '/school/settings/subjects',
      icon: BookOpen,
      description: 'Course catalog, departmental codes and weekly teaching periods',
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
      title: 'Authentication',
      category: 'Security',
      status: 'NOT_CONNECTED',
      statusText: 'Service not connected',
      href: '/school/settings/security/authentication',
      icon: Lock,
      description: 'Identity provider boundary, login policies and session control',
    },
    {
      title: 'Examinations',
      category: 'Operations',
      status: hasActiveSession && gradingCount > 0 ? 'CONFIGURED' : 'NEEDS_CONFIGURATION',
      statusText: hasActiveSession && gradingCount > 0 ? 'Ready' : 'Needs configuration',
      href: '/school/settings/examinations',
      icon: Award,
      description: 'Exam types, time slots, grading scale and hall allocations',
    },
    {
      title: 'Results Management',
      category: 'Operations',
      status: gradingCount > 0 ? 'CONFIGURED' : 'NEEDS_CONFIGURATION',
      statusText: gradingCount > 0 ? 'Ready' : 'Needs configuration',
      href: '/school/settings/results',
      icon: CheckCircle2,
      description: 'Marksheet publication rules and student portal access locks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Section Header (Section 14) */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Overview
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          System readiness and operational configuration status across school modules.
        </p>
      </div>

      {/* Real Critical Dependency Warnings */}
      <div className="space-y-3">
        {!hasActiveSession && (
          <DependencyAlert
            title="Academic Sessions: Not Configured"
            description="An active academic session is required to schedule classes, conduct examinations, mark attendance and enroll students."
            configureHref="/school/settings/academic-sessions"
            configureLabel="Configure Sessions →"
            severity="warning"
          />
        )}

        {campusesCount === 0 && (
          <DependencyAlert
            title="Campuses: No Campuses Configured"
            description="At least one physical campus or main branch must be registered for student cohort assignment and exam roll allocation."
            configureHref="/school/settings/campuses"
            configureLabel="Configure Campuses →"
            severity="info"
          />
        )}
      </div>

      {/* Configuration Hub Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration Status Overview
          </h2>
          <span className="text-xs text-muted-foreground">
            Calculated from real central store records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readinessItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="hover:border-primary/40 transition-colors shadow-2xs group flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                        <CardDescription className="text-xs">{item.category}</CardDescription>
                      </div>
                    </div>
                    <EntityStatusBadge status={item.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {item.statusText}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 group-hover:text-primary p-0 hover:bg-transparent"
                      asChild
                    >
                      <Link href={item.href}>
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
