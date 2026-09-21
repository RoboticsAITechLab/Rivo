'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { mockCurrentUser } from '@/data/mock-data';
import { APP_NAV_GROUPS } from '@/config/navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { RivoLogo } from '@/components/ui/rivo-logo';
import { cn } from '@/lib/utils';

export function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative hidden lg:flex flex-col border-r bg-card transition-all duration-300 select-none z-30',
        collapsed ? 'w-18' : 'w-64',
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href="/school"
          className={cn(
            'flex items-center gap-3 transition-opacity hover:opacity-90',
            collapsed && 'justify-center w-full',
          )}
        >
          {collapsed ? (
            <RivoLogo variant="icon" size="sm" />
          ) : (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <RivoLogo variant="icon" size="sm" />
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-base tracking-tight text-foreground leading-tight">
                  RIVO
                </span>
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {mockCurrentUser.schoolName}
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
        {APP_NAV_GROUPS.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.group}
              </div>
            ) : (
              <div className="h-px bg-border/60 mx-2 my-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/school' && pathname.startsWith(item.href));

                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary select-none',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary/15'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                      collapsed && 'justify-center px-0 h-10 w-10 mx-auto',
                    )}
                  >
                    {isActive && (
                      <span
                        className={cn(
                          'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary',
                          collapsed && 'left-0.5 w-0.75 top-2 bottom-2'
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <NavIcon
                      name={item.iconName}
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform group-hover:scale-110 duration-150',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? 'default' : 'outline'}
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4.5',
                              isActive && 'bg-primary text-primary-foreground border-transparent',
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip
                      key={item.href}
                      content={
                        <div className="flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="rounded bg-primary/20 px-1 py-0.2 text-[10px]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      }
                      side="right"
                    >
                      {linkContent}
                    </Tooltip>
                  );
                }

                return <div key={item.href}>{linkContent}</div>;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="border-t p-3 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>Session {mockCurrentUser.sessionName}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
