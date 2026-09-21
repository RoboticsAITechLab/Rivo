'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
  value?: string;
  onValueChange?: (val: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel: string;
  setSelectedLabel: React.Dispatch<React.SetStateAction<string>>;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

export function Select({
  children,
  value,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={selectRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, id, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      id={id}
      type="button"
      ref={ref}
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  const display = context?.selectedLabel || context?.value || placeholder;

  return (
    <span className={cn('block truncate text-left', !context?.value && !context?.selectedLabel && 'text-muted-foreground', className)}>
      {display}
    </span>
  );
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context?.open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;

  React.useEffect(() => {
    if (isSelected && typeof children === 'string') {
      context?.setSelectedLabel(children);
    }
  }, [isSelected, children, context]);

  const handleSelect = () => {
    context?.onValueChange?.(value);
    if (typeof children === 'string') {
      context?.setSelectedLabel(children);
    }
    context?.setOpen(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        isSelected && 'bg-accent/60 font-medium',
        className
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
    </div>
  );
}
