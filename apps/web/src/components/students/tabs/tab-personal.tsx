'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { User, Mail, Phone, MapPin, Calendar, Hash, Droplet } from 'lucide-react';

export function TabPersonal({ student }: { student: StudentDetail }) {
  return (
    <div className="space-y-4 pt-1 text-xs">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-primary" />
          Primary Identity & Demographics
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Full Legal Name
            </span>
            <p className="font-semibold text-foreground text-sm">{student.name}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Admission / Student ID
            </span>
            <p className="font-mono font-bold text-primary">{student.admissionNumber}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date of Birth
            </span>
            <p className="font-medium text-foreground">{student.dateOfBirth}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Gender</span>
            <p className="font-medium text-foreground">{student.gender}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Droplet className="h-3 w-3 text-rose-500" /> Blood Group
            </span>
            <p className="font-medium text-foreground">{student.bloodGroup || 'Not specified'}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground">Campus Branch</span>
            <p className="font-medium text-foreground">{student.currentCampus}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Contact & Residential Address
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Official Student Email
            </span>
            <p className="font-mono text-foreground break-all">{student.email}</p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Student Mobile Contact
            </span>
            <p className="font-medium text-foreground">{student.phone}</p>
          </div>

          <div className="sm:col-span-2 rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Residential Address
            </span>
            <p className="font-medium text-foreground leading-relaxed">
              {student.address.street}, {student.address.city}, {student.address.state} — {student.address.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
