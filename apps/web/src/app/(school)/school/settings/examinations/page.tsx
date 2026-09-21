'use client';

import React from 'react';
import Link from 'next/link';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { 
  FileText, 
  Clock, 
  Award, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExaminationsHubPage() {
  const store = useSchoolStore();
  const examTypes = store.examTypes || [];
  const timeSlots = store.examTimeSlots || [];
  const gradingSchemes = store.gradingSchemes || [];
  const rooms = store.rooms || [];
  const rules = store.examRules;

  const defaultGradingScheme = gradingSchemes.find(s => s.isDefault);

  const sections = [
    {
      title: 'Exam Types',
      description: 'Define standardized categories of examinations (e.g. Unit Tests, Mid-Terms, Annual Boards).',
      href: '/school/settings/examinations/types',
      icon: FileText,
      badge: examTypes.length > 0 ? `${examTypes.length} Configured` : 'Not Configured',
      badgeVariant: (examTypes.length > 0 ? 'default' : 'secondary') as 'default' | 'secondary',
      metrics: `${examTypes.filter(t => t.status === 'ACTIVE').length} active exam types`,
    },
    {
      title: 'Time Slots',
      description: 'Configure standard examination shifts and timings to prevent scheduling collisions.',
      href: '/school/settings/examinations/time-slots',
      icon: Clock,
      badge: timeSlots.length > 0 ? `${timeSlots.length} Slots` : 'Not Configured',
      badgeVariant: (timeSlots.length > 0 ? 'default' : 'secondary') as 'default' | 'secondary',
      metrics: `${timeSlots.filter(s => s.status === 'ACTIVE').length} active shifts`,
    },
    {
      title: 'Grading Schemes',
      description: 'Setup percentage cutoffs, letter grades, pass marks, and GPA points calculation systems.',
      href: '/school/settings/examinations/grading',
      icon: Award,
      badge: defaultGradingScheme ? `Default: ${defaultGradingScheme.name}` : (gradingSchemes.length > 0 ? `${gradingSchemes.length} Schemes` : 'Not Configured'),
      badgeVariant: (defaultGradingScheme ? 'default' : 'secondary') as 'default' | 'secondary',
      metrics: `${gradingSchemes.length} grading schemes defined`,
    },
    {
      title: 'Halls & Venues',
      description: 'Manage physical examination rooms, hall capacities, and invigilation seating setups.',
      href: '/school/settings/examinations/rooms',
      icon: Building2,
      badge: rooms.length > 0 ? `${rooms.length} Venues` : 'Not Configured',
      badgeVariant: (rooms.length > 0 ? 'default' : 'secondary') as 'default' | 'secondary',
      metrics: `${rooms.reduce((acc, r) => acc + (r.capacity || 0), 0)} total seating capacity`,
    },
    {
      title: 'Rules & Conflict Detection',
      description: 'Configure multi-paper limits, room collision checks, and minimum student attendance requirements.',
      href: '/school/settings/examinations/rules',
      icon: ShieldCheck,
      badge: rules ? 'Active Policy' : 'Default',
      badgeVariant: 'default' as const,
      metrics: `Min Attendance: ${rules?.attendanceRequirementPercentage ?? 75}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Examinations Configuration Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centrally manage examination structures, scheduling constraints, grading scales, and room allocation rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.href} className="hover:border-primary/50 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">{sec.title}</CardTitle>
                  </div>
                  <Badge variant={sec.badgeVariant} className="text-xs">
                    {sec.badge}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {sec.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                  <span className="text-muted-foreground">{sec.metrics}</span>
                  <Link href={sec.href}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium text-primary hover:text-primary">
                      Configure
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
