'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { UserAccount } from '@/features/settings/types';
import { 
  Users, 
  ArrowLeft, 
  Save, 
  Shield, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Calendar,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const store = useSchoolStore();
  const users = store.users || [];
  const roles = store.roles || [];
  const campuses = store.campuses || [];

  const user = users.find(u => u.id === userId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [campusId, setCampusId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INVITED'>('ACTIVE');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setCampusId(user.campusId || '');
      setStatus(user.status);
      setMfaEnabled(user.mfaEnabled);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href="/school/settings/users">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">User Not Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              The user account with identifier "{userId}" does not exist in the active store.
            </p>
            <Link href="/school/settings/users">
              <Button size="sm">Return to Directory</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    schoolStore.updateUser({
      ...user,
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
      campusId: campusId || undefined,
      status,
      mfaEnabled,
    });

    toast.success(`User profile updated successfully`);
  };

  const handleSendPasswordReset = () => {
    toast.success(`Password reset email dispatched to ${user.email}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <Link href="/school/settings/users">
            <Button variant="ghost" size="sm" className="gap-2 text-xs px-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to User Directory
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {user.name}
            </h1>
            <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
              {user.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSendPasswordReset} className="gap-1.5 text-xs">
            <KeyRound className="h-3.5 w-3.5" />
            Send Password Reset
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile & Contact Information</CardTitle>
              <CardDescription className="text-xs">
                Essential identity records and communication details for this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name *</Label>
                  <Input 
                    id="userName" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address (Read-only)</Label>
                  <Input 
                    id="userEmail" 
                    value={email} 
                    disabled 
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Phone Number</Label>
                  <Input 
                    id="userPhone" 
                    placeholder="+91 98765 43210"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Assigned System Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="userRole">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userCampus">Campus Assignment</Label>
                  <Select value={campusId} onValueChange={setCampusId}>
                    <SelectTrigger id="userCampus">
                      <SelectValue placeholder="All Campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Campuses (Universal Scope)</SelectItem>
                      {campuses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountStatus">Account Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger id="accountStatus">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended (Login Blocked)</SelectItem>
                      <SelectItem value="INVITED">Invited (Pending Confirmation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Security & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="mfaSwitch" className="text-sm font-medium">Require 2FA / MFA</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enforce authenticator app verification upon login.
                  </p>
                </div>
                <Switch 
                  id="mfaSwitch"
                  checked={mfaEnabled}
                  onCheckedChange={setMfaEnabled}
                />
              </div>

              <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex items-center justify-between">
                  <span>Registered:</span>
                  <span className="font-mono text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Account ID:</span>
                  <span className="font-mono text-foreground text-[11px]">{user.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
