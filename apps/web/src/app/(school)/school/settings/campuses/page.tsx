'use client';

import * as React from 'react';
import { Home, Plus, Search, CheckCircle2, MoreVertical, MapPin, Phone, Mail, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { Campus } from '@/shared/types';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function CampusesSettingsPage() {
  const store = useSchoolStore();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingCampus, setEditingCampus] = React.useState<Campus | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    headName: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const campuses = store.campuses || [];

  const filteredCampuses = campuses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingCampus(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      headName: '',
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (campus: Campus) => {
    setEditingCampus(campus);
    setFormData({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      phone: campus.phone || '',
      email: campus.email || '',
      headName: campus.headName || '',
      status: campus.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingCampus) {
      schoolStore.updateCampus({
        ...editingCampus,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        headName: formData.headName.trim() || undefined,
        status: formData.status,
      });
    } else {
      schoolStore.createCampus({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        headName: formData.headName.trim() || undefined,
        status: formData.status,
      });
    }

    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (campus: Campus) => {
    schoolStore.updateCampus({
      ...campus,
      status: campus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campuses & Sites"
        description="Configure physical campus branches, operational site codes and multi-campus hierarchy."
        icon={Home}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Campus
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
            placeholder="Search campuses by name, code or location..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 rounded-md border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Campuses Table or Empty State */}
      <Card>
        <CardContent className="p-0">
          {campuses.length === 0 ? (
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
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Campus
              </Button>
            </div>
          ) : filteredCampuses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No campuses match the selected search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Campus Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Address</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Status</th>
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
                        </div>
                        {c.headName && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 ml-5">
                            Head: {c.headName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {c.address || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.phone || c.email || '—'}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
                placeholder="e.g. City Central Campus"
                className="text-xs"
              />
            </FormField>

            <FormField id="code" label="Campus Code / Prefix" required>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CC"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="address" label="Campus Address">
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address or location landmark"
                className="text-xs"
              />
            </FormField>

            <FormField id="headName" label="Campus Head / Principal">
              <Input
                id="headName"
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                placeholder="Full name of site director"
                className="text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="phone" label="Phone">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91..."
                  className="text-xs"
                />
              </FormField>

              <FormField id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="campus@school.edu"
                  className="text-xs"
                />
              </FormField>
            </div>

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
                {editingCampus ? 'Update Campus' : 'Create Campus'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
