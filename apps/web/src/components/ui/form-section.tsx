import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <div
      className={cn('space-y-4 rounded-lg border bg-card p-5 shadow-2xs', className)}
      {...props}
    >
      <div className="border-b pb-3 space-y-0.5">
        <h4 className="text-sm font-semibold text-foreground tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
