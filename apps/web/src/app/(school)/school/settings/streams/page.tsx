'use client';

import * as React from 'react';
import { GitBranch, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EntityStatusBadge } from '@/features/settings/components/entity-status-badge';

interface ApiStream {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  applicableClasses: string[];
}

export default function StreamsSettingsPage() {
  const [streams, setStreams] = React.useState<ApiStream[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadStreams = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/streams');
      if (res.ok) {
        const data = await res.json();
        setStreams(data.streams || []);
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to load streams' }));
        setErrorMessage(err.message || 'Failed to load streams');
      }
    } catch (err: any) {
      console.error('Failed to load streams:', err);
      setErrorMessage('Network error loading academic streams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const filteredStreams = streams.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Senior Secondary Streams"
        description="Institutional Class 11 & 12 academic tracks (Science, Commerce, Humanities, Vocational)."
        icon={GitBranch}
      />

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search streams by track name or code..."
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading streams from database...</span>
            </div>
          ) : streams.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <GitBranch className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No streams configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Senior secondary streams allow tracking subject elective clusters and stream-based exam roll prefixes.
                </p>
              </div>
            </div>
          ) : filteredStreams.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No streams match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Stream Track</th>
                    <th className="py-2.5 px-4">Prefix Code</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Applicable Standards</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStreams.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {s.code}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {s.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.applicableClasses.map((cls) => (
                            <Badge key={cls} variant="secondary" className="text-[10px]">
                              {cls}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <EntityStatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
