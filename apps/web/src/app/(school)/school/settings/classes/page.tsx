'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers, Plus, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { SchoolClass } from '@/shared/types';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function ClassesSettingsPage() {
  const store = useSchoolStore();
  const [search, setSearch] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<SchoolClass | null>(null);

  const [formData, setFormData] = React.useState({
    className: '',
    displayName: '',
    gradeLevel: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
  });

  const classes = store.classes || [];

  const filteredClasses = classes.filter(
    (c) =>
      c.className.toLowerCase().includes(search.toLowerCase()) ||
      c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      className: '',
      displayName: '',
      gradeLevel: '',
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (c: SchoolClass) => {
    setEditingClass(c);
    setFormData({
      className: c.className,
      displayName: c.displayName,
      gradeLevel: String(c.gradeLevel),
      status: c.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) return;

    if (editingClass) {
      schoolStore.updateClass({
        ...editingClass,
        className: formData.className.trim(),
        displayName: formData.displayName.trim() || formData.className.trim(),
        gradeLevel: formData.gradeLevel.trim() || formData.className.trim(),
        status: formData.status,
      });
    } else {
      schoolStore.createClass({
        className: formData.className.trim(),
        displayName: formData.displayName.trim() || formData.className.trim(),
        gradeLevel: formData.gradeLevel.trim() || formData.className.trim(),
        academicSessionId: store.activeSessionId || '',
        sections: [],
        status: formData.status,
      });
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes &amp; Grade Cohorts"
        description="Configure academic standards, grade hierarchies and cohort rosters."
        icon={Layers}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Class
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes by name or grade..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {classes.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No classes configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Classes define student cohorts (e.g. Grade 1, Class 10). Create your institutional grades to establish division sections and timetable schedules.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Class
              </Button>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No classes match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Class Standard</th>
                    <th className="py-2.5 px-4">Display Name</th>
                    <th className="py-2.5 px-4">Grade Level</th>
                    <th className="py-2.5 px-4">Sections</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {c.className}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.displayName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {c.gradeLevel}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href="/school/settings/sections"
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {c.sections?.length ?? 0} section(s)
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-base font-bold">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Define academic standard cohort and grade hierarchy level.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="className" label="Class Name" required>
              <Input
                id="className"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                placeholder="e.g. Class 10"
                className="text-xs"
              />
            </FormField>

            <FormField id="displayName" label="Display Label">
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Tenth Standard"
                className="text-xs"
              />
            </FormField>

            <FormField id="gradeLevel" label="Grade Level / Hierarchy Order">
              <Input
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                placeholder="e.g. 10"
                className="text-xs font-mono"
              />
            </FormField>

            <FormField id="status" label="Status">
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </FormField>

            <SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                {editingClass ? 'Update Class' : 'Create Class'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
