'use client';

import * as React from 'react';
import { Calendar, Plus, Search, Star, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

interface AcademicSessionRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'UPCOMING' | 'COMPLETED';
  isCurrent: boolean;
  enrollmentCount?: number;
  assignmentCount?: number;
}

export default function AcademicSessionsSettingsPage() {
  const [sessions, setSessions] = React.useState<AcademicSessionRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<AcademicSessionRecord | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED' | 'UPCOMING' | 'COMPLETED',
    isCurrent: false,
  });

  const fetchSessions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/academic-sessions');
      if (!res.ok) throw new Error('Failed to load academic sessions.');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      console.error('Error fetching academic sessions:', err);
      setError(err?.message || 'Error loading academic sessions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingSession(null);
    setFormData({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      isCurrent: sessions.length === 0,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (session: AcademicSessionRecord) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      status: session.status,
      isCurrent: session.isCurrent,
    });
    setIsDrawerOpen(true);
  };

  const handleSetCurrent = async (session: AcademicSessionRecord) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/academic-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          makeCurrent: true,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to set active session.');
      }
      await fetchSessions();
    } catch (err: any) {
      alert(err?.message || 'Error setting active session.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return;

    try {
      setIsSubmitting(true);
      if (editingSession) {
        const res = await fetch(`/api/academic-sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            makeCurrent: formData.isCurrent,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to update academic session.');
        }
      } else {
        const res = await fetch('/api/academic-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            makeCurrent: formData.isCurrent,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to create academic session.');
        }
      }

      setIsDrawerOpen(false);
      await fetchSessions();
    } catch (err: any) {
      alert(err?.message || 'Error saving academic session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Sessions"
        description="Configure academic years, current operational session and calendar term boundaries."
        icon={Calendar}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Academic Session
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions by name..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading academic sessions from database...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No academic sessions configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  An academic session defines the operational year for admissions, attendance records, examinations, and grade promotions.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Academic Session
              </Button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No academic sessions match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Session Name</th>
                    <th className="py-2.5 px-4">Start Date</th>
                    <th className="py-2.5 px-4">End Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.isCurrent && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              Current
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {s.startDate || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {s.endDate || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {!s.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetCurrent(s)}
                            className="h-7 px-2 text-[11px] text-primary hover:text-primary cursor-pointer"
                          >
                            Set Current
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-7 px-2.5 text-[11px] cursor-pointer"
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
              {editingSession ? 'Edit Academic Session' : 'Create Academic Session'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Define the academic calendar year and mark the active session.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="name" label="Session Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 2026-2027"
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="startDate" label="Start Date" required>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="text-xs font-mono"
                />
              </FormField>

              <FormField id="endDate" label="End Date" required>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="text-xs font-mono"
                />
              </FormField>
            </div>

            <FormField id="status" label="Session Status">
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </FormField>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="isCurrent" className="text-xs font-medium text-foreground cursor-pointer">
                Set as Active Current Session for all school modules
              </label>
            </div>

            <SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                {editingSession ? 'Update Session' : 'Create Session'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
