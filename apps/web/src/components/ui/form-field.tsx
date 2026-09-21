import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  htmlFor?: string;
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  disabled?: boolean;
}

export function FormField({
  id,
  htmlFor,
  label,
  required,
  description,
  error,
  disabled,
  children,
  className,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = htmlFor || id || generatedId;
  const descriptionId = `${fieldId}-desc`;
  const errorId = `${fieldId}-error`;

  return (
    <div
      className={cn(
        'space-y-1.5',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
      {...props}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1 text-xs font-semibold text-foreground select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-destructive font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {React.isValidElement(children) &&
        React.cloneElement(
          children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { disabled?: boolean }>,
          {
            id: fieldId,
            disabled:
              disabled ||
              Boolean((children.props as { disabled?: boolean }).disabled),
            'aria-invalid': Boolean(error),
            'aria-describedby':
              cn(description && descriptionId, error && errorId) || undefined,
          },
        )}

      {description && !error && (
        <p id={descriptionId} className="text-[11px] text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
