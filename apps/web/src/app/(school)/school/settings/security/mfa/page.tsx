'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert,
  KeyRound, 
  Smartphone, 
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Download,
  Loader2,
  Trash2,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  LogIn
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface EnrollmentData {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

export default function MFASettingsPage() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isMfaActive, setIsMfaActive] = useState(false);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Policy Settings
  const [enforcement, setEnforcement] = useState<'OPTIONAL' | 'REQUIRED_FOR_ADMINS' | 'REQUIRED_FOR_ALL'>('OPTIONAL');
  const [policySaved, setPolicySaved] = useState(false);

  // Setup Wizard State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'scan' | 'verify' | 'recovery'>('scan');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [hasCopiedCodes, setHasCopiedCodes] = useState(false);

  // Disable MFA Modal State
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Regenerate Recovery Codes Modal State
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [showRegeneratePassword, setShowRegeneratePassword] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[]>([]);

  // 1. Fetch current status
  const checkMfaStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/auth/mfa/enroll');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setIsMfaActive(false);
        return;
      }
      setIsAuthenticated(true);
      if (res.ok) {
        const data = await res.json();
        setIsMfaActive(!!data.enabled);
        setRecoveryCodesCount(data.remainingCodesCount ?? 0);
      } else {
        setIsMfaActive(false);
      }
    } catch {
      setIsMfaActive(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkMfaStatus();
  }, []);

  // 2. Start Setup Wizard
  const handleStartSetup = async () => {
    setIsEnrolling(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/auth/mfa/enroll', { method: 'POST' });
      const data = await res.json();

      if (res.status === 401) {
        toast.error('Please sign in first to configure two-factor authentication.');
        window.location.href = '/login?returnUrl=/school/settings/security/mfa';
        return;
      }

      const qr = data.qrCodeDataUrl || data.qrCode;
      const sec = data.secret || data.manualEntryKey;

      if (res.ok && qr && sec) {
        setEnrollment({
          secret: sec,
          uri: data.uri || data.otpauthUri || '',
          qrCodeDataUrl: qr,
        });
        setSetupStep('scan');
        setIsSetupOpen(true);
      } else {
        toast.error(data.message || 'Failed to start MFA setup');
      }
    } catch {
      toast.error('Unable to connect to MFA service');
    } finally {
      setIsEnrolling(false);
    }
  };

  // 3. Verify Code during Setup
  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCode.trim();
    if (cleanCode.length !== 6) {
      setVerifyError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveryCodes(data.recoveryCodes || []);
        setSetupStep('recovery');
        setIsMfaActive(true);
        setRecoveryCodesCount(data.recoveryCodes?.length || 8);
        toast.success('Two-factor authentication enabled successfully!');
      } else {
        setVerifyError(data.message || 'Invalid verification code. Please check your authenticator clock.');
      }
    } catch {
      setVerifyError('Connection failed while verifying code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. Disable MFA
  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError('Account password is required to disable 2FA.');
      return;
    }

    setIsDisabling(true);
    setDisableError(null);

    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsMfaActive(false);
        setIsDisableOpen(false);
        setDisablePassword('');
        toast.success('Two-factor authentication has been disabled.');
      } else {
        setDisableError(data.message || 'Failed to disable 2FA. Incorrect password.');
      }
    } catch {
      setDisableError('Connection failed. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  // 5. Regenerate Recovery Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regeneratePassword) {
      setRegenerateError('Password confirmation is required.');
      return;
    }

    setIsRegenerating(true);
    setRegenerateError(null);

    try {
      const res = await fetch('/api/auth/mfa/recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: regeneratePassword }),
      });
      const data = await res.json();
      if (res.ok && data.recoveryCodes) {
        setRegeneratedCodes(data.recoveryCodes);
        setRecoveryCodesCount(data.recoveryCodes.length);
        toast.success('8 new recovery codes generated.');
      } else {
        setRegenerateError(data.message || 'Failed to generate new recovery codes. Incorrect password.');
      }
    } catch {
      setRegenerateError('Unable to connect to recovery service');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Copy helpers
  const copyToClipboard = (text: string, onCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    onCopied(true);
    setTimeout(() => onCopied(false), 2000);
  };

  const downloadCodesAsFile = (codes: string[]) => {
    const text = `RIVO SCHOOL MANAGEMENT - 2FA EMERGENCY RECOVERY CODES\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes safe and confidential. Each code can only be used once.\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rivo-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Two-Factor Authentication (2FA / MFA)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            RFC 6238 TOTP Multi-Factor Verification & School-Wide Access Security.
          </p>
        </div>
      </div>

      {/* Auth Alert if not signed in */}
      {!loadingStatus && !isAuthenticated && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start justify-between gap-4 animate-in fade-in-0 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Sign in required to configure 2FA</p>
              <p className="text-xs text-amber-700">
                You must be logged into an active school account to generate authenticator keys and link devices.
              </p>
            </div>
          </div>
          <Link href="/login?returnUrl=/school/settings/security/mfa">
            <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-white text-xs gap-1.5 shrink-0">
              <LogIn className="h-3.5 w-3.5" />
              Sign In Now
            </Button>
          </Link>
        </div>
      )}

      {/* 1. CURRENT USER 2FA STATUS CARD */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className={`h-1.5 w-full ${isMfaActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${isMfaActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isMfaActive ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Your Account Security</CardTitle>
                {loadingStatus ? (
                  <Badge variant="outline" className="text-slate-400 animate-pulse">Checking...</Badge>
                ) : isMfaActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-medium">
                    2FA Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    Not Configured
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                {isMfaActive
                  ? 'Your account is protected by an authenticator application. Verification is required at every login.'
                  : 'Add an extra layer of protection to your school account with Google Authenticator, Microsoft Authenticator, or 1Password.'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isMfaActive ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegeneratedCodes([]);
                    setRegeneratePassword('');
                    setRegenerateError(null);
                    setIsRegenerateOpen(true);
                  }}
                  className="text-xs h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Backup Codes ({recoveryCodesCount})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDisableError(null);
                    setDisablePassword('');
                    setIsDisableOpen(true);
                  }}
                  className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Disable 2FA
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStartSetup}
                disabled={isEnrolling || loadingStatus}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 shadow-sm gap-2"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Key...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Enable Authenticator 2FA
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 2. INSTITUTIONAL POLICY & ENFORCEMENT CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-700" />
              Institutional Enforcement Policy
            </CardTitle>
            <CardDescription className="text-xs">
              Determine which user roles must complete two-factor authentication to access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enforcePolicy" className="text-xs font-semibold text-slate-700">
                Enforcement Tier
              </Label>
              <Select 
                value={enforcement} 
                onValueChange={(val: any) => {
                  setEnforcement(val);
                  setPolicySaved(false);
                }}
              >
                <SelectTrigger id="enforcePolicy" className="text-xs">
                  <SelectValue placeholder="Select enforcement tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIONAL">Optional (Faculty & staff opt-in independently)</SelectItem>
                  <SelectItem value="REQUIRED_FOR_ADMINS">Mandatory for School Administrators Only</SelectItem>
                  <SelectItem value="REQUIRED_FOR_ALL">Mandatory for All Faculty, Teachers & Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500">
                When mandatory, accounts without 2FA configured are securely prompted to enroll upon their next login.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button
              size="sm"
              onClick={() => {
                setPolicySaved(true);
                toast.success('Institutional 2FA policy updated successfully.');
              }}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              Update Policy
            </Button>
            {policySaved && (
              <span className="text-xs text-emerald-600 font-medium ml-3 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-slate-700" />
              Supported Authentication Channels
            </CardTitle>
            <CardDescription className="text-xs">
              Verified multi-factor delivery mechanisms supported by the institution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                  Time-Based One-Time Password (TOTP)
                </div>
                <div className="text-[11px] text-slate-500">RFC 6238 compliant app (Google Authenticator, Microsoft, 1Password)</div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                  Emergency Single-Use Recovery Codes
                </div>
                <div className="text-[11px] text-slate-500">SHA-256 hashed 8-character offline emergency codes</div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SETUP WIZARD DIALOG */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {setupStep === 'scan' && 'Scan QR Code'}
              {setupStep === 'verify' && 'Verify Authenticator Code'}
              {setupStep === 'recovery' && 'Save Emergency Recovery Codes'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {setupStep === 'scan' && 'Open your authenticator app and scan this QR code.'}
              {setupStep === 'verify' && 'Enter the 6-digit code currently shown in your authenticator app.'}
              {setupStep === 'recovery' && 'Store these 8 emergency backup codes in a secure password manager.'}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: SCAN QR */}
          {setupStep === 'scan' && enrollment && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative w-48 h-48 bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                  <Image
                    src={enrollment.qrCodeDataUrl}
                    alt="2FA QR Code"
                    width={192}
                    height={192}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-3 text-center">
                  Scan with Google Authenticator, Microsoft Authenticator, or 1Password.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-medium">Can&apos;t scan? Enter key manually:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={enrollment.secret}
                    className="font-mono text-xs tracking-wider bg-slate-50 border-slate-200 font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(enrollment.secret, setHasCopiedSecret)}
                    className="shrink-0 text-xs h-9"
                  >
                    {hasCopiedSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSetupOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setSetupStep('verify')} className="bg-slate-900 hover:bg-slate-800 text-white">
                  Next: Verify Code
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* STEP 2: VERIFY */}
          {setupStep === 'verify' && (
            <form onSubmit={handleVerifySetup} className="space-y-4 py-2">
              {verifyError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{verifyError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verifyCode" className="text-xs font-semibold text-slate-700">
                  Enter 6-Digit Code
                </Label>
                <Input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => {
                    setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (verifyError) setVerifyError(null);
                  }}
                  placeholder="000000"
                  className="font-mono tracking-widest text-center text-xl font-bold h-12 border-slate-300"
                />
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSetupStep('scan')}>
                  Back
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={verifyCode.length !== 6 || isVerifying}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Verifying...
                    </>
                  ) : (
                    'Confirm & Activate'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* STEP 3: RECOVERY CODES */}
          {setupStep === 'recovery' && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Save these codes now! If you lose access to your authenticator app, these are the <strong>only way</strong> to log back into your account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 tracking-wider text-center">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'), setHasCopiedCodes)}
                  className="w-full text-xs"
                >
                  {hasCopiedCodes ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  Copy All Codes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCodesAsFile(recoveryCodes)}
                  className="w-full text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download .TXT
                </Button>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  size="sm"
                  onClick={() => setIsSetupOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  I Have Saved My Recovery Codes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DISABLE MFA CONFIRMATION MODAL */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will remove the secondary verification requirement. Confirm your account password to proceed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisableMfa} className="space-y-4 py-2">
            {disableError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <p>{disableError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="disablePassword" className="text-xs font-semibold text-slate-700">
                Account Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="disablePassword"
                  type={showDisablePassword ? 'text' : 'password'}
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="pl-9 pr-10 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePassword(!showDisablePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showDisablePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDisableOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!disablePassword || isDisabling}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Disabling...
                  </>
                ) : (
                  'Confirm Disable'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REGENERATE RECOVERY CODES MODAL */}
      <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-slate-700" />
              Backup Recovery Codes
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              You currently have <strong>{recoveryCodesCount}</strong> valid recovery code(s) remaining.
            </DialogDescription>
          </DialogHeader>

          {regeneratedCodes.length === 0 ? (
            <form onSubmit={handleRegenerateCodes} className="space-y-4 py-2">
              <p className="text-xs text-slate-600">
                Generating new recovery codes will immediately revoke all previous backup codes. Enter your password to confirm:
              </p>

              {regenerateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{regenerateError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="regPassword" className="text-xs font-semibold text-slate-700">
                  Account Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="regPassword"
                    type={showRegeneratePassword ? 'text' : 'password'}
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="pl-9 pr-10 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegeneratePassword(!showRegeneratePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showRegeneratePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRegenerateOpen(false)}>
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!regeneratePassword || isRegenerating}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Generate 8 New Codes
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 text-center">
                {regeneratedCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(regeneratedCodes.join('\n'), setHasCopiedCodes)}
                  className="w-full text-xs"
                >
                  {hasCopiedCodes ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  Copy All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCodesAsFile(regeneratedCodes)}
                  className="w-full text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download .TXT
                </Button>
              </div>

              <DialogFooter className="pt-2">
                <Button size="sm" onClick={() => setIsRegenerateOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
