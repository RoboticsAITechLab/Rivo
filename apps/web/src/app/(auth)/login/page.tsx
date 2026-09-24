'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Phone,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/school';

  const { login, verifyMfaChallenge, user, authState } = useAuth();

  const [authMode, setAuthMode] = useState<'STAFF' | 'PARENT'>('STAFF');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Parent OTP State
  const [parentType, setParentType] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Form submission and server error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // MFA 2-Step Verification State
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Countdown timer for OTP cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user) {
      if (user.scope === 'PLATFORM' || user.roleType === 'OWNER' || user.roleType === 'PLATFORM_ADMIN') {
        router.replace('/platform/dashboard');
      } else if (user.roleType === 'TEACHER') {
        const dest = returnUrl && returnUrl !== '/school' ? returnUrl : '/teacher/dashboard';
        router.replace(dest);
      } else if (user.roleType === 'PARENT') {
        router.replace('/parent');
      } else if (
        user.roleType === 'DIRECTOR' ||
        user.roleType === 'PRINCIPAL' ||
        user.roleType === 'ADMIN' ||
        user.roleType === 'SCHOOL_ADMIN' ||
        user.roleType === 'STAFF'
      ) {
        router.replace(returnUrl || '/school');
      } else {
        router.replace('/access-denied');
      }
    }
  }, [authState, user, router, returnUrl]);

  const validateForm = (): boolean => {
    let isValid = true;
    setServerError(null);

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Enter a valid email address.');
        isValid = false;
      } else {
        setEmailError(null);
      }
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      // 1. If MFA challenge is required
      if (result.success && result.mfaRequired && result.mfaChallengeToken) {
        setMfaChallengeToken(result.mfaChallengeToken);
        setMfaStep(true);
        setPassword(''); // Clear password from browser memory
        setMfaError(null);
        return;
      }

      // 2. Direct session established
      if (result.success && result.user) {
        if (result.user.roleType === 'TEACHER') {
          const dest = returnUrl && returnUrl !== '/school' ? returnUrl : '/teacher/dashboard';
          window.location.href = dest;
        } else if (result.user.roleType === 'PARENT') {
          window.location.href = '/parent';
        } else if (
          result.user.roleType === 'SCHOOL_ADMIN' ||
          result.user.roleType === 'ADMIN' ||
          result.user.roleType === 'OWNER'
        ) {
          window.location.href = returnUrl || '/school';
        } else {
          router.replace('/access-denied');
        }
      } else {
        const errorMsg =
          result.error ||
          (result.errorCode === 'INVALID_CREDENTIALS'
            ? 'Invalid email or password.'
            : result.errorCode === 'NETWORK_ERROR'
            ? 'Unable to connect. Please try again.'
            : result.errorCode === 'SERVICE_UNAVAILABLE'
            ? 'Authentication service is currently unavailable.'
            : 'Something went wrong. Please try again.');

        setServerError(errorMsg);
      }
    } catch {
      setServerError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendParentOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setServerError(null);
    const identifier = parentType === 'PHONE' ? parentPhone.trim() : parentEmail.trim();
    if (!identifier) {
      setServerError(`Please enter your registered ${parentType === 'PHONE' ? 'mobile number' : 'email address'}.`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/parent/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentType === 'PHONE' ? { phone: identifier } : { email: identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || 'Failed to send verification code.');
      } else {
        setOtpSent(true);
        setMaskedTarget(data.identifier || identifier);
        setCooldown(data.cooldownSeconds || 60);
      }
    } catch {
      setServerError('Network error while requesting verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyParentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setServerError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const identifier = parentType === 'PHONE' ? parentPhone.trim() : parentEmail.trim();
      const res = await fetch('/api/auth/parent/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(parentType === 'PHONE' ? { phone: identifier } : { email: identifier }),
          code: cleanOtp,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || 'Invalid or expired verification code.');
        return;
      }

      // Check if MFA is required
      if (data.mfaRequired && data.challengeToken) {
        setMfaChallengeToken(data.challengeToken);
        setMfaStep(true);
        setOtpCode('');
        setMfaError(null);
        return;
      }

      if (data.success) {
        window.location.href = '/parent';
      }
    } catch {
      setServerError('Network error while verifying code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallengeToken || isVerifyingMfa) return;

    const trimmedCode = mfaCode.trim();
    if (!trimmedCode) {
      setMfaError(useRecoveryCode ? 'Please enter a recovery code.' : 'Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingMfa(true);
    setMfaError(null);

    try {
      const result = await verifyMfaChallenge(mfaChallengeToken, trimmedCode, useRecoveryCode);

      if (result.success && result.user) {
        if (result.user.roleType === 'TEACHER') {
          const dest = returnUrl && returnUrl !== '/school' ? returnUrl : '/teacher/dashboard';
          window.location.href = dest;
        } else if (result.user.roleType === 'PARENT') {
          window.location.href = '/parent';
        } else if (
          result.user.roleType === 'SCHOOL_ADMIN' ||
          result.user.roleType === 'ADMIN' ||
          result.user.roleType === 'OWNER'
        ) {
          window.location.href = returnUrl || '/school';
        } else {
          router.replace('/access-denied');
        }
      } else {
        setMfaError(result.error || 'Invalid verification code. Please check and try again.');
      }
    } catch {
      setMfaError('Unable to verify code. Please try again.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const resetToCredentials = () => {
    setMfaStep(false);
    setMfaChallengeToken(null);
    setMfaCode('');
    setMfaError(null);
    setUseRecoveryCode(false);
  };

  // STEP 2: MFA VERIFICATION CARD
  if (mfaStep) {
    return (
      <Card className="shadow-sm border-slate-200/80 bg-white animate-in fade-in-50 duration-200">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                Two-Factor Verification
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {useRecoveryCode
                  ? 'Enter one of your 8-character single-use recovery codes.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleMfaSubmit} noValidate>
          <CardContent className="space-y-4">
            {mfaError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-800">Verification Failed</p>
                  <p>{mfaError}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="mfaCode"
                className="block text-xs font-semibold text-slate-700"
              >
                {useRecoveryCode ? 'Recovery Code' : '6-Digit Authenticator Code'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  inputMode={useRecoveryCode ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={isVerifyingMfa}
                  maxLength={useRecoveryCode ? 16 : 6}
                  value={mfaCode}
                  onChange={(e) => {
                    const val = useRecoveryCode
                      ? e.target.value.toUpperCase()
                      : e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMfaCode(val);
                    if (mfaError) setMfaError(null);
                  }}
                  placeholder={useRecoveryCode ? 'e.g. A1B2-C3D4' : '000000'}
                  className="pl-9 font-mono tracking-widest text-center text-base sm:text-lg h-11 border-slate-200 font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {useRecoveryCode
                  ? 'Each recovery code can only be used once.'
                  : 'Codes rotate every 30 seconds.'}
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setMfaCode('');
                  setMfaError(null);
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline outline-none"
              >
                {useRecoveryCode
                  ? 'Use authenticator app code instead'
                  : 'Lost your device? Use recovery code'}
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              disabled={isVerifyingMfa || (!useRecoveryCode && mfaCode.length !== 6)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 text-xs sm:text-sm h-10 shadow-sm"
            >
              {isVerifyingMfa ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Verifying code...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            <button
              type="button"
              onClick={resetToCredentials}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to email and password
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // STEP 1: CREDENTIALS CARD
  return (
    <Card className="shadow-sm border-slate-200/80 bg-white">
      <CardHeader className="space-y-3 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            {authMode === 'PARENT' ? 'Parent Portal' : 'Welcome back'}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {authMode === 'PARENT'
              ? 'Sign in with your registered mobile number or email using one-time verification.'
              : 'Sign in to your school staff or administrator account.'}
          </CardDescription>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('STAFF');
              setServerError(null);
            }}
            className={`py-1.5 rounded-md transition-all ${
              authMode === 'STAFF'
                ? 'bg-white shadow text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('PARENT');
              setServerError(null);
            }}
            className={`py-1.5 rounded-md transition-all ${
              authMode === 'PARENT'
                ? 'bg-white shadow text-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Parent Portal (OTP)
          </button>
        </div>
      </CardHeader>

      {/* PARENT LOGIN FORM */}
      {authMode === 'PARENT' ? (
        <form onSubmit={otpSent ? handleVerifyParentOtp : handleSendParentOtp} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-800">Authentication failed</p>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            {!otpSent ? (
              <>
                <div className="flex items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setParentType('PHONE');
                      setServerError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                      parentType === 'PHONE'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParentType('EMAIL');
                      setServerError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                      parentType === 'EMAIL'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </button>
                </div>

                {parentType === 'PHONE' ? (
                  <div className="space-y-1.5">
                    <label htmlFor="parentPhone" className="block text-xs font-semibold text-slate-700">
                      Registered Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="parentPhone"
                        type="tel"
                        inputMode="tel"
                        disabled={isSendingOtp}
                        value={parentPhone}
                        onChange={(e) => {
                          setParentPhone(e.target.value);
                          if (serverError) setServerError(null);
                        }}
                        placeholder="e.g. 9876543210 or +91 98765 43210"
                        className="pl-9 text-xs sm:text-sm border-slate-200"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standard Indian mobile numbers will automatically resolve to +91 format.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="parentEmail" className="block text-xs font-semibold text-slate-700">
                      Registered Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="parentEmail"
                        type="email"
                        inputMode="email"
                        disabled={isSendingOtp}
                        value={parentEmail}
                        onChange={(e) => {
                          setParentEmail(e.target.value);
                          if (serverError) setServerError(null);
                        }}
                        placeholder="parent@example.com"
                        className="pl-9 text-xs sm:text-sm border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Code Dispatched</p>
                    <p className="text-[11px] opacity-90">
                      We sent a 6-digit verification code to <span className="font-mono font-bold">{maskedTarget}</span>.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="otpCode" className="block text-xs font-semibold text-slate-700">
                    Enter 6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      disabled={isVerifyingOtp}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (serverError) setServerError(null);
                      }}
                      placeholder="000000"
                      className="pl-9 text-center font-mono font-bold text-base sm:text-lg tracking-widest h-11 border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setServerError(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                  >
                    Change {parentType === 'PHONE' ? 'phone' : 'email'}
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || isSendingOtp}
                    onClick={() => handleSendParentOtp()}
                    className={`font-semibold ${
                      cooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-primary hover:underline cursor-pointer'
                    }`}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            {!otpSent ? (
              <Button
                type="submit"
                disabled={isSendingOtp}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 text-xs sm:text-sm h-10 shadow-sm"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending verification code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 text-xs sm:text-sm h-10 shadow-sm"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying code...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
            )}

            <div className="w-full text-center border-t border-slate-100 pt-3">
              <p className="text-[11px] text-slate-500">
                School-enrolled parent accounts are pre-registered by school administration.
              </p>
            </div>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleCredentialsSubmit} noValidate>
        <CardContent className="space-y-4">
          {/* Server / Auth Error Alert */}
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-800">Authentication failed</p>
                <p>{serverError}</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={() => {
                  if (email.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email.trim())) {
                      setEmailError('Enter a valid email address.');
                    }
                  }
                }}
                placeholder="admin@school.edu"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`pl-9 text-xs sm:text-sm ${
                  emailError
                    ? 'border-red-500 focus-visible:ring-red-400'
                    : 'border-slate-200'
                }`}
              />
            </div>
            {emailError && (
              <p
                id="email-error"
                role="alert"
                className="text-[11px] text-red-600 font-medium"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field with Visibility Toggle */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter your password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`pl-9 pr-10 text-xs sm:text-sm ${
                  passwordError
                    ? 'border-red-500 focus-visible:ring-red-400'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {passwordError && (
              <p
                id="password-error"
                role="alert"
                className="text-[11px] text-red-600 font-medium"
              >
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember me and Forgot password row */}
          <div className="flex items-center justify-between pt-0.5 text-xs">
            <label
              htmlFor="remember-device"
              className="flex items-center gap-2 text-slate-600 select-none cursor-pointer"
            >
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberMe}
                disabled={isSubmitting}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span>Remember this device</span>
            </label>

            <Link
              href="/forgot-password"
              className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-1"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 text-xs sm:text-sm h-10 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Link to School Admin Signup */}
          <div className="w-full text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                Create school account
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-sm border-slate-200/80 bg-white p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-xs text-slate-500">Loading sign in portal...</p>
          </div>
        </Card>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
