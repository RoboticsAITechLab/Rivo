'use client';

import * as React from 'react';
import { Home, Plus, Search, Building, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

interface CampusRecord {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isMain: boolean;
  studentCount?: number;
  teacherCount?: number;
  createdAt: string;
}

export default function CampusesSettingsPage() {
  const [campuses, setCampuses] = React.useState<CampusRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingCampus, setEditingCampus] = React.useState<CampusRecord | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    isMain: false,
  });

  const fetchCampuses = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/campuses');
      if (!res.ok) throw new Error('Failed to load campuses.');
      const data = await res.json();
      setCampuses(data.campuses || []);
    } catch (err: any) {
      console.error('Error fetching campuses:', err);
      setError(err?.message || 'Error loading campuses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);

  const filteredCampuses = campuses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingCampus(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      isMain: campuses.length === 0,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (campus: CampusRecord) => {
    setEditingCampus(campus);
    setFormData({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      city: campus.city || '',
      state: campus.state || '',
      phone: campus.phone || '',
      email: campus.email || '',
      isMain: campus.isMain,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingCampus) {
        const res = await fetch(`/api/campuses/${editingCampus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to update campus.');
        }
      } else {
        const res = await fetch('/api/campuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || 'Failed to create campus.');
        }
      }

      setIsDrawerOpen(false);
      await fetchCampuses();
    } catch (err: any) {
      alert(err?.message || 'Error saving campus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campuses & Sites"
        description="Configure physical campus branches, operational site codes and multi-campus hierarchy."
        icon={Home}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Campus
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campuses by name, code or location..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* Campuses Table or Empty State */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading campuses from database...</p>
            </div>
          ) : campuses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Home className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No campuses configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No campus sites or branches have been registered yet. Add your main campus to allow student enrollments, exam hall mapping, and section scheduling.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                Add Campus
              </Button>
            </div>
          ) : filteredCampuses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No campuses match the selected search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Campus Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Address / City</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCampuses.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{c.name}</span>
                          {c.isMain && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                              Main Campus
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {c.code || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {[c.address, c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.phone || c.email || '—'}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Campus Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-base font-bold">
              {editingCampus ? 'Edit Campus Site' : 'Add New Campus'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Register a physical institution branch or main administrative campus site.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="name" label="Campus Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. North Campus / Main Branch"
                className="text-xs"
              />
            </FormField>

            <FormField id="code" label="Campus Code">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CMP-NORTH"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="address" label="Street Address">
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 104 Academic Avenue"
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="city" label="City">
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Jaipur"
                  className="text-xs"
                />
              </FormField>

              <FormField id="state" label="State / Province">
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Rajasthan"
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="phone" label="Phone">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="text-xs font-mono"
                />
              </FormField>

              <FormField id="email" label="Contact Email">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="north@institution.edu"
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isMain"
                checked={formData.isMain}
                onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="isMain" className="text-xs font-medium text-foreground cursor-pointer">
                Primary Headquarter / Main Campus
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
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {editingCampus ? 'Update Campus' : 'Create Campus'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
