'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface VerifiedInvitation {
  id: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
  schoolName: string;
  schoolSlug: string;
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<VerifiedInvitation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('Missing invitation security token in link.');
      return;
    }

    fetch(`/api/invitations/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid && data.invitation) {
          setInvitation(data.invitation);
        } else {
          setErrorMessage(data.message || 'This invitation link is invalid, expired, or has already been used.');
        }
      })
      .catch(() => {
        setErrorMessage('Unable to connect to verification server. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.message || 'Failed to activate account. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Your portal account has been activated!');

      const userRole = data?.user?.roleType;
      const targetRoute = userRole === 'TEACHER' ? '/teacher/dashboard' : '/school';

      setTimeout(() => {
        router.replace(targetRoute);
      }, 500);
    } catch {
      setSubmitError('Network error. Unable to complete activation.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-600">Verifying invitation credentials...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !invitation) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-md border-border/80 bg-card p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Invalid Invitation Link</h2>
            <p className="text-xs text-muted-foreground">{errorMessage || 'Invitation not found.'}</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      <div className="relative w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              RIVO
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Institutional Invitation Onboarding
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Accept Invitation</CardTitle>
            <CardDescription className="text-xs">
              Joining <strong className="text-foreground">{invitation.schoolName}</strong> as a{' '}
              <strong className="text-foreground">{invitation.role}</strong> ({invitation.email}).
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleActivate}>
            <CardContent className="space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    required
                    placeholder="e.g. Dr. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="Minimum 8 characters (uppercase, lowercase, number, symbol)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                <ShieldCheck className="h-4 w-4" />
                {isSubmitting ? 'Activating Account...' : 'Activate & Enter Portal'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading invitation details...</div>
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
