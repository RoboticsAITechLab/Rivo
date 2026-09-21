'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, MailCheck, ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      toast.success('A fresh verification link has been dispatched to your email.');
    }, 700);
  };

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
              Institutional Email Verification
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Check your inbox</CardTitle>
            <CardDescription className="text-xs">
              We have sent an authentication verification link to your registered institutional address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs text-muted-foreground text-center">
            <p>
              Click the link inside the confirmation email to verify your ownership and activate your school portal permissions.
            </p>
            <div className="p-3 bg-muted/20 rounded-md border border-border/40 text-[11px]">
              Didn&apos;t receive the email? Check your spam folder or request a new verification token below.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button onClick={handleResend} disabled={isResending} variant="outline" className="w-full gap-2 text-xs">
              <Send className="h-3.5 w-3.5" />
              {isResending ? 'Resending Link...' : 'Resend Verification Email'}
            </Button>

            <Link href="/login" className="w-full">
              <Button variant="ghost" size="sm" type="button" className="w-full gap-2 text-xs text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
