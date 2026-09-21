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
import { useSchoolStore, schoolStore } from '@/shared/mock-store/school-store';
import { selectExams, selectCampuses } from '@/shared/selectors';
import { Exam, ExamType } from '@/shared/types';
import { cn } from '@/lib/utils';

export default function ExamsPage() {
  const store = useSchoolStore();
  const exams = selectExams(store);
  const campuses = selectCampuses(store);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = React.useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const filteredExams = React.useMemo(() => {
    return exams.filter((ex) => {
      if (selectedStatus !== 'ALL' && ex.status !== selectedStatus) return false;
      if (selectedCampus !== 'ALL' && !ex.campusIds.includes(selectedCampus)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesCode = ex.code.toLowerCase().includes(q);
        const matchesType = ex.type.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesType) return false;
      }
      return true;
    });
  }, [exams, selectedStatus, selectedCampus, searchQuery]);

  // Summary counts
  const totalExams = exams.length;
  const ongoingCount = exams.filter((e) => e.status === 'ONGOING').length;
  const scheduledCount = exams.filter((e) => e.status === 'SCHEDULED').length;
  const publishedCount = exams.filter((e) => e.status === 'PUBLISHED').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Formal Examination Cycles"
        description="Institutional examination lifecycle management: papers, multi-exam per day schedules, stable roll numbers, attendance, marks, and multi-campus result reporting."
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
              className="text-xs h-8.5 gap-1.5 bg-primary text-primary-foreground"
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
            <div className="text-[10px] text-muted-foreground">Across Academic Sessions</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto flex-1">
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
              <option value="RESULT_PROCESSING">Result Processing</option>
              <option value="PUBLISHED">Published</option>
            </select>

            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Campuses (Multi-site Aggregate)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Applicable Campuses</th>
                <th className="py-2.5 px-3">Classes</th>
                <th className="py-2.5 px-3">Date Window</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Exam 360 Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No examination cycles found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((ex) => {
                  const campusNames = ex.campusIds
                    .map((id) => campuses.find((c) => c.id === id)?.code || id)
                    .join(', ');
                  const classLabels = ex.classIds
                    .map((id) => id.replace('cls-', 'Class '))
                    .join(', ');

                  let badgeColor = 'bg-secondary text-secondary-foreground';
                  if (ex.status === 'PUBLISHED') badgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
                  else if (ex.status === 'ONGOING') badgeColor = 'bg-blue-500/10 text-blue-700 border-blue-500/20';
                  else if (ex.status === 'SCHEDULED') badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';

                  return (
                    <tr key={ex.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/school/exams/${ex.id}`}
                          className="group flex items-start gap-2.5 cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                              {ex.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Code: {ex.code} • Session 2025-26
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {ex.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-foreground font-medium">
                          {ex.campusIds.length === campuses.length ? 'All Campuses' : campusNames}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {ex.campusIds.length} sites included
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-foreground">{classLabels}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {ex.startDate} <span className="text-muted-foreground">to</span> {ex.endDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border',
                            badgeColor
                          )}
                        >
                          {ex.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link href={`/school/exams/${ex.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                            Manage Exam 360
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
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
          onSuccess={(newExam) => {
            setIsCreateOpen(false);
            showToast(`Formal examination cycle "${newExam.name}" registered successfully.`);
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
  onSuccess: (exam: Exam) => void;
}) {
  const store = useSchoolStore();
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<ExamType>('HALF_YEARLY');
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('2026-04-10');
  const [endDate, setEndDate] = React.useState('2026-04-24');
  const [selectedCampusIds, setSelectedCampusIds] = React.useState<string[]>(['cmp-main', 'cmp-north', 'cmp-south']);
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>(['cls-10', 'cls-11', 'cls-12']);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newExam = schoolStore.createExam({
      schoolId: 'school-gwa',
      academicSessionId: store.activeSessionId,
      name: name.trim(),
      type,
      code: code.trim().toUpperCase() || `${type.slice(0, 3)}-${new Date().getFullYear()}`,
      description: description.trim() || `${name.trim()} evaluation cycle.`,
      status: 'SCHEDULED',
      startDate,
      endDate,
      campusIds: selectedCampusIds,
      classIds: selectedClassIds,
    });

    onSuccess(newExam);
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
                Creates a centralized formal examination event spanning candidate rosters and multi-day timetables.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-2">
          <FormField label="Examination Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Secondary Board Assessment 2026"
              className="h-8.5 text-xs"
              required
            />
          </FormField>

          <FormField label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Formal summative board evaluation cycle"
              className="h-8.5 text-xs"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Exam Type" required>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ExamType)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="ANNUAL">Annual Assessment</option>
                <option value="HALF_YEARLY">Half-Yearly Evaluation</option>
                <option value="PRE_BOARD">Senior Pre-Board</option>
                <option value="TERM">Term Examination</option>
                <option value="UNIT_TEST">Unit Evaluation</option>
              </select>
            </FormField>

            <FormField label="Exam Code" required>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ANN-2026"
                className="h-8.5 text-xs font-mono uppercase"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8.5 text-xs"
              />
            </FormField>

            <FormField label="End Date" required>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8.5 text-xs"
              />
            </FormField>
          </div>

          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
            <span className="text-xs font-semibold text-foreground">Applicable Classes</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {store.classes.map((c) => {
                const isChecked = selectedClassIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassIds([...selectedClassIds, c.id]);
                        } else {
                          setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded border-input text-primary h-3.5 w-3.5"
                    />
                    {c.className}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
            <span className="text-xs font-semibold text-foreground">Included Campus Sites</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {store.campuses.map((c) => {
                const isChecked = selectedCampusIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampusIds([...selectedCampusIds, c.id]);
                        } else {
                          setSelectedCampusIds(selectedCampusIds.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded border-input text-primary h-3.5 w-3.5"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="bg-primary text-white text-xs" onClick={handleSubmit}>
              Create Examination Cycle
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
