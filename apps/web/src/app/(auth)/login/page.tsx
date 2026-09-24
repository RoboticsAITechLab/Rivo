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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  // Redirect if already authenticated
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user) {
      if (user.scope === 'PLATFORM' || user.roleType === 'OWNER' || user.roleType === 'PLATFORM_ADMIN') {
        router.replace('/platform/dashboard');
      } else if (user.roleType === 'TEACHER') {
        const dest = returnUrl && returnUrl !== '/school' ? returnUrl : '/teacher/dashboard';
        router.replace(dest);
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
      <CardHeader className="space-y-1.5 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sign in to your school account.
          </CardDescription>
        </div>
      </CardHeader>

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
