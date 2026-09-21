import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RivoLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  inverted?: boolean;
}

export function RivoLogo({
  variant = 'full',
  size = 'md',
  className,
  inverted = false,
}: RivoLogoProps) {
  if (variant === 'icon') {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-14 w-14',
    };

    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center p-1',
          sizeClasses[size],
          className
        )}
      >
        <Image
          src="/logo-icon.png"
          alt="Rivo Logo Icon"
          width={64}
          height={64}
          className="h-full w-full object-contain"
          priority
        />
      </div>
    );
  }

  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Image
        src="/logo-wordmark.png"
        alt="Rivo — Schools Today, Stronger Tomorrow"
        width={340}
        height={180}
        className={cn(
          'w-auto object-contain select-none',
          heightClasses[size],
          inverted && 'brightness-0 invert'
        )}
        priority
      />
    </div>
  );
}
