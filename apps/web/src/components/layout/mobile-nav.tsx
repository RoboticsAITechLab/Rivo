'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { mockCurrentUser } from '@/data/mock-data';
import { APP_NAV_GROUPS } from '@/config/navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RivoLogo } from '@/components/ui/rivo-logo';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const schoolDisplayName = user?.schoolName || mockCurrentUser.schoolName;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <RivoLogo variant="icon" size="sm" />
            <div className="flex flex-col overflow-hidden">
              <SheetTitle className="text-base font-bold tracking-tight text-foreground leading-tight">
                RIVO
              </SheetTitle>
              <div className="text-xs text-muted-foreground truncate">
                {schoolDisplayName}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {APP_NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/school' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'group relative flex min-h-[42px] items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all select-none',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary/15'
                          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <NavIcon name={item.iconName} className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge
                          variant={isActive ? 'secondary' : 'outline'}
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-4.5',
                            isActive && 'bg-primary-foreground/20 text-primary-foreground border-transparent',
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-4 text-xs text-muted-foreground">
          Academic Session: <span className="font-semibold text-foreground">{mockCurrentUser.sessionName}</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
