'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
  value?: string;
  onValueChange?: (val: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel: string;
  setSelectedLabel: React.Dispatch<React.SetStateAction<string>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
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
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        triggerRef,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, id, ...props }, forwardedRef) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      context.triggerRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    },
    [context.triggerRef, forwardedRef]
  );

  return (
    <button
      id={id}
      type="button"
      ref={combinedRef}
      onClick={() => context.setOpen(!context.open)}
      aria-expanded={context.open}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 opacity-50 shrink-0 ml-2 transition-transform duration-200',
          context.open && 'rotate-180'
        )}
      />
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
    <span
      className={cn(
        'block truncate text-left',
        !context?.value && !context?.selectedLabel && 'text-muted-foreground',
        className
      )}
    >
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
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
    width: number;
    placement: 'bottom' | 'top';
  }>({
    top: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
  });
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!context?.triggerRef.current) return;
    const rect = context.triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedHeight = 220;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Intelligent positioning: flip upward if space below is too small
    const placement = spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const computedTop = placement === 'top' ? rect.top - 4 : rect.bottom + 4;
    
    // Ensure the menu stays within horizontal viewport boundaries
    const targetWidth = Math.max(rect.width, 140);
    let computedLeft = rect.left;
    if (computedLeft + targetWidth > viewportWidth - 12) {
      computedLeft = Math.max(12, viewportWidth - targetWidth - 12);
    }

    setCoords({
      top: computedTop,
      left: computedLeft,
      width: targetWidth,
      placement,
    });
  }, [context?.triggerRef]);

  React.useEffect(() => {
    if (!context?.open) return;

    updatePosition();

    function handleScrollOrResize() {
      updatePosition();
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        context?.triggerRef.current &&
        !context.triggerRef.current.contains(e.target as Node)
      ) {
        context.setOpen(false);
      }
    }

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context?.open, context?.setOpen, updatePosition]);

  if (!context?.open || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      style={{
        position: 'fixed',
        left: `${coords.left}px`,
        ...(coords.placement === 'top'
          ? { bottom: `${window.innerHeight - coords.top}px` }
          : { top: `${coords.top}px` }),
        minWidth: `${coords.width}px`,
      }}
      className={cn(
        'z-[9999] max-h-60 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in-80 zoom-in-95 focus:outline-none backdrop-blur-xs',
        className
      )}
    >
      {children}
    </div>,
    document.body
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
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
        isSelected && 'bg-accent/70 font-semibold text-accent-foreground',
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
