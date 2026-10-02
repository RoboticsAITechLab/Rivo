'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PasswordPolicy } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  Lock, 
  Save, 
  ShieldCheck, 
  Key, 
  AlertOctagon, 
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const defaultPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  expiryDays: 0,
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
};

export default function PasswordPolicySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(1440);

  const {
    currentValues: formData,
    setCurrentValues: setFormData,
    isDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
  } = useUnsavedChanges<PasswordPolicy>(defaultPolicy);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=security');
      const json = await res.json();
      if (res.ok && json.data?.passwordPolicy) {
        setFormData(json.data.passwordPolicy);
        setSessionTimeout(json.data.sessionTimeoutMinutes || 1440);
        markSaved(json.data.passwordPolicy);
      }
    } catch (err) {
      console.error('Failed to load password policy settings:', err);
      toast.error('Failed to load institutional security settings');
    } finally {
      setLoading(false);
    }
  }, [markSaved, setFormData]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = <K extends keyof PasswordPolicy>(key: K, value: PasswordPolicy[K]) => {
    setFormData({ ...formData, [key]: value });
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
            sessionTimeoutMinutes: sessionTimeout,
            passwordPolicy: formData,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save security policy');
      }

      markSaved(formData);
      toast.success('Institutional password complexity and lockout policy saved and enforced.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Password Policy & Account Lockout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enforce password complexity standards, rotation rules, and brute-force lockout safeguards.
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
            {saving ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complexity Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Password Complexity
            </CardTitle>
            <CardDescription className="text-xs">
              Character standards required when setting or changing passwords.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label htmlFor="minLength" className="text-sm font-medium">Minimum Password Length</Label>
                <span className="font-mono font-bold text-xs text-primary">{formData.minLength} characters</span>
              </div>
              <Input 
                id="minLength"
                type="number"
                min={8}
                max={32}
                value={formData.minLength}
                onChange={(e) => handleChange('minLength', Number(e.target.value))}
                className="font-mono mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Require Uppercase Letter (A-Z)</div>
                <div className="text-xs text-muted-foreground">At least one capital letter</div>
              </div>
              <Switch 
                checked={formData.requireUppercase}
                onCheckedChange={(val) => handleChange('requireUppercase', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Require Lowercase Letter (a-z)</div>
                <div className="text-xs text-muted-foreground">At least one lowercase letter</div>
              </div>
              <Switch 
                checked={formData.requireLowercase}
                onCheckedChange={(val) => handleChange('requireLowercase', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Require Numerical Digit (0-9)</div>
                <div className="text-xs text-muted-foreground">At least one digit</div>
              </div>
              <Switch 
                checked={formData.requireNumbers}
                onCheckedChange={(val) => handleChange('requireNumbers', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Require Special Character (!@#$%)</div>
                <div className="text-xs text-muted-foreground">Non-alphanumeric punctuation symbol</div>
              </div>
              <Switch 
                checked={formData.requireSpecialChars}
                onCheckedChange={(val) => handleChange('requireSpecialChars', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expiry & Lockout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Password Rotation
              </CardTitle>
              <CardDescription className="text-xs">
                Force users to periodically update their access credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDays">Password Expiration</Label>
                <Select 
                  value={String(formData.expiryDays)} 
                  onValueChange={(val) => handleChange('expiryDays', Number(val))}
                >
                  <SelectTrigger id="expiryDays">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Never Expire (Standard)</SelectItem>
                    <SelectItem value="30">Every 30 Days (High Security)</SelectItem>
                    <SelectItem value="60">Every 60 Days</SelectItem>
                    <SelectItem value="90">Every 90 Days (Quarterly)</SelectItem>
                    <SelectItem value="180">Every 180 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-destructive" />
                Brute Force Protection & Lockout
              </CardTitle>
              <CardDescription className="text-xs">
                Temporarily lock user accounts after successive invalid authentication attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Failed Attempts Before Lockout</Label>
                <Select 
                  value={String(formData.maxFailedAttempts)} 
                  onValueChange={(val) => handleChange('maxFailedAttempts', Number(val))}
                >
                  <SelectTrigger id="maxAttempts">
                    <SelectValue placeholder="Select limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Consecutive Failures (Strict)</SelectItem>
                    <SelectItem value="5">5 Consecutive Failures (Standard)</SelectItem>
                    <SelectItem value="10">10 Consecutive Failures (Lenient)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration</Label>
                <Select 
                  value={String(formData.lockoutMinutes)} 
                  onValueChange={(val) => handleChange('lockoutMinutes', Number(val))}
                >
                  <SelectTrigger id="lockoutDuration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">60 Minutes (1 Hour)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
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

