'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  Copy,
  Check,
  Loader2,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
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
import { toast } from 'sonner';

interface EnrollmentData {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

export function AccountMfaCard({ title, description }: { title?: string; description?: string }) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isMfaActive, setIsMfaActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isEnforced, setIsEnforced] = useState(false);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState<number>(0);

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

  // Disable Modal State
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // 1. Fetch live MFA status
  const checkMfaStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/auth/mfa/enroll');
      if (res.ok) {
        const data = await res.json();
        setIsMfaActive(!!data.enabled && !!data.verified);
        setIsVerified(!!data.verified);
        setIsEnforced(!!data.enforced);
        setRecoveryCodesCount(data.remainingCodesCount ?? 0);
      } else {
        setIsMfaActive(false);
        setIsVerified(false);
        setIsEnforced(false);
      }
    } catch {
      setIsMfaActive(false);
      setIsVerified(false);
      setIsEnforced(false);
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
        setVerifyCode('');
        setIsSetupOpen(true);
      } else {
        toast.error(data.message || 'Failed to initialize MFA setup');
      }
    } catch {
      toast.error('Unable to connect to MFA security service');
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
        setIsVerified(true);
        setRecoveryCodesCount(data.recoveryCodes?.length || 8);
        toast.success('Two-factor authentication verified and enabled successfully!');
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
        setIsVerified(false);
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

  const copySecret = () => {
    if (!enrollment?.secret) return;
    navigator.clipboard.writeText(enrollment.secret);
    setHasCopiedSecret(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setHasCopiedSecret(false), 2000);
  };

  const copyRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setHasCopiedCodes(true);
    toast.success('Recovery codes copied to clipboard');
    setTimeout(() => setHasCopiedCodes(false), 2000);
  };

  return (
    <>
      {/* NOTICE BANNER: Displayed when Director has enforced MFA but user has not verified yet */}
      {isEnforced && !isVerified && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-amber-950 dark:text-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Notice: Two-Factor Authentication Enforced by School Director
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-xl">
              Your School Director has required Multi-Factor Authentication (MFA) on your account. 
              MFA is <strong>not yet set up</strong>. Please scan your QR code and connect your authenticator app now.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStartSetup}
            disabled={isEnrolling}
            className="shrink-0 h-8.5 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <QrCode className="h-3.5 w-3.5" />
            Setup Authenticator Now
          </Button>
        </div>
      )}

      <Card className="border-border/80 shadow-2xs bg-card/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {title || 'Account Security & Two-Factor Authentication (MFA)'}
              </CardTitle>
              <CardDescription className="text-xs">
                {description ||
                  'Enforce Google Authenticator or Microsoft Authenticator verification upon login to protect financial operations.'}
              </CardDescription>
            </div>
            <div>
              {loadingStatus ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Checking status...
                </div>
              ) : isEnforced && !isVerified ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  MFA Enforced (Setup Required)
                </Badge>
              ) : isMfaActive && isVerified ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  2FA Active &amp; Verified (Protected)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  2FA Not Configured
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                TOTP Authenticator Verification (RFC 6238)
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
                {isEnforced && !isVerified
                  ? 'Your School Director has required 2FA on this account. It is currently unverified. Click "Setup Authenticator" to scan your QR code.'
                  : isMfaActive && isVerified
                  ? `Your financial account is secured with time-based 6-digit codes. ${recoveryCodesCount} backup recovery codes remaining.`
                  : 'Multi-factor authentication adds an essential layer of security for fee ledger and receipt issuing accounts.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isMfaActive && isVerified ? (
                <>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={handleStartSetup}
                    disabled={isEnrolling}
                    className="text-xs h-8 gap-1.5 font-semibold"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Reconfigure 2FA
                  </Button>
                  <Link href="/school/settings/security/mfa">
                    <Button variant="outline" size="sm" type="button" className="text-xs h-8 gap-1.5">
                      Security Workspace
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  {isEnforced ? (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled
                      title="MFA is enforced by the School Director and cannot be disabled."
                      className="text-xs h-8 opacity-60 cursor-not-allowed"
                    >
                      Enforced by Director
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setDisablePassword('');
                        setDisableError(null);
                        setIsDisableOpen(true);
                      }}
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                    >
                      Disable 2FA
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  type="button"
                  onClick={handleStartSetup}
                  disabled={isEnrolling}
                  className="text-xs h-8 font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-3.5 w-3.5" />
                      {isEnforced ? 'Setup Authenticator (Required)' : 'Setup Authenticator (2FA)'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SETUP WIZARD DIALOG */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Configure Authenticator (2FA)
            </DialogTitle>
            <DialogDescription className="text-xs">
              {setupStep === 'scan' && 'Scan the QR code below using Google Authenticator, Microsoft Authenticator, or Authy.'}
              {setupStep === 'verify' && 'Enter the 6-digit verification code generated by your authenticator app.'}
              {setupStep === 'recovery' && 'Save these emergency recovery codes in a secure location.'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'scan' && enrollment && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center p-3 bg-white rounded-xl border border-border shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollment.qrCodeDataUrl}
                  alt="MFA QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Manual Entry Secret Key:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted/60 rounded text-xs font-mono tracking-wider break-all select-all border border-border/40">
                    {enrollment.secret}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="h-8 text-xs gap-1 shrink-0"
                  >
                    {hasCopiedSecret ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => setSetupStep('verify')}
                  className="w-full text-xs font-semibold"
                >
                  Next: Verify 6-Digit Code
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === 'verify' && (
            <form onSubmit={handleVerifySetup} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="mfaVerifyInput" className="text-xs font-medium">
                  Enter 6-Digit Code
                </Label>
                <Input
                  id="mfaVerifyInput"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center font-mono text-lg tracking-widest h-11"
                  autoFocus
                />
                {verifyError && (
                  <p className="text-[11px] text-destructive font-medium">{verifyError}</p>
                )}
              </div>

              <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSetupStep('scan')}
                  className="text-xs"
                >
                  Back to QR Code
                </Button>
                <Button
                  type="submit"
                  disabled={verifyCode.length !== 6 || isVerifying}
                  className="text-xs font-semibold"
                >
                  {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Confirm &amp; Enable 2FA
                </Button>
              </DialogFooter>
            </form>
          )}

          {setupStep === 'recovery' && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                ✓ 2-Factor Authentication is now active! If you lose access to your device, you can use these one-time recovery codes to log in.
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border font-mono text-xs text-center">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-background rounded border border-border/60">
                    {code}
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyRecoveryCodes}
                  className="text-xs gap-1.5"
                >
                  {hasCopiedCodes ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  Copy Codes
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsSetupOpen(false)}
                  className="text-xs font-semibold"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DISABLE 2FA CONFIRMATION MODAL */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your account password to remove authenticator protection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisableMfa} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="disablePasswordInput" className="text-xs font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="disablePasswordInput"
                  type={showDisablePassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="text-xs pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePassword(!showDisablePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDisablePassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {disableError && (
                <p className="text-[11px] text-destructive font-medium">{disableError}</p>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDisableOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!disablePassword || isDisabling}
                className="text-xs font-semibold"
              >
                {isDisabling ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Disable 2FA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
