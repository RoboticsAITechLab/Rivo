'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { ExamTypeConfig } from '@/features/settings/types';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function ExamTypesSettingsPage() {
  const [examTypes, setExamTypes] = useState<ExamTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExamTypeConfig | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [sortOrder, setSortOrder] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/school/settings?category=examinations');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setExamTypes(json.data.examTypes || []);
          }
        }
      } catch (err) {
        console.error('Failed to load exam types:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const persistTypes = async (updated: ExamTypeConfig[]) => {
    try {
      setExamTypes(updated);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'examinations',
          value: { examTypes: updated },
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to persist exam types to server');
      }
    } catch (err: any) {
      toast.error(err.message || 'Persistence failed');
    }
  };

  const openCreateDialog = () => {
    setEditingType(null);
    setName('');
    setCode('');
    setDescription('');
    setStatus('ACTIVE');
    setSortOrder(examTypes.length + 1);
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: ExamTypeConfig) => {
    setEditingType(type);
    setName(type.name);
    setCode(type.code);
    setDescription(type.description || '');
    setStatus(type.status);
    setSortOrder(type.sortOrder);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Please enter an exam type name and unique code');
      return;
    }

    let updatedTypes: ExamTypeConfig[];
    if (editingType) {
      updatedTypes = examTypes.map((t) => {
        if (t.id === editingType.id) {
          return {
            ...t,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
            status,
            sortOrder: Number(sortOrder) || 1,
          };
        }
        return t;
      });
      toast.success(`Exam type "${name}" updated successfully`);
    } else {
      const newType: ExamTypeConfig = {
        id: `type-${Date.now()}`,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
        sortOrder: Number(sortOrder) || (examTypes.length + 1),
      };
      updatedTypes = [...examTypes, newType];
      toast.success(`Exam type "${name}" created successfully`);
    }

    await persistTypes(updatedTypes);
    setIsDialogOpen(false);
  };

  const handleDelete = async (type: ExamTypeConfig) => {
    if (confirm(`Are you sure you want to delete exam type "${type.name}"?`)) {
      const updated = examTypes.filter(t => t.id !== type.id);
      await persistTypes(updated);
      toast.success(`Exam type "${type.name}" removed`);
    }
  };

  const filteredTypes = examTypes
    .filter(t => 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Exam Types
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standardize exam classifications such as Unit Tests, Mid-Terms, Practicals, and Final Examinations.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Exam Type
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search exam types by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Configured Exam Types</CardTitle>
          <CardDescription className="text-xs">
            {filteredTypes.length} {filteredTypes.length === 1 ? 'type' : 'types'} listed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">No examination types found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {search ? 'No types matched your search query.' : 'Configure your first exam category (e.g. Unit Test, Terminal Examination) to start scheduling.'}
              </p>
              {!search && (
                <Button variant="outline" size="sm" onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Create First Exam Type
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        #{type.sortOrder}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {type.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <Badge variant="outline" className="font-semibold">
                          {type.code}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {type.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {type.status === 'ACTIVE' ? (
                          <Badge variant="default" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(type)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(type)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Exam Type' : 'Add Exam Type'}</DialogTitle>
              <DialogDescription>
                Define standard exam category details and scheduling display order.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="typeName">Type Name *</Label>
                <Input 
                  id="typeName" 
                  placeholder="e.g. Unit Test 1, Mid-Term Exam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeCode">Code / Slug *</Label>
                  <Input 
                    id="typeCode" 
                    placeholder="e.g. UT-1, MID-TERM"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input 
                    id="sortOrder" 
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Optional brief notes or intended duration..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as 'ACTIVE' | 'INACTIVE')}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Available for scheduling)</SelectItem>
                    <SelectItem value="INACTIVE">Inactive (Archived)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingType ? 'Save Changes' : 'Create Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
