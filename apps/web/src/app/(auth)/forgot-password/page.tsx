'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setServerError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return false;
    }

    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await forgotPassword({ email: email.trim() });

      if (result.success) {
        setSuccessMessage(
          result.message ||
            "If an account exists with this email address, we've sent instructions to reset your password."
        );
      } else {
        const errorMsg =
          result.error ||
          (result.errorCode === 'SERVICE_UNAVAILABLE'
            ? 'Account recovery service is currently unavailable.'
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
          Forgot your password?
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your account email and we&apos;ll help you reset your password.
        </CardDescription>
      </CardHeader>

      {successMessage ? (
        <CardContent className="space-y-4 pt-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-900">Recovery email dispatched</p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                {successMessage}
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login" className="w-full block">
              <Button variant="outline" className="w-full text-xs h-9">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Login
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
                  <p className="font-semibold text-red-800">Recovery request failed</p>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="forgotEmail"
                className="block text-xs font-semibold text-slate-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="forgotEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="admin@school.edu"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'forgot-email-error' : undefined}
                  className={`pl-9 text-xs sm:text-sm ${
                    emailError ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {emailError && (
                <p
                  id="forgot-email-error"
                  role="alert"
                  className="text-[11px] text-red-600 font-medium"
                >
                  {emailError}
                </p>
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
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
