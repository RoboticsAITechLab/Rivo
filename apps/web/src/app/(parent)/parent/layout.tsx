'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Bell,
  Award,
  User,
  LogOut,
  ChevronDown,
  GraduationCap,
  FileText,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Child {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  campus?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
}

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [childrenList, setChildrenList] = React.useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = React.useState<string>('');
  const [schools, setSchools] = React.useState<Array<{ id: string; name: string }>>([]);
  const [activeSchool, setActiveSchool] = React.useState<{ id: string; name: string } | null>(null);
  const [unreadNoticesCount, setUnreadNoticesCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch parent context (active school, all schools, and linked children)
  React.useEffect(() => {
    async function loadParentContext() {
      try {
        const [meRes, childRes] = await Promise.all([
          fetch('/api/auth/parent/me').catch(() => null),
          fetch('/api/parent/children').catch(() => null),
        ]);

        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData.schools) setSchools(meData.schools);
          if (meData.activeSchool) setActiveSchool(meData.activeSchool);
        }

        if (childRes && childRes.ok) {
          const childData = await childRes.json();
          const list = childData.children || [];
          setChildrenList(list);
          if (list.length > 0) {
            const saved = localStorage.getItem('rivo_parent_selected_child');
            const valid = list.find((c: Child) => c.id === saved);
            const activeId = valid ? valid.id : list[0].id;
            setSelectedChildId(activeId);
            localStorage.setItem('rivo_parent_selected_child', activeId);
          }
        }
      } catch (err) {
        console.error('Failed to load parent context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadParentContext();
  }, []);

  const handleSelectSchool = async (schoolId: string) => {
    try {
      const res = await fetch('/api/auth/parent/select-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSchool(data.activeSchool);
        if (data.children) {
          setChildrenList(data.children);
          if (data.children.length > 0) {
            const firstId = data.children[0].id;
            setSelectedChildId(firstId);
            localStorage.setItem('rivo_parent_selected_child', firstId);
            window.dispatchEvent(new CustomEvent('parentChildSwitched', { detail: { childId: firstId } }));
          }
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed switching school:', err);
    }
  };

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    localStorage.setItem('rivo_parent_selected_child', childId);
    // Dispatch custom event so pages can react immediately to child switch
    window.dispatchEvent(new CustomEvent('parentChildSwitched', { detail: { childId } }));
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const activeChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  const navItems = [
    { label: 'Home', href: '/parent', icon: Home },
    { label: 'Notices', href: '/parent/notices', icon: FileText },
    { label: 'Results', href: '/parent/results', icon: Award },
    { label: 'Alerts', href: '/parent/notifications', icon: Bell },
    { label: 'Profile', href: '/parent/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            R
          </div>
          <div>
            <div className="text-xs font-bold leading-none text-foreground flex items-center gap-1.5">
              <span>{activeSchool?.name || 'Rivo Parent Portal'}</span>
              {schools.length > 1 && (
                <select
                  value={activeSchool?.id}
                  onChange={(e) => handleSelectSchool(e.target.value)}
                  className="text-[10px] bg-muted/60 border rounded px-1.5 py-0.5 font-normal cursor-pointer"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">Digital School Communication</div>
          </div>
        </div>

        {/* Child Context Switcher */}
        <div className="flex items-center gap-2">
          {childrenList.length > 1 ? (
            <div className="flex items-center gap-1 bg-muted/60 rounded-full px-2.5 py-1 border text-xs">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <select
                value={selectedChildId}
                onChange={(e) => handleSelectChild(e.target.value)}
                className="bg-transparent font-semibold text-xs text-foreground focus:outline-none cursor-pointer"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} ({c.class?.name || 'Class'}-{c.section?.name || 'Sec'})
                  </option>
                ))}
              </select>
            </div>
          ) : activeChild ? (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{activeChild.firstName}</span>
              <span className="text-[10px] opacity-75 font-normal">
                ({activeChild.class?.name}-{activeChild.section?.name})
              </span>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">{children}</main>

      {/* Bottom Navigation for Mobile & Desktop Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t flex items-center justify-around py-1 md:py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
