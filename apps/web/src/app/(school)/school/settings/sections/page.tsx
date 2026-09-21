'use client';

import * as React from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, Search, Layers, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { Section, ClassId } from '@/shared/types';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';

export default function SectionsSettingsPage() {
  const store = useSchoolStore();
  const [selectedClassId, setSelectedClassId] = React.useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<{ section: Section; classId: ClassId } | null>(null);

  const classes = store.classes || [];
  const rooms = store.rooms || [];
  const teachers = store.teachers || [];

  const [formData, setFormData] = React.useState({
    classId: '',
    name: '',
    capacity: 40,
    roomId: '',
    classTeacherId: '',
  });

  // Flatten all relational sections with parent class info
  const allSections = React.useMemo(() => {
    return classes.flatMap((c) =>
      (c.sections || []).map((sec) => ({
        ...sec,
        parentClass: c,
      }))
    );
  }, [classes]);

  const filteredSections = allSections.filter((s) => {
    if (selectedClassId === 'ALL') return true;
    return s.classId === selectedClassId;
  });

  const handleOpenCreate = () => {
    setEditingSection(null);
    setFormData({
      classId: classes[0]?.id || '',
      name: '',
      capacity: 40,
      roomId: '',
      classTeacherId: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: { section: Section; classId: ClassId }) => {
    setEditingSection(item);
    setFormData({
      classId: item.classId,
      name: item.section.name,
      capacity: item.section.capacity || 40,
      roomId: item.section.roomId || '',
      classTeacherId: item.section.classTeacherId || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.classId) return;

    if (editingSection) {
      schoolStore.updateSection(formData.classId, {
        ...editingSection.section,
        name: formData.name.trim().toUpperCase(),
        capacity: Number(formData.capacity) || 40,
        roomId: formData.roomId || null,
        classTeacherId: formData.classTeacherId || null,
      });
    } else {
      schoolStore.createSection(formData.classId, {
        name: formData.name.trim().toUpperCase(),
        capacity: Number(formData.capacity) || 40,
        roomId: formData.roomId || null,
        classTeacherId: formData.classTeacherId || null,
      });
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections &amp; Class Divisions"
        description="Relational classroom divisions, seating capacities, assigned homeroom teachers and halls."
        icon={FolderKanban}
        actions={
          <Button
            size="sm"
            onClick={handleOpenCreate}
            disabled={classes.length === 0}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
          </Button>
        }
      />

      {classes.length === 0 && (
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
            className="h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-xs"
          >
            <option value="ALL">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className} ({c.sections?.length ?? 0} sections)
              </option>
            ))}
          </select>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {classes.length === 0 || allSections.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No sections configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Sections divide a class cohort into manageable groups (e.g. Section A, Section B). Each section can have its own capacity, room and class teacher.
                </p>
              </div>
              {classes.length > 0 && (
                <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </Button>
              )}
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No sections match the selected class filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Class Standard</th>
                    <th className="py-2.5 px-4">Section Name</th>
                    <th className="py-2.5 px-4">Room Allocation</th>
                    <th className="py-2.5 px-4">Class Teacher</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSections.map((sec) => {
                    const room = rooms.find((r) => r.id === sec.roomId);
                    const teacher = teachers.find((t) => t.id === sec.classTeacherId);
                    return (
                      <tr key={sec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {sec.parentClass.className}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono text-primary">
                          Section {sec.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {room ? `${room.name} (${room.code})` : '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {teacher
                            ? `${teacher.personal.firstName} ${teacher.personal.lastName}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {sec.capacity} students
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleOpenEdit({ section: sec, classId: sec.classId })
                            }
                            className="h-7 px-2.5 text-[11px]"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
              Assign a section division code, capacity and homeroom assignment.
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
                    {c.className} ({c.displayName})
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
                placeholder="e.g. A, B, Rose, Alpha"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="capacity" label="Student Capacity">
              <Input
                id="capacity"
                type="number"
                min={1}
                max={100}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="text-xs font-mono"
              />
            </FormField>

            <FormField id="room" label="Assigned Homeroom">
              <select
                id="room"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No homeroom assigned</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="teacher" label="Class Teacher">
              <select
                id="teacher"
                value={formData.classTeacherId}
                onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No class teacher assigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.personal.firstName} {t.personal.lastName} ({t.employment.department})
                  </option>
                ))}
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
                {editingSection ? 'Update Section' : 'Create Section'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
