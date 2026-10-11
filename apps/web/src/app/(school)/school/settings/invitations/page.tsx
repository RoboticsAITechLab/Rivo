'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  UserPlus,
  Copy,
  Check,
  Clock,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  Users,
  MoreVertical,
  RotateCcw,
  Ban
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';

interface LiveInvitation {
  id: string;
  email: string;
  role: string;
  customRoleId?: string | null;
  customRoleName?: string | null;
  displayRole: string;
  department?: string | null;
  designation?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  invitedBy?: {
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

interface AssignableRole {
  id: string;
  name: string;
  code: string;
  isCustom: boolean;
  baseRole: string;
  description: string | null;
}

export default function InvitationsManagementPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<LiveInvitation[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Single / Bulk Invite Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [bulkEmailsInput, setBulkEmailsInput] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Copied Link & Row Action Loading State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Created / Refreshed Invitation Link Dialog State
  interface CreatedInvitationResult {
    email: string;
    role: string;
    customRoleName?: string | null;
    expiresAt?: string;
    emailDelivered: boolean;
    emailError?: string | null;
    inviteUrl: string;
    fullInviteUrl: string;
  }
  const [createdResult, setCreatedResult] = useState<CreatedInvitationResult | null>(null);
  const [resultCopied, setResultCopied] = useState(false);

  // Load assignable roles dynamically from authoritative API
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const res = await fetch('/api/school/roles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.assignableRoles) {
          setAssignableRoles(data.assignableRoles);
          if (data.assignableRoles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(data.assignableRoles[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load assignable roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, [selectedRoleId]);

  // Load invitations with status filter
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/invitations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      toast.error('Failed to load invitations list');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const targetRoleObj = assignableRoles.find((r) => r.id === selectedRoleId);
    if (!targetRoleObj) {
      setSubmitError('Please select a valid role.');
      return;
    }

    setIsSubmitting(true);

    try {
      let payload: any = {
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
      };

      if (targetRoleObj.isCustom) {
        payload.customRoleId = targetRoleObj.id;
      } else {
        payload.role = targetRoleObj.code;
      }

      if (isBulkMode) {
        const rawEmails = bulkEmailsInput
          .split(/[\n,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e && e.includes('@'));

        if (rawEmails.length === 0) {
          setSubmitError('Please enter at least one valid email address.');
          setIsSubmitting(false);
          return;
        }

        payload.emails = rawEmails;
      } else {
        const cleanEmail = emailInput.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setSubmitError('Please enter a valid email address.');
          setIsSubmitting(false);
          return;
        }
        payload.email = cleanEmail;
      }

      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch invitation');
      }

      if (isBulkMode) {
        toast.success(data.message);
        setIsDialogOpen(false);
      } else {
        const fullUrl = data.fullInviteUrl || `${window.location.origin}${data.inviteUrl}`;
        setCreatedResult({
          email: payload.email,
          role: targetRoleObj.name,
          customRoleName: data.invitation?.customRoleName,
          expiresAt: data.invitation?.expiresAt,
          emailDelivered: !!data.emailDelivered,
          emailError: data.emailError,
          inviteUrl: data.inviteUrl,
          fullInviteUrl: fullUrl,
        });
        setIsDialogOpen(false);
      }

      setEmailInput('');
      setBulkEmailsInput('');
      setDepartment('');
      setDesignation('');
      await fetchInvitations();
    } catch (err: any) {
      setSubmitError(err.message || 'Invitation request failed.');
      toast.error(err.message || 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId: string, email: string) => {
    if (!confirm(`Revoke invitation for ${email}? The activation link will be immediately invalidated.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invitations/${invitationId}/revoke`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to revoke invitation');

      toast.success(`Invitation for ${email} revoked.`);
      await fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke');
    }
  };

  const handleResend = async (invitationId: string, email: string) => {
    setActionLoadingId(invitationId);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend invitation');

      const fullUrl = data.fullInviteUrl || `${window.location.origin}${data.inviteUrl}`;
      if (data.emailDelivered) {
        toast.success(`Invitation re-dispatched to ${email}. Token refreshed.`);
      } else {
        toast.info(`Token refreshed. Onboarding link ready.`);
      }

      setCreatedResult({
        email,
        role: 'Staff Member',
        expiresAt: data.invitation?.expiresAt,
        emailDelivered: !!data.emailDelivered,
        emailError: data.emailError,
        inviteUrl: data.inviteUrl,
        fullInviteUrl: fullUrl,
      });

      await fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyLink = async (inv: LiveInvitation) => {
    if (inv.status !== 'PENDING') {
      toast.info(`Invitation is already ${inv.status.toLowerCase()}.`);
      return;
    }

    setActionLoadingId(inv.id);
    try {
      const res = await fetch(`/api/invitations/${inv.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate invitation link');
      }

      const fullUrl = data.fullInviteUrl || `${window.location.origin}${data.inviteUrl}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedId(inv.id);
        toast.success('Fresh invitation link copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
      } catch {
        // Fallback: If clipboard write fails, show modal with selectable text
        setCreatedResult({
          email: inv.email,
          role: inv.displayRole,
          expiresAt: data.invitation?.expiresAt,
          emailDelivered: false,
          inviteUrl: data.inviteUrl,
          fullInviteUrl: fullUrl,
        });
      }
      await fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy link');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Invitations &amp; Access Provisioning
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Securely invite educators, administrators, and specialized faculty with automatic role assignment and cryptographic activation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setIsBulkMode(false);
              setSubmitError(null);
              setIsDialogOpen(true);
            }}
            size="sm"
            className="gap-2 shrink-0 text-xs"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-xl shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
              <SelectItem value="ACCEPTED" className="text-xs">Accepted</SelectItem>
              <SelectItem value="REVOKED" className="text-xs">Revoked</SelectItem>
              <SelectItem value="EXPIRED" className="text-xs">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-xs w-[150px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Roles</SelectItem>
              {assignableRoles.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.name} {r.isCustom ? '(Custom)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invitations Table / List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span>Loading invitations register...</span>
          </div>
        </div>
      ) : invitations.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-foreground">No Invitations Found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                {search || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? 'No invitation records match the selected filters.'
                  : 'Start onboarding faculty and administrative staff by sending their first invitation.'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="text-xs gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => {
            const isPending = inv.status === 'PENDING';
            const isAccepted = inv.status === 'ACCEPTED';
            const isRevoked = inv.status === 'REVOKED';
            const isExpired = inv.status === 'EXPIRED';

            return (
              <Card key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border/60 hover:border-border transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{inv.email}</span>
                    <Badge variant={inv.customRoleId ? 'default' : 'secondary'} className="text-[11px] font-normal">
                      {inv.displayRole}
                    </Badge>
                    <Badge
                      variant={isAccepted ? 'default' : isPending ? 'outline' : 'secondary'}
                      className={`text-[10px] ${
                        isAccepted
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : isRevoked
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : isExpired
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {inv.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {inv.department && <span>Dept: {inv.department}</span>}
                    {inv.designation && <span>Role: {inv.designation}</span>}
                    {inv.invitedBy && (
                      <span>Invited by: {inv.invitedBy.firstName} {inv.invitedBy.lastName}</span>
                    )}
                    <span>Issued: {new Date(inv.createdAt).toLocaleDateString()}</span>
                    {isPending && (
                      <span className="text-amber-600 dark:text-amber-400">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isPending && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === inv.id}
                        onClick={() => handleCopyLink(inv)}
                        className="text-xs h-8 gap-1.5"
                      >
                        {actionLoadingId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : copiedId === inv.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {actionLoadingId === inv.id ? 'Refreshing...' : copiedId === inv.id ? 'Copied' : 'Copy Link'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === inv.id}
                        onClick={() => handleResend(inv.id, inv.email)}
                        className="text-xs h-8 gap-1"
                        title="Resend invitation email"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${actionLoadingId === inv.id ? 'animate-spin' : ''}`} />
                        Resend
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === inv.id}
                        onClick={() => handleRevoke(inv.id, inv.email)}
                        className="text-xs h-8 gap-1 text-destructive hover:text-destructive"
                        title="Revoke invitation"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    </>
                  )}

                  {isAccepted && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Active Member
                    </span>
                  )}

                  {(isRevoked || isExpired) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(inv.id, inv.email)}
                      className="text-xs h-8 gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reactivate
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Bulk Invitation Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateInvite}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {isBulkMode ? 'Bulk Staff Invitations' : 'Dispatch Staff Invitation'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select from built-in system roles or your school's custom roles. An onboarding link will be sent to the recipient.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {submitError && (
                <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <span className="text-xs text-muted-foreground font-medium">Invitation Mode</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={!isBulkMode ? 'secondary' : 'ghost'}
                    onClick={() => setIsBulkMode(false)}
                    className="h-7 text-[11px] px-2.5"
                  >
                    Single
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isBulkMode ? 'secondary' : 'ghost'}
                    onClick={() => setIsBulkMode(true)}
                    className="h-7 text-[11px] px-2.5"
                  >
                    Bulk Invites
                  </Button>
                </div>
              </div>

              {/* Email Input */}
              {!isBulkMode ? (
                <div className="space-y-1.5">
                  <Label htmlFor="inviteEmail" className="text-xs font-medium">Recipient Email Address *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="faculty.member@school.edu"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="bulkEmails" className="text-xs font-medium">Recipient Email Addresses (One per line or comma-separated) *</Label>
                  <textarea
                    id="bulkEmails"
                    rows={4}
                    placeholder="teacher1@school.edu&#10;teacher2@school.edu&#10;accountant@school.edu"
                    value={bulkEmailsInput}
                    onChange={(e) => setBulkEmailsInput(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  />
                </div>
              )}

              {/* Authoritative Role Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="assignRole" className="text-xs font-medium">Assignable Role Profile *</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger id="assignRole" className="text-xs">
                    <SelectValue placeholder="Select assignable role" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Authoritative Roles
                    </div>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.name} {r.isCustom ? '★ Custom' : '(System)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoleId && (
                  <p className="text-[11px] text-muted-foreground">
                    {assignableRoles.find((r) => r.id === selectedRoleId)?.description || 'Authoritative access profile.'}
                  </p>
                )}
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dept" className="text-xs font-medium">Department</Label>
                  <Input
                    id="dept"
                    placeholder="e.g. Science, Accounts"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desig" className="text-xs font-medium">Official Designation</Label>
                  <Input
                    id="desig"
                    placeholder="e.g. Senior Faculty, Bursar"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isSubmitting ? 'Dispatching...' : isBulkMode ? 'Send Bulk Invitations' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Persistent Success / Link Sharing Dialog */}
      <Dialog open={!!createdResult} onOpenChange={(open) => !open && setCreatedResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Invitation Ready &amp; Dispatched
            </DialogTitle>
            <DialogDescription className="text-xs">
              Secure onboarding credentials have been generated for this staff member.
            </DialogDescription>
          </DialogHeader>

          {createdResult && (
            <div className="space-y-4 py-2 text-xs">
              {/* Recipient Summary */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recipient Email:</span>
                  <span className="font-semibold text-foreground">{createdResult.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {createdResult.customRoleName ? `${createdResult.customRoleName} (${createdResult.role})` : createdResult.role}
                  </Badge>
                </div>
                {createdResult.expiresAt && (
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Valid Through:</span>
                    <span>{new Date(createdResult.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Delivery Status Banner */}
              {createdResult.emailDelivered ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Invitation Email Dispatched</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 pl-5">
                    An email was sent via Resend. If not visible in Inbox within a few minutes, advise the recipient to check their <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Direct Link Sharing Required</span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-400 pl-5">
                    {createdResult.emailError
                      ? `Email could not be delivered: ${createdResult.emailError}. You can copy and share the direct link below.`
                      : 'Please copy and send the link below directly via SMS, WhatsApp, or chat.'}
                  </p>
                </div>
              )}

              {/* Direct Onboarding Link */}
              <div className="space-y-1.5">
                <Label htmlFor="onboardingLink" className="text-xs font-medium text-foreground">
                  Direct Onboarding Link (Contains Security Token)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="onboardingLink"
                    readOnly
                    value={createdResult.fullInviteUrl}
                    className="font-mono text-[11px] h-9 select-all bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdResult.fullInviteUrl);
                      setResultCopied(true);
                      toast.success('Onboarding link copied to clipboard!');
                      setTimeout(() => setResultCopied(false), 2500);
                    }}
                    className="shrink-0 gap-1.5 h-9 text-xs"
                  >
                    {resultCopied ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                    {resultCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This secure link allows the recipient to establish their password and activate their institutional account.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => setCreatedResult(null)}
              className="w-full sm:w-auto text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
