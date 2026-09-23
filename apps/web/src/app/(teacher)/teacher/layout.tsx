'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TeacherSidebar } from '@/components/layout/teacher-sidebar';
import { TeacherMobileNav } from '@/components/layout/teacher-mobile-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { useAuth } from '@/lib/auth/auth-context';
import { Loader2, Menu } from 'lucide-react';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, authState } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (authState === 'UNAUTHENTICATED') {
      router.replace('/login?returnUrl=/teacher/dashboard');
    } else if (authState === 'AUTHENTICATED' && user) {
      if (user.roleType !== 'TEACHER' && user.roleType !== 'SCHOOL_ADMIN' && user.roleType !== 'ADMIN') {
        router.replace('/access-denied');
      }
    }
  }, [authState, user, router]);

  if (authState === 'AUTHENTICATING' || authState === 'UNKNOWN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-600">Verifying teacher session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'UNAUTHENTICATED') {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Desktop Sidebar */}
      <TeacherSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Mobile/Tablet Drawer Sheet */}
      <TeacherMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden cursor-pointer"
              aria-label="Open faculty navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="text-sm font-semibold text-foreground">Teacher Workspace</span>
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium">
              Faculty
            </span>
          </div>

          <div className="flex items-center gap-3">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1536px] w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
