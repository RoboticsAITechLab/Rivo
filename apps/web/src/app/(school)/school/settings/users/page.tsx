'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { UserAccount } from '@/features/settings/types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  KeyRound
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  const store = useSchoolStore();
  const users = store.users || [];
  const roles = store.roles || [];
  const campuses = store.campuses || [];

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(roles[0]?.name || 'Teacher');
  const [inviteCampus, setInviteCampus] = useState(campuses[0]?.id || '');

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    schoolStore.inviteUser({
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      campusId: inviteCampus || undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    toast.success(`Access invitation queued for ${inviteEmail}`);
    setIsInviteOpen(false);
    setInviteEmail('');
  };

  const handleToggleSuspend = (user: UserAccount) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    schoolStore.updateUser({ ...user, status: nextStatus });
    toast.success(`User ${user.name} is now ${nextStatus.toLowerCase()}`);
  };

  const filteredUsers = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(u => campusFilter === 'ALL' || u.campusId === campusFilter)
    .filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Accounts & Access
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage administrative personnel, instructors, and portal accounts with role assignments and security status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/school/settings/invitations">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              Pending Invitations
            </Button>
          </Link>
          <Button onClick={() => setIsInviteOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {campuses.length > 0 && (
            <Select value={campusFilter} onValueChange={setCampusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Campuses</SelectItem>
                {campuses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">User Directory</CardTitle>
          <CardDescription className="text-xs">
            {filteredUsers.length} registered accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-base text-foreground">No user accounts found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                {search || roleFilter !== 'ALL' || campusFilter !== 'ALL'
                  ? 'No users match your filters. Try clearing the search query.'
                  : 'Zero mock accounts are seeded in this environment. Invite your school administrators, coordinators, or teachers to get started.'}
              </p>
              {!search && (
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite First User
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">MFA Security</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((user) => {
                    const campus = campuses.find(c => c.id === user.campusId);
                    return (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/school/settings/users/${user.id}`} className="hover:underline">
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs font-medium">
                            <Shield className="h-3 w-3 mr-1 text-primary" />
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {campus ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {campus.name}
                            </span>
                          ) : 'Global / All'}
                        </td>
                        <td className="py-3 px-4">
                          {user.status === 'ACTIVE' && (
                            <Badge variant="default" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                          {user.status === 'SUSPENDED' && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Suspended
                            </Badge>
                          )}
                          {user.status === 'INVITED' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Clock className="h-3 w-3" />
                              Invited
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.mfaEnabled ? (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <KeyRound className="h-3 w-3" />
                              Enforced
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not Enabled</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleToggleSuspend(user)}
                            >
                              {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </Button>
                            <Link href={`/school/settings/users/${user.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSendInvite}>
            <DialogHeader>
              <DialogTitle>Invite Portal User</DialogTitle>
              <DialogDescription>
                Send an email invitation link for portal access with designated role permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input 
                  id="inviteEmail" 
                  type="email"
                  placeholder="colleague@institution.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteRole">Assigned Role *</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="inviteRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {campuses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCampus">Campus Scope</Label>
                  <Select value={inviteCampus} onValueChange={setInviteCampus}>
                    <SelectTrigger id="inviteCampus">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Campuses (Global Access)</SelectItem>
                      {campuses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
