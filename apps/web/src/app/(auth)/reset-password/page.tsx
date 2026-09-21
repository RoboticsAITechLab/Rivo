'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      toast.success('Password updated successfully');
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
              Create New Password
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Set new password</CardTitle>
            <CardDescription className="text-xs">
              Please enter and confirm your new institutional account password.
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="space-y-4 pt-2 text-center">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg border border-border/40">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Password Reset Complete</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your credentials have been securely updated. You may now log in to the portal.
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <Button className="w-full gap-2 text-xs">
                  Proceed to Login
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="newPassword" 
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                      disabled={isLoading}
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
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-2">
                <Button type="submit" disabled={isLoading} className="w-full gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {isLoading ? 'Updating Password...' : 'Save New Password'}
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
