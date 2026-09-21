'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Mail, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    // Transition to dashboard
    setTimeout(() => {
      router.push('/school');
    }, 600);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      {/* Background ambient accent */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[360px] w-[460px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                RIVO
              </h1>
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                School OS
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              Institution Management & Access Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Sign in to your portal</CardTitle>
            <CardDescription className="text-xs">
              Enter your institutional credentials to access your authorized school modules
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <FormField
                id="email"
                label="Institutional Email"
                required
                disabled={isSubmitting}
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
              </FormField>

              <FormField
                id="password"
                label="Password"
                required
                disabled={isSubmitting}
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
              </FormField>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isSubmitting}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-muted-foreground select-none cursor-pointer"
                  >
                    Remember device
                  </label>
                </div>

                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {isSubmitting && (
                <div className="rounded-md bg-primary/10 p-3 text-xs text-primary font-medium flex items-center gap-2 animate-in fade-in-0">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Validating session credentials...</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-1">
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to School Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="w-full rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Awaiting Backend Link:</span> Client auth boundary is live. Once API gateway is attached, logins will verify against database credentials.
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer links */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <Link href="/school" className="hover:text-foreground underline underline-offset-4">
            Direct to Dashboard
          </Link>
          <span>Rivo School Ecosystem</span>
        </div>
      </div>
    </div>
  );
}
