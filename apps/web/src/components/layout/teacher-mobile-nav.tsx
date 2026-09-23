'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TEACHER_NAVIGATION } from '@/config/teacher-navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RivoLogo } from '@/components/ui/rivo-logo';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

export function TeacherMobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const schoolDisplayName = user?.schoolName || 'Faculty Portal';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        {/* Brand Header */}
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <RivoLogo variant="icon" size="sm" />
            <div className="flex flex-col overflow-hidden text-left">
              <SheetTitle className="text-base font-bold tracking-tight text-foreground leading-tight">
                RIVO
              </SheetTitle>
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                {schoolDisplayName}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Faculty Navigation
          </div>

          <div className="space-y-1">
            {TEACHER_NAVIGATION.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'group relative flex min-h-[42px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-all select-none',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs dark:bg-emerald-950/40'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <NavIcon
                      name={item.iconName}
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform group-hover:scale-110 duration-150',
                        isActive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Teacher profile badge at bottom */}
        <div className="border-t p-4 flex items-center gap-2.5 text-xs text-muted-foreground bg-muted/20">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate">{user?.name || 'Teacher'}</span>
            <span className="text-[11px] text-muted-foreground truncate">{user?.email || 'Faculty Account'}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
