import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeeDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onOpenFullDetail?: () => void;
  onPrint?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FeeDetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  onOpenFullDetail,
  onPrint,
  children,
  className,
}: FeeDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col bg-background', className)}
      >
        <SheetHeader className="p-5 border-b bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {title}
                </SheetTitle>
                {badge}
              </div>
              {subtitle && (
                <SheetDescription className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </SheetDescription>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onPrint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrint}
                  className="h-8 px-2.5 text-xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              )}
              {onOpenFullDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenFullDetail}
                  className="h-8 px-2.5 text-xs gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
