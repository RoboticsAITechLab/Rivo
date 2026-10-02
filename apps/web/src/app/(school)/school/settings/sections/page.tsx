'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FolderKanban, Plus, Search, Layers, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';

interface ApiClass {
  id: string;
  name: string;
  displayOrder: number;
  sections: Array<{ id: string; name: string }>;
}

interface ApiSection {
  id: string;
  name: string;
  classId: string;
  className: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function SectionsSettingsPage() {
  const searchParams = useSearchParams();
  const initialClassFilter = searchParams.get('classId') || 'ALL';

  const [classes, setClasses] = React.useState<ApiClass[]>([]);
  const [sections, setSections] = React.useState<ApiSection[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState<string>(initialClassFilter);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<ApiSection | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    classId: '',
    name: '',
  });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/sections'),
      ]);

      if (classesRes.ok && sectionsRes.ok) {
        const classesData = await classesRes.json();
        const sectionsData = await sectionsRes.json();
        setClasses(classesData.classes || []);
        setSections(sectionsData.sections || []);
      } else {
        setErrorMessage('Failed to load sections and classes data from server.');
      }
    } catch (err: any) {
      console.error('Failed to load sections data:', err);
      setErrorMessage('Network error loading sections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSections = sections.filter((s) => {
    if (selectedClassId === 'ALL') return true;
    return s.classId === selectedClassId;
  });

  const handleOpenCreate = () => {
    setEditingSection(null);
    setFormData({
      classId: selectedClassId !== 'ALL' ? selectedClassId : classes[0]?.id || '',
      name: '',
    });
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (sec: ApiSection) => {
    setEditingSection(sec);
    setFormData({
      classId: sec.classId,
      name: sec.name,
    });
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.classId) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingSection) {
        const res = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim().toUpperCase(),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to update section' }));
          throw new Error(err.message || 'Failed to update section');
        }

        setSuccessMessage(`Section "${formData.name.trim().toUpperCase()}" updated successfully.`);
      } else {
        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: formData.classId,
            name: formData.name.trim().toUpperCase(),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to create section' }));
          throw new Error(err.message || 'Failed to create section');
        }

        setSuccessMessage(`Section "${formData.name.trim().toUpperCase()}" added successfully.`);
      }

      setIsDrawerOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sec: ApiSection) => {
    if (!confirm(`Are you sure you want to delete Section "${sec.name}" of "${sec.className}"?`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sections/${sec.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete section' }));
        throw new Error(err.message || 'Failed to delete section');
      }

      setSuccessMessage(`Section "${sec.name}" deleted successfully.`);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete section');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections & Class Divisions"
        description="Relational classroom divisions, student capacity, and division rosters."
        icon={FolderKanban}
        actions={
          <Button
            size="sm"
            onClick={handleOpenCreate}
            disabled={classes.length === 0}
            className="gap-1.5 text-xs h-8 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
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

      {classes.length === 0 && !isLoading && (
        <DependencyAlert
          title="No Classes Available"
          description="Sections must belong to a parent class standard. Create a class cohort first before adding sections."
          configureHref="/school/settings/classes"
          configureLabel="Create Class →"
          severity="warning"
        />
      )}

      {/* Filter by parent class */}
      {classes.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Filter by Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-xs cursor-pointer"
          >
            <option value="ALL">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.sections?.length ?? 0} sections)
              </option>
            ))}
          </select>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading sections from database...</span>
            </div>
          ) : classes.length === 0 || sections.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No sections configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Sections divide a class cohort into manageable groups (e.g. Section A, Section B).
                </p>
              </div>
              {classes.length > 0 && (
                <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </Button>
              )}
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No sections configured for this class.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Class Standard</th>
                    <th className="py-2.5 px-4">Section Division</th>
                    <th className="py-2.5 px-4">Enrolled Students</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {sec.className}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-primary">
                        Section {sec.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {sec.studentCount} student(s)
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(sec)}
                          className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sec)}
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
              {editingSection ? 'Edit Section' : 'Add Division Section'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Assign a section division code to a class standard.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="parentClass" label="Parent Class Standard" required>
              <select
                id="parentClass"
                required
                disabled={Boolean(editingSection)}
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="name" label="Section Code / Label" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. A, B, C, Rose, Red"
                className="text-xs font-mono uppercase"
              />
            </FormField>

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
                {editingSection ? 'Update Section' : 'Create Section'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
