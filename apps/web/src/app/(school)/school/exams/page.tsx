'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  Clock,
  Plus,
  Search,
  Hash,
  ArrowRight,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ExamTermPaper {
  id: string;
  paperCode: string;
  maxMarks: number;
  subject?: { id: string; name: string };
  schedules?: Array<{ id: string; class?: { name: string }; section?: { name: string } }>;
}

interface ExamTerm {
  id: string;
  name: string;
  code: string | null;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  academicSession?: { id: string; name: string };
  papers?: ExamTermPaper[];
}

export default function ExamsPage() {
  const [examTerms, setExamTerms] = React.useState<ExamTerm[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const fetchExamTerms = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/timetable/exam');
      if (res.ok) {
        const data = await res.json();
        setExamTerms(data.examTerms || []);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to load exam terms' }));
        setErrorMessage(err.message);
      }
    } catch (err) {
      console.error('Failed to fetch exam terms:', err);
      setErrorMessage('Network error fetching exam terms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExamTerms();
  }, [fetchExamTerms]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteTerm = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete exam term "${name}"?`)) return;
    try {
      const res = await fetch(`/api/timetable/exam?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Exam cycle "${name}" deleted.`);
        fetchExamTerms();
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to delete' }));
        alert(err.message || 'Failed to delete exam cycle');
      }
    } catch (err) {
      console.error('Error deleting exam cycle:', err);
    }
  };

  const handleTogglePublish = async (term: ExamTerm) => {
    try {
      const res = await fetch('/api/timetable/exam', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: term.id,
          isPublished: !term.isPublished,
        }),
      });
      if (res.ok) {
        showToast(`Exam "${term.name}" publication status updated.`);
        fetchExamTerms();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Derive status from dates & publication
  const getTermStatus = (term: ExamTerm): 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED' => {
    if (term.isPublished) return 'PUBLISHED';
    const now = new Date();
    const start = new Date(term.startDate);
    const end = new Date(term.endDate);
    if (now < start) return 'SCHEDULED';
    if (now >= start && now <= end) return 'ONGOING';
    return 'COMPLETED';
  };

  const filteredExams = React.useMemo(() => {
    return examTerms.filter((ex) => {
      const status = getTermStatus(ex);
      if (selectedStatus !== 'ALL' && status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesCode = (ex.code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [examTerms, selectedStatus, searchQuery]);

  // Summary counts
  const totalExams = examTerms.length;
  const ongoingCount = examTerms.filter((e) => getTermStatus(e) === 'ONGOING').length;
  const scheduledCount = examTerms.filter((e) => getTermStatus(e) === 'SCHEDULED').length;
  const publishedCount = examTerms.filter((e) => e.isPublished).length;

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Formal Examination Cycles"
        description="Institutional examination lifecycle management: papers, multi-exam per day schedules, stable roll numbers, attendance, marks, and result reporting."
        icon={Award}
        badge="Academic Evaluation"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/school/exams/roll-numbers">
              <Button variant="outline" size="sm" className="text-xs h-8.5 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10">
                <Hash className="h-3.5 w-3.5 text-emerald-600" />
                Exam Roll Registry
              </Button>
            </Link>
            <Button
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-primary text-primary-foreground cursor-pointer"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Formal Exam Cycle
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Exam Cycles
            </div>
            <div className="text-xl font-bold text-foreground">{totalExams}</div>
            <div className="text-[10px] text-muted-foreground">Active Database Records</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Ongoing Evaluations
            </div>
            <div className="text-xl font-bold text-blue-600">{ongoingCount}</div>
            <div className="text-[10px] text-muted-foreground">Active in exam halls</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Upcoming / Scheduled
            </div>
            <div className="text-xl font-bold text-amber-600">{scheduledCount}</div>
            <div className="text-[10px] text-muted-foreground">Timetables prepared</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Results Published
            </div>
            <div className="text-xl font-bold text-emerald-600">{publishedCount}</div>
            <div className="text-[10px] text-muted-foreground">Marksheets available</div>
          </div>
        </Card>
      </div>

      {/* 3. Filters */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search examination name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredExams.length}</strong> exam cycles
          </div>
        </div>
      </Card>

      {/* 4. Formal Exams Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3">Examination Cycle</th>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Papers &amp; Subjects</th>
                <th className="py-2.5 px-3">Date Window</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading examination cycles from database...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No examination cycles found. Click &quot;New Formal Exam Cycle&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredExams.map((ex) => {
                  const status = getTermStatus(ex);
                  let badgeColor = 'bg-secondary text-secondary-foreground';
                  if (status === 'PUBLISHED') badgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
                  else if (status === 'ONGOING') badgeColor = 'bg-blue-500/10 text-blue-700 border-blue-500/20';
                  else if (status === 'SCHEDULED') badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';

                  const paperCount = ex.papers?.length || 0;
                  const startDateStr = new Date(ex.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const endDateStr = new Date(ex.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={ex.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-xs">
                              {ex.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Code: {ex.code || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-medium text-foreground">
                          {ex.academicSession?.name || 'Active Session'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-foreground">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{paperCount} {paperCount === 1 ? 'Paper' : 'Papers'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {startDateStr} <span className="text-muted-foreground">to</span> {endDateStr}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(ex)}
                          title="Click to toggle published status"
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer hover:opacity-80 transition-opacity',
                            badgeColor
                          )}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/school/exams/${ex.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                              Manage Exam
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTerm(ex.id, ex.name)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Exam Cycle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Create Exam Dialog */}
      {isCreateOpen && (
        <CreateExamDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            showToast('Formal examination cycle registered successfully.');
            fetchExamTerms();
          }}
        />
      )}
    </PageContainer>
  );
}

function CreateExamDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [startDate, setStartDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Examination name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/timetable/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase() || undefined,
          startDate,
          endDate,
          isPublished: false,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to create exam term' }));
        setFormError(err.message || 'Failed to create exam term');
      }
    } catch (err: any) {
      console.error('Error creating exam term:', err);
      setFormError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">New Formal Examination Cycle</DialogTitle>
              <DialogDescription className="text-xs">
                Creates a centralized formal examination event in the active academic session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {formError && (
            <div className="p-3 text-xs bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 rounded-lg">
              {formError}
            </div>
          )}

          <FormField label="Examination Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Secondary Board Assessment 2026"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Exam Code">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ANN-2026"
              className="h-8.5 text-xs font-mono uppercase"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8.5 text-xs"
                required
              />
            </FormField>

            <FormField label="End Date" required>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8.5 text-xs"
                required
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Direct database synchronization enabled for active session.</span>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-primary text-white text-xs cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Examination Cycle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
