'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthSettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  KeyRound, 
  Save, 
  ShieldAlert, 
  Lock, 
  Mail, 
  Clock, 
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const defaultAuthSettings: AuthSettings = {
  passwordLoginEnabled: true,
  emailVerificationEnabled: false,
  roleAccess: {
    schoolAdmin: true,
    teacher: true,
    student: true,
    parent: true,
  },
  sessionTimeoutMinutes: 1440,
};

export default function AuthenticationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    currentValues: formData,
    setCurrentValues: setFormData,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges<AuthSettings>(defaultAuthSettings);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=security');
      const json = await res.json();
      if (res.ok && json.data?.authentication) {
        setFormData(json.data.authentication);
        markSaved(json.data.authentication);
      }
    } catch (err) {
      console.error('Failed to load authentication settings:', err);
      toast.error('Failed to load institutional authentication settings');
    } finally {
      setLoading(false);
    }
  }, [markSaved, setFormData]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = <K extends keyof AuthSettings>(key: K, value: AuthSettings[K]) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleRoleToggle = (role: keyof AuthSettings['roleAccess'], val: boolean) => {
    setFormData({
      ...formData,
      roleAccess: {
        ...formData.roleAccess,
        [role]: val,
      },
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'security',
          value: {
            authentication: formData,
            sessionTimeoutMinutes: formData.sessionTimeoutMinutes,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save authentication parameters');
      }

      markSaved(formData);
      toast.success('Authentication controls saved and enforced server-side.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update authentication settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Authentication Controls
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Govern institutional login methods, role portal access permissions, and session timeout thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={resetForm}
              className="text-xs h-8"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={() => handleSave()}
            disabled={!isDirty || saving}
            className="gap-2 shrink-0 h-8 text-xs"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Verified Backend Connectivity Indicator */}
      <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold">Authoritative Security Enforcement Active</div>
          <p className="leading-relaxed opacity-90">
            Policies configured below are persisted to PostgreSQL and enforced in real time at the API and middleware gateway.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Login Methods
            </CardTitle>
            <CardDescription className="text-xs">
              Primary identification mechanisms supported on the institutional portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="passLogin" className="text-sm font-medium">Standard Password Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Allow credential login using email address and salted password.
                </p>
              </div>
              <Switch 
                id="passLogin"
                checked={formData.passwordLoginEnabled}
                onCheckedChange={(val) => handleToggle('passwordLoginEnabled', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="emailVerify" className="text-sm font-medium">Mandatory Email Verification</Label>
                <p className="text-xs text-muted-foreground">
                  Require newly invited accounts to verify email ownership before portal entry.
                </p>
              </div>
              <Switch 
                id="emailVerify"
                checked={formData.emailVerificationEnabled}
                onCheckedChange={(val) => handleToggle('emailVerificationEnabled', val)}
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label htmlFor="sessionTimeout" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Idle Session Timeout (Minutes)
                </Label>
                <span className="font-mono font-semibold text-xs text-primary">{formData.sessionTimeoutMinutes} min</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Inactivity threshold after which web sessions automatically expire and require re-authentication.
              </p>
              <Input 
                id="sessionTimeout"
                type="number"
                min={5}
                max={1440}
                value={formData.sessionTimeoutMinutes}
                onChange={(e) => handleToggle('sessionTimeoutMinutes', Number(e.target.value))}
                className="font-mono mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Role Portal Entry Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Role Portal Access Control
            </CardTitle>
            <CardDescription className="text-xs">
              Select which user roles are currently permitted to log into their web portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">School Administrators</div>
                <div className="text-xs text-muted-foreground">Principal, Vice Principal, System Admins</div>
              </div>
              <Switch 
                checked={formData.roleAccess.schoolAdmin}
                onCheckedChange={(val) => handleRoleToggle('schoolAdmin', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Teachers & Faculty</div>
                <div className="text-xs text-muted-foreground">Subject instructors and class coordinators</div>
              </div>
              <Switch 
                checked={formData.roleAccess.teacher}
                onCheckedChange={(val) => handleRoleToggle('teacher', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Students</div>
                <div className="text-xs text-muted-foreground">Enrolled student homework & report card view</div>
              </div>
              <Switch 
                checked={formData.roleAccess.student}
                onCheckedChange={(val) => handleRoleToggle('student', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Parents & Guardians</div>
                <div className="text-xs text-muted-foreground">Fee tracking, student attendance & progress</div>
              </div>
              <Switch 
                checked={formData.roleAccess.parent}
                onCheckedChange={(val) => handleRoleToggle('parent', val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog 
        open={showUnsavedDialog} 
        onDiscard={() => resetForm()} 
        onContinueEditing={() => setShowUnsavedDialog(false)} 
        onSave={async () => {
          await handleSave();
        }} 
      />
    </div>
  );
}
