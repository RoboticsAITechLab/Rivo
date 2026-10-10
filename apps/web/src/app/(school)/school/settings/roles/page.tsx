'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Plus, 
  Lock, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Loader2,
  Trash2,
  Power,
  Mail,
  RefreshCw,
  Key
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

interface RoleItem {
  id: string;
  name: string;
  code: string;
  baseRole: string;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  userCount: number;
  pendingInvitesCount: number;
  permissionsCount?: number;
}

export default function RolesManagementPage() {
  const [builtInRoles, setBuiltInRoles] = useState<RoleItem[]>([]);
  const [customRoles, setCustomRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Role State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [baseRole, setBaseRole] = useState('TEACHER');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/school/roles');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBuiltInRoles(json.builtInRoles || []);
          setCustomRoles(json.customRoles || []);
        }
      } else {
        toast.error('Failed to load institutional roles');
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
      toast.error('Network error loading roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/school/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          baseRole,
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create role');
      }

      toast.success(`Role "${roleName}" created successfully! Configure permissions below.`);
      setIsDialogOpen(false);
      setRoleName('');
      setDescription('');
      setBaseRole('TEACHER');
      await fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (role: RoleItem) => {
    const nextActive = !role.isActive;
    try {
      const res = await fetch(`/api/school/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update role status');
      }

      toast.success(`Role "${role.name}" is now ${nextActive ? 'active' : 'inactive'}.`);
      await fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (!confirm(`Are you sure you want to permanently delete custom role "${role.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/school/roles/${role.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete role');
      }

      toast.success(`Role "${role.name}" deleted.`);
      await fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Roles & Access Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative institutional governance: manage system roles and configure tailored custom permission profiles.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchRoles} disabled={isLoading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 shrink-0 text-xs">
            <Plus className="h-4 w-4" />
            Create Custom Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span>Loading authoritative role registry...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: School-Specific Custom Roles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  School Custom Roles ({customRoles.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Specialized roles tailored for your campus with dynamic invitation assignment and custom permission overrides.
                </p>
              </div>
            </div>

            {customRoles.length === 0 ? (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                  <ShieldCheck className="h-9 w-9 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">No Custom Roles Created Yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                      Create specialized roles like "Department Head", "Examination Controller", or "Hostel Warden" to grant granular privileges.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)} className="text-xs gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create First Custom Role
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map((role) => (
                  <Card key={role.id} className={`flex flex-col justify-between transition-colors ${role.isActive ? 'hover:border-primary/40' : 'opacity-70 bg-muted/30'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                            <Badge variant={role.isActive ? 'default' : 'secondary'} className="text-[10px] font-normal">
                              {role.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              Base: {role.baseRole}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" title="Assigned active members">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{role.userCount}</span>
                          </span>
                          {role.pendingInvitesCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Pending invitations">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{role.pendingInvitesCount}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {role.description || 'No description provided.'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(role)}
                            className={`h-7 px-2 text-[11px] gap-1 ${role.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                            title={role.isActive ? 'Deactivate role' : 'Activate role'}
                          >
                            <Power className="h-3 w-3" />
                            {role.isActive ? 'Deactivate' : 'Activate'}
                          </Button>

                          {role.userCount === 0 && role.pendingInvitesCount === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
                              className="h-7 px-2 text-[11px] gap-1 text-destructive hover:text-destructive"
                              title="Delete role"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>

                        <Link href={`/school/settings/roles/${role.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary hover:text-primary">
                            Configure Permissions ({role.permissionsCount ?? 0})
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Built-in System Roles */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                System Built-in Roles ({builtInRoles.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Authoritative institutional roles with standard capabilities defined by the Rivo platform framework.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builtInRoles.map((role) => (
                <Card key={role.id} className="flex flex-col justify-between bg-muted/15 border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-semibold">{role.name}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                          <Lock className="h-2.5 w-2.5" />
                          Built-in
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Assigned active users">
                          <Users className="h-3.5 w-3.5" />
                          <span>{role.userCount}</span>
                        </span>
                        {role.pendingInvitesCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600" title="Pending invites">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{role.pendingInvitesCount}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {role.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Standard system privileges</span>
                      <span className="font-mono text-[10px] uppercase font-semibold text-foreground/70">{role.code}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle>Create School Custom Role</DialogTitle>
              <DialogDescription className="text-xs">
                Define a specialized institutional role that will automatically appear in invitation forms and permission matrices.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="roleName" className="text-xs font-medium">Role Title *</Label>
                <Input 
                  id="roleName" 
                  placeholder="e.g. Exam Coordinator, Academic Head, Hostel Warden"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">The formal title displayed across ERP workspaces and legal documents.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baseRole" className="text-xs font-medium">Inherits Base Capabilities From *</Label>
                <Select value={baseRole} onValueChange={setBaseRole}>
                  <SelectTrigger id="baseRole" className="text-xs">
                    <SelectValue placeholder="Select base role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEACHER" className="text-xs">
                      Teacher / Faculty (Access to assigned classes, timetable, attendance)
                    </SelectItem>
                    <SelectItem value="STAFF" className="text-xs">
                      Support Staff (Administrative desk, operational coordination)
                    </SelectItem>
                    <SelectItem value="FEE_MANAGER" className="text-xs">
                      Fee Officer (Financial operations, fee plans, receipts)
                    </SelectItem>
                    <SelectItem value="ADMIN" className="text-xs">
                      Administrator (Operational school administration)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Determines default portal access and underlying staff entity mapping.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="roleDesc" className="text-xs font-medium">Description</Label>
                <Input 
                  id="roleDesc" 
                  placeholder="Responsibilities and intended access boundary..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !roleName.trim()} className="text-xs gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {isSubmitting ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
