import * as React from 'react';
import { User, GraduationCap, School, ShieldCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StudentIdentityData {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  admissionNumber?: string | null;
  rollNumber?: string | number | null;
  className?: string | null;
  sectionName?: string | null;
  streamName?: string | null;
  campusName?: string | null;
  fatherName?: string | null;
  avatarUrl?: string | null;
}

interface StudentIdentityBlockProps {
  student: StudentIdentityData;
  variant?: 'banner' | 'card' | 'compact' | 'inline';
  className?: string;
}

export function StudentIdentityBlock({
  student,
  variant = 'card',
  className,
}: StudentIdentityBlockProps) {
  const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'ST';

  const classSectionDisplay = [student.className, student.sectionName ? `Sec ${student.sectionName}` : null]
    .filter(Boolean)
    .join(' · ');

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0 overflow-hidden">
          <div className="font-semibold text-xs text-foreground truncate">{fullName}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {student.admissionNumber ? `Adm: ${student.admissionNumber}` : ''}
            {student.className ? ` · ${student.className}` : ''}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn('p-4 sm:p-5 rounded-xl border bg-card/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {fullName}
              </h2>
              {student.admissionNumber && (
                <Badge variant="outline" className="font-mono text-xs">
                  Adm: {student.admissionNumber}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
              {classSectionDisplay && (
                <span className="font-medium text-foreground/80">{classSectionDisplay}</span>
              )}
              {student.rollNumber && <span>Roll #{student.rollNumber}</span>}
              {student.streamName && <span>Stream: {student.streamName}</span>}
              {student.campusName && (
                <span className="inline-flex items-center gap-1">
                  <School className="h-3 w-3" /> {student.campusName}
                </span>
              )}
              {student.fatherName && <span>Guardian: {student.fatherName}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={cn('p-3.5 rounded-lg border bg-muted/20 flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">{fullName}</div>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            {student.admissionNumber && <span className="font-mono">Adm: {student.admissionNumber}</span>}
            {classSectionDisplay && <span>{classSectionDisplay}</span>}
            {student.rollNumber && <span>Roll: {student.rollNumber}</span>}
          </div>
        </div>
      </div>
      {student.campusName && (
        <Badge variant="outline" className="text-[11px] shrink-0 hidden sm:inline-flex">
          {student.campusName}
        </Badge>
      )}
    </div>
  );
}
