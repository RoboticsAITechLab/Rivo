'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      <div className="relative w-full max-w-md space-y-6">
        <Card className="shadow-md border-border/80 bg-card text-center">
          <CardHeader className="space-y-2 pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Access Restricted</CardTitle>
            <CardDescription className="text-xs">
              403 • Insufficient Role Privileges
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              Your active user role does not possess authorization to view or manipulate this institutional module.
            </p>
            <div className="p-3 bg-muted/20 rounded-md border border-border/40 text-[11px] text-left">
              <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-primary" />
                Need Access?
              </div>
              Contact your designated School Administrator to request elevated functional permissions or a role reassignment.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/school" className="w-full">
              <Button className="w-full gap-2 text-xs">
                <Home className="h-3.5 w-3.5" />
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/school/settings/permissions" className="w-full">
              <Button variant="outline" className="w-full gap-2 text-xs">
                View Matrix
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
