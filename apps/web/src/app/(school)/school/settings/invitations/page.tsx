'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { Invitation } from '@/features/settings/types';
import { 
  Mail, 
  UserPlus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Copy,
  Ban,
  Calendar,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function InvitationsManagementPage() {
  const store = useSchoolStore();
  const invitations = store.invitations || [];
  const roles = store.roles || [];
  const campuses = store.campuses || [];

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(roles[0]?.name || 'Teacher');
  const [campusId, setCampusId] = useState('');

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    schoolStore.inviteUser({
      email: email.trim().toLowerCase(),
      role,
      campusId: campusId || undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    toast.success(`Invitation dispatched to ${email}`);
    setIsDialogOpen(false);
    setEmail('');
  };

  const handleRevoke = (invite: Invitation) => {
    schoolStore.revokeInvitation(invite.id);
    toast.success(`Invitation for ${invite.email} has been revoked`);
  };

  const handleCopyLink = (invite: Invitation) => {
    const link = `${window.location.origin}/invite/accept?token=${invite.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation URL copied to clipboard');
  };

  const filteredInvites = invitations.filter(inv =>
    inv.email.toLowerCase().includes(search.toLowerCase()) ||
    inv.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Portal Access Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue secure, time-bounded registration invites for teachers, administrative staff, and coordinators.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          New Invitation
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invites by email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Sent Invitations</CardTitle>
          <CardDescription className="text-xs">
            {filteredInvites.length} {filteredInvites.length === 1 ? 'invitation' : 'invitations'} logged
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInvites.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground">No invitations found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                {search ? 'No invites matched your filter.' : 'Zero mock invitations exist. Dispatch portal onboarding links to faculty or administrators.'}
              </p>
              {!search && (
                <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Send First Invitation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Invited Recipient</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredInvites.map((invite) => {
                    const campus = campuses.find(c => c.id === invite.campusId);
                    return (
                      <tr key={invite.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {invite.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs gap-1 font-normal">
                            <Shield className="h-3 w-3 text-primary" />
                            {invite.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {campus ? campus.name : 'Global'}
                        </td>
                        <td className="py-3 px-4">
                          {invite.status === 'PENDING' && (
                            <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {invite.status === 'ACCEPTED' && (
                            <Badge variant="default" className="text-xs gap-1 bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Accepted
                            </Badge>
                          )}
                          {invite.status === 'REVOKED' && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Ban className="h-3 w-3" />
                              Revoked
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {invite.status === 'PENDING' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleCopyLink(invite)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Link
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRevoke(invite)}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  Revoke
                                </Button>
                              </>
                            )}
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

      {/* New Invitation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateInvite}>
            <DialogHeader>
              <DialogTitle>Send Access Invitation</DialogTitle>
              <DialogDescription>
                A one-time activation link valid for 7 days will be issued to this email address.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invEmail">Recipient Email *</Label>
                <Input 
                  id="invEmail" 
                  type="email"
                  placeholder="teacher@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invRole">Target Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="invRole">
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
                  <Label htmlFor="invCampus">Assigned Campus</Label>
                  <Select value={campusId} onValueChange={setCampusId}>
                    <SelectTrigger id="invCampus">
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
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Dispatch Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
