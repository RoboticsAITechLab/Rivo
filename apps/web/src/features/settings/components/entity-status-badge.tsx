'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EntityStatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PENDING' | 'SUSPENDED' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'NOT_CONNECTED' | string;
  className?: string;
}

export function EntityStatusBadge({ status, className }: EntityStatusBadgeProps) {
  const norm = status.toUpperCase();

  if (norm === 'ACTIVE' || norm === 'CONFIGURED' || norm === 'SUCCESS') {
    return (
      <Badge variant="success" className={cn('text-[10px] uppercase font-semibold', className)}>
        {status}
      </Badge>
    );
  }

  if (norm === 'PENDING' || norm === 'NEEDS_CONFIGURATION' || norm === 'WARNING') {
    return (
      <Badge variant="warning" className={cn('text-[10px] uppercase font-semibold', className)}>
        {status}
      </Badge>
    );
  }

  if (norm === 'INACTIVE' || norm === 'ARCHIVED' || norm === 'SUSPENDED' || norm === 'NOT_CONFIGURED') {
    return (
      <Badge variant="secondary" className={cn('text-[10px] uppercase font-semibold text-muted-foreground', className)}>
        {status}
      </Badge>
    );
  }

  if (norm === 'NOT_CONNECTED' || norm === 'UNAVAILABLE' || norm === 'ERROR' || norm === 'FAILED') {
    return (
      <Badge variant="destructive" className={cn('text-[10px] uppercase font-semibold', className)}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase font-semibold', className)}>
      {status}
    </Badge>
  );
}
