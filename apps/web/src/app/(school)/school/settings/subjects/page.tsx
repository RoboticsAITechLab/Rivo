'use client';

import * as React from 'react';
import { BookOpen, Plus, Search, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { Subject, SubjectType, SubjectStatus } from '@/shared/types';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function SubjectsSettingsPage() {
  const store = useSchoolStore();
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);

  const subjects = store.subjects || [];
  const classes = store.classes || [];

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    department: '',
    type: 'CORE' as SubjectType,
    weeklyPeriods: 5,
    description: '',
    applicableClassIds: [] as string[],
    status: 'ACTIVE' as SubjectStatus,
  });

  const filteredSubjects = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      department: '',
      type: 'CORE',
      weeklyPeriods: 5,
      description: '',
      applicableClassIds: [],
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      type: subject.type,
      weeklyPeriods: subject.weeklyPeriods || 5,
      description: subject.description || '',
      applicableClassIds: subject.applicableClassIds || [],
      status: subject.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingSubject) {
      schoolStore.updateSubject({
        ...editingSubject,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        department: formData.department.trim() || 'General',
        type: formData.type,
        weeklyPeriods: Number(formData.weeklyPeriods) || 5,
        description: formData.description.trim() || undefined,
        applicableClassIds: formData.applicableClassIds,
        status: formData.status,
      });
    } else {
      schoolStore.createSubject({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        department: formData.department.trim() || 'General',
        type: formData.type,
        weeklyPeriods: Number(formData.weeklyPeriods) || 5,
        description: formData.description.trim() || undefined,
        applicableClassIds: formData.applicableClassIds,
        status: formData.status,
      });
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects &amp; Curriculum"
        description="Configure academic subjects, syllabus codes, departmental divisions and weekly teaching quotas."
        icon={BookOpen}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Subject
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name, code or department..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Types</option>
            <option value="CORE">Core</option>
            <option value="ELECTIVE">Elective</option>
            <option value="OPTIONAL">Optional</option>
            <option value="LANGUAGE">Language</option>
            <option value="PRACTICAL">Practical</option>
            <option value="ACTIVITY">Activity</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {subjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No subjects configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Subjects establish curriculum topics for timetable entries, teacher assignments, homework and examination papers.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </Button>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No subjects match the selected filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Subject Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Periods/Wk</th>
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
                        {s.code}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {s.department || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {s.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {s.weeklyPeriods}
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
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
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure curriculum course name, departmental category and classification.
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

            <FormField id="code" label="Subject Code" required>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MAT-10"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="department" label="Academic Department">
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Science, Humanities, Languages"
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="type" label="Subject Type">
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="CORE">Core</option>
                  <option value="ELECTIVE">Elective</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="LANGUAGE">Language</option>
                  <option value="PRACTICAL">Practical</option>
                  <option value="ACTIVITY">Activity</option>
                </select>
              </FormField>

              <FormField id="weeklyPeriods" label="Weekly Period Quota">
                <Input
                  id="weeklyPeriods"
                  type="number"
                  min={1}
                  max={30}
                  value={formData.weeklyPeriods}
                  onChange={(e) => setFormData({ ...formData, weeklyPeriods: Number(e.target.value) })}
                  className="text-xs font-mono"
                />
              </FormField>
            </div>

            <FormField id="description" label="Description">
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Syllabus notes or curriculum code"
                className="text-xs"
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
                <option value="INACTIVE">Inactive</option>
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
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
