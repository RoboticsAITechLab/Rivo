'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers, Plus, Search, CheckCircle2, ArrowRight, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

interface ApiClass {
  id: string;
  name: string;
  displayOrder: number;
  totalStudents: number;
  totalSections: number;
  sections: Array<{ id: string; name: string; studentCount: number }>;
  createdAt: string;
  updatedAt: string;
}

export default function ClassesSettingsPage() {
  const [classes, setClasses] = React.useState<ApiClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<ApiClass | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    displayOrder: 0,
    sections: 'A',
  });

  const loadClasses = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to load classes' }));
        setErrorMessage(err.message || 'Failed to load classes');
      }
    } catch (err: any) {
      console.error('Failed to load classes:', err);
      setErrorMessage('Network error loading classes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      displayOrder: classes.length + 1,
      sections: 'A',
    });
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (c: ApiClass) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      displayOrder: c.displayOrder,
      sections: c.sections.map((s) => s.name).join(', ') || 'A',
    });
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingClass) {
        const res = await fetch(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            displayOrder: Number(formData.displayOrder) || 0,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to update class' }));
          throw new Error(err.message || 'Failed to update class');
        }

        setSuccessMessage(`Class "${formData.name.trim()}" updated successfully.`);
      } else {
        const sectionList = formData.sections
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            displayOrder: Number(formData.displayOrder) || 0,
            sections: sectionList.length > 0 ? sectionList : ['A'],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to create class' }));
          throw new Error(err.message || 'Failed to create class');
        }

        setSuccessMessage(`Class "${formData.name.trim()}" created successfully.`);
      }

      setIsDrawerOpen(false);
      await loadClasses();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save class');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: ApiClass) => {
    if (!confirm(`Are you sure you want to delete "${c.name}"? This action cannot be undone.`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/classes/${c.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete class' }));
        throw new Error(err.message || 'Failed to delete class');
      }

      setSuccessMessage(`Class "${c.name}" deleted successfully.`);
      await loadClasses();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes & Grade Cohorts"
        description="Configure academic standards, grade hierarchies and cohort rosters."
        icon={Layers}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Class
          </Button>
        }
      />

      {successMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes by standard name..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading classes from database...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No classes configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Classes define student cohorts (e.g. Class 1, Class 10). Create your institutional standards to establish division sections and timetable schedules.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs cursor-pointer">
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
                    <th className="py-2.5 px-4">Display Order</th>
                    <th className="py-2.5 px-4">Active Sections</th>
                    <th className="py-2.5 px-4">Enrolled Students</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {c.displayOrder}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/school/settings/sections?classId=${c.id}`}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {c.sections?.length ?? 0} section(s) ({c.sections?.map(s => s.name).join(', ') || 'None'})
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {c.totalStudents} student(s)
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status="ACTIVE" />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c)}
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
            <FormField id="name" label="Class Standard Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Class 10 or Grade 1"
                className="text-xs"
              />
            </FormField>

            <FormField id="displayOrder" label="Display Order / Hierarchy">
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                placeholder="e.g. 1, 2, 10"
                className="text-xs font-mono"
              />
            </FormField>

            {!editingClass && (
              <FormField id="sections" label="Initial Division Sections (Comma-separated)">
                <Input
                  id="sections"
                  value={formData.sections}
                  onChange={(e) => setFormData({ ...formData, sections: e.target.value })}
                  placeholder="e.g. A, B, C"
                  className="text-xs font-mono uppercase"
                />
              </FormField>
            )}

            <SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="text-xs cursor-pointer">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {editingClass ? 'Update Class' : 'Create Class'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
