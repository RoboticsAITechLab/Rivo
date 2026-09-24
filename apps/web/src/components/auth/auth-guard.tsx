'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authState } = useAuth();

  useEffect(() => {
    if (authState === 'UNAUTHENTICATED') {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
    } else if (authState === 'AUTHENTICATED' && user) {
      const isAllowed =
        user.roleType === 'DIRECTOR' ||
        user.roleType === 'PRINCIPAL' ||
        user.roleType === 'ADMIN' ||
        user.roleType === 'SCHOOL_ADMIN' ||
        user.roleType === 'TEACHER' ||
        user.roleType === 'STAFF';

      if (!isAllowed) {
        router.replace('/access-denied');
      }
    }
  }, [authState, user, router, pathname]);

  // Loading state while session is being verified
  if (authState === 'UNKNOWN' || authState === 'AUTHENTICATING') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800 tracking-tight">
              Verifying credentials
            </p>
            <p className="text-[11px] text-slate-500">
              Securing institutional session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, render nothing while redirect occurs
  if (authState === 'UNAUTHENTICATED') {
    return null;
  }

  // If error verifying session
  if (authState === 'ERROR') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center space-y-3 shadow-sm">
          <ShieldAlert className="h-8 w-8 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Session Error</h2>
            <p className="text-xs text-slate-600">
              Unable to verify your session credentials.
            </p>
          </div>
          <Button
            onClick={() => router.replace('/login')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // If authenticated and authorized
  return <>{children}</>;
}
