'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SETTINGS_NAVIGATION_GROUPS, SettingsCategoryGroup } from '../config/settings-navigation';
import { SettingsSearch } from './settings-search';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronRight, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SettingsNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [selectedMobileCategory, setSelectedMobileCategory] = React.useState<SettingsCategoryGroup | null>(null);

  // Find currently active item and group
  const activeInfo = React.useMemo(() => {
    for (const group of SETTINGS_NAVIGATION_GROUPS) {
      for (const item of group.items) {
        const isActive =
          item.href === '/school/settings'
            ? pathname === '/school/settings'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        if (isActive) {
          return { item, group };
        }
      }
    }
    return null;
  }, [pathname]);

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP WORKSPACE SIDEBAR (260px, Independent scroll)  */}
      {/* ========================================================= */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-full overflow-y-auto overscroll-contain pr-2 border-r border-border/40">
        <nav className="space-y-5 pb-8" aria-label="Settings Navigation">
          {SETTINGS_NAVIGATION_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1">
              <div className="px-3 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/school/settings'
                      ? pathname === '/school/settings'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-primary'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground/70 group-hover:text-foreground'
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE RESPONSIVE TRIGGER & DRAWER (Section 18)         */}
      {/* ========================================================= */}
      <div className="lg:hidden w-full">
        {/* Mobile current section indicator & trigger button */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                {activeInfo?.group.label || 'Settings'}
              </div>
              <div className="text-sm font-bold text-foreground truncate">
                {activeInfo?.item.title || 'Settings Section'}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMobileCategory(null);
              setMobileOpen(true);
            }}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            <Menu className="h-3.5 w-3.5" />
            <span>All Sections</span>
          </Button>
        </div>

        {/* Mobile Fullscreen Navigation Modal */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-4 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              {selectedMobileCategory ? (
                <button
                  type="button"
                  onClick={() => setSelectedMobileCategory(null)}
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>All Categories</span>
                </button>
              ) : (
                <span className="text-base font-bold text-foreground">Settings Navigation</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Top Search */}
            <div className="mb-4">
              <SettingsSearch onSelect={() => setMobileOpen(false)} />
            </div>

            {/* Level 1: Category Listing */}
            {!selectedMobileCategory ? (
              <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                {SETTINGS_NAVIGATION_GROUPS.map((group) => {
                  const isCurrentCategory = activeInfo?.group.category === group.category;
                  return (
                    <button
                      key={group.category}
                      type="button"
                      onClick={() => setSelectedMobileCategory(group)}
                      className="w-full flex items-center justify-between py-3.5 px-2 text-left hover:bg-muted/40 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isCurrentCategory ? 'text-primary font-semibold' : 'text-foreground'
                          )}
                        >
                          {group.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({group.items.length})
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Level 2: Sub-items inside category */
              <div className="flex-1 overflow-y-auto space-y-1 py-1">
                <div className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {selectedMobileCategory.label}
                </div>
                {selectedMobileCategory.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/school/settings'
                      ? pathname === '/school/settings'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
