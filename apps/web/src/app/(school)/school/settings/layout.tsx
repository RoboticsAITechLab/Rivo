import * as React from 'react';
import { SettingsNav } from '@/features/settings/components/settings-nav';
import { SettingsSearch } from '@/features/settings/components/settings-search';
import { Badge } from '@/components/ui/badge';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[1536px] mx-auto flex flex-col lg:h-[calc(100vh-7.5rem)] overflow-hidden space-y-4">
      {/* 1. Global Settings Control Center Header & Search (Fixed at top, doesn't scroll) */}
      <div className="space-y-3 shrink-0 pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Settings
              </h1>
              <Badge
                variant="outline"
                className="text-[11px] font-medium bg-muted/40 text-muted-foreground border-border/60"
              >
                Administrator
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure your school&apos;s academic, operational, access and security settings.
            </p>
          </div>
        </div>

        {/* Unified Quick Search Bar */}
        <div className="w-full max-w-lg">
          <SettingsSearch />
        </div>
      </div>

      {/* 2. Unified Workspace Grid (Independent columns: sidebar stays fixed, content scrolls) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 items-stretch overflow-hidden">
        {/* Settings Navigation: fixed in place, independent scroll if content overflows, never moves with main page */}
        <SettingsNav />

        {/* Settings Content: independent scroll, overscroll-contain */}
        <main
          className="flex-1 min-w-0 w-full lg:h-full lg:overflow-y-auto lg:overscroll-contain pr-1 pb-10"
          id="settings-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
