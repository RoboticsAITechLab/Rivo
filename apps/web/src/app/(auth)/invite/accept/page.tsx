'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { GraduationCap, ShieldCheck, Lock, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const store = useSchoolStore();
  const invitations = store.invitations || [];

  const invitation = invitations.find(inv => inv.id === token);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    // Register user into store
    const userRole = invitation?.role || 'Teacher';
    const userEmail = invitation?.email || 'user@institution.edu';

    schoolStore.updateUser({
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      email: userEmail,
      role: userRole,
      campusId: invitation?.campusId,
      status: 'ACTIVE',
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    });

    if (invitation) {
      // Mark invitation accepted
      schoolStore.revokeInvitation(invitation.id);
    }

    toast.success('Your portal account is activated!');
    setTimeout(() => {
      router.push('/school');
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
              Institutional Invitation Onboarding
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Accept Invitation</CardTitle>
            <CardDescription className="text-xs">
              {invitation ? (
                <span>You have been invited as a <strong className="text-foreground">{invitation.role}</strong> for {invitation.email}.</span>
              ) : (
                <span>Complete your identity setup to join your school ecosystem.</span>
              )}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleActivate}>
            <CardContent className="space-y-4">
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
                    placeholder="Minimum 8 characters"
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading invitation details...</div>
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}
