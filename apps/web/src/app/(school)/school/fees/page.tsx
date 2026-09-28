'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FeeNav } from '@/components/fees/fee-nav';
import { FeeMetricCard } from '@/components/fees/fee-metric-card';
import { FinancialAmount } from '@/components/fees/financial-amount';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';
import { FeeDetailDrawer } from '@/components/fees/fee-detail-drawer';
import { StudentIdentityBlock } from '@/components/fees/student-identity-block';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsResponse {
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalConcessions: number;
    todayCollections: number;
    thisMonthCollections: number;
  };
  outstandingByClass: Array<{ className: string; amount: number }>;
  outstandingByCampus: Array<{ campusName: string; amount: number }>;
  collectionTrend: Array<{ date: string; amount: number }>;
  recentPayments: any[];
  recentReceipts: any[];
  upcomingDues: any[];
  overdueObligations: any[];
  recentReversals: any[];
}

export default function FeeDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [sessions, setSessions] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>('');
  const [campuses, setCampuses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedCampusId, setSelectedCampusId] = React.useState<string>('');

  // Selected item for drawer inspection
  const [inspectedPayment, setInspectedPayment] = React.useState<any | null>(null);

  // Fetch Academic Sessions and Campuses
  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [sessRes, campRes] = await Promise.all([
          fetch('/api/academic-sessions'),
          fetch('/api/campuses'),
        ]);
        if (sessRes.ok) {
          const sData = await sessRes.json();
          const sessList = sData.sessions || sData.academicSessions || [];
          setSessions(sessList);
          const active = sessList.find((s: any) => s.status === 'ACTIVE');
          if (active) setSelectedSessionId(active.id);
        }
        if (campRes.ok) {
          const cData = await campRes.json();
          setCampuses(cData.campuses || []);
        }
      } catch (err) {
        console.warn('Failed to load sessions/campuses', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Dashboard Stats from authoritative API
  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSessionId) params.set('academicSessionId', selectedSessionId);
      if (selectedCampusId) params.set('campusId', selectedCampusId);

      const res = await fetch(`/api/fees/stats?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You do not have permission to view fee financial analytics.');
        }
        throw new Error(`Failed to load fee dashboard stats (HTTP ${res.status})`);
      }
      const resJson = await res.json();
      setData(resJson);
    } catch (err: any) {
      console.error('Error fetching fee stats:', err);
      setError(err?.message || 'Unable to connect to financial analytics service.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionId, selectedCampusId]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const summary = data?.summary || {
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    totalConcessions: 0,
    todayCollections: 0,
    thisMonthCollections: 0,
  };

  return (
    <PageContainer>
      <PageHeader
        title="Fee Management"
        description="Institutional financial overview, real-time fee collection, obligations & audit settlement"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
              className="h-8.5 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/school/fees/plans/new">
              <Button variant="outline" size="sm" className="h-8.5 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Plan
              </Button>
            </Link>
            <Link href="/school/fees/payments/new">
              <Button size="sm" className="h-8.5 text-xs gap-1.5 font-semibold">
                <CreditCard className="h-3.5 w-3.5" />
                Collect Payment
              </Button>
            </Link>
          </div>
        }
      />

      <FeeNav />

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-lg border bg-card/60 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scope:
          </span>
          {sessions.length > 0 && (
            <div className="w-[180px]">
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {campuses.length > 0 && (
            <div className="w-[180px]">
              <select
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Real-time authoritative ledger data</span>
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          title="Financial Analytics Unavailable"
          message={error}
          onRetry={fetchStats}
          className="my-6"
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 border rounded-lg bg-card space-y-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      )}

      {/* Financial Metrics Grid */}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeeMetricCard
              title="Total Expected"
              amount={summary.totalExpected}
              subtext="Original obligations minus concessions"
              icon={FileSpreadsheet}
              variant="default"
            />
            <FeeMetricCard
              title="Total Collected"
              amount={summary.totalCollected}
              subtext={`₹${(summary.thisMonthCollections || 0).toLocaleString('en-IN')} this month`}
              icon={CheckCircle2}
              variant="success"
            />
            <FeeMetricCard
              title="Total Outstanding"
              amount={summary.totalOutstanding}
              subtext={`${(((summary.totalOutstanding || 0) / (summary.totalExpected || 1)) * 100).toFixed(1)}% of total dues`}
              icon={Clock}
              variant="warning"
            />
            <FeeMetricCard
              title="Total Overdue"
              amount={summary.totalOverdue}
              subtext="Unsettled obligations past due date"
              icon={AlertCircle}
              variant="destructive"
            />
          </div>

          {/* Today & Monthly Collection Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border bg-card/80 shadow-2xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                Today's Cashflow
              </span>
              <div>
                <FinancialAmount amount={summary.todayCollections} size="xl" variant="success" />
              </div>
              <p className="text-[11px] text-muted-foreground">Recorded across today's receipts</p>
            </div>
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                Month-to-Date Collections
              </span>
              <div>
                <FinancialAmount amount={summary.thisMonthCollections} size="xl" variant="default" />
              </div>
              <p className="text-[11px] text-muted-foreground">Cumulative receipts in current calendar month</p>
            </div>
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                Approved Concessions
              </span>
              <div>
                <FinancialAmount amount={summary.totalConcessions} size="xl" variant="muted" />
              </div>
              <p className="text-[11px] text-muted-foreground">Deducted from gross fee obligations</p>
            </div>
          </div>

          {/* Outstanding by Class & Campus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Outstanding by Class */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Outstanding by Class
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Uncollected student fee obligations across grade divisions
                    </CardDescription>
                  </div>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {data.outstandingByClass.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No outstanding class balances.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.outstandingByClass.map((c) => (
                      <div key={c.className} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                        <span className="font-semibold text-foreground">{c.className}</span>
                        <FinancialAmount amount={c.amount} size="sm" variant="warning" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Due Obligations */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Upcoming Due Installments
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Obligations maturing within the next 30 days
                    </CardDescription>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {data.upcomingDues.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No installments maturing in the next 30 days.
                  </p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.upcomingDues.map((due: any) => (
                      <div key={due.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">
                            {due.student?.firstName} {due.student?.lastName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {due.studentEnrollment?.class?.name} · Due:{' '}
                            {new Date(due.dueDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <FinancialAmount amount={due.balanceAmount} size="sm" variant="warning" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments & Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Recent Collections
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Latest financial receipts recorded
                  </CardDescription>
                </div>
                <Link href="/school/fees/payments">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    View All <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data.recentPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No payments recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.recentPayments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setInspectedPayment(p)}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 px-2 rounded-md transition-colors cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground">
                              {p.paymentNumber}
                            </span>
                            <FeeStatusBadge status={p.status} size="sm" />
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.student?.firstName} {p.student?.lastName} · Mode: {p.paymentMode}
                          </div>
                        </div>
                        <div className="text-right">
                          <FinancialAmount amount={p.amount} size="sm" variant="success" />
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue Students */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Overdue Students
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students with mature unpaid balances requiring cashier action
                  </CardDescription>
                </div>
                <Link href="/school/fees/assignments">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    View All <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data.overdueObligations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No overdue obligations found.
                  </p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.overdueObligations.map((ob: any) => (
                      <div key={ob.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground">
                            {ob.student?.firstName} {ob.student?.lastName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {ob.studentEnrollment?.class?.name} · {ob.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <FinancialAmount amount={ob.balanceAmount} size="sm" variant="destructive" />
                            <div className="text-[10px] text-rose-500 font-medium">Overdue</div>
                          </div>
                          <Link href={`/school/fees/students/${ob.studentId}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                              Inspect
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Reversals Section */}
          {data.recentReversals && data.recentReversals.length > 0 && (
            <Card className="border-purple-200/80 bg-purple-50/20 dark:border-purple-900/40 dark:bg-purple-950/10 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Audit Alerts: Recent Payment Reversals
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-purple-200/60 dark:divide-purple-900/40 text-xs">
                  {data.recentReversals.map((rev) => (
                    <div key={rev.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold line-through text-muted-foreground">
                            {rev.paymentNumber}
                          </span>
                          <FeeStatusBadge status="REVERSED" size="sm" />
                          <span className="text-muted-foreground">
                            for {rev.student?.firstName} {rev.student?.lastName}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Reason: <em>"{rev.reversalReason || 'No reason provided'}"</em>
                        </p>
                      </div>
                      <div className="text-right">
                        <FinancialAmount amount={rev.amount} size="sm" variant="muted" className="line-through" />
                        <div className="text-[10px] text-muted-foreground">
                          {rev.reversedAt ? new Date(rev.reversedAt).toLocaleDateString('en-IN') : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Inspection Drawer for Payment Row */}
      {inspectedPayment && (
        <FeeDetailDrawer
          open={!!inspectedPayment}
          onOpenChange={(open) => !open && setInspectedPayment(null)}
          title={inspectedPayment.paymentNumber}
          subtitle={`Recorded on ${new Date(inspectedPayment.paymentDate).toLocaleDateString('en-IN')}`}
          badge={<FeeStatusBadge status={inspectedPayment.status} size="sm" />}
          onOpenFullDetail={() => router.push(`/school/fees/payments/${inspectedPayment.id}`)}
          onPrint={inspectedPayment.receipt?.id ? () => router.push(`/school/fees/receipts/${inspectedPayment.receipt.id}`) : undefined}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-muted/20 rounded-lg space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold">Student</span>
              <div className="font-bold text-sm text-foreground">
                {inspectedPayment.student?.firstName} {inspectedPayment.student?.lastName}
              </div>
              <div className="text-muted-foreground font-mono">
                Adm #{inspectedPayment.student?.admissionNumber || 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase block">Amount Paid</span>
                <FinancialAmount amount={inspectedPayment.amount} size="lg" variant="success" />
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase block">Payment Mode</span>
                <span className="font-bold text-foreground">{inspectedPayment.paymentMode}</span>
              </div>
            </div>

            {inspectedPayment.receipt?.receiptNumber && (
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Receipt Generated</span>
                  <span className="font-mono font-bold text-foreground">{inspectedPayment.receipt.receiptNumber}</span>
                </div>
                <Link href={`/school/fees/receipts/${inspectedPayment.receipt.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </FeeDetailDrawer>
      )}
    </PageContainer>
  );
}
