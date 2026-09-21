'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { ResultSettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';
import { 
  FileCheck2, 
  Save, 
  Eye, 
  Lock, 
  Award, 
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function ResultsSettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.resultSettings;
  const gradingSchemes = store.gradingSchemes || [];

  const [formData, setFormData] = useState<ResultSettings>({
    defaultGradingSchemeId: undefined,
    publicationBehavior: 'MANUAL',
    resultVisibility: 'ADMIN_ONLY',
    lockPublishedResults: true,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleChange = <K extends keyof ResultSettings>(key: K, value: ResultSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateResultSettings(formData);
    setIsDirty(false);
    toast.success('Result publication and grading preferences saved successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            Result Settings & Publication
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure report card grading schemes, release approvals, and post-publication mark locks.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {gradingSchemes.length === 0 && (
        <DependencyAlert 
          title="No Grading Schemes Configured"
          message="Define at least one grading scale (e.g. CBSE 10-Point, Percentage standard) before assigning report card calculation standards."
          actionText="Configure Grading Schemes"
          actionHref="/school/settings/examinations/grading"
          severity="warning"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grading Scheme Standard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Default Grading Scheme
            </CardTitle>
            <CardDescription className="text-xs">
              Primary letter grading formula applied across new exam marksheets and report cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gradingScheme">Active Grading Scale</Label>
              <Select 
                value={formData.defaultGradingSchemeId || 'NONE'} 
                onValueChange={(val) => handleChange('defaultGradingSchemeId', val === 'NONE' ? undefined : val)}
              >
                <SelectTrigger id="gradingScheme">
                  <SelectValue placeholder="Select grading scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Default Assigned</SelectItem>
                  {gradingSchemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code}) {s.isDefault ? '— [Default]' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Subject marks will be evaluated against this scale to produce GPA and letter grade rankings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publication Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Publication Moderation
            </CardTitle>
            <CardDescription className="text-xs">
              Control when evaluated exam scores transition from draft to official record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicationBehavior">Release Trigger</Label>
              <Select 
                value={formData.publicationBehavior} 
                onValueChange={(val: any) => handleChange('publicationBehavior', val)}
              >
                <SelectTrigger id="publicationBehavior">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual Review & Approval (Principal/Admin explicit release)</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled Date/Time Release</SelectItem>
                  <SelectItem value="IMMEDIATE">Immediate Release Upon Entry Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Result Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Audience Visibility
            </CardTitle>
            <CardDescription className="text-xs">
              Set role permissions for accessing provisional and finalized report sheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resultVisibility">Accessible By</Label>
              <Select 
                value={formData.resultVisibility} 
                onValueChange={(val: any) => handleChange('resultVisibility', val)}
              >
                <SelectTrigger id="resultVisibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN_ONLY">Administrative Staff Only (Restricted Draft)</SelectItem>
                  <SelectItem value="TEACHERS">Admins and Subject Teachers</SelectItem>
                  <SelectItem value="STUDENTS_AND_PARENTS">Public (Admins, Teachers, Students & Parents)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set to Students & Parents, report cards appear on the student portal immediately upon publication.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lock Published Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Data Integrity & Freezing
            </CardTitle>
            <CardDescription className="text-xs">
              Prevent unauthorized mark tampering or retro-active edits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="lockResults" className="text-sm font-medium">Lock Published Marks</Label>
                <p className="text-xs text-muted-foreground">
                  Lock examination marksheets against any edits once published. Re-opening requires administrative override.
                </p>
              </div>
              <Switch 
                id="lockResults"
                checked={formData.lockPublishedResults}
                onCheckedChange={(val) => handleChange('lockPublishedResults', val)}
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
