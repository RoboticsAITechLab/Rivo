'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    setServerError(null);
    let valid = true;

    if (!token) {
      setServerError('Reset link is invalid or missing a security token.');
      return false;
    }

    if (!newPassword) {
      setPasswordError('New password is required.');
      valid = false;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    } else {
      setConfirmError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await resetPassword({
        token,
        newPassword,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        const errorMsg =
          result.error ||
          (result.errorCode === 'INVALID_TOKEN'
            ? 'Reset link is invalid or expired.'
            : result.errorCode === 'SERVICE_UNAVAILABLE'
            ? 'Password reset service is currently unavailable.'
            : result.errorCode === 'NETWORK_ERROR'
            ? 'Unable to connect. Please try again.'
            : 'Something went wrong. Please try again.');

        setServerError(errorMsg);
      }
    } catch {
      setServerError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200/80 bg-white">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Set new password
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter and confirm your new institutional account password.
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4 pt-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-900">Password reset complete</p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/login" className="w-full block">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-10 shadow-sm">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-800">Password reset failed</p>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            {!token && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                Warning: No recovery token detected in URL. Please use the link dispatched to your email.
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  disabled={isSubmitting}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Minimum 8 characters"
                  className={`pl-9 pr-10 text-xs sm:text-sm ${
                    passwordError ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-600 font-medium">{passwordError}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmResetPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="confirmResetPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError(null);
                  }}
                  placeholder="Re-enter new password"
                  className={`pl-9 pr-10 text-xs sm:text-sm ${
                    confirmError ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmError && (
                <p className="text-[11px] text-red-600 font-medium">{confirmError}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm h-10 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className="w-full text-center border-t border-slate-100 pt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-sm border-slate-200/80 bg-white p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-xs text-slate-500">Loading password reset portal...</p>
          </div>
        </Card>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
