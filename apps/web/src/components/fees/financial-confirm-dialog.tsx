import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  requiresReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  minReasonLength?: number;
  onConfirm: (reason?: string) => Promise<void> | void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function FinancialConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'default',
  requiresReason = false,
  reasonLabel = 'Mandatory Audit Reason',
  reasonPlaceholder = 'State specific justification for this financial operation...',
  minReasonLength = 5,
  onConfirm,
  isLoading = false,
  children,
}: FinancialConfirmDialogProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (requiresReason) {
      if (!reason || reason.trim().length < minReasonLength) {
        setError(`Please provide a detailed justification (at least ${minReasonLength} characters).`);
        return;
      }
    }
    setError(null);
    try {
      await onConfirm(requiresReason ? reason.trim() : undefined);
    } catch (err: any) {
      setError(err?.message || 'Operation failed. Please review and retry.');
    }
  };

  const IconComponent =
    variant === 'destructive' ? ShieldAlert : variant === 'warning' ? AlertCircle : CheckCircle2;

  const iconClasses = {
    default: 'text-primary bg-primary/10',
    destructive: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
  };

  const confirmButtonVariant = variant === 'destructive' ? 'destructive' : 'default';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg shrink-0', iconClasses[variant])}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {children && <div className="my-2">{children}</div>}

        {requiresReason && (
          <div className="space-y-1.5 my-2">
            <Label htmlFor="audit-reason" className="text-xs font-semibold text-foreground">
              {reasonLabel} <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="audit-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={reasonPlaceholder}
              className="text-xs h-9"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              This reason is immutably logged into the financial audit trail.
            </p>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
