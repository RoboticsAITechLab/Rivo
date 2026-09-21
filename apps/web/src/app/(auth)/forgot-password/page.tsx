'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      toast.success('Password recovery email dispatched');
    }, 800);
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
              Account Recovery Service
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Reset your password</CardTitle>
            <CardDescription className="text-xs">
              Enter your registered institutional email to receive a password reset link.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4 pt-2 text-center">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg border border-border/40">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Recovery Link Dispatched</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, a secure password restoration link has been queued.
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Return to Sign In
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Registered Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      required
                      placeholder="you@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-2">
                <Button type="submit" disabled={isLoading} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  {isLoading ? 'Sending Link...' : 'Send Recovery Link'}
                </Button>

                <Link href="/login" className="w-full">
                  <Button variant="ghost" size="sm" type="button" className="w-full gap-2 text-xs text-muted-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
