'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Plus,
  FileEdit,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FeeNav } from '@/components/fees/fee-nav';
import { FinancialAmount } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { FinancialConfirmDialog } from '@/components/fees/financial-confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function FeePlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [plan, setPlan] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Version Selection (defaults to latest)
  const [selectedVersionNumber, setSelectedVersionNumber] = React.useState<number>(1);

  // Publish Dialog
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);

  // Create Version Dialog
  const [createVersionDialogOpen, setCreateVersionDialogOpen] = React.useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = React.useState(false);

  const fetchPlan = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fees/plans/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Fee plan not found');
        throw new Error(`Failed to load fee plan (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPlan(data.plan);
      if (data.plan?.versions?.length > 0) {
        setSelectedVersionNumber(data.plan.versions[0].versionNumber);
      }
    } catch (err: any) {
      console.error('Error loading fee plan details:', err);
      setError(err?.message || 'Failed to load fee plan details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const activeVersion = React.useMemo(() => {
    if (!plan?.versions) return null;
    return (
      plan.versions.find((v: any) => v.versionNumber === selectedVersionNumber) ||
      plan.versions[0]
    );
  }, [plan, selectedVersionNumber]);

  // Handle Publish
  const handlePublish = async () => {
    if (!plan || !activeVersion) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/fees/plans/${plan.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber: activeVersion.versionNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Publishing failed');

      toast.success(`Fee plan version v${activeVersion.versionNumber} published and locked.`);
      setPublishDialogOpen(false);
      fetchPlan();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Create New Version
  const handleCreateNewVersion = async () => {
    if (!plan) return;
    setIsCreatingVersion(true);
    try {
      const res = await fetch(`/api/fees/plans/${plan.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create new version');

      toast.success(`Created draft version v${data.version?.versionNumber}.`);
      setCreateVersionDialogOpen(false);
      fetchPlan();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create version');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  if (isLoading && !plan) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !plan) {
    return (
      <PageContainer>
        <ErrorState
          title="Plan Not Found"
          message={error || 'The requested fee plan does not exist or has been removed.'}
          onRetry={fetchPlan}
          className="my-8"
        />
      </PageContainer>
    );
  }

  const isPublished = activeVersion?.status === 'PUBLISHED';

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href="/school/fees/plans">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Fee Plans
          </Button>
        </Link>
      </div>

      <PageHeader
        title={plan.name}
        description={plan.description || `Targeted to ${plan.class?.name || 'Students'} · ${plan.academicSession?.name || ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isPublished ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateVersionDialogOpen(true)}
                  className="h-8.5 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create New Version
                </Button>
                <Link href={`/school/fees/assignments?feePlanVersionId=${activeVersion.id}`}>
                  <Button size="sm" className="h-8.5 text-xs gap-1.5 font-semibold">
                    <Users className="h-3.5 w-3.5" />
                    Assign to Students
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setPublishDialogOpen(true)}
                className="h-8.5 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Lock className="h-3.5 w-3.5" />
                Publish Version v{activeVersion?.versionNumber}
              </Button>
            )}
          </div>
        }
      />

      <FeeNav />

      {/* Top Identity & Status Strip */}
      <div className="p-4 sm:p-5 rounded-xl border bg-card/80 shadow-2xs mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded border border-border/80">
                {plan.code || 'PLAN-AUTO'}
              </span>
              <FeeStatusBadge status={activeVersion?.status || plan.status} size="md" />
              <Badge variant="outline" className="font-mono text-xs">
                Version {activeVersion?.versionNumber || 1}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Academic Session: <strong>{plan.academicSession?.name}</strong></span>
              <span>Class: <strong>{plan.class?.name}</strong></span>
              {plan.section?.name && <span>Section: <strong>{plan.section.name}</strong></span>}
              {plan.campus?.name && <span>Campus: <strong>{plan.campus.name}</strong></span>}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider block">
              Total Plan Value
            </span>
            <FinancialAmount amount={activeVersion?.totalAmount} size="2xl" />
          </div>
        </div>

        {/* Immutability Banner */}
        {isPublished && (
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-xs flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                <strong>Version Immutable:</strong> Published versions are cryptographically protected from inline mutations. Obligations assigned to students remain tied to this version snapshot.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateVersionDialogOpen(true)}
              className="h-7 text-xs px-2.5 bg-background shrink-0"
            >
              Draft Version v{(activeVersion?.versionNumber || 1) + 1}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 border">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="components" className="text-xs">Components ({activeVersion?.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="installments" className="text-xs">Installments ({activeVersion?.installments?.length || 0})</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs">Cohort Assignments ({activeVersion?._count?.assignments || 0})</TabsTrigger>
          <TabsTrigger value="versions" className="text-xs">Version History ({plan.versions?.length || 1})</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Cohort Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Academic Session:</span>
                  <span className="font-semibold text-foreground">{plan.academicSession?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-semibold text-foreground">{plan.class?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Section:</span>
                  <span className="font-semibold text-foreground">{plan.section?.name || 'All Sections'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Campus:</span>
                  <span className="font-semibold text-foreground">{plan.campus?.name || 'All Campuses'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Assigned Students:</span>
                  <span className="font-mono font-bold text-foreground">{activeVersion?._count?.assignments || 0} students</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Schedule Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Fee Heads:</span>
                  <span className="font-mono font-semibold">{activeVersion?.items?.length || 0} heads</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Installments:</span>
                  <span className="font-mono font-semibold">{activeVersion?.installments?.length || 0} cycles</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Published By:</span>
                  <span className="font-medium text-foreground">
                    {activeVersion?.publishedByUser
                      ? `${activeVersion.publishedByUser.firstName} ${activeVersion.publishedByUser.lastName}`
                      : 'Unpublished'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Published Date:</span>
                  <span className="font-mono text-muted-foreground">
                    {activeVersion?.publishedAt
                      ? new Date(activeVersion.publishedAt).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: COMPONENTS */}
        <TabsContent value="components">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Fee Components Breakdown (v{activeVersion?.versionNumber})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-semibold">Code</th>
                      <th className="pb-2 font-semibold">Component / Fee Head</th>
                      <th className="pb-2 font-semibold">Type</th>
                      <th className="pb-2 font-semibold text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeVersion?.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-mono font-bold text-foreground">
                          {item.feeHead?.code}
                        </td>
                        <td className="py-2.5 font-medium text-foreground">
                          {item.name}
                        </td>
                        <td className="py-2.5">
                          {item.isOptional ? (
                            <Badge variant="outline" className="text-[10px]">Optional</Badge>
                          ) : (
                            <span className="text-muted-foreground">Mandatory</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          <FinancialAmount amount={item.amount} size="sm" />
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-bold">
                      <td colSpan={3} className="py-3 text-right">Total Components Sum:</td>
                      <td className="py-3 text-right font-mono">
                        <FinancialAmount amount={activeVersion?.totalAmount} size="md" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INSTALLMENTS */}
        <TabsContent value="installments">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Installment Schedule (v{activeVersion?.versionNumber})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-semibold">#</th>
                      <th className="pb-2 font-semibold">Installment Name</th>
                      <th className="pb-2 font-semibold">Due Date</th>
                      <th className="pb-2 font-semibold">Late Fee Rules</th>
                      <th className="pb-2 font-semibold text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeVersion?.installments?.map((inst: any) => (
                      <tr key={inst.id}>
                        <td className="py-2.5 font-mono font-bold text-muted-foreground">
                          #{inst.installmentNumber}
                        </td>
                        <td className="py-2.5 font-semibold text-foreground">
                          {inst.name}
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground">
                          {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 text-muted-foreground text-[11px]">
                          {inst.lateFeeFinePerDay
                            ? `₹${inst.lateFeeFinePerDay}/day after ${inst.gracePeriodDays || 0} grace days`
                            : 'Standard rules'}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          <FinancialAmount amount={inst.amount} size="sm" />
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-bold">
                      <td colSpan={4} className="py-3 text-right">Total Installments Sum:</td>
                      <td className="py-3 text-right font-mono">
                        <FinancialAmount amount={activeVersion?.totalAmount} size="md" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ASSIGNMENTS */}
        <TabsContent value="assignments">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Linked Student Assignments
                </CardTitle>
                <CardDescription className="text-xs">
                  Students currently enrolled with obligations generated from this version
                </CardDescription>
              </div>
              <Link href={`/school/fees/assignments?feePlanVersionId=${activeVersion?.id}`}>
                <Button size="sm" variant="outline" className="text-xs gap-1 h-8">
                  <Users className="h-3.5 w-3.5" /> Assign More Students
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeVersion?.assignments?.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p>No students assigned to version v{activeVersion?.versionNumber} yet.</p>
                  <Link href={`/school/fees/assignments?feePlanVersionId=${activeVersion?.id}`}>
                    <Button size="sm" className="text-xs mt-2">
                      Assign Cohort Students
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {activeVersion?.assignments?.map((assign: any) => (
                    <div key={assign.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">
                          {assign.student?.firstName} {assign.student?.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Adm #{assign.student?.admissionNumber || 'N/A'} · Roll #{assign.studentEnrollment?.rollNumber || 'N/A'}
                        </div>
                      </div>
                      <Link href={`/school/fees/students/${assign.studentId}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                          View Ledger <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: VERSION HISTORY */}
        <TabsContent value="versions">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Plan Version Audit Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Immutable record of financial revisions and publication events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.versions?.map((ver: any) => {
                  const isCurrent = ver.versionNumber === activeVersion?.versionNumber;
                  const isVerPublished = ver.status === 'PUBLISHED';

                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersionNumber(ver.versionNumber)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/40'
                          : 'border-border/60 bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            Version {ver.versionNumber}
                          </span>
                          <FeeStatusBadge status={ver.status} size="sm" />
                          {isCurrent && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary">
                              Selected View
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isVerPublished ? (
                            <>
                              Published on{' '}
                              {ver.publishedAt
                                ? new Date(ver.publishedAt).toLocaleDateString('en-IN')
                                : 'Recorded date'}{' '}
                              {ver.publishedByUser && (
                                <>by {ver.publishedByUser.firstName} {ver.publishedByUser.lastName}</>
                              )}
                            </>
                          ) : (
                            'Draft (Editable until published)'
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <FinancialAmount amount={ver.totalAmount} size="md" />
                        <div className="text-[11px] text-muted-foreground">
                          {ver.items?.length || 0} heads · {ver.installments?.length || 0} installments
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <FinancialConfirmDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        title={`Publish Plan Version v${activeVersion?.versionNumber}`}
        description="Publishing permanently locks this version. Its components and installments will be immutable."
        confirmLabel="Publish & Lock"
        variant="warning"
        isLoading={isPublishing}
        onConfirm={handlePublish}
      />

      {/* Create Version Dialog */}
      <FinancialConfirmDialog
        open={createVersionDialogOpen}
        onOpenChange={setCreateVersionDialogOpen}
        title={`Create New Version (v${(plan.versions?.[0]?.versionNumber || 1) + 1})`}
        description="This will initialize a new Draft version cloned from the current version. You can customize components and installments before publishing."
        confirmLabel="Initialize Draft Version"
        variant="default"
        isLoading={isCreatingVersion}
        onConfirm={handleCreateNewVersion}
      />
    </PageContainer>
  );
}
