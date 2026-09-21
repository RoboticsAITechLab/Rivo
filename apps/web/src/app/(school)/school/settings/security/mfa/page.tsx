'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { MFASettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  ShieldCheck, 
  Save, 
  KeyRound, 
  Smartphone, 
  Mail, 
  AlertCircle,
  QrCode
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

export default function MFASettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.mfaSettings;

  const [formData, setFormData] = useState<MFASettings>({
    enforcement: 'OPTIONAL',
    supportedMethods: ['TOTP'],
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleEnforcementChange = (val: MFASettings['enforcement']) => {
    setFormData(prev => ({ ...prev, enforcement: val }));
    setIsDirty(true);
  };

  const handleToggleMethod = (method: 'TOTP' | 'SMS' | 'EMAIL', enabled: boolean) => {
    setFormData(prev => {
      let updated = [...(prev.supportedMethods || [])];
      if (enabled && !updated.includes(method)) {
        updated.push(method);
      } else if (!enabled) {
        updated = updated.filter(m => m !== method);
      }
      return { ...prev, supportedMethods: updated };
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    if ((formData.supportedMethods || []).length === 0) {
      toast.error('Please select at least one supported MFA method');
      return;
    }
    schoolStore.updateMFASettings(formData);
    setIsDirty(false);
    toast.success('Two-factor authentication settings saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Two-Factor Authentication (2FA / MFA)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enforce multi-factor verification to safeguard privileged accounts and sensitive student records.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-sm">MFA Provider Status: Awaiting Backend Gateway</div>
          <p className="leading-relaxed opacity-90">
            SMS gateways (Twilio/AWS SNS) and TOTP secret generation engines are currently unattached. 
            The controls below manage your institutional compliance policy which activates immediately once your SMS/Auth provider is linked.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enforcement Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              MFA Enforcement Policy
            </CardTitle>
            <CardDescription className="text-xs">
              Determine which user categories are required to authenticate with a second factor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enforcePolicy">Institutional Requirement</Label>
              <Select 
                value={formData.enforcement} 
                onValueChange={(val: any) => handleEnforcementChange(val)}
              >
                <SelectTrigger id="enforcePolicy">
                  <SelectValue placeholder="Select enforcement tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIONAL">Optional (Users opt-in independently)</SelectItem>
                  <SelectItem value="REQUIRED_FOR_ADMINS">Mandatory for School Administrators Only</SelectItem>
                  <SelectItem value="REQUIRED_FOR_ALL">Mandatory for All Faculty & Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When mandatory, users without configured 2FA are routed to a setup prompt upon their next login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supported Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Permitted Verification Methods
            </CardTitle>
            <CardDescription className="text-xs">
              Allowable secondary validation mechanisms for users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" />
                  Authenticator App (TOTP)
                </div>
                <div className="text-xs text-muted-foreground">Google Authenticator, Microsoft Authenticator, 1Password</div>
              </div>
              <Switch 
                checked={(formData.supportedMethods || []).includes('TOTP')}
                onCheckedChange={(val) => handleToggleMethod('TOTP', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS One-Time Passcode (OTP)
                </div>
                <div className="text-xs text-muted-foreground">6-digit security code sent to verified mobile phone</div>
              </div>
              <Switch 
                checked={(formData.supportedMethods || []).includes('SMS')}
                onCheckedChange={(val) => handleToggleMethod('SMS', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-primary" />
                  Email One-Time Code
                </div>
                <div className="text-xs text-muted-foreground">Fallback passcode sent to registered email address</div>
              </div>
              <Switch 
                checked={(formData.supportedMethods || []).includes('EMAIL')}
                onCheckedChange={(val) => handleToggleMethod('EMAIL', val)}
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
