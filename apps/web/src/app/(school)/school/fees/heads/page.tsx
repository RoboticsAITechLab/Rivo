'use client';

import * as React from 'react';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  Sparkles,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { FeeNav } from '@/components/fees/fee-nav';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isRefundable: boolean;
  isActive: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// Standard educational fee structures recommended for K-12 and Higher Secondary
export const SUGGESTED_FEE_HEADS = [
  {
    name: 'Tuition Fee',
    code: 'TUF',
    description: 'Academic instruction, classroom faculty teaching and curriculum delivery',
    isRefundable: false,
  },
  {
    name: 'Admission & Registration Fee',
    code: 'ADMF',
    description: 'One-time initial enrollment and student admission processing charges',
    isRefundable: false,
  },
  {
    name: 'Examination & Assessment Fee',
    code: 'EXMF',
    description: 'Term examinations, evaluation, report cards, and digital marksheet systems',
    isRefundable: false,
  },
  {
    name: 'Science & Computer Lab Fee',
    code: 'LABF',
    description: 'Consumables and equipment for Physics, Chemistry, Biology, and IT labs',
    isRefundable: false,
  },
  {
    name: 'Library & Learning Resource Fee',
    code: 'LIBF',
    description: 'Access to physical library, digital journals, e-books, and periodicals',
    isRefundable: false,
  },
  {
    name: 'Sports & Co-Curricular Activity Fee',
    code: 'ACTF',
    description: 'Athletic facilities, inter-school tournaments, clubs, and cultural activities',
    isRefundable: false,
  },
];

export default function FeeHeadsPage() {
  const [heads, setHeads] = React.useState<FeeHead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Dialog State: Create / Edit Single
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [headToEdit, setHeadToEdit] = React.useState<FeeHead | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formRefundable, setFormRefundable] = React.useState(false);
  const [formActive, setFormActive] = React.useState(true);

  // Suggested Heads Modal State
  const [suggestModalOpen, setSuggestModalOpen] = React.useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<string[]>(
    SUGGESTED_FEE_HEADS.map((s) => s.code)
  );
  const [isApplyingSuggestions, setIsApplyingSuggestions] = React.useState(false);

  const fetchHeads = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fees/heads');
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have permission to view fee heads.');
        throw new Error(`Failed to load fee heads (HTTP ${res.status})`);
      }
      const data = await res.json();
      setHeads(data.heads || []);
    } catch (err: any) {
      console.error('Error loading fee heads:', err);
      setError(err?.message || 'Failed to connect to fee heads catalog service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHeads();
  }, [fetchHeads]);

  const handleOpenCreate = () => {
    setHeadToEdit(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormRefundable(false);
    setFormActive(true);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (h: FeeHead) => {
    setHeadToEdit(h);
    setFormName(h.name);
    setFormCode(h.code);
    setFormDescription(h.description || '');
    setFormRefundable(h.isRefundable);
    setFormActive(h.isActive);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSaveHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setSubmitError('Both Name and Code are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (headToEdit) {
        // PATCH existing
        const res = await fetch(`/api/fees/heads/${headToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            description: formDescription.trim() || null,
            isRefundable: formRefundable,
            isActive: formActive,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || 'Failed to update fee head');
        }

        toast.success(`Fee head '${formName.trim()}' updated successfully`);
      } else {
        // POST new
        const res = await fetch('/api/fees/heads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            description: formDescription.trim() || null,
            isRefundable: formRefundable,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || 'Failed to create fee head');
        }

        toast.success(`Fee head '${formName.trim()}' created successfully`);
      }

      setDialogOpen(false);
      fetchHeads();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save fee head. Please check for duplicate codes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHead = async (h: FeeHead) => {
    if (h.usageCount && h.usageCount > 0) {
      toast.error(`Cannot delete: ${h.name} is used in ${h.usageCount} fee plan version(s).`);
      return;
    }

    if (!confirm(`Are you sure you want to delete Fee Head '${h.name}' (${h.code})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fees/heads/${h.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete fee head');
      }
      toast.success(`Fee head '${h.name}' removed from catalog.`);
      fetchHeads();
    } catch (err: any) {
      toast.error(err?.message || 'Error deleting fee head.');
    }
  };

  // Bulk Apply Suggested Heads with User Confirmation
  const handleApplySuggestions = async () => {
    const toCreate = SUGGESTED_FEE_HEADS.filter(
      (s) =>
        selectedSuggestions.includes(s.code) &&
        !heads.some((h) => h.code.toUpperCase() === s.code.toUpperCase() || h.name.toLowerCase() === s.name.toLowerCase())
    );

    if (toCreate.length === 0) {
      toast.info('All selected suggested fee heads already exist in your catalog.');
      setSuggestModalOpen(false);
      return;
    }

    setIsApplyingSuggestions(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const item of toCreate) {
      try {
        const res = await fetch('/api/fees/heads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json();
          errors.push(`${item.code}: ${errData.message || 'Failed'}`);
        }
      } catch (err: any) {
        errors.push(`${item.code}: ${err.message}`);
      }
    }

    setIsApplyingSuggestions(false);
    setSuggestModalOpen(false);
    fetchHeads();

    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} standard fee heads to catalog.`);
    }
    if (errors.length > 0) {
      toast.warning(`Some items were skipped:\n${errors.join('\n')}`);
    }
  };

  // Filtered Heads
  const filteredHeads = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return heads;
    return heads.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q))
    );
  }, [heads, searchQuery]);

  // Table Columns
  const columns: ColumnDef<FeeHead>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-xs px-2 py-0.5 rounded bg-muted/60 border border-border/60">
          {row.code}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'name',
      header: 'Fee Head Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{row.name}</div>
          {row.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'usageCount',
      header: 'Linked Plans',
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.usageCount && row.usageCount > 0 ? (
            <Badge variant="secondary" className="text-[11px] font-mono">
              {row.usageCount} plan(s)
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">Unlinked</span>
          )}
        </span>
      ),
      width: '130px',
    },
    {
      key: 'isRefundable',
      header: 'Refundable',
      render: (row) =>
        row.isRefundable ? (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
            Refundable
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">Non-refundable</span>
        ),
      width: '130px',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Inactive
          </span>
        ),
      width: '110px',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(row)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Edit Fee Head"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteHead(row)}
            disabled={Boolean(row.usageCount && row.usageCount > 0)}
            className="h-7 w-7 text-muted-foreground hover:text-rose-600 disabled:opacity-40"
            title={row.usageCount && row.usageCount > 0 ? 'Cannot delete linked head' : 'Delete Fee Head'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      width: '90px',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fee Heads Catalog"
        description="Standardized institutional fee categories used for tuition, facilities, laboratories and activities"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHeads}
              disabled={isLoading}
              className="h-8.5 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuggestModalOpen(true)}
              className="h-8.5 text-xs gap-1.5 text-emerald-700 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Suggested Structure
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="h-8.5 text-xs gap-1.5 font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add Fee Head
            </Button>
          </div>
        }
      />

      <FeeNav />

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-lg border bg-card/60 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fee head by code or name..."
            className="pl-8.5 text-xs h-9 bg-background"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Total Fee Heads: <strong className="text-foreground">{heads.length}</strong>
        </div>
      </div>

      {error && !isLoading && (
        <ErrorState
          title="Catalog Service Unavailable"
          message={error}
          onRetry={fetchHeads}
          className="my-6"
        />
      )}

      {/* Empty State Banner when 0 heads */}
      {!isLoading && !error && heads.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed rounded-xl bg-card/40 my-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-foreground">No Fee Heads Configured Yet</h3>
            <p className="text-xs text-muted-foreground">
              A fee catalog defines the billable components (such as Tuition, Laboratory, or Transport) required before creating Fee Plans.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="sm" onClick={handleOpenCreate} className="text-xs gap-1.5 font-semibold">
              <Plus className="h-3.5 w-3.5" /> Create First Fee Head
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuggestModalOpen(true)}
              className="text-xs gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:border-emerald-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Use Suggested Structure
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {heads.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredHeads}
          isLoading={isLoading}
          loadingRowCount={5}
          emptyTitle="No Fee Heads Match Your Search"
          emptyDescription="Try clearing your search query to see all catalog entries."
        />
      )}

      {/* Create / Edit Fee Head Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveHead}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {headToEdit ? 'Edit Fee Head' : 'Add Fee Head'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {headToEdit
                  ? 'Update fee head naming, description, or active status.'
                  : 'Create a new reusable financial component for fee plan templates.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="head-name" className="text-xs font-semibold">
                  Fee Head Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="head-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tuition Fee, Laboratory Charges"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="head-code" className="text-xs font-semibold">
                    Fee Head Code <span className="text-rose-500">*</span>
                  </Label>
                  {headToEdit && headToEdit.usageCount && headToEdit.usageCount > 0 && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Code locked (in use)
                    </span>
                  )}
                </div>
                <Input
                  id="head-code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TUF, LAB, ADM, TRANS"
                  className="text-xs h-9 font-mono uppercase"
                  disabled={Boolean(headToEdit && headToEdit.usageCount && headToEdit.usageCount > 0)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Short unique code within the school catalog.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="head-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Input
                  id="head-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional billing or refund notes"
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="head-refundable" className="text-xs font-semibold">
                    Refundable Component
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Mark if this component is subject to student caution deposit refund rules.
                  </p>
                </div>
                <Switch
                  id="head-refundable"
                  checked={formRefundable}
                  onCheckedChange={setFormRefundable}
                />
              </div>

              {headToEdit && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="head-active" className="text-xs font-semibold">
                      Active Status
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Inactive fee heads cannot be assigned to new fee plans.
                    </p>
                  </div>
                  <Switch
                    id="head-active"
                    checked={formActive}
                    onCheckedChange={setFormActive}
                  />
                </div>
              )}

              {submitError && (
                <div className="p-2.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : headToEdit ? 'Save Changes' : 'Create Fee Head'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suggested Fee Heads Opt-In Confirmation Modal */}
      <Dialog open={suggestModalOpen} onOpenChange={setSuggestModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Suggested Institutional Fee Structure
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Review standard fee categories below. Select which heads to add to your school catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-3 max-h-[55vh] overflow-y-auto pr-1">
            {SUGGESTED_FEE_HEADS.map((s) => {
              const alreadyExists = heads.some(
                (h) => h.code.toUpperCase() === s.code.toUpperCase() || h.name.toLowerCase() === s.name.toLowerCase()
              );
              const isChecked = selectedSuggestions.includes(s.code);

              return (
                <div
                  key={s.code}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                    alreadyExists
                      ? 'bg-muted/40 opacity-70 border-muted'
                      : isChecked
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`sugg-${s.code}`}
                    checked={isChecked}
                    disabled={alreadyExists}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSuggestions((prev) => [...prev, s.code]);
                      } else {
                        setSelectedSuggestions((prev) => prev.filter((c) => c !== s.code));
                      }
                    }}
                    className="mt-0.5 rounded border-border"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`sugg-${s.code}`} className="font-bold text-foreground cursor-pointer">
                        {s.name}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold">
                          {s.code}
                        </span>
                        {alreadyExists && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Already In Catalog
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSuggestModalOpen(false)}
              disabled={isApplyingSuggestions}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplySuggestions}
              disabled={isApplyingSuggestions || selectedSuggestions.length === 0}
              className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isApplyingSuggestions ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding to Catalog...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Confirm & Add Selected
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}