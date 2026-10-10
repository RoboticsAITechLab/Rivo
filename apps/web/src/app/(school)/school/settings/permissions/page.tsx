'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PermissionAction } from '@/features/settings/types';
import { 
  ShieldCheck, 
  Lock, 
  Edit, 
  Check, 
  X,
  ExternalLink,
  Layers,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const modulesList = [
  { key: 'students', label: 'Students & Admissions' },
  { key: 'attendance', label: 'Attendance Management' },
  { key: 'academics', label: 'Classes & Curriculum' },
  { key: 'timetable', label: 'Timetable & Scheduling' },
  { key: 'homework', label: 'Homework & Assignments' },
  { key: 'examinations', label: 'Exams & Date Sheets' },
  { key: 'results', label: 'Evaluation & Reports' },
  { key: 'settings', label: 'System Settings' },
];

export default function PermissionsMatrixPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsStore, setPermissionsStore] = useState<Record<string, Record<string, Record<PermissionAction, boolean>>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoleId, setActiveRoleId] = useState<string>('role-admin');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/school/settings?category=roles');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const fetchedRoles = json.data.customRoles || [];
            setRoles(fetchedRoles);
            setPermissionsStore(json.data.permissions || {});
            if (fetchedRoles.length > 0) {
              setActiveRoleId(fetchedRoles[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load permissions matrix:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const activeRole = roles.find(r => r.id === activeRoleId) || roles[0];

  const getPermission = (moduleKey: string, action: PermissionAction): boolean => {
    if (!activeRole) return false;
    const rolePerms = permissionsStore[activeRole.id]?.[moduleKey];
    if (rolePerms && rolePerms[action] !== undefined) {
      return rolePerms[action];
    }
    // Default system conventions
    if (activeRole.name === 'School Admin') return true;
    if (activeRole.name === 'Teacher') {
      if (action === 'VIEW') return true;
      if (['attendance', 'homework'].includes(moduleKey) && ['CREATE', 'EDIT'].includes(action)) return true;
      if (moduleKey === 'results' && action === 'EDIT') return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Global Permissions Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidated matrix overview of functional authorization grants across all institutional roles.
          </p>
        </div>
        {activeRole && (
          <Link href={`/school/settings/roles/${activeRole.id}`}>
            <Button size="sm" className="gap-2 shrink-0">
              <Edit className="h-3.5 w-3.5" />
              Modify {activeRole.name}
            </Button>
          </Link>
        )}
      </div>

      {roles.length > 0 && (
        <Tabs value={activeRoleId} onValueChange={setActiveRoleId} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto p-1 bg-muted/60">
            {roles.map((r) => (
              <TabsTrigger key={r.id} value={r.id} className="text-xs px-3 py-1.5 gap-1.5">
                {r.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                {r.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {activeRole && (
        <Card>
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{activeRole.name}</span>
                  {activeRole.isSystem ? (
                    <Badge variant="secondary" className="text-xs font-normal">System Role</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Custom Role</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {activeRole.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Functional Module</th>
                    <th className="py-3 px-4 text-center">View</th>
                    <th className="py-3 px-4 text-center">Create</th>
                    <th className="py-3 px-4 text-center">Edit</th>
                    <th className="py-3 px-4 text-center">Delete</th>
                    <th className="py-3 px-4 text-center">Publish</th>
                    <th className="py-3 px-4 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {modulesList.map((mod) => (
                    <tr key={mod.key} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground text-xs">
                        {mod.label}
                      </td>
                      {(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'PUBLISH', 'EXPORT'] as PermissionAction[]).map((action) => {
                        const granted = getPermission(mod.key, action);
                        return (
                          <td key={action} className="py-3 px-4 text-center">
                            {granted ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground/40">
                                <X className="h-3 w-3" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
