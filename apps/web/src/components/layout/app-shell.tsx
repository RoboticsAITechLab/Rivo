'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { MobileNav } from './mobile-nav';
import { CommandSearch } from '@/components/navigation/command-search';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [commandSearchOpen, setCommandSearchOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Mobile/Tablet Drawer Sheet */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenCommandSearch={() => setCommandSearchOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1536px] w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command / Search Palette */}
      <CommandSearch
        open={commandSearchOpen}
        onOpenChange={setCommandSearchOpen}
      />
    </div>
  );
}
