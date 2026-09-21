import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('space-y-6 max-w-7xl mx-auto w-full pb-10', className)}
      {...props}
    >
      {children}
    </div>
  );
}
