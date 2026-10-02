'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Users, Phone, Mail, Briefcase, Edit3 } from 'lucide-react';

export function TabGuardian({
  student,
  onEditGuardian,
}: {
  student: StudentDetail;
  onEditGuardian?: () => void;
}) {
  const primary = student.primaryGuardian || {
    name: student.guardianName || 'Parent / Guardian',
    relationship: 'Guardian',
    phone: student.guardianPhone || student.phone || '',
    email: student.email || '',
    occupation: '',
  };

  const secondary = student.secondaryGuardian;

  return (
    <div className="space-y-4 pt-1 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Parent &amp; Guardian Profiles
        </h4>
        {onEditGuardian && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditGuardian}
            className="h-7 text-xs gap-1.5"
          >
            <Edit3 className="h-3 w-3" />
            Edit Record
          </Button>
        )}
      </div>

      {/* Primary Guardian Card */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              1
            </span>
            <span className="font-bold text-sm text-foreground">
              {primary.name}
            </span>
          </div>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
            Primary Contact ({primary.relationship || 'Guardian'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </span>
            <p className="font-semibold text-foreground font-mono">{primary.phone || 'Not provided'}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email Address
            </span>
            <p className="font-mono text-foreground break-all">{primary.email || 'Not provided'}</p>
          </div>

          {primary.occupation && (
            <div className="sm:col-span-2 rounded-md border bg-muted/20 p-2.5 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Occupation &amp; Designation
              </span>
              <p className="font-medium text-foreground">
                {primary.occupation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Guardian Card */}
      {secondary && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                2
              </span>
              <span className="font-bold text-sm text-foreground">
                {secondary.name}
              </span>
            </div>
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold">
              Secondary ({secondary.relationship || 'Guardian'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </span>
              <p className="font-semibold text-foreground font-mono">{secondary.phone || 'Not provided'}</p>
            </div>

            <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address
              </span>
              <p className="font-mono text-foreground break-all">{secondary.email || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
