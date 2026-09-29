'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Save, 
  ShieldAlert, 
  Send, 
  Users, 
  FileEdit,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function NoticeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    teacherCanCreate: true,
    teacherCanPublish: false,
    defaultAudience: 'ALL' as 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS',
    allowScheduling: true,
    allowAttachments: true,
    requireApprovalBeforeBroadcast: true,
    enabledChannels: ['IN_APP', 'EMAIL'] as ('IN_APP' | 'EMAIL' | 'PUSH')[],
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=communication');
      const json = await res.json();
      if (res.ok && json.data) {
        setFormData(json.data);
      }
    } catch (err) {
      console.error('Failed to load communication settings:', err);
      toast.error('Failed to load notice configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'communication',
          value: formData,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save communication settings');
      }

      setIsDirty(false);
      setSaveSuccess(true);
      toast.success('Notice and communication policies saved');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notice policies');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notice & Broadcast Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure authorization rules, faculty publishing restrictions, and circular review workflows.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saving || loading} className="gap-2 shrink-0">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Policies'}
        </Button>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Notice policies updated and active across communication channels.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authoring & Publishing Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-primary" />
              Faculty Authoring Permissions
            </CardTitle>
            <CardDescription className="text-xs">
              Determine who can draft circulars and whether leadership approval is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">Teacher Circular Drafting</div>
                <div className="text-xs text-muted-foreground">
                  Allow teachers to compose notices for their assigned classes and sections.
                </div>
              </div>
              <Switch 
                checked={formData.teacherCanCreate} 
                onCheckedChange={checked => handleToggle('teacherCanCreate', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">Immediate Faculty Publishing</div>
                <div className="text-xs text-muted-foreground">
                  Allow teachers to publish directly without administrative review.
                </div>
              </div>
              <Switch 
                checked={formData.teacherCanPublish} 
                onCheckedChange={checked => handleToggle('teacherCanPublish', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">Mandatory Broadcast Review</div>
                <div className="text-xs text-muted-foreground">
                  School-wide broadcasts require approval from the Principal or Director.
                </div>
              </div>
              <Switch 
                checked={formData.requireApprovalBeforeBroadcast} 
                onCheckedChange={checked => handleToggle('requireApprovalBeforeBroadcast', checked)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Dispatch Features
            </CardTitle>
            <CardDescription className="text-xs">
              Enable advanced dispatch mechanisms and attachment allowances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">Scheduled Dispatches</div>
                <div className="text-xs text-muted-foreground">
                  Allow circulars to be scheduled for automated release at a future date/time.
                </div>
              </div>
              <Switch 
                checked={formData.allowScheduling} 
                onCheckedChange={checked => handleToggle('allowScheduling', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">Document Attachments</div>
                <div className="text-xs text-muted-foreground">
                  Allow PDF circulars, timetables, and guidelines to be attached to notices.
                </div>
              </div>
              <Switch 
                checked={formData.allowAttachments} 
                onCheckedChange={checked => handleToggle('allowAttachments', checked)} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
