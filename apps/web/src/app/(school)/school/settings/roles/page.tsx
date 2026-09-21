'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { RoleDefinition } from '@/features/settings/types';
import { 
  Shield, 
  Plus, 
  Lock, 
  Edit, 
  Trash2, 
  Users, 
  ArrowRight,
  ShieldCheck
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
import { toast } from 'sonner';

export default function RolesManagementPage() {
  const store = useSchoolStore();
  const roles = store.roles || [];
  const users = store.users || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (roles.some(r => r.name.toLowerCase() === roleName.trim().toLowerCase())) {
      toast.error('A role with this name already exists');
      return;
    }

    schoolStore.createRole({
      name: roleName.trim(),
      description: description.trim() || 'Custom institutional role',
    });

    toast.success(`Role "${roleName}" created successfully`);
    setIsDialogOpen(false);
    setRoleName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Roles & Access Levels
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define system and custom permission profiles governing institutional access rights.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/school/settings/permissions">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Permissions Matrix
            </Button>
          </Link>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          // Calculate strictly real count of assigned users
          const assignedUserCount = users.filter(u => u.role === role.name).length;

          return (
            <Card key={role.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="text-xs gap-1 font-normal">
                        <Lock className="h-3 w-3" />
                        System Built-in
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{assignedUserCount} {assignedUserCount === 1 ? 'user' : 'users'}</span>
                  </div>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {role.isSystem ? 'Standard capabilities' : 'Configurable permissions'}
                  </span>
                  <Link href={`/school/settings/roles/${role.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary">
                      Configure Permissions
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Custom Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
              <DialogDescription>
                Add a specialized role (e.g. Exam Coordinator, Accountant, Librarian) to tailor permission grants.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Title *</Label>
                <Input 
                  id="roleName" 
                  placeholder="e.g. Exam Coordinator, Academic Head"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description</Label>
                <Input 
                  id="roleDesc" 
                  placeholder="Responsibilities and intended access boundary..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
