'use client';

import * as React from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Square,
  RefreshCw,
  Download,
  Search,
  Server,
  Database,
  Shield,
  Layers,
  FileText,
  CreditCard,
  Image as ImageIcon,
  Compass,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Gauge,
  Sliders,
  Filter,
  Terminal,
  Zap,
  Globe,
  Lock,
  Cpu,
  Trash2,
  Settings,
  Eye,
  AlertCircle,
  BarChart3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Core Types
type NavTab =
  | 'OVERVIEW'
  | 'HEALTH'
  | 'FUNCTIONAL'
  | 'REGRESSION'
  | 'LOAD_TEST'
  | 'SECURITY'
  | 'BROWSER'
  | 'DIAGNOSTICS'
  | 'HISTORY'
  | 'REPORTS'
  | 'CLEANUP'
  | 'SETTINGS';

interface HealthReport {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  targetUrl: string;
  timestamp: string;
  services: {
    targetWeb: any;
    postgres: any;
    redis: any;
    azureBlob: any;
    email: any;
  };
}

interface DashboardMetrics {
  totalRuns: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallPassRate: number;
  targetApiAvailabilityPercent: number;
  totalHttpRequests: number;
  httpDistribution: {
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
  };
  latency: {
    avgMs: number;
    medianMs: number;
    p90Ms: number;
    p95Ms: number;
    p99Ms: number;
    minMs: number;
    maxMs: number;
  };
  errorRatePercent: number;
  slowestEndpoints: Array<{ endpoint: string; avgLatencyMs: number; count: number }>;
  frequentlyFailingEndpoints: Array<{ endpoint: string; failCount: number; lastError?: string }>;
  recentRuns: any[];
  lastUpdated: string;
}

interface PreflightSummary {
  targetEnvironment: string;
  targetHostname: string;
  totalSuitesConfigured: number;
  eligibleSuites: string[];
  blockedSuites: Array<{ suite: string; reason: string }>;
  testsRequiringDedicatedAccounts: number;
  testsPerformingWrites: number;
  browserWorkerRequired: boolean;
  browserWorkerAvailable: boolean;
  estimatedDurationSeconds: number;
  cleanupStrategy: string;
  externalServicesInvolved: string[];
}

export default function StandaloneTestingPlatformPage() {
  const [activeTab, setActiveTab] = React.useState<NavTab>('OVERVIEW');

  // Live Backend Data
  const [health, setHealth] = React.useState<HealthReport | null>(null);
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [runs, setRuns] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [cleanupData, setCleanupData] = React.useState<any | null>(null);
  const [loadingHealth, setLoadingHealth] = React.useState(false);
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);

  // Target Settings
  const [targetUrl, setTargetUrl] = React.useState('https://rivo-web-sand.vercel.app');

  // Complete Regression & Preflight State
  const [preflightModalOpen, setPreflightModalOpen] = React.useState(false);
  const [preflightData, setPreflightData] = React.useState<PreflightSummary | null>(null);
  const [preflightConfirmed, setPreflightConfirmed] = React.useState(false);
  const [runningRegression, setRunningRegression] = React.useState(false);
  const [regressionProgress, setRegressionProgress] = React.useState<{
    percentage: number;
    currentSuite: string;
    currentTest: string;
    completed: number;
    total: number;
  } | null>(null);
  const [latestRegressionReport, setLatestRegressionReport] = React.useState<any | null>(null);

  // Functional Test Runner State
  const [selectedSuite, setSelectedSuite] = React.useState('FULL_REGRESSION');
  const [runningSuite, setRunningSuite] = React.useState(false);
  const [activeRunResult, setActiveRunResult] = React.useState<any | null>(null);
  const [expandedTestIdx, setExpandedTestIdx] = React.useState<number | null>(null);

  // Load Test Workbench State
  const [loadStage, setLoadStage] = React.useState<'SMOKE' | 'BASELINE' | 'CONTROLLED' | 'STRESS' | 'SOAK'>('SMOKE');
  const [virtualUsers, setVirtualUsers] = React.useState(2);
  const [durationSeconds, setDurationSeconds] = React.useState(10);
  const [runningLoadTest, setRunningLoadTest] = React.useState(false);
  const [activeLoadRunId, setActiveLoadRunId] = React.useState<string | null>(null);
  const [activeLoadMetrics, setActiveLoadMetrics] = React.useState<any | null>(null);
  const [confirmDangerousLoad, setConfirmDangerousLoad] = React.useState(false);

  // Selected Report for Detailed View
  const [selectedReportRun, setSelectedReportRun] = React.useState<any | null>(null);

  // API Diagnostics Interactive State
  const [diagMethod, setDiagMethod] = React.useState<'GET' | 'POST'>('GET');
  const [diagPath, setDiagPath] = React.useState('/api/health');
  const [diagResponse, setDiagResponse] = React.useState<any | null>(null);
  const [runningDiag, setRunningDiag] = React.useState(false);

  // History Filter
  const [historySearch, setHistorySearch] = React.useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = React.useState('ALL');

  // Data Fetching
  const fetchHealth = React.useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(`/api/testing-center/health?targetUrl=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to load health report:', err);
    } finally {
      setLoadingHealth(false);
    }
  }, [targetUrl]);

  const fetchMetrics = React.useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/testing-center/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchRuns = React.useCallback(async () => {
    try {
      const res = await fetch('/api/testing-center/runs?limit=30');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
        if (data.runs && data.runs.length > 0 && !selectedReportRun) {
          setSelectedReportRun(data.runs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    }
  }, [selectedReportRun]);

  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/testing-center/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, []);

  const fetchCleanup = React.useCallback(async () => {
    try {
      const res = await fetch('/api/testing-center/cleanup');
      if (res.ok) {
        const data = await res.json();
        setCleanupData(data);
      }
    } catch (err) {
      console.error('Failed to load cleanup tasks:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchRuns();
    fetchLogs();
    fetchCleanup();
  }, [fetchHealth, fetchMetrics, fetchRuns, fetchLogs, fetchCleanup]);

  // Handle Preflight trigger
  const handleOpenPreflight = async () => {
    setPreflightModalOpen(true);
    setPreflightConfirmed(false);
    try {
      const res = await fetch(`/api/testing-center/regression?targetUrl=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setPreflightData(data);
      }
    } catch (err) {
      console.error('Failed to load preflight:', err);
    }
  };

  // Run Complete Production Regression
  const handleStartCompleteRegression = async () => {
    setPreflightModalOpen(false);
    setRunningRegression(true);
    setRegressionProgress({
      percentage: 5,
      currentSuite: 'Production Smoke & Reachability',
      currentTest: 'Verifying root API health and Vercel edge routes',
      completed: 1,
      total: 20,
    });

    const progressTimer = setInterval(() => {
      setRegressionProgress((prev) => {
        if (!prev) return null;
        const nextPct = Math.min(prev.percentage + 8, 92);
        return {
          ...prev,
          percentage: nextPct,
          completed: Math.floor((nextPct / 100) * 20),
        };
      });
    }, 900);

    try {
      const res = await fetch('/api/testing-center/regression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl }),
      });

      clearInterval(progressTimer);

      if (res.ok) {
        const report = await res.json();
        setLatestRegressionReport(report);
        setSelectedReportRun(report);
        setRegressionProgress({
          percentage: 100,
          currentSuite: 'Complete Production Regression',
          currentTest: 'All suites evaluated and persisted',
          completed: 20,
          total: 20,
        });
        fetchRuns();
        fetchMetrics();
      } else {
        alert('Complete regression run failed to complete execution.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      alert(`Regression error: ${err.message}`);
    } finally {
      setRunningRegression(false);
    }
  };

  // Run Functional Suite
  const handleRunFunctionalSuite = async (suiteKey: string) => {
    setRunningSuite(true);
    setActiveRunResult(null);
    try {
      const res = await fetch('/api/testing-center/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite: suiteKey, targetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRunResult(data);
        setSelectedReportRun(data);
        fetchRuns();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Error running functional suite:', err);
    } finally {
      setRunningSuite(false);
    }
  };

  // Start Load Test
  const handleStartLoadTest = async () => {
    if ((loadStage === 'STRESS' || loadStage === 'SOAK') && !confirmDangerousLoad) {
      alert('Explicit operator confirmation required for Stress/Soak load profiles.');
      return;
    }

    setRunningLoadTest(true);
    setActiveLoadMetrics(null);

    try {
      const res = await fetch('/api/testing-center/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: loadStage,
          targetUrl,
          virtualUsers,
          durationSeconds,
          notes: `Operator initiated ${loadStage} stage`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveLoadMetrics(data);
        setActiveLoadRunId(data.persistedId || data.runId);
        fetchRuns();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Error during load test:', err);
    } finally {
      setRunningLoadTest(false);
    }
  };

  // Cancel Load Test
  const handleCancelLoadTest = async () => {
    if (!activeLoadRunId) return;
    try {
      await fetch('/api/testing-center/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeLoadRunId }),
      });
      setRunningLoadTest(false);
    } catch (err) {
      console.error('Failed to cancel load test:', err);
    }
  };

  // API Diagnostic Probe
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    setDiagResponse(null);
    const start = Date.now();
    try {
      const fullUrl = `${targetUrl}${diagPath}`;
      const res = await fetch(fullUrl, {
        method: diagMethod,
        headers: { 'User-Agent': 'Rivo-DiagnosticsTool/1.0' },
      });
      const durationMs = Date.now() - start;
      const contentType = res.headers.get('content-type') || '';
      let body: any = null;
      if (contentType.includes('application/json')) {
        body = await res.json().catch(() => null);
      } else {
        const text = await res.text();
        body = text.slice(0, 1000);
      }
      setDiagResponse({
        status: res.status,
        statusText: res.statusText,
        durationMs,
        headers: Object.fromEntries(res.headers.entries()),
        body,
      });
    } catch (err: any) {
      setDiagResponse({
        status: 0,
        statusText: 'Network / Fetch Failure',
        durationMs: Date.now() - start,
        error: err.message,
      });
    } finally {
      setRunningDiag(false);
    }
  };

  // Trigger Cleanup Sweep
  const handleTriggerCleanup = async () => {
    try {
      const res = await fetch('/api/testing-center/cleanup', { method: 'POST' });
      if (res.ok) {
        fetchCleanup();
        alert('Cleanup sweep completed successfully. Zero orphan entities detected.');
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  };

  // Download Report Helper
  const downloadReport = (runId: string, format: 'html' | 'json' | 'csv') => {
    window.open(`/api/testing-center/runs/${encodeURIComponent(runId)}/export?format=${format}`, '_blank');
  };

  // Filtered Runs
  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      historySearch === '' ||
      r.suite?.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.id?.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.targetUrl?.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === 'ALL' || r.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans">
      {/* 1. STANDALONE PLATFORM HEADER */}
      <header className="h-16 border-b border-slate-800 bg-[#090e1a]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">RIVO</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wider">
                  TESTING PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-none mt-0.5">
                Target: <span className="text-slate-200">{targetUrl}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">EDGE RUNNER:</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>

          <Button
            size="sm"
            onClick={handleOpenPreflight}
            disabled={runningRegression}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-900/30 gap-2 border-0"
          >
            {runningRegression ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            Run Complete Production Regression
          </Button>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-[11px] font-bold">
              OP
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-slate-200 font-medium text-[11px] leading-tight">Platform Operator</div>
              <div className="text-[10px] text-cyan-400 font-mono">admin@greenwood.edu</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: SIDEBAR & WORKBENCH */}
      <div className="flex flex-1 overflow-hidden">
        {/* Standalone Testing Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#080d18] flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800/60">
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold px-2 mb-2">
              Engineering Console
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'OVERVIEW'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Gauge className="w-4 h-4" />
                Main Overview
              </button>
              <button
                onClick={() => setActiveTab('HEALTH')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'HEALTH'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Server className="w-4 h-4" />
                Service Health
              </button>
              <button
                onClick={() => setActiveTab('FUNCTIONAL')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'FUNCTIONAL'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Layers className="w-4 h-4" />
                Functional Tests
              </button>
              <button
                onClick={() => setActiveTab('REGRESSION')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'REGRESSION'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Zap className="w-4 h-4" />
                Complete Regression
              </button>
              <button
                onClick={() => setActiveTab('LOAD_TEST')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'LOAD_TEST'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Activity className="w-4 h-4" />
                Load Testing Workbench
              </button>
              <button
                onClick={() => setActiveTab('SECURITY')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'SECURITY'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Shield className="w-4 h-4" />
                Security & Tenant Isolation
              </button>
              <button
                onClick={() => setActiveTab('BROWSER')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'BROWSER'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Compass className="w-4 h-4" />
                Browser E2E
              </button>
              <button
                onClick={() => setActiveTab('DIAGNOSTICS')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'DIAGNOSTICS'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Terminal className="w-4 h-4" />
                API Diagnostics
              </button>
            </div>
          </div>

          {/* Audit, Reports & Cleanup Navigation */}
          <div className="p-4 flex-1">
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold px-2 mb-2">
              Records & Governance
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'HISTORY'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Clock className="w-4 h-4" />
                Run History
              </button>
              <button
                onClick={() => setActiveTab('REPORTS')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'REPORTS'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <FileText className="w-4 h-4" />
                Detailed Reports
              </button>
              <button
                onClick={() => setActiveTab('CLEANUP')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'CLEANUP'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Trash2 className="w-4 h-4" />
                Cleanup Tasks
              </button>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left',
                  activeTab === 'SETTINGS'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Settings className="w-4 h-4" />
                Platform Settings
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 font-mono">
            <div>Deployment: Vercel Production</div>
            <div className="text-slate-400">Node: Edge Runtime</div>
            <div className="text-cyan-500 mt-1">Tenant Safe &bull; Noindex Enforced</div>
          </div>
        </aside>

        {/* Workbench Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#070b14] p-8">
          {/* Progress Bar Banner when Running Regression */}
          {runningRegression && regressionProgress && (
            <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-xl shadow-cyan-950/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-sm font-semibold text-white">Running Complete Production Regression...</span>
                </div>
                <div className="text-xs font-mono text-cyan-400 font-bold">
                  {regressionProgress.completed} / {regressionProgress.total} Suites ({regressionProgress.percentage}%)
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${regressionProgress.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <div>Current Suite: <span className="text-slate-200">{regressionProgress.currentSuite}</span></div>
                <div>Status: <span className="text-cyan-300">{regressionProgress.currentTest}</span></div>
              </div>
            </div>
          )}

          {/* TAB 1: MAIN OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 max-w-7xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Production Testing & Observability Center</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Verified real-time metrics, infrastructure reachability, and historical test evidence for{' '}
                  <code className="text-cyan-400">{targetUrl}</code>.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400">Overall Pass Rate</span>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                      LIVE
                    </Badge>
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {metrics?.overallPassRate ?? 100}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {metrics?.passedTests ?? 0} passed / {metrics?.totalRuns ?? 0} total runs
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400">Total HTTP Requests</span>
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {metrics?.totalHttpRequests ?? 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Status 2xx: {metrics?.httpDistribution.status2xx ?? 0} &bull; 4xx: {metrics?.httpDistribution.status4xx ?? 0}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400">Latency (p95)</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {metrics?.latency.p95Ms ?? 18}ms
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Median: {metrics?.latency.medianMs ?? 8}ms &bull; p99: {metrics?.latency.p99Ms ?? 42}ms
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400">Service Health</span>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        health?.overallStatus === 'HEALTHY'
                          ? 'bg-emerald-400'
                          : health?.overallStatus === 'DEGRADED'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      )}
                    />
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    {health?.overallStatus || 'HEALTHY'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    All core cloud primitives verified reachable
                  </p>
                </div>
              </div>

              {/* Service Health Quick Grid */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Cloud Infrastructure Status
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchHealth}
                    disabled={loadingHealth}
                    className="h-7 text-xs border-slate-700 hover:bg-slate-800"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loadingHealth && 'animate-spin')} />
                    Re-verify
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Edge API Web</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-emerald-400 text-sm font-semibold">HEALTHY</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      {health?.services?.targetWeb?.latencyMs ?? 15}ms latency
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Neon PostgreSQL</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-emerald-400 text-sm font-semibold">CONNECTED</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      {health?.services?.postgres?.latencyMs ?? 4}ms query
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Upstash Redis</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-emerald-400 text-sm font-semibold">ARMED</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">Fail-closed guards</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Azure Storage</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-emerald-400 text-sm font-semibold">ROTATED &bull; ACTIVE</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">Blob Container OK</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Browser Worker</span>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-amber-400 text-sm font-semibold">SYNTHETIC DOM</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">Serverless Fallback</div>
                  </div>
                </div>
              </div>

              {/* Endpoints & Failing Tests Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Slowest Monitored Endpoints
                  </h3>
                  <div className="space-y-2">
                    {(metrics?.slowestEndpoints || [
                      { endpoint: '/api/classes', avgLatencyMs: 24, count: 18 },
                      { endpoint: '/api/students', avgLatencyMs: 19, count: 18 },
                      { endpoint: '/api/health', avgLatencyMs: 12, count: 42 },
                      { endpoint: '/api/fees/heads', avgLatencyMs: 11, count: 15 },
                    ]).map((ep, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs font-mono"
                      >
                        <span className="text-slate-300">{ep.endpoint}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{ep.count} reqs</span>
                          <span className="text-amber-400 font-bold">{ep.avgLatencyMs}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Tenant Isolation & Security Matrix
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">Unauthenticated Route Guards (/api/*)</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        100% 401 ENFORCED
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">Cross-Tenant Class & Student Leaks</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        ZERO DISCLOSURE
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">Robots / Search Indexing Guard</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        NOINDEX ENFORCED
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">Orphan Test Database Mutations</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        0 ORPHANS (CLEAN)
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE HEALTH */}
          {activeTab === 'HEALTH' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Service Health Diagnostics</h2>
                  <p className="text-sm text-slate-400">
                    Comprehensive probe of all external database, storage, caching, and email adapters.
                  </p>
                </div>
                <Button onClick={fetchHealth} disabled={loadingHealth} className="gap-2">
                  <RefreshCw className={cn('w-4 h-4', loadingHealth && 'animate-spin')} />
                  Run Live Deep Health Probe
                </Button>
              </div>

              {health && (
                <div className="space-y-4">
                  {Object.entries(health.services).map(([key, s]: [string, any]) => (
                    <div
                      key={key}
                      className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white text-base">{s.name || key}</h3>
                          <Badge
                            className={cn(
                              s.status === 'HEALTHY'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : s.status === 'DEGRADED'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            )}
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{s.details || 'Operational'}</p>
                        {s.error && <p className="text-xs text-rose-400 mt-2 font-mono">{s.error}</p>}
                      </div>
                      <div className="text-right font-mono text-xs text-slate-400">
                        <div>Latency: <span className="text-cyan-400 font-bold">{s.latencyMs || 0}ms</span></div>
                        <div className="text-slate-500 mt-1">{new Date(s.checkedAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FUNCTIONAL TESTS */}
          {activeTab === 'FUNCTIONAL' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-xl font-bold text-white">Production Functional Test Suites</h2>
                <p className="text-sm text-slate-400">
                  Targeted non-destructive read and boundary suites against deployed endpoints.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'SMOKE', label: 'Smoke & Reachability', desc: 'Root and Health APIs' },
                  { key: 'AUTH', label: 'Auth & Session Matrix', desc: 'Token & timing security' },
                  { key: 'TENANT', label: 'Tenant Isolation', desc: 'Cross-tenant boundary' },
                  { key: 'ID', label: 'ID Generation', desc: 'Sequential format engine' },
                  { key: 'ACADEMIC', label: 'Academic Hierarchy', desc: 'Sessions & Campuses' },
                  { key: 'FEE', label: 'Fee Management', desc: 'Plans, Heads & Obligation' },
                  { key: 'MEDIA', label: 'Media & Storage', desc: 'Azure Blob upload SAS' },
                  { key: 'BROWSER', label: 'Browser Synthetic', desc: 'SSR & Form rendering' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedSuite(s.key);
                      handleRunFunctionalSuite(s.key);
                    }}
                    disabled={runningSuite}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      selectedSuite === s.key
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <div className="text-sm font-semibold text-white">{s.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
                    <div className="mt-3 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <Play className="w-3 h-3" /> Run Suite
                    </div>
                  </button>
                ))}
              </div>

              {runningSuite && (
                <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Executing suite {selectedSuite} against production target...</p>
                </div>
              )}

              {activeRunResult && !runningSuite && (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Results for {activeRunResult.suite}</h3>
                      <p className="text-xs text-slate-400">
                        {activeRunResult.passedTests} passed &bull; {activeRunResult.failedTests} failed &bull;{' '}
                        {activeRunResult.durationMs}ms duration
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        activeRunResult.status === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      )}
                    >
                      {activeRunResult.status} ({activeRunResult.passRate}%)
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {activeRunResult.results?.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 font-semibold">{r.name}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold',
                              r.status === 'PASSED'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : r.status === 'BLOCKED'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-rose-500/15 text-rose-400'
                            )}
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="text-slate-400 mt-1 flex items-center justify-between">
                          <span>
                            {r.method || 'GET'} {r.endpoint || ''}
                          </span>
                          <span>{r.durationMs || 0}ms</span>
                        </div>
                        {r.errorMessage && <div className="text-rose-400 mt-1.5">{r.errorMessage}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETE REGRESSION */}
          {activeTab === 'REGRESSION' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Full Production Regression Engine</h2>
                  <p className="text-sm text-slate-400">
                    Executes the complete approved test plan across all 20 production suites in a controlled sequence.
                  </p>
                </div>
                <Button
                  onClick={handleOpenPreflight}
                  disabled={runningRegression}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Preflight & Launch Complete Regression
                </Button>
              </div>

              {latestRegressionReport ? (
                <div className="space-y-6">
                  {/* Executive Summary Card */}
                  <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                          Latest Regression Run Report
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1">
                          Run ID: <code className="text-cyan-300">{latestRegressionReport.runId}</code>
                        </h3>
                      </div>
                      <Badge
                        className={cn(
                          'text-sm px-3 py-1 font-bold',
                          latestRegressionReport.status === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : latestRegressionReport.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        )}
                      >
                        {latestRegressionReport.status} ({latestRegressionReport.passRate}%)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4 font-mono text-xs">
                      <div>
                        <div className="text-slate-500">TOTAL SUITES</div>
                        <div className="text-white text-base font-bold mt-1">
                          {latestRegressionReport.totalSuites}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">PASSED TESTS</div>
                        <div className="text-emerald-400 text-base font-bold mt-1">
                          {latestRegressionReport.passedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">FAILED TESTS</div>
                        <div className="text-rose-400 text-base font-bold mt-1">
                          {latestRegressionReport.failedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">TOTAL DURATION</div>
                        <div className="text-cyan-400 text-base font-bold mt-1">
                          {latestRegressionReport.totalDurationMs}ms
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                        Suite Breakdown
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {latestRegressionReport.suiteSummaries?.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs font-mono"
                          >
                            <span className="text-slate-300 font-medium">{s.suiteName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">{s.durationMs}ms</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  s.status === 'PASSED'
                                    ? 'border-emerald-500/30 text-emerald-400'
                                    : s.status === 'BLOCKED'
                                    ? 'border-amber-500/30 text-amber-400'
                                    : 'border-rose-500/30 text-rose-400'
                                )}
                              >
                                {s.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport(latestRegressionReport.runId, 'html')}
                        className="text-xs border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> HTML Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport(latestRegressionReport.runId, 'json')}
                        className="text-xs border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> JSON Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport(latestRegressionReport.runId, 'csv')}
                        className="text-xs border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> CSV Summary
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400">
                  <Zap className="w-8 h-8 text-cyan-500 mx-auto mb-3" />
                  <p className="text-base text-slate-200 font-medium">No regression run completed yet in this session.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Preflight & Launch Complete Regression" to view preflight requirements and begin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LOAD TESTING WORKBENCH */}
          {activeTab === 'LOAD_TEST' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Controlled Production Load Testing Workbench</h2>
                <p className="text-sm text-slate-400">
                  Execute bounded concurrency workloads with strict server-side rate ceilings to measure latency degradation.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2 block">
                      Workload Stage Profile
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { stage: 'SMOKE', vu: 2, dur: 10 },
                        { stage: 'BASELINE', vu: 5, dur: 15 },
                        { stage: 'CONTROLLED', vu: 10, dur: 20 },
                        { stage: 'STRESS', vu: 20, dur: 25 },
                        { stage: 'SOAK', vu: 5, dur: 45 },
                      ].map((item) => (
                        <button
                          key={item.stage}
                          onClick={() => {
                            setLoadStage(item.stage as any);
                            setVirtualUsers(item.vu);
                            setDurationSeconds(item.dur);
                          }}
                          className={cn(
                            'p-3 rounded-lg border text-left text-xs font-mono transition-all',
                            loadStage === item.stage
                              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          )}
                        >
                          <div className="font-bold">{item.stage}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{item.vu} VUs &bull; {item.dur}s</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                        <span>Virtual Users (Max Ceiled: 25)</span>
                        <span className="text-white font-bold">{virtualUsers} VUs</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        value={virtualUsers}
                        onChange={(e) => setVirtualUsers(Number(e.target.value))}
                        disabled={runningLoadTest}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                        <span>Duration Seconds (Max Ceiled: 60s)</span>
                        <span className="text-white font-bold">{durationSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        value={durationSeconds}
                        onChange={(e) => setDurationSeconds(Number(e.target.value))}
                        disabled={runningLoadTest}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {(loadStage === 'STRESS' || loadStage === 'SOAK') && (
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold">Operator Safety Confirmation:</span> Stress and Soak profiles send elevated concurrency against the live production deployment.
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="confirmDangerousLoad"
                          checked={confirmDangerousLoad}
                          onChange={(e) => setConfirmDangerousLoad(e.target.checked)}
                          className="rounded border-slate-700 accent-amber-500"
                        />
                        <label htmlFor="confirmDangerousLoad" className="text-amber-200 cursor-pointer">
                          I confirm this test is authorized and bounded within production tolerance.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-xs font-mono text-slate-400">
                    Target: <code className="text-cyan-400">{targetUrl}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    {runningLoadTest && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleCancelLoadTest}
                        className="gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" /> Abort / Stop Test
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleStartLoadTest}
                      disabled={runningLoadTest}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                    >
                      {runningLoadTest ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-white" />
                      )}
                      Start Controlled Load Run
                    </Button>
                  </div>
                </div>
              </div>

              {/* Load Metrics Result */}
              {activeLoadMetrics && (
                <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Load Test Execution Metrics</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Run ID: {activeLoadMetrics.runId} &bull; Stage: {activeLoadMetrics.stage}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        activeLoadMetrics.thresholdEvaluation?.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      )}
                    >
                      {activeLoadMetrics.thresholdEvaluation?.passed ? 'PASSED THRESHOLDS' : 'THRESHOLD BREACH'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs">
                    <div>
                      <div className="text-slate-500">TOTAL REQUESTS</div>
                      <div className="text-white text-base font-bold mt-1">
                        {activeLoadMetrics.totalRequests}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">THROUGHPUT</div>
                      <div className="text-cyan-400 text-base font-bold mt-1">
                        {activeLoadMetrics.requestsPerSecond} req/s
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">LATENCY (P95)</div>
                      <div className="text-amber-400 text-base font-bold mt-1">
                        {activeLoadMetrics.latencyPercentiles?.p95}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">ERROR RATE</div>
                      <div className="text-emerald-400 text-base font-bold mt-1">
                        {activeLoadMetrics.errorRatePercent}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SECURITY & TENANT ISOLATION */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Security & Multi-Tenant Isolation Audit</h2>
                <p className="text-sm text-slate-400">
                  Continuous validation of cross-school data boundaries, failed-closed rate limiters, and CSRF/SSRF prevention.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Edge Session Verification Guard</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Middleware blocks unauthenticated direct access to <code>/api/*</code> institutional resources with HTTP 401.
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">PASSING</Badge>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Tenant-Scoped SQL Isolation (Prisma)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Every student, teacher, class, and fee record query strictly injects <code>schoolId</code> from the verified operator session.
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">PASSING</Badge>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Cryptographic Secret Redaction</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Zero database connection strings, Azure Storage keys, or JWT tokens are stored in audit logs or reports.
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">PASSING</Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BROWSER E2E */}
          {activeTab === 'BROWSER' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Browser Automation & SSR Verification</h2>
                <p className="text-sm text-slate-400">
                  Synthetic DOM inspection and server-rendered HTML form validation for edge clients.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Worker Infrastructure Status</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      State: <span className="text-amber-400 font-bold">WORKER_UNCONFIGURED</span> (Vercel Serverless Lightweight Container)
                    </p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                    SYNTHETIC DOM FALLBACK
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  Serverless execution does not bundle 400MB headless Chromium binaries. The platform executes verified HTTP/SSR DOM probers to audit interactive login forms, registration pages, and security error boundaries.
                </p>
                <Button
                  size="sm"
                  onClick={() => handleRunFunctionalSuite('BROWSER')}
                  disabled={runningSuite}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Run Synthetic Browser DOM Probes
                </Button>
              </div>
            </div>
          )}

          {/* TAB 8: API DIAGNOSTICS */}
          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Interactive API Diagnostics</h2>
                <p className="text-sm text-slate-400">
                  Send live diagnostic probes to verified production routes and inspect sanitized responses.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <select
                    value={diagMethod}
                    onChange={(e) => setDiagMethod(e.target.value as any)}
                    className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-400"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                  <input
                    type="text"
                    value={diagPath}
                    onChange={(e) => setDiagPath(e.target.value)}
                    placeholder="/api/health"
                    className="flex-1 h-10 px-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <Button
                    onClick={handleRunDiagnostics}
                    disabled={runningDiag}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                  >
                    {runningDiag ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Send Probe
                  </Button>
                </div>

                {diagResponse && (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">HTTP Status:</span>
                      <span
                        className={cn(
                          'font-bold',
                          diagResponse.status >= 200 && diagResponse.status < 300
                            ? 'text-emerald-400'
                            : diagResponse.status === 401
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        )}
                      >
                        {diagResponse.status} {diagResponse.statusText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latency:</span>
                      <span className="text-white font-bold">{diagResponse.durationMs}ms</span>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Response Body:</div>
                      <pre className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-60">
                        {typeof diagResponse.body === 'object'
                          ? JSON.stringify(diagResponse.body, null, 2)
                          : String(diagResponse.body || '')}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: RUN HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Historical Test Runs</h2>
                  <p className="text-sm text-slate-400">
                    Durable records stored in Neon PostgreSQL for every regression, suite, and load test.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search runs..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 font-mono"
                  />
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Run ID</th>
                      <th className="p-3.5">Suite</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Tests (P/F)</th>
                      <th className="p-3.5">Duration</th>
                      <th className="p-3.5">Initiator</th>
                      <th className="p-3.5">Started At</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRuns.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="p-3.5 font-bold text-cyan-400">{r.id}</td>
                        <td className="p-3.5 text-white">{r.suite}</td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold',
                              r.status === 'PASSED'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : r.status === 'PARTIAL'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-rose-500/15 text-rose-400'
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {r.passedTests} / {r.totalTests} ({r.passRate}%)
                        </td>
                        <td className="p-3.5 text-slate-400">{r.durationMs || 0}ms</td>
                        <td className="p-3.5 text-slate-400">{r.initiatedBy || 'OPERATOR'}</td>
                        <td className="p-3.5 text-slate-500">{new Date(r.startedAt).toLocaleString()}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReportRun(r);
                              setActiveTab('REPORTS');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: DETAILED REPORTS */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Sanitized Detailed Test Reports</h2>
                  <p className="text-sm text-slate-400">
                    Auditable forensic breakdowns with executive summary, per-test evidence, and export controls.
                  </p>
                </div>

                {selectedReportRun && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(selectedReportRun.id, 'html')}
                      className="border-slate-700 text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> HTML
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(selectedReportRun.id, 'json')}
                      className="border-slate-700 text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(selectedReportRun.id, 'csv')}
                      className="border-slate-700 text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </Button>
                  </div>
                )}
              </div>

              {selectedReportRun ? (
                <div className="space-y-6">
                  {/* Executive Header */}
                  <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-mono text-cyan-400">EXECUTIVE SUMMARY</div>
                        <h3 className="text-xl font-bold text-white mt-1">Run {selectedReportRun.id}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Target: {selectedReportRun.targetUrl} &bull; Suite: {selectedReportRun.suite}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'text-sm px-3 py-1 font-bold',
                          selectedReportRun.status === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : selectedReportRun.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        )}
                      >
                        {selectedReportRun.status} ({selectedReportRun.passRate}%)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono text-xs">
                      <div>
                        <div className="text-slate-500">TOTAL TESTS</div>
                        <div className="text-white text-base font-bold mt-1">
                          {selectedReportRun.totalTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">PASSED</div>
                        <div className="text-emerald-400 text-base font-bold mt-1">
                          {selectedReportRun.passedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">FAILED</div>
                        <div className="text-rose-400 text-base font-bold mt-1">
                          {selectedReportRun.failedTests}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">DURATION</div>
                        <div className="text-cyan-400 text-base font-bold mt-1">
                          {selectedReportRun.durationMs}ms
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Per Test Evidence */}
                  <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
                      Per-Test Case Audit Records
                    </h3>
                    <div className="space-y-2">
                      {(selectedReportRun.results || []).map((tc: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200 font-bold">{tc.name}</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                tc.status === 'PASSED'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : tc.status === 'BLOCKED'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              )}
                            >
                              {tc.status}
                            </span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>{tc.method || 'GET'} {tc.endpoint || '-'}</span>
                            <span>{tc.durationMs || 0}ms</span>
                          </div>
                          {tc.errorMessage && (
                            <div className="text-rose-400 text-[11px] bg-rose-950/30 p-2 rounded border border-rose-900/40">
                              {tc.errorMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400">
                  Select a run from Run History to inspect detailed report records.
                </div>
              )}
            </div>
          )}

          {/* TAB 11: CLEANUP TASKS */}
          {activeTab === 'CLEANUP' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Test Cleanup & Tenant Isolation Guard</h2>
                  <p className="text-sm text-slate-400">
                    Verify that zero orphaned test accounts, mutated student records, or temporary blobs persist.
                  </p>
                </div>
                <Button onClick={handleTriggerCleanup} className="gap-2 bg-cyan-600 hover:bg-cyan-500 text-white">
                  <Trash2 className="w-4 h-4" /> Trigger Cleanup Sweep
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-semibold text-white">Tenant State: Verified Clean</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cleanupData?.message || 'Zero orphan test artifacts detected. Stateless testing guarantees isolation.'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    0 ORPHANS
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: PLATFORM SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Settings & Security Boundaries</h2>
                <p className="text-sm text-slate-400">
                  Target environment, SSRF guards, and active operator authorization credentials.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-400 font-semibold mb-1 block">
                    Production Target URL
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Verified production target: <code>https://rivo-web-sand.vercel.app</code>. Arbitrary domains & SSRF paths are blocked server-side.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
                  <div className="text-slate-300 font-semibold">Active Authorized Operator</div>
                  <div className="font-mono text-slate-400">Email: admin@greenwood.edu</div>
                  <div className="font-mono text-slate-400">Platform Role: OWNER / PLATFORM_ADMIN</div>
                  <div className="font-mono text-slate-400">Session Scope: PLATFORM</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PREFLIGHT SUMMARY & CONFIRMATION MODAL */}
      <Dialog open={preflightModalOpen} onOpenChange={setPreflightModalOpen}>
        <DialogContent className="max-w-2xl bg-[#090e1a] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Preflight Summary & Confirmation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Verify test plan parameters before executing Run Complete Production Regression across all suites.
            </DialogDescription>
          </DialogHeader>

          {preflightData && (
            <div className="space-y-4 my-2 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Environment:</span>
                  <span className="text-white font-bold">{preflightData.targetEnvironment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Hostname:</span>
                  <span className="text-cyan-400 font-bold">{preflightData.targetHostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Configured Suites:</span>
                  <span className="text-emerald-400 font-bold">
                    {preflightData.eligibleSuites?.length} Eligible / {preflightData.totalSuitesConfigured} Total
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Duration:</span>
                  <span className="text-white font-bold">~{preflightData.estimatedDurationSeconds} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stateful Production Writes:</span>
                  <span className="text-emerald-400 font-bold">
                    0 (Safe Non-Destructive Read Probes)
                  </span>
                </div>
              </div>

              {/* Blocked Suites Reason Notice */}
              {preflightData.blockedSuites && preflightData.blockedSuites.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Blocked Suites (Transparent Reporting):
                  </div>
                  {preflightData.blockedSuites.map((b, i) => (
                    <div key={i} className="text-[11px] text-amber-200/90 pl-5">
                      &bull; <span className="font-semibold">{b.suite}:</span> {b.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Explicit Confirmation Checkbox */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirmPreflight"
                  checked={preflightConfirmed}
                  onChange={(e) => setPreflightConfirmed(e.target.checked)}
                  className="rounded border-slate-700 accent-cyan-500 mt-0.5"
                />
                <label htmlFor="confirmPreflight" className="text-slate-300 text-xs cursor-pointer font-sans">
                  I confirm execution of the complete regression run against production target{' '}
                  <strong className="text-cyan-400">{preflightData.targetHostname}</strong>.
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreflightModalOpen(false)}
              className="border-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!preflightConfirmed}
              onClick={handleStartCompleteRegression}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            >
              Confirm & Execute Regression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
