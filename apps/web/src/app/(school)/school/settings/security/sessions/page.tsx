'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveSession } from '@/features/settings/types';
import { 
  Laptop, 
  Smartphone, 
  Globe, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  LogOut,
  Radio,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      } else {
        toast.error(data.message || 'Failed to load active sessions');
      }
    } catch {
      toast.error('Unable to connect to session management service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (session: ActiveSession) => {
    try {
      setRevokingId(session.id);
      const res = await fetch(`/api/auth/sessions?id=${session.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || `Session on ${session.device} revoked successfully`);
        setSessions(prev => prev.filter(s => s.id !== session.id));
      } else {
        toast.error(data.message || 'Failed to revoke session');
      }
    } catch {
      toast.error('Failed to revoke session. Please try again.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOther = async () => {
    try {
      setRevokingOthers(true);
      const res = await fetch('/api/auth/sessions?allOthers=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'All other concurrent sessions terminated');
        setSessions(prev => prev.filter(s => s.isCurrent));
      } else {
        toast.error(data.message || 'Failed to terminate sessions');
      }
    } catch {
      toast.error('Failed to terminate other sessions. Please try again.');
    } finally {
      setRevokingOthers(false);
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Laptop className="h-6 w-6 text-primary" />
            Active User Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor real-time authenticated devices and terminate suspicious or stale concurrent logins.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {otherSessionsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeOther}
              disabled={revokingOthers}
              className="gap-2 shrink-0 text-xs h-9"
            >
              {revokingOthers ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Terminate All Other Sessions ({otherSessionsCount})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Logged In Devices & Sessions</CardTitle>
          <CardDescription className="text-xs">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} currently active in PostgreSQL database
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-2" />
              <p className="text-xs">Loading active user sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Laptop className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground">No active sessions tracked</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Your authenticated session will appear here upon logging in.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground mt-0.5">
                      {session.device.toLowerCase().includes('mobile') || session.device.toLowerCase().includes('iphone') ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{session.device}</span>
                        <span className="text-xs text-muted-foreground">• {session.browser}</span>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-[10px] h-5 bg-emerald-600 gap-1 font-medium">
                            <Radio className="h-2.5 w-2.5 animate-pulse" />
                            This Device (Current)
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.isCurrent ? 'Current Session' : `Last active ${session.lastActive}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5 shrink-0 self-start sm:self-auto"
                      disabled={revokingId === session.id}
                      onClick={() => handleRevoke(session)}
                    >
                      {revokingId === session.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
