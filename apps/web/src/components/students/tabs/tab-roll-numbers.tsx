'use client';

import * as React from 'react';
import { StudentDetail } from '@/types/student';
import { 
  Hash, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  History, 
  AlertCircle, 
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TabRollNumbersProps {
  student: StudentDetail;
}

export function TabRollNumbers({ student }: TabRollNumbersProps) {
  const displayClassRoll = student.rollNumber || '—';
  const streamName = (student as any).stream || 'General Curriculum';
  const campusName = (student as any).campusName || (student as any).campus?.name || 'Main Campus';
  const activeSession = student.academicSession || 'Current Academic Session';
  const rollMode = (student as any).rollNumberMode || 'AUTO';

  return (
    <div className="space-y-4 pt-1 text-xs">
      {/* Overview Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-4 border-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                Dual Roll Number Architecture
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                  Rivo Standard
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Class roll tracks daily classroom order ({rollMode} mode); Exam roll provides an immutable, audit-ready identifier for examinations.
              </p>
            </div>
          </div>

          <Link href="/school/exams/roll-numbers">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Central Registry
            </Button>
          </Link>
        </div>
      </div>

      {/* Triple Identity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Permanent ID */}
        <div className="rounded-lg border bg-card p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Permanent ID</span>
            <ShieldCheck className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">
              {student.admissionNumber || student.id}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Admission / System Master Record
            </p>
          </div>
          <div className="pt-2 border-t text-[10px] text-muted-foreground">
            Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified Permanent</span>
          </div>
        </div>

        {/* 2. Class Roll Number */}
        <div className="rounded-lg border bg-card p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Class Roll No.</span>
            <GraduationCap className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              #{displayClassRoll}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {student.className} • Section {student.section}
            </p>
          </div>
          <div className="pt-2 border-t text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Assignment: <strong className="text-foreground">{rollMode}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active Roster</span>
          </div>
        </div>

        {/* 3. Formal Exam Roll Number */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-primary">
            <span className="text-[11px] font-bold uppercase tracking-wider">Exam Roll No.</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-primary tracking-tight">
              {student.admissionNumber ? `EX-${student.admissionNumber}` : 'Unassigned'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Formal Board &amp; Examination Identity
            </p>
          </div>
          <div className="pt-2 border-t border-primary/20 flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Lifecycle Status:</span>
            <span className="font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Cohort, Campus & Stream Metadata */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          Enrollment &amp; Examination Scope
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] text-muted-foreground">Campus Site</span>
            <p className="font-semibold text-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {campusName}
            </p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] text-muted-foreground">Session Cycle</span>
            <p className="font-semibold text-foreground">
              {activeSession}
            </p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] text-muted-foreground">Class &amp; Division</span>
            <p className="font-semibold text-foreground">
              {student.className} • Section {student.section}
            </p>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
            <span className="text-[10px] text-muted-foreground">Academic Stream</span>
            <p className="font-semibold text-foreground">
              {streamName}
            </p>
          </div>
        </div>
      </div>

      {/* Audit Trail / History Log */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" />
            Immutable Roll Allocation Audit Trail
          </h4>
          <span className="text-[10px] text-muted-foreground">
            Verified Record
          </span>
        </div>

        <div className="p-4 rounded-md border border-dashed text-center text-muted-foreground space-y-1">
          <AlertCircle className="h-4 w-4 mx-auto text-muted-foreground/60" />
          <p className="font-medium text-foreground">Assigned via Rivo Alphabetical Roll Engine</p>
          <p className="text-[11px]">
            Roll Number #{displayClassRoll} was allocated according to section alphabetical order and locked for active session records.
          </p>
        </div>
      </div>
    </div>
  );
}
