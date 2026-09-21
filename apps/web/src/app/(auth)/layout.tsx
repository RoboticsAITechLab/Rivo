import * as React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Building2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RivoLogo } from '@/components/ui/rivo-logo';

export const metadata = {
  title: 'Authentication — Rivo School Digital Ecosystem',
  description: 'Secure authentication gateway for school administrators, faculty, and institutional staff.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Visual / Message Panel (Desktop Left Column, Tablet Compact Banner) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-5/12 bg-slate-900 text-white p-8 xl:p-12 flex-col justify-between overflow-hidden">
        {/* Subtle geometric ambient lighting */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
          >
            <RivoLogo variant="icon" size="md" className="shadow-lg shadow-emerald-950/40" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                RIVO
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-[10px] font-mono uppercase tracking-wider"
              >
                School OS
              </Badge>
            </div>
          </Link>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Institutional Digital Ecosystem & Management Infrastructure
          </p>
        </div>

        {/* Center Institutional Assurance Visual */}
        <div className="relative z-10 my-auto py-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl xl:text-2xl font-semibold text-white tracking-tight">
              Administrative & Academic Governance
            </h2>
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed max-w-md">
              Secure, centralized operational environment designed for school leadership, campus management, and academic compliance.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-200">Role-Based Access Governance</p>
                <p className="text-[11px] text-slate-400">Strict separation between school administration, faculty responsibilities, and institutional data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <Building2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-200">Unified Multi-Campus Architecture</p>
                <p className="text-[11px] text-slate-400">Centralized academic sessions, faculty catalog, and exam roll allocation across branches.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-200">Encrypted Session Security</p>
                <p className="text-[11px] text-slate-400">Inactivity protection, tokenized credentials, and configurable password policies.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Rivo School Digital Ecosystem</span>
          <span>Single-Tenant Security</span>
        </div>
      </div>

      {/* Main Form Workspace (Right Column on Desktop, Centered on Mobile) */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 xl:p-12 relative">
        {/* Mobile / Tablet Header */}
        <div className="lg:hidden w-full max-w-md mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <RivoLogo variant="icon" size="sm" />
            <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">
              RIVO
            </span>
          </Link>
          <Badge variant="secondary" className="text-[10px] uppercase font-mono font-semibold">
            School OS
          </Badge>
        </div>

        {/* Children Form Container */}
        <div className="w-full max-w-md xl:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
