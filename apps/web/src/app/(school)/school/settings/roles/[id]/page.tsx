'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { PermissionAction, PermissionScope } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Lock, 
  Check, 
  X,
  Layers,
  Info
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

interface ModuleConfig {
  key: string;
  name: string;
  description: string;
  actions: Record<PermissionAction, boolean>;
  scope: PermissionScope;
}

const defaultModules: { key: string; name: string; description: string }[] = [
  { key: 'students', name: 'Student Records & Admissions', description: 'Access student biodata, admission registers, and guardian details.' },
  { key: 'attendance', name: 'Attendance Register', description: 'Mark daily attendance, generate absence reports, and correct past registers.' },
  { key: 'academics', name: 'Classes, Sections & Subjects', description: 'Curriculum structure, syllabus plans, and teacher assignments.' },
  { key: 'timetable', name: 'Timetable & Schedules', description: 'Weekly class schedule creation, period blocks, and room slots.' },
  { key: 'homework', name: 'Homework & Assignments', description: 'Issue home tasks, evaluate submissions, and grade assignments.' },
  { key: 'examinations', name: 'Examinations & Hall Tickets', description: 'Date-sheets, seating charts, admit cards, and venue allocation.' },
  { key: 'results', name: 'Marks & Report Cards', description: 'Enter examination marks, calculate GPA, and publish final report cards.' },
  { key: 'settings', name: 'System Settings & Config', description: 'Institution profile, campus management, and access controls.' },
];

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params?.id as string;

  const store = useSchoolStore();
  const roles = store.roles || [];
  const permissionsStore = store.permissions || {};

  const role = roles.find(r => r.id === roleId);

  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (!role) return;

    const existingRolePerms = permissionsStore[role.id] || {};

    const initial: ModuleConfig[] = defaultModules.map(m => {
      const perms = existingRolePerms[m.key] || {};
      const isSystemAdmin = role.name === 'School Admin';
      const isTeacher = role.name === 'Teacher';

      return {
        key: m.key,
        name: m.name,
        description: m.description,
        actions: {
          VIEW: perms.VIEW !== undefined ? perms.VIEW : true,
          CREATE: perms.CREATE !== undefined ? perms.CREATE : (isSystemAdmin || (isTeacher && ['attendance', 'homework'].includes(m.key))),
          EDIT: perms.EDIT !== undefined ? perms.EDIT : (isSystemAdmin || (isTeacher && ['attendance', 'homework', 'results'].includes(m.key))),
          DELETE: perms.DELETE !== undefined ? perms.DELETE : isSystemAdmin,
          PUBLISH: perms.PUBLISH !== undefined ? perms.PUBLISH : isSystemAdmin,
          EXPORT: perms.EXPORT !== undefined ? perms.EXPORT : isSystemAdmin,
        },
        scope: isSystemAdmin ? 'SCHOOL' : (isTeacher ? 'ASSIGNED' : 'OWN'),
      };
    });

    setModules(initial);
  }, [role, permissionsStore]);

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
              The role identifier "{roleId}" could not be located in institutional records.
            </p>
            <Link href="/school/settings/roles">
              <Button size="sm">Return to Roles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleAction = (moduleKey: string, action: PermissionAction, val: boolean) => {
    setModules(prev => prev.map(m => {
      if (m.key === moduleKey) {
        return {
          ...m,
          actions: { ...m.actions, [action]: val }
        };
      }
      return m;
    }));
    setIsDirty(true);
  };

  const handleScopeChange = (moduleKey: string, scope: PermissionScope) => {
    setModules(prev => prev.map(m => {
      if (m.key === moduleKey) {
        return { ...m, scope };
      }
      return m;
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const formatted: Record<string, Record<PermissionAction, boolean>> = {};
    modules.forEach(m => {
      formatted[m.key] = m.actions;
    });

    schoolStore.updateRolePermissions(role.id, formatted);
    setIsDirty(false);
    toast.success(`Permissions for role "${role.name}" updated successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <Link href="/school/settings/roles">
            <Button variant="ghost" size="sm" className="gap-2 text-xs px-0 text-muted-foreground hover:text-foreground mb-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Roles
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {role.name} — Permissions
            </h1>
            {role.isSystem ? (
              <Badge variant="secondary" className="text-xs gap-1 font-normal">
                <Lock className="h-3 w-3" />
                System Role
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Custom Role</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure granular functional capabilities and data visibility boundaries for this role.
          </p>
        </div>

        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Permissions
        </Button>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => (
          <Card key={mod.key} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">{mod.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{mod.description}</CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Scope:</span>
                  <Select 
                    value={mod.scope} 
                    onValueChange={(val) => handleScopeChange(mod.key, val as PermissionScope)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWN">Own Records Only</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned Classes</SelectItem>
                      <SelectItem value="SCHOOL">Entire School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'PUBLISH', 'EXPORT'] as PermissionAction[]).map((action) => (
                  <div 
                    key={action} 
                    className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-muted/10 text-xs"
                  >
                    <span className="font-medium text-muted-foreground capitalize">
                      {action.toLowerCase()}
                    </span>
                    <Switch 
                      checked={mod.actions[action]}
                      onCheckedChange={(val) => handleToggleAction(mod.key, action, val)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UnsavedChangesDialog 
        open={showDialog} 
        onConfirm={confirmLeave} 
        onCancel={cancelLeave} 
      />
    </div>
  );
}
