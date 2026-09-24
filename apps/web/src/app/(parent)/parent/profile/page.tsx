'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  GraduationCap,
  Building,
  Mail,
  Phone,
  LogOut,
  Shield,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Child {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  relationshipType: string;
  isPrimaryContact: boolean;
  campus?: { id: string; name: string; city: string } | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
}

export default function ParentProfilePage() {
  const router = useRouter();
  const [children, setChildren] = React.useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = React.useState<string>('');
  const [userProfile, setUserProfile] = React.useState<{
    name: string;
    email: string;
    phone?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [childRes, meRes] = await Promise.all([
          fetch('/api/parent/children'),
          fetch('/api/auth/me'),
        ]);

        if (childRes.ok) {
          const cData = await childRes.json();
          const list = cData.children || [];
          setChildren(list);
          const saved = localStorage.getItem('rivo_parent_selected_child');
          setSelectedChildId(saved || list[0]?.id || '');
        }

        if (meRes.ok) {
          const mData = await meRes.json();
          setUserProfile({
            name: `${mData.user?.firstName || ''} ${mData.user?.lastName || ''}`.trim() || 'Parent / Guardian',
            email: mData.user?.email || '',
            phone: mData.user?.phone || null,
          });
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    localStorage.setItem('rivo_parent_selected_child', childId);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-foreground">Guardian Account Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Family contacts, student relationships, and active school enrollments.
        </p>
      </div>

      {/* Parent Identity Card */}
      <Card className="p-4">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">{userProfile?.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Mail className="h-3 w-3" />
              <span>{userProfile?.email}</span>
            </div>
            {userProfile?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Phone className="h-3 w-3" />
                <span>{userProfile.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified Family Account</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
        </div>
      </Card>

      {/* Linked Wards Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-0.5 pb-2">
          Linked Students ({children.length})
        </h2>

        <div className="space-y-2.5">
          {children.map((child) => {
            const isSelected = child.id === selectedChildId;
            return (
              <Card
                key={child.id}
                className={`p-3.5 transition-colors cursor-pointer ${
                  isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-border'
                }`}
                onClick={() => handleSelectChild(child.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0">
                      {child.firstName[0]}
                      {child.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          {child.firstName} {child.lastName}
                        </span>
                        {isSelected && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] h-4">
                            Active Context
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground">
                          {child.class?.name || 'Class'}-{child.section?.name || 'Sec'}
                        </span>{' '}
                        • Adm No: <span className="font-mono">{child.admissionNumber}</span>
                      </div>
                      {child.campus && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" />
                          <span>{child.campus.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px]">
                    {child.relationshipType}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
