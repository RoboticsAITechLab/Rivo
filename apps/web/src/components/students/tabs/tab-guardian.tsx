'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Users, Phone, Mail, Briefcase, Edit3 } from 'lucide-react';

export function TabGuardian({
  student,
  onEditGuardian,
}: {
  student: StudentDetail;
  onEditGuardian?: () => void;
}) {
  const { toast } = useToast();

  const handleEditClick = () => {
    if (onEditGuardian) {
      onEditGuardian();
    } else {
      toast('Edit Guardian Coordinates', 'Guardian contact editor modal opened in mock session.');
    }
  };

  return (
    <div className="space-y-4 pt-1 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Parent & Guardian Profiles
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditClick}
          className="h-7 text-xs gap-1.5"
        >
          <Edit3 className="h-3 w-3" />
          Edit Guardian
        </Button>
      </div>

      {/* Primary Guardian Card */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              1
            </span>
            <span className="font-bold text-sm text-foreground">
              {student.primaryGuardian.name}
            </span>
          </div>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
            Primary Contact ({student.primaryGuardian.relationship})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </span>
            <p className="font-semibold text-foreground">{student.primaryGuardian.phone}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email Address
            </span>
            <p className="font-mono text-foreground break-all">{student.primaryGuardian.email}</p>
          </div>

          <div className="sm:col-span-2 rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Occupation & Designation
            </span>
            <p className="font-medium text-foreground">
              {student.primaryGuardian.occupation || 'Self-employed Professional'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Guardian Card */}
      {student.secondaryGuardian && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                2
              </span>
              <span className="font-bold text-sm text-foreground">
                {student.secondaryGuardian.name}
              </span>
            </div>
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold">
              Secondary ({student.secondaryGuardian.relationship})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </span>
              <p className="font-semibold text-foreground">{student.secondaryGuardian.phone}</p>
            </div>

            <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address
              </span>
              <p className="font-mono text-foreground break-all">{student.secondaryGuardian.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
