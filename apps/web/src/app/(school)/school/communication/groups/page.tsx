'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Bell,
  Layers,
  GraduationCap,
  Building,
  RefreshCw,
  Send,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

interface CommunicationGroup {
  id: string;
  name: string;
  description: string;
  type: 'SCHOOL_WIDE' | 'TEACHERS' | 'PARENTS' | 'CLASS' | 'SECTION';
  memberCount: number;
  classId?: string;
  sectionId?: string;
}

export default function CommunicationGroupsPage() {
  const [groups, setGroups] = React.useState<CommunicationGroup[]>([]);
  const [selectedType, setSelectedType] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchGroups = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/communication/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Error fetching communication groups:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = groups.filter((g) => {
    const matchesType = selectedType === 'ALL' || g.type === selectedType;
    const matchesSearch =
      searchQuery.trim() === '' ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SCHOOL_WIDE':
        return <Building className="h-5 w-5 text-primary" />;
      case 'TEACHERS':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'PARENTS':
        return <Users className="h-5 w-5 text-emerald-500" />;
      case 'CLASS':
        return <GraduationCap className="h-5 w-5 text-amber-500" />;
      default:
        return <Layers className="h-5 w-5 text-blue-500" />;
    }
  };

  const types = [
    { key: 'ALL', label: 'All Groups' },
    { key: 'SCHOOL_WIDE', label: 'School-Wide' },
    { key: 'TEACHERS', label: 'Faculty & Staff' },
    { key: 'PARENTS', label: 'All Parents' },
    { key: 'CLASS', label: 'Class Cohorts' },
    { key: 'SECTION', label: 'Section Cohorts' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Communication Audiences &amp; Groups"
        description="Dynamic broadcast cohorts resolved directly from active school enrollments and faculty rosters."
        icon={Users}
        badge="Audience Directory"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={fetchGroups}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/school/notices">
              <Button size="sm" className="text-xs h-8 gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Dispatch Notice
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-muted/20">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {types.map((t) => (
              <Button
                key={t.key}
                variant={selectedType === t.key ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedType(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>
      </Card>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No communication groups match criteria"
          description="Groups are automatically computed from active classrooms and parent associations."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGroups.map((g) => (
            <Card key={g.id} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      {getTypeIcon(g.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-foreground leading-snug">
                        {g.name}
                      </h3>
                      <Badge variant="outline" className="text-[9px] mt-0.5">
                        {g.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold font-mono text-primary">
                      {g.memberCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Members</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {g.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Dynamic Auto-Sync
                </span>
                <Link href="/school/notices">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    <Send className="h-3 w-3" /> Broadcast
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
