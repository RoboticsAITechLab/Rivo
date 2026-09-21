'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { TEACHER_NAVIGATION } from '@/config/teacher-navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
            <GraduationCap className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-base tracking-tight text-foreground leading-tight">
                RIVO
              </span>
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                {user?.schoolName || 'Faculty Portal'}
              </span>
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
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-0 h-10 w-10 mx-auto'
              )}
            >
              <NavIcon
                name={item.iconName}
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
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
