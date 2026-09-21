'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'default' | 'lg';
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'default',
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(!src);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full font-medium ring-1 ring-border select-none',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground uppercase">
          {fallback}
        </div>
      )}
    </div>
  );
}
