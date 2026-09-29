'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  UserX,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<NotificationFormState>({
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
    eventTriggers: {
      studentAbsence: true,
      homeworkAssigned: true,
      examSchedulePublished: true,
      resultDeclared: true,
      feeDueReminder: true,
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=notifications');
      const json = await res.json();
      if (res.ok && json.data) {
        setFormData(json.data);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChannelToggle = (channel: keyof NotificationFormState['channels'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: { ...prev.channels, [channel]: value }
    }));
    setIsDirty(true);
  };

  const handleTriggerToggle = (trigger: keyof NotificationFormState['eventTriggers'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      eventTriggers: { ...prev.eventTriggers, [trigger]: value }
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'notifications',
          value: formData,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save notification settings');
      }

      setIsDirty(false);
      setSaveSuccess(true);
      toast.success('Notification preferences saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Automated Notification Triggers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated event alerts dispatched to parents, students, and faculty members.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saving || loading} className="gap-2 shrink-0">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Notification rules updated and enforced across CommunicationService.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Supported Delivery Channels
            </CardTitle>
            <CardDescription className="text-xs">
              Active communication channels for event notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  In-App Notification Feed
                </div>
                <div className="text-xs text-muted-foreground">
                  Deliver real-time web portal notifications to student and parent dashboards.
                </div>
              </div>
              <Switch 
                checked={formData.channels.inApp} 
                onCheckedChange={checked => handleChannelToggle('inApp', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Dispatch
                </div>
                <div className="text-xs text-muted-foreground">
                  Send official email advisories for important academic milestones and alerts.
                </div>
              </div>
              <Switch 
                checked={formData.channels.email} 
                onCheckedChange={checked => handleChannelToggle('email', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 opacity-60">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  SMS Gateway (Future Carrier Add-on)
                </div>
                <div className="text-xs text-muted-foreground">
                  SMS carrier notifications (Requires active telecom gateway provisioning).
                </div>
              </div>
              <Switch 
                checked={formData.channels.sms} 
                disabled={true}
                onCheckedChange={checked => handleChannelToggle('sms', checked)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic & Operational Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Event Automated Triggers
            </CardTitle>
            <CardDescription className="text-xs">
              Select which events dispatch instant notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <UserX className="h-4 w-4 text-amber-500" />
                  Daily Student Absence Alert
                </div>
                <div className="text-xs text-muted-foreground">
                  Notify parents when student is marked Absent during daily roll call.
                </div>
              </div>
              <Switch 
                checked={formData.eventTriggers.studentAbsence} 
                onCheckedChange={checked => handleTriggerToggle('studentAbsence', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Exam Date-sheet Publication
                </div>
                <div className="text-xs text-muted-foreground">
                  Notify students and parents when formal exam timetables are released.
                </div>
              </div>
              <Switch 
                checked={formData.eventTriggers.examSchedulePublished} 
                onCheckedChange={checked => handleTriggerToggle('examSchedulePublished', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  Term Result Declaration
                </div>
                <div className="text-xs text-muted-foreground">
                  Dispatch alert when marksheets and grades are officially published.
                </div>
              </div>
              <Switch 
                checked={formData.eventTriggers.resultDeclared} 
                onCheckedChange={checked => handleTriggerToggle('resultDeclared', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Fee Installment Due Reminders
                </div>
                <div className="text-xs text-muted-foreground">
                  Send automated reminder notifications prior to installment due dates.
                </div>
              </div>
              <Switch 
                checked={formData.eventTriggers.feeDueReminder} 
                onCheckedChange={checked => handleTriggerToggle('feeDueReminder', checked)} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
