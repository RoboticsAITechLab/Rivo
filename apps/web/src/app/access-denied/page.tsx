'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="relative w-full max-w-md space-y-6">
        <Card className="shadow-sm border-slate-200/80 bg-white text-center">
          <CardHeader className="space-y-2 pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
              Access denied
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              403 • Authorization Boundary
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>
              Your account does not have permission to access this area.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/school" className="w-full">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs h-9">
                <Home className="h-3.5 w-3.5" />
                Go to Dashboard
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full gap-2 text-xs h-9 text-slate-700 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
