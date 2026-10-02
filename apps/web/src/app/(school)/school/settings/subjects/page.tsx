'use client';

import * as React from 'react';
import { BookOpen, Plus, Search, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

interface ApiSubject {
  id: string;
  name: string;
  code: string;
  assignedTeacherCount: number;
  timetableSlotCount: number;
  examPaperCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export default function SubjectsSettingsPage() {
  const [subjects, setSubjects] = React.useState<ApiSubject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<ApiSubject | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
  });

  const loadSubjects = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to load subjects' }));
        setErrorMessage(err.message || 'Failed to load subjects');
      }
    } catch (err: any) {
      console.error('Failed to load subjects:', err);
      setErrorMessage('Network error loading subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const filteredSubjects = subjects.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
    });
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (subject: ApiSubject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
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
      if (editingSubject) {
        const res = await fetch(`/api/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase() || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to update subject' }));
          throw new Error(err.message || 'Failed to update subject');
        }

        setSuccessMessage(`Subject "${formData.name.trim()}" updated successfully.`);
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase() || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to create subject' }));
          throw new Error(err.message || 'Failed to create subject');
        }

        setSuccessMessage(`Subject "${formData.name.trim()}" added successfully.`);
      }

      setIsDrawerOpen(false);
      await loadSubjects();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subject: ApiSubject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete subject' }));
        throw new Error(err.message || 'Failed to delete subject');
      }

      setSuccessMessage(`Subject "${subject.name}" deleted successfully.`);
      await loadSubjects();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects & Curriculum"
        description="Configure academic subjects, syllabus codes, departmental divisions and weekly teaching quotas."
        icon={BookOpen}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Subject
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name or syllabus code..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading subjects from database...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No subjects configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Subjects establish curriculum topics for timetable entries, teacher assignments, and examination papers.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </Button>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No subjects match the search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Subject Name</th>
                    <th className="py-2.5 px-4">Subject Code</th>
                    <th className="py-2.5 px-4">Timetable Slots</th>
                    <th className="py-2.5 px-4">Exam Papers</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubjects.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {s.code || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {s.timetableSlotCount} slot(s)
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {s.examPaperCount} paper(s)
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-7 px-2.5 text-[11px] cursor-pointer"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s)}
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
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure curriculum course name and syllabus code.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="name" label="Subject Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mathematics, Physics, English"
                className="text-xs"
              />
            </FormField>

            <FormField id="code" label="Subject Code">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MAT-10, PHY-12"
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
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
