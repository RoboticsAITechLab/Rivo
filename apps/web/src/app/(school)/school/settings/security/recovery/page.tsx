'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { AccountRecoverySettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  LifeBuoy, 
  Save, 
  Clock, 
  ShieldAlert, 
  Mail, 
  CheckCircle2,
  Lock
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

export default function AccountRecoverySettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.recoverySettings;

  const [formData, setFormData] = useState<AccountRecoverySettings>({
    allowSelfServiceReset: true,
    requireAdminApproval: false,
    notifyAdminOnRecovery: true,
    resetLinkExpiryHours: 24,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleToggle = <K extends keyof AccountRecoverySettings>(key: K, value: AccountRecoverySettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updateRecoverySettings(formData);
    setIsDirty(false);
    toast.success('Account recovery preferences updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" />
            Account Recovery & Reset Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated self-service password retrieval, administrative oversight, and reset token lifespans.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Self-Service Reset Controls
            </CardTitle>
            <CardDescription className="text-xs">
              Allow users to initiate password restoration autonomously.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="selfReset" className="text-sm font-medium">Allow Self-Service Password Reset</Label>
                <p className="text-xs text-muted-foreground">
                  Users can click "Forgot Password" on the login screen to receive a secure recovery email.
                </p>
              </div>
              <Switch 
                id="selfReset"
                checked={formData.allowSelfServiceReset}
                onCheckedChange={(val) => handleToggle('allowSelfServiceReset', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="adminApproval" className="text-sm font-medium">Require Administrator Approval</Label>
                <p className="text-xs text-muted-foreground">
                  Password reset requests require manual authorization from an administrator before the email link is issued.
                </p>
              </div>
              <Switch 
                id="adminApproval"
                checked={formData.requireAdminApproval}
                onCheckedChange={(val) => handleToggle('requireAdminApproval', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="adminNotify" className="text-sm font-medium">Notify Administrators on Reset</Label>
                <p className="text-xs text-muted-foreground">
                  Send an audit notification to school administrators whenever an account password is reset.
                </p>
              </div>
              <Switch 
                id="adminNotify"
                checked={formData.notifyAdminOnRecovery}
                onCheckedChange={(val) => handleToggle('notifyAdminOnRecovery', val)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Token Security & Expiry
            </CardTitle>
            <CardDescription className="text-xs">
              Time validity constraints for password recovery links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiryHours">Reset Link Validity Window</Label>
              <Select 
                value={String(formData.resetLinkExpiryHours)} 
                onValueChange={(val) => handleToggle('resetLinkExpiryHours', Number(val))}
              >
                <SelectTrigger id="expiryHours">
                  <SelectValue placeholder="Select validity period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour (High Security)</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="24">24 Hours (Standard)</SelectItem>
                  <SelectItem value="48">48 Hours (Extended)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                After this duration expires, any unclicked password reset tokens become void and must be re-requested.
              </p>
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
