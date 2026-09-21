'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface PermissionItem {
  code: string;
  module: string;
  action: string;
  name: string;
  description: string;
  granted: boolean;
  scope: 'SCHOOL' | 'CAMPUS' | 'ASSIGNED' | 'OWN';
  isCustomized: boolean;
}

interface TeacherInfo {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  campusName: string;
  assignedClasses: string[];
}

export default function TeacherPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.id as string;

  const [teacher, setTeacher] = React.useState<TeacherInfo | null>(null);
  const [permissions, setPermissions] = React.useState<PermissionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const fetchPermissions = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers/${teacherId}/permissions`);
      if (!res.ok) {
        throw new Error('Failed to load teacher permissions');
      }
      const data = await res.json();
      setTeacher(data.teacher);
      setPermissions(data.permissions);
    } catch (err: any) {
      toast.error(err.message || 'Error loading permissions');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => {
    if (teacherId) {
      fetchPermissions();
    }
  }, [teacherId, fetchPermissions]);

  const handleToggle = (code: string, granted: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.code === code ? { ...p, granted, isCustomized: true } : p))
    );
  };

  const handleScopeChange = (code: string, scope: any) => {
    setPermissions((prev) =>
      prev.map((p) => (p.code === code ? { ...p, scope, isCustomized: true } : p))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/teachers/${teacherId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: permissions.map((p) => ({
            code: p.code,
            granted: p.granted,
            scope: p.scope,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save permissions');
      }

      toast.success('Permissions updated successfully!');
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.message || 'Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const modules = React.useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    permissions.forEach((p) => {
      const list = map.get(p.module) || [];
      list.push(p);
      map.set(p.module, list);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'attendance':
        return { title: 'Attendance Register', icon: Clock, desc: 'Classroom & homeroom attendance authority' };
      case 'school_timetable':
        return { title: 'School Timetable (Normal Weekly)', icon: Calendar, desc: 'Regular classroom schedule & period planning' };
      case 'exam_timetable':
        return { title: 'Exam Timetable (Formal Decoupled)', icon: GraduationCap, desc: 'Formal date-sheet, term exams & invigilation' };
      case 'students':
        return { title: 'Student Directory & Admissions', icon: Users, desc: 'Student profile access, admissions & records' };
      case 'teachers':
        return { title: 'Faculty & Teacher Management', icon: Shield, desc: 'Faculty profiles and departmental coordination' };
      case 'exams':
        return { title: 'Examinations & Papers', icon: BookOpen, desc: 'Exam papers, syllabus and marking schemes' };
      case 'results':
        return { title: 'Marks & Grade Cards', icon: Sparkles, desc: 'Marks entry, grading, and result publication' };
      default:
        return { title: mod.replace('_', ' ').toUpperCase(), icon: Shield, desc: '' };
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/school/teachers')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teachers
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2 shadow-sm font-semibold"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>

        {/* Teacher Identity Card */}
        {teacher && (
          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {teacher.name}
                      <Badge variant="outline" className="font-mono text-xs">
                        {teacher.employeeId}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {teacher.email} • {teacher.department} ({teacher.designation})
                    </CardDescription>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="secondary" className="font-normal text-xs">
                    Campus: {teacher.campusName}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                <span className="font-semibold text-foreground">Assigned Classes: </span>
                {teacher.assignedClasses.length > 0
                  ? teacher.assignedClasses.join(', ')
                  : 'No classes currently assigned.'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permission Groups */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading permission matrix...</div>
          ) : (
            modules.map(([modKey, items]) => {
              const meta = getModuleTitle(modKey);
              const Icon = meta.icon;

              return (
                <Card key={modKey} className="border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">{meta.title}</CardTitle>
                        <CardDescription className="text-xs">{meta.desc}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-border/50">
                    {items.map((perm) => (
                      <div
                        key={perm.code}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/10 transition-colors"
                      >
                        <div className="space-y-0.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {perm.name}
                            </span>
                            <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                              {perm.code}
                            </code>
                            {perm.isCustomized && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                Customized
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          {perm.granted && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground font-medium">Scope:</span>
                              <Select
                                value={perm.scope}
                                onValueChange={(val) => handleScopeChange(perm.code, val)}
                              >
                                <SelectTrigger className="h-7 text-xs w-28 bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ASSIGNED">Assigned Only</SelectItem>
                                  <SelectItem value="CAMPUS">Campus Wide</SelectItem>
                                  <SelectItem value="SCHOOL">School Wide</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <Switch
                            checked={perm.granted}
                            onCheckedChange={(checked) => handleToggle(perm.code, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
}
