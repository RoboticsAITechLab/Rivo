'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Lock, 
  Layers, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface PermissionItem {
  id: string;
  code: string;
  action: string;
  name: string;
  description: string | null;
}

interface RoleData {
  id: string;
  name: string;
  code: string;
  baseRole: string;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  permissions?: Array<{
    code: string;
    scope: string;
  }>;
}

const MODULE_DISPLAY_NAMES: Record<string, { title: string; desc: string }> = {
  attendance: { title: 'Attendance Register', desc: 'Daily roll-call, excused absence marking, and attendance logs' },
  students: { title: 'Student Admissions & Records', desc: 'Biodata, admission register, profile management, and documents' },
  teachers: { title: 'Faculty & Teacher Management', desc: 'Teacher profiles, subject allocation, and staff directory' },
  school_timetable: { title: 'School Class Timetable', desc: 'Class scheduling, period slots, subject allocations, and room assignments' },
  exam_timetable: { title: 'Examination Timetable', desc: 'Date-sheets, exam slot schedules, and room coordination' },
  exams: { title: 'Examinations Management', desc: 'Exam cycles, papers, marking schemes, and hall tickets' },
  results: { title: 'Academic Results & Marks', desc: 'Marks entry, grading calculation, and publication of scorecards' },
  fees: { title: 'Fee Structures & Collections', desc: 'Fee plans, counter payments, receipts, and concessions' },
};

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params?.id as string;

  const [role, setRole] = useState<RoleData | null>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionItem[]>>({});
  const [grantedPermissions, setGrantedPermissions] = useState<Map<string, string>>(new Map()); // code -> scope
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadData = useCallback(async () => {
    if (!roleId) return;
    try {
      setIsLoading(true);
      const [roleRes, permRes] = await Promise.all([
        fetch(`/api/school/roles/${roleId}`),
        fetch('/api/school/roles/permissions'),
      ]);

      if (!roleRes.ok) {
        throw new Error('Role not found');
      }

      const roleJson = await roleRes.json();
      const permJson = await permRes.json();

      if (roleJson.success && roleJson.role) {
        setRole(roleJson.role);

        // Prepopulate granted permissions map
        const grantedMap = new Map<string, string>();
        if (roleJson.role.permissions && Array.isArray(roleJson.role.permissions)) {
          roleJson.role.permissions.forEach((p: any) => {
            grantedMap.set(p.code, p.scope || 'SCHOOL');
          });
        }
        setGrantedPermissions(grantedMap);
      }

      if (permJson.success && permJson.grouped) {
        setGroupedPermissions(permJson.grouped);
      }
    } catch (err: any) {
      console.error('Error loading role permissions:', err);
      toast.error(err.message || 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePermission = (code: string, granted: boolean) => {
    setGrantedPermissions((prev) => {
      const next = new Map(prev);
      if (granted) {
        next.set(code, 'SCHOOL');
      } else {
        next.delete(code);
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleScopeChange = (code: string, scope: string) => {
    setGrantedPermissions((prev) => {
      const next = new Map(prev);
      next.set(code, scope);
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!role) return;

    try {
      setIsSaving(true);
      const permissionsPayload: Array<{ permissionCode: string; scope: string }> = [];
      grantedPermissions.forEach((scope, permissionCode) => {
        permissionsPayload.push({ permissionCode, scope });
      });

      const res = await fetch(`/api/school/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: permissionsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to persist permissions');
      }

      setIsDirty(false);
      toast.success(`Permissions for role "${role.name}" updated successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading role permission profile...</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <Link href="/school/settings/roles">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Roles
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">Role Not Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              The requested role identifier could not be located in institutional records.
            </p>
            <Link href="/school/settings/roles">
              <Button size="sm">Return to Roles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const moduleKeys = Object.keys(groupedPermissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <Link href="/school/settings/roles">
            <Button variant="ghost" size="sm" className="gap-2 text-xs px-0 text-muted-foreground hover:text-foreground mb-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Roles
            </Button>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {role.name}
            </h1>
            <Badge variant={role.isSystem ? 'secondary' : 'default'} className="text-xs font-normal">
              {role.isSystem ? 'System Built-in' : 'Custom Role'}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Base: {role.baseRole}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {role.description || 'Institutional access role profile.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty || role.isSystem}
            size="sm"
            className="gap-2 text-xs"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>

      {role.isSystem && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            System built-in roles have authoritative capabilities managed by the Rivo platform core. To customize access boundaries, create a custom role based on this role.
          </span>
        </div>
      )}

      {/* Permissions Matrix by Module */}
      <div className="space-y-6">
        {moduleKeys.map((modKey) => {
          const items = groupedPermissions[modKey] || [];
          const info = MODULE_DISPLAY_NAMES[modKey] || { title: modKey.toUpperCase(), desc: 'Module access capabilities' };

          return (
            <Card key={modKey} className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      {info.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {info.desc}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    {items.filter((it) => grantedPermissions.has(it.code)).length} of {items.length} enabled
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 divide-y divide-border/30">
                {items.map((perm) => {
                  const isGranted = grantedPermissions.has(perm.code);
                  const currentScope = grantedPermissions.get(perm.code) || 'SCHOOL';

                  return (
                    <div key={perm.code} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{perm.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">({perm.code})</span>
                        </div>
                        {perm.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{perm.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isGranted && (
                          <Select
                            value={currentScope}
                            onValueChange={(val) => handleScopeChange(perm.code, val)}
                          >
                            <SelectTrigger disabled={role.isSystem} className="h-7 text-[11px] w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SCHOOL" className="text-xs">School Scope</SelectItem>
                              <SelectItem value="CAMPUS" className="text-xs">Campus Scope</SelectItem>
                              <SelectItem value="ASSIGNED" className="text-xs">Assigned Only</SelectItem>
                              <SelectItem value="OWN" className="text-xs">Own Records</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        <Switch
                          checked={isGranted}
                          disabled={role.isSystem}
                          onCheckedChange={(checked) => handleTogglePermission(perm.code, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
