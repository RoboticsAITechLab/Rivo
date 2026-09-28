import * as React from 'react';
import { cn } from '@/lib/utils';

export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  const isNegative = num < 0;
  const abs = Math.abs(num);

  // Format with Indian numbering system (e.g. 12,34,567.00 or whole rupees)
  const [whole, decimal] = abs.toFixed(2).split('.');
  
  let lastThree = whole.slice(-3);
  const otherNumbers = whole.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedWhole = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  // Format whole numbers cleanly unless decimals exist and are non-zero
  const formatted = decimal && decimal !== '00' ? `${formattedWhole}.${decimal}` : formattedWhole;

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatLakhsCrores(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  return formatINR(num);
}

interface FinancialAmountProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'muted';
  compact?: boolean;
}

export function FinancialAmount({
  amount,
  size = 'md',
  variant = 'default',
  compact = false,
  className,
  ...props
}: FinancialAmountProps) {
  const formatted = compact ? formatLakhsCrores(amount) : formatINR(amount);

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-xl font-bold',
    '2xl': 'text-2xl font-extrabold tracking-tight',
    '3xl': 'text-3xl font-extrabold tracking-tight',
  };

  const variantClasses = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    destructive: 'text-rose-600 dark:text-rose-400',
    muted: 'text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'font-mono tabular-nums inline-block',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {formatted}
    </span>
  );
}
