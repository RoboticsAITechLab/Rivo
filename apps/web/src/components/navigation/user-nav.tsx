'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, Settings, User as UserIcon, Building2 } from 'lucide-react';
import { mockCurrentUser } from '@/data/mock-data';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserNav() {
  const [logoutMessage, setLogoutMessage] = React.useState(false);

  const handleLogout = () => {
    setLogoutMessage(true);
    setTimeout(() => setLogoutMessage(false), 3000);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-background transition-colors hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User account menu"
          >
            <Avatar
              fallback={mockCurrentUser.initials}
              size="sm"
              className="bg-primary/10 text-primary border border-primary/20"
            />
            <span className="hidden text-left text-xs sm:inline-block pr-1">
              <span className="block font-medium leading-none text-foreground">
                {mockCurrentUser.name}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {mockCurrentUser.role}
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground">
                {mockCurrentUser.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {mockCurrentUser.email}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary">
                <Building2 className="h-3 w-3" />
                <span>{mockCurrentUser.schoolName}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/school/settings" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>Profile Details</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/school/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>School Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="h-4 w-4 text-destructive" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {logoutMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg animate-in slide-in-from-bottom-2">
          Demo session: Authentication will be connected in Step 7.
        </div>
      )}
    </div>
  );
}
