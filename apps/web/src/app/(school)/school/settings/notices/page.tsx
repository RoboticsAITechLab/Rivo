'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { NoticeSettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  Bell, 
  Save, 
  ShieldAlert, 
  Send, 
  Users, 
  FileEdit,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function NoticeSettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.noticeSettings;

  const [formData, setFormData] = useState<NoticeSettings>({
    adminOnlyPublish: false,
    allowTeacherDrafts: true,
    targetAudienceScope: ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS'],
    requireApprovalBeforeBroadcast: true,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleToggle = <K extends keyof NoticeSettings>(key: K, value: NoticeSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleToggleAudience = (audience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS', checked: boolean) => {
    setFormData(prev => {
      let updated = [...(prev.targetAudienceScope || [])];
      if (checked && !updated.includes(audience)) {
        updated.push(audience);
      } else if (!checked) {
        updated = updated.filter(a => a !== audience);
      }
      return { ...prev, targetAudienceScope: updated };
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateNoticeSettings(formData);
    setIsDirty(false);
    toast.success('Notice board preferences saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notice Board & Circulars Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure announcement authorship rights, pre-broadcast moderation workflows, and recipient segmentation.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authorship & Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-primary" />
              Publishing & Moderation
            </CardTitle>
            <CardDescription className="text-xs">
              Determine who can author and broadcast official school bulletins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="adminOnly" className="text-sm font-medium">Admin-Only Publishing</Label>
                <p className="text-xs text-muted-foreground">
                  Restrict circular creation and dispatch exclusively to School Administrators.
                </p>
              </div>
              <Switch 
                id="adminOnly"
                checked={formData.adminOnlyPublish}
                onCheckedChange={(val) => handleToggle('adminOnlyPublish', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="teacherDrafts" className="text-sm font-medium">Permit Teacher Drafts</Label>
                <p className="text-xs text-muted-foreground">
                  Allow teachers and department coordinators to compose notice drafts for administrative review.
                </p>
              </div>
              <Switch 
                id="teacherDrafts"
                checked={formData.allowTeacherDrafts}
                onCheckedChange={(val) => handleToggle('allowTeacherDrafts', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="requireApproval" className="text-sm font-medium">Mandatory Approval Before Broadcast</Label>
                <p className="text-xs text-muted-foreground">
                  Require explicit principal/admin sign-off before notices appear on student and parent feeds.
                </p>
              </div>
              <Switch 
                id="requireApproval"
                checked={formData.requireApprovalBeforeBroadcast}
                onCheckedChange={(val) => handleToggle('requireApprovalBeforeBroadcast', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audience Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Supported Audience Segments
            </CardTitle>
            <CardDescription className="text-xs">
              Allowable targeting options available when authoring a new circular.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Entire School Community (Universal)</div>
                <div className="text-xs text-muted-foreground">All staff, students, and parent guardians</div>
              </div>
              <Switch 
                checked={(formData.targetAudienceScope || []).includes('ALL')}
                onCheckedChange={(val) => handleToggleAudience('ALL', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Students</div>
                <div className="text-xs text-muted-foreground">Classroom and campus-specific student feeds</div>
              </div>
              <Switch 
                checked={(formData.targetAudienceScope || []).includes('STUDENTS')}
                onCheckedChange={(val) => handleToggleAudience('STUDENTS', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Teaching Faculty & Staff</div>
                <div className="text-xs text-muted-foreground">Internal academic and operational bulletins</div>
              </div>
              <Switch 
                checked={(formData.targetAudienceScope || []).includes('TEACHERS')}
                onCheckedChange={(val) => handleToggleAudience('TEACHERS', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Parents & Guardians</div>
                <div className="text-xs text-muted-foreground">Institutional announcements and fee circulars</div>
              </div>
              <Switch 
                checked={(formData.targetAudienceScope || []).includes('PARENTS')}
                onCheckedChange={(val) => handleToggleAudience('PARENTS', val)}
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
