'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { APP_NAVIGATION, AppNavItem } from '@/config/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils';

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onOpenChange(false);
  }, [onOpenChange]);

  const filteredItems: AppNavItem[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_NAVIGATION;
    return APP_NAVIGATION.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query]);

  const handleSelect = React.useCallback(
    (href: string) => {
      handleClose();
      router.push(href);
    },
    [handleClose, router],
  );


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        handleClose();
      }
      if (!open || filteredItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          handleSelect(selected.href);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, handleClose, filteredItems, selectedIndex, handleSelect]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search palette"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-16 sm:pt-24"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0"
        onClick={handleClose}
      />

      {/* Dialog card */}
      <div className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search modules, students, exams, timetable..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            aria-autocomplete="list"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="mr-2 text-muted-foreground hover:text-foreground p-1"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div ref={listRef} role="listbox" className="max-h-[340px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No matching pages or modules found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Navigation & Modules
              </div>
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.href}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground',
                          isSelected
                            ? 'bg-primary-foreground/15 border-transparent text-primary-foreground'
                            : 'bg-background border-border group-hover:border-primary/40 group-hover:text-primary',
                        )}
                      >
                        <NavIcon name={item.iconName} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-medium truncate">{item.title}</div>
                        {item.description && (
                          <div
                            className={cn(
                              'text-xs truncate',
                              isSelected
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground',
                            )}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-3 shrink-0">
                      <span
                        className={cn(
                          'text-[10px] font-medium uppercase tracking-wider',
                          isSelected
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground/70',
                        )}
                      >
                        {item.group}
                      </span>
                      {isSelected ? (
                        <CornerDownLeft className="h-3.5 w-3.5 text-primary-foreground" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-background px-1 border font-mono">↑</kbd>{' '}
              <kbd className="rounded bg-background px-1 border font-mono">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="rounded bg-background px-1 border font-mono">↵</kbd> to select
            </span>
          </div>
          <span>Rivo School OS</span>
        </div>
      </div>
    </div>
  );
}
