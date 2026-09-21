'use client';

import * as React from 'react';
import { GitBranch, Plus, Search, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { Stream, StreamStatus } from '@/shared/types';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function StreamsSettingsPage() {
  const store = useSchoolStore();
  const [search, setSearch] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingStream, setEditingStream] = React.useState<Stream | null>(null);

  const streams = store.streams || [];
  const classes = store.classes || [];

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    description: '',
    applicableClasses: [] as string[],
    status: 'ACTIVE' as StreamStatus,
  });

  const filteredStreams = streams.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingStream(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      applicableClasses: [],
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (stream: Stream) => {
    setEditingStream(stream);
    setFormData({
      name: stream.name,
      code: stream.code,
      description: stream.description || '',
      applicableClasses: stream.applicableClasses || [],
      status: stream.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingStream) {
      schoolStore.updateStream({
        ...editingStream,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        applicableClasses: formData.applicableClasses,
        status: formData.status,
      });
    } else {
      schoolStore.createStream({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        applicableClasses: formData.applicableClasses,
        status: formData.status,
      });
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Senior Secondary Streams"
        description="Configure Class 11 &amp; 12 academic specializations (e.g. Science, Commerce, Humanities)."
        icon={GitBranch}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Stream
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search streams by name or code..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {streams.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <GitBranch className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No streams configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Senior secondary streams allow tracking subject elective clusters and stream-based exam roll prefixes for high school cohorts.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Stream
              </Button>
            </div>
          ) : filteredStreams.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No streams match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Stream Track</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStreams.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {s.code}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {s.description || '—'}
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
              {editingStream ? 'Edit Academic Stream' : 'Add Academic Stream'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure curriculum track name, prefix code and status.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="name" label="Stream Track Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Science, Commerce, Vocational"
                className="text-xs"
              />
            </FormField>

            <FormField id="code" label="Stream Prefix / Code" required>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. SCI, COMM, HUM"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="description" label="Track Description">
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course outline or group focus"
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
                {editingStream ? 'Update Stream' : 'Create Stream'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
