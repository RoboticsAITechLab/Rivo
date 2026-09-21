'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User as UserIcon, Building2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-context';

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'School Administrator';
  const displaySchool = user?.schoolName || 'Institution Portal';
  const displayInitials = user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD');

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-background transition-colors hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="User account menu"
          >
            <Avatar
              fallback={displayInitials}
              size="sm"
              className="bg-primary/10 text-primary border border-primary/20"
            />
            <span className="hidden text-left text-xs sm:inline-block pr-1">
              <span className="block font-medium leading-none text-foreground">
                {displayName}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {displayRole}
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg bg-white">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground">
                {displayName}
              </p>
              {displayEmail && (
                <p className="text-xs leading-none text-muted-foreground break-all">
                  {displayEmail}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <Building2 className="h-3 w-3" />
                <span>{displaySchool}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {user?.roleType === 'TEACHER' ? (
            <DropdownMenuItem asChild>
              <Link href="/teacher/dashboard" className="flex items-center gap-2 cursor-pointer">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Teacher Dashboard</span>
              </Link>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/school/settings/school-profile" className="flex items-center gap-2 cursor-pointer">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>School Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/school/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings Hub</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-destructive" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
