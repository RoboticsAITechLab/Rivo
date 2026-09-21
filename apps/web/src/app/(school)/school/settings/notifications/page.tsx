'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { NotificationSettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  BellRing, 
  Save, 
  Mail, 
  Smartphone, 
  Monitor, 
  AlertCircle,
  Calendar,
  Award,
  BookOpen,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface NotificationFormState {
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  eventTriggers: {
    studentAbsence: boolean;
    homeworkAssigned: boolean;
    examSchedulePublished: boolean;
    resultDeclared: boolean;
    feeDueReminder: boolean;
  };
}

export default function NotificationSettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.notificationSettings;

  const [formData, setFormData] = useState<NotificationFormState>({
    channels: {
      inApp: currentSettings?.channels?.inApp ?? true,
      email: currentSettings?.channels?.email ?? true,
      sms: currentSettings?.channels?.sms ?? false,
    },
    eventTriggers: {
      studentAbsence: currentSettings?.eventTriggers?.studentAbsence ?? true,
      homeworkAssigned: currentSettings?.eventTriggers?.homeworkAssigned ?? true,
      examSchedulePublished: currentSettings?.eventTriggers?.examSchedulePublished ?? true,
      resultDeclared: currentSettings?.eventTriggers?.resultDeclared ?? true,
      feeDueReminder: currentSettings?.eventTriggers?.feeDueReminder ?? false,
    },
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        channels: {
          inApp: currentSettings.channels?.inApp ?? true,
          email: currentSettings.channels?.email ?? true,
          sms: currentSettings.channels?.sms ?? false,
        },
        eventTriggers: {
          studentAbsence: currentSettings.eventTriggers?.studentAbsence ?? true,
          homeworkAssigned: currentSettings.eventTriggers?.homeworkAssigned ?? true,
          examSchedulePublished: currentSettings.eventTriggers?.examSchedulePublished ?? true,
          resultDeclared: currentSettings.eventTriggers?.resultDeclared ?? true,
          feeDueReminder: currentSettings.eventTriggers?.feeDueReminder ?? false,
        },
      });
    }
  }, [currentSettings]);

  const handleChannelToggle = (channel: keyof NotificationFormState['channels'], val: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: val,
      }
    }));
    setIsDirty(true);
  };

  const handleTriggerToggle = (trigger: keyof NotificationFormState['eventTriggers'], val: boolean) => {
    setFormData(prev => ({
      ...prev,
      eventTriggers: {
        ...prev.eventTriggers,
        [trigger]: val,
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateNotificationSettings(formData);
    setIsDirty(false);
    toast.success('Automated dispatch and notification triggers saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Automated Alerts & Dispatch Triggers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated outbound channels and lifecycle alerts triggered by academic workflows.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Triggers
        </Button>
      </div>

      <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-sm">Outbound Gateways: Pending Carrier Attachment</div>
          <p className="leading-relaxed opacity-90">
            SMS gateways (DLT compliant SMS service) and transactional SMTP mailers will handle delivery once attached. 
            All in-app alerts fire reactive notifications within the portal immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Delivery Channels
            </CardTitle>
            <CardDescription className="text-xs">
              Select supported transport mechanisms for automated institutional communication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-primary" />
                  In-App Notification Center
                </div>
                <div className="text-xs text-muted-foreground">Portal bell icon & activity drawer</div>
              </div>
              <Switch 
                checked={formData.channels.inApp}
                onCheckedChange={(val) => handleChannelToggle('inApp', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Dispatch
                </div>
                <div className="text-xs text-muted-foreground">Automated HTML digests and reports</div>
              </div>
              <Switch 
                checked={formData.channels.email}
                onCheckedChange={(val) => handleChannelToggle('email', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS Text Messages
                </div>
                <div className="text-xs text-muted-foreground">Urgent absence alerts & critical OTPs</div>
              </div>
              <Switch 
                checked={formData.channels.sms}
                onCheckedChange={(val) => handleChannelToggle('sms', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              Academic Event Triggers
            </CardTitle>
            <CardDescription className="text-xs">
              Automated notifications fired when operational milestones occur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <UserX className="h-3.5 w-3.5 text-amber-500" />
                  Student Absence Recorded
                </div>
                <div className="text-xs text-muted-foreground">Alert parent guardian when student is marked absent</div>
              </div>
              <Switch 
                checked={formData.eventTriggers.studentAbsence}
                onCheckedChange={(val) => handleTriggerToggle('studentAbsence', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  New Homework Assigned
                </div>
                <div className="text-xs text-muted-foreground">Notify students when teacher publishes a class assignment</div>
              </div>
              <Switch 
                checked={formData.eventTriggers.homeworkAssigned}
                onCheckedChange={(val) => handleTriggerToggle('homeworkAssigned', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Exam Date Sheet Published
                </div>
                <div className="text-xs text-muted-foreground">Broadcast date sheet timings and room allocations</div>
              </div>
              <Switch 
                checked={formData.eventTriggers.examSchedulePublished}
                onCheckedChange={(val) => handleTriggerToggle('examSchedulePublished', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  Exam Results Declared
                </div>
                <div className="text-xs text-muted-foreground">Alert students and parents when report cards are released</div>
              </div>
              <Switch 
                checked={formData.eventTriggers.resultDeclared}
                onCheckedChange={(val) => handleTriggerToggle('resultDeclared', val)}
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
