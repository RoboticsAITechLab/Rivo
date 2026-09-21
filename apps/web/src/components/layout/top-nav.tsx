'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
import { UserNav } from '@/components/navigation/user-nav';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function TopNav({
  onOpenMobileNav,
  onOpenCommandSearch,
}: {
  onOpenMobileNav: () => void;
  onOpenCommandSearch: () => void;
}) {
  const pathname = usePathname();

  // Helper to construct breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger (mobile) + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/school">School</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb) => {
              if (crumb.href === '/school') return null;
              return (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Search trigger, Notifications, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={onOpenCommandSearch}
          className="group flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-surface-subtle/60 hover:bg-card px-3 text-xs text-muted-foreground shadow-2xs transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer sm:w-64"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 text-left truncate">Search resources, students, roster...</span>
          <kbd className="pointer-events-none hidden rounded border border-border/70 bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs group-hover:border-border sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Button */}
        <Link
          href="/school/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </Link>

        {/* User Account Navigation */}
        <UserNav />
      </div>
    </header>
  );
}
