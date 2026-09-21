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
    <div className="w-full max-w-[1536px] mx-auto space-y-6 pb-12">
      {/* 1. Global Settings Control Center Header & Search (Section 2, 4, 15) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-5">
          <div className="space-y-1">
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

      {/* 2. Unified Workspace Grid (Section 2 & 8: 260px Nav + flex-1 Content) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <SettingsNav />
        <main className="flex-1 min-w-0 w-full" id="settings-content">
          {children}
        </main>
      </div>
    </div>
  );
}
