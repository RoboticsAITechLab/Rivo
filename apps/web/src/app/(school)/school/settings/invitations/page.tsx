'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  UserPlus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Shield,
  Loader2,
  RefreshCw,
  SendHorizontal
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

interface LiveInvitation {
  id: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
  createdAt: string;
  expiresAt: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function InvitationsManagementPage() {
  const [invitations, setInvitations] = useState<LiveInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Invite Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Link Dialog
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      toast.error('Failed to load pending invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          role,
          department: department.trim() || undefined,
          designation: designation.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Invitation dispatched via Resend to ${cleanEmail}`);
        const fullUrl = `${window.location.origin}${data.inviteUrl}`;
        setCreatedInviteUrl(fullUrl);
        setIsDialogOpen(false);
        setEmail('');
        setDepartment('');
        setDesignation('');
        fetchInvitations();
      } else {
        setSubmitError(data.message || 'Failed to dispatch invitation.');
      }
    } catch {
      setSubmitError('Unable to connect to invitation dispatch service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedLink(true);
    toast.success('Invitation link copied to clipboard');
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  const filteredInvites = invitations.filter((inv) =>
    inv.email.toLowerCase().includes(search.toLowerCase()) ||
    inv.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-emerald-600" />
            Portal Access Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue secure, 7-day time-bounded registration invites dispatched via Resend for teachers and staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvitations}
            disabled={loading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs h-9">
            <UserPlus className="h-4 w-4" />
            Send New Invitation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invites by email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Invitations Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Active Invitations</CardTitle>
          <CardDescription className="text-xs">
            {filteredInvites.length} pending {filteredInvites.length === 1 ? 'invitation' : 'invitations'} currently active
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-2" />
              <p className="text-xs">Loading invitations...</p>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground text-sm">No pending invitations</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                {search
                  ? 'No invites matched your search criteria.'
                  : 'Dispatch email onboarding links to faculty, teachers, or administrators.'}
              </p>
              {!search && (
                <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs bg-slate-900 text-white">
                  <UserPlus className="h-4 w-4" />
                  Send First Invitation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-[11px] font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Recipient Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Department / Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Expires On</th>
                    <th className="py-3 px-4">Invited By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredInvites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {invite.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[11px] gap-1 font-medium bg-slate-50 border-slate-200">
                          <Shield className="h-3 w-3 text-emerald-600" />
                          {invite.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {invite.designation || invite.department || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[11px] gap-1 bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3" />
                          Pending Acceptance
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {invite.invitedBy
                          ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`
                          : 'Administrator'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEND INVITATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateInvite}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <SendHorizontal className="h-4 w-4 text-emerald-600" />
                Dispatch Portal Invitation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                A branded invitation email will be dispatched via Resend containing a secure 7-day activation link.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{submitError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="invEmail" className="text-xs font-semibold text-slate-700">
                  Recipient Email <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="invEmail" 
                  type="email"
                  placeholder="teacher@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invRole" className="text-xs font-semibold text-slate-700">
                  Assigned System Role <span className="text-red-500">*</span>
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="invRole" className="text-xs h-9">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="STAFF">Staff / Coordinator</SelectItem>
                    <SelectItem value="SCHOOL_ADMIN">School Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invDept" className="text-xs font-semibold text-slate-700">
                    Department (Optional)
                  </Label>
                  <Input 
                    id="invDept" 
                    type="text"
                    placeholder="e.g. Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invDesig" className="text-xs font-semibold text-slate-700">
                    Designation (Optional)
                  </Label>
                  <Input 
                    id="invDesig" 
                    type="text"
                    placeholder="e.g. Senior Faculty"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Sending via Resend...
                  </>
                ) : (
                  'Send Email Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* INVITATION SENT SUCCESS LINK MODAL */}
      <Dialog open={!!createdInviteUrl} onOpenChange={() => setCreatedInviteUrl(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Invitation Email Dispatched
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The invitation email has been routed through Resend. You can also directly share the registration link below:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Direct Activation URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdInviteUrl || ''}
                  className="font-mono text-xs bg-white border-slate-200"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createdInviteUrl && copyToClipboard(createdInviteUrl)}
                  className="shrink-0 text-xs"
                >
                  {hasCopiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              onClick={() => setCreatedInviteUrl(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
