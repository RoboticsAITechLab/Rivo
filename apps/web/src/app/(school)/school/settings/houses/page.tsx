'use client';

import * as React from 'react';
import { Sparkles, Plus, Search, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { House } from '@/shared/types';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

export default function HousesSettingsPage() {
  const store = useSchoolStore();
  const [search, setSearch] = React.useState('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingHouse, setEditingHouse] = React.useState<House | null>(null);

  const houses = store.houses || [];

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    color: '#3b82f6',
    motto: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const filteredHouses = houses.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingHouse(null);
    setFormData({
      name: '',
      code: '',
      color: '#3b82f6',
      motto: '',
      status: 'ACTIVE',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (h: House) => {
    setEditingHouse(h);
    setFormData({
      name: h.name,
      code: h.code,
      color: h.color || '#3b82f6',
      motto: h.motto || '',
      status: h.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingHouse) {
      schoolStore.updateHouse({
        ...editingHouse,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        color: formData.color,
        motto: formData.motto.trim() || undefined,
        status: formData.status,
      });
    } else {
      schoolStore.createHouse({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        color: formData.color,
        motto: formData.motto.trim() || undefined,
        status: formData.status,
      });
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Houses"
        description="Optional co-curricular student houses, team identifiers, house crest colors and mottos."
        icon={Sparkles}
        actions={
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add House
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search houses by name or code..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {houses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No houses configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  The house system is optional in Rivo. If your institution organizes students into sports or cultural houses, register them here.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add House
              </Button>
            </div>
          ) : filteredHouses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No houses match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">House Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Color</th>
                    <th className="py-2.5 px-4">Motto</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHouses.map((h) => (
                    <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0 border"
                            style={{ backgroundColor: h.color || '#3b82f6' }}
                          />
                          <span>{h.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {h.code}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {h.color || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground italic">
                        {h.motto ? `"${h.motto}"` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={h.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(h)}
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
              {editingHouse ? 'Edit House' : 'Add Co-Curricular House'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure student house name, team color, and crest motto.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <FormField id="name" label="House Name" required>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Phoenix, Gladiators, Ruby"
                className="text-xs"
              />
            </FormField>

            <FormField id="code" label="House Code" required>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. PHX, GLD"
                className="text-xs font-mono uppercase"
              />
            </FormField>

            <FormField id="color" label="House Theme Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-8 w-10 p-0 rounded border cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </FormField>

            <FormField id="motto" label="House Motto / Slogan">
              <Input
                id="motto"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                placeholder="e.g. Courage and Honor"
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
                {editingHouse ? 'Update House' : 'Create House'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
