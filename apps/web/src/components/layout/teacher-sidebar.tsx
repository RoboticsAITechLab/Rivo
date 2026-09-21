'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { TEACHER_NAVIGATION } from '@/config/teacher-navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { RivoLogo } from '@/components/ui/rivo-logo';

export function TeacherSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'relative hidden lg:flex flex-col border-r bg-card transition-all duration-300 select-none z-30',
        collapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href="/teacher/dashboard"
          className={cn(
            'flex items-center gap-3 transition-opacity hover:opacity-90',
            collapsed && 'justify-center w-full'
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
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                  {user?.schoolName || 'Faculty Portal'}
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          {!collapsed && 'Faculty Navigation'}
        </div>

        {TEACHER_NAVIGATION.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 select-none',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs dark:bg-emerald-950/40'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                collapsed && 'justify-center px-0 h-10 w-10 mx-auto'
              )}
            >
              {isActive && (
                <span
                  className={cn(
                    'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-emerald-600',
                    collapsed && 'left-0.5 w-0.75 top-2 bottom-2'
                  )}
                  aria-hidden="true"
                />
              )}
              <NavIcon
                name={item.iconName}
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110 duration-150',
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && <span className="truncate flex-1">{item.title}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t p-3 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="truncate">{user?.name || 'Teacher'}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
