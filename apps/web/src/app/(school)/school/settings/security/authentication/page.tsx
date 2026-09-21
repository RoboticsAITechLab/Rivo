'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AuthenticationSettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.authSettings;

  const [formData, setFormData] = useState<AuthSettings>({
    passwordLoginEnabled: true,
    emailVerificationEnabled: true,
    roleAccess: {
      schoolAdmin: true,
      teacher: true,
      student: false,
      parent: false,
    },
    sessionTimeoutMinutes: 60,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleToggle = <K extends keyof AuthSettings>(key: K, value: AuthSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleRoleToggle = (role: keyof AuthSettings['roleAccess'], val: boolean) => {
    setFormData(prev => ({
      ...prev,
      roleAccess: {
        ...prev.roleAccess,
        [role]: val,
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateAuthSettings(formData);
    setIsDirty(false);
    toast.success('Authentication parameters saved successfully');
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
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>

      {/* Honest Backend Connectivity Indicator */}
      <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-sm">Auth Provider Status: Standalone Frontend Interface</div>
          <p className="leading-relaxed opacity-90">
            Authentication service endpoints and Identity Providers (e.g. Supabase, Firebase, or LDAP) are currently not connected. 
            All policy switches below are fully configured on the client store and will automatically enforce security boundaries once your authentication API is linked.
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
        open={showDialog} 
        onConfirm={confirmLeave} 
        onCancel={cancelLeave} 
      />
    </div>
  );
}
