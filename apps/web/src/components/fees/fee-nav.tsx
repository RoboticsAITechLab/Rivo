'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Users,
  CreditCard,
  Receipt,
  BadgePercent,
  History,
} from 'lucide-react';

const FEE_NAV_ITEMS = [
  { label: 'Overview', href: '/school/fees', icon: LayoutDashboard, exact: true },
  { label: 'Fee Heads', href: '/school/fees/heads', icon: Layers },
  { label: 'Fee Plans', href: '/school/fees/plans', icon: FileSpreadsheet },
  { label: 'Assignments', href: '/school/fees/assignments', icon: Users },
  { label: 'Payments', href: '/school/fees/payments', icon: CreditCard },
  { label: 'Receipts', href: '/school/fees/receipts', icon: Receipt },
  { label: 'Concessions', href: '/school/fees/concessions', icon: BadgePercent },
  { label: 'Audit Log', href: '/school/fees/audit', icon: History },
];

export function FeeNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('border-b border-border/80 bg-card/60 backdrop-blur-xs -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6', className)}>
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2" aria-label="Fees Navigation">
        {FEE_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (pathname.startsWith(item.href) && pathname !== '/school/fees');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors select-none',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/15'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
