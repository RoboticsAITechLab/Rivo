'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { ExamRulesConfig } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  ShieldCheck, 
  Save, 
  AlertTriangle, 
  CalendarClock, 
  Building2, 
  UserCheck, 
  Percent, 
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function ExamRulesSettingsPage() {
  const store = useSchoolStore();
  const currentRules = store.examRules;

  const [formData, setFormData] = useState<ExamRulesConfig>({
    multiplePapersPerDay: false,
    multipleSessionsPerDay: true,
    scheduleConflictDetection: true,
    roomConflictDetection: true,
    candidateValidationRequired: true,
    attendanceRequirementPercentage: 75,
    publishResultsImmediately: false,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentRules) {
      setFormData(currentRules);
    }
  }, [currentRules]);

  const handleChange = <K extends keyof ExamRulesConfig>(key: K, value: ExamRulesConfig[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateExamRules(formData);
    setIsDirty(false);
    toast.success('Examination rules & conflict policies updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Exam Rules & Conflict Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enforce scheduling boundaries, double-booking prevention, candidate eligibility, and result publishing controls.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Rules
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scheduling Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Scheduling Constraints
            </CardTitle>
            <CardDescription className="text-xs">
              Govern student workload and paper density per calendar day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="multiplePapers" className="text-sm font-medium">Multiple Papers Per Day</Label>
                <p className="text-xs text-muted-foreground">
                  Permit scheduling more than one exam paper on the same day for a class/section.
                </p>
              </div>
              <Switch 
                id="multiplePapers"
                checked={formData.multiplePapersPerDay}
                onCheckedChange={(val) => handleChange('multiplePapersPerDay', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="multipleSessions" className="text-sm font-medium">Multiple Shifts Per Day</Label>
                <p className="text-xs text-muted-foreground">
                  Allow different shifts (e.g. morning and afternoon) on a single calendar day across the institution.
                </p>
              </div>
              <Switch 
                id="multipleSessions"
                checked={formData.multipleSessionsPerDay}
                onCheckedChange={(val) => handleChange('multipleSessionsPerDay', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conflict Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Collision & Double-Booking Detection
            </CardTitle>
            <CardDescription className="text-xs">
              Automated safeguards when creating timetable date-sheets and assigning venues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="schedConflict" className="text-sm font-medium">Student Schedule Collision Check</Label>
                <p className="text-xs text-muted-foreground">
                  Block saving if a student has two overlapping exams scheduled simultaneously.
                </p>
              </div>
              <Switch 
                id="schedConflict"
                checked={formData.scheduleConflictDetection}
                onCheckedChange={(val) => handleChange('scheduleConflictDetection', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="roomConflict" className="text-sm font-medium">Room Over-Allocation Guard</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent allocating examination halls beyond their certified seat capacity or double-booking.
                </p>
              </div>
              <Switch 
                id="roomConflict"
                checked={formData.roomConflictDetection}
                onCheckedChange={(val) => handleChange('roomConflictDetection', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility & Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Candidate Eligibility
            </CardTitle>
            <CardDescription className="text-xs">
              Admit card generation and hall ticket qualification thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="candidateValidation" className="text-sm font-medium">Enforce Candidate Validation</Label>
                <p className="text-xs text-muted-foreground">
                  Require verified enrollment status and active academic session registration for hall ticket issuance.
                </p>
              </div>
              <Switch 
                id="candidateValidation"
                checked={formData.candidateValidationRequired}
                onCheckedChange={(val) => handleChange('candidateValidationRequired', val)}
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label htmlFor="minAttendance" className="text-sm font-medium flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  Minimum Attendance Requirement
                </Label>
                <span className="font-mono font-bold text-sm text-primary">{formData.attendanceRequirementPercentage}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Students with aggregate attendance below this percentage trigger an admit card warning or blockage.
              </p>
              <Input 
                id="minAttendance" 
                type="number"
                min={0}
                max={100}
                value={formData.attendanceRequirementPercentage}
                onChange={(e) => handleChange('attendanceRequirementPercentage', Number(e.target.value))}
                className="font-mono mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Evaluation & Publication
            </CardTitle>
            <CardDescription className="text-xs">
              Result moderation policies and public release behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="publishImmediate" className="text-sm font-medium">Publish Results Immediately</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically make marks visible to students once teacher grading is marked complete (skip admin review).
                </p>
              </div>
              <Switch 
                id="publishImmediate"
                checked={formData.publishResultsImmediately}
                onCheckedChange={(val) => handleChange('publishResultsImmediately', val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog 
        open={showDialog} 
        onConfirm={confirmLeave} 
        onCancel={cancelLeave} 
      />
    </div>
  );
}
