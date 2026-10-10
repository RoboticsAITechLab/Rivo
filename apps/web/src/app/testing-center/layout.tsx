import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rivo Production Testing & Engineering Platform',
  description: 'Dedicated production testing, full regression runner, and live observability interface for Rivo Platform Engineering.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function TestingCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {children}
    </div>
  );
}
