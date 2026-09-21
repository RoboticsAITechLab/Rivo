'use client';

import * as React from 'react';
import { Search, ChevronDown, Check, X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectorOption<T = unknown> {
  id: string;
  title: string;
  subtitle?: string | React.ReactNode;
  badge?: string | React.ReactNode;
  disabled?: boolean;
  raw?: T;
}

export interface SelectorGroup<T = unknown> {
  label: string;
  items: SelectorOption<T>[];
}

export interface UniversalSelectorProps<T = unknown> {
  value?: string | null;
  onChange: (value: string, item?: SelectorOption<T>) => void;
  options?: SelectorOption<T>[];
  groups?: SelectorGroup<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  permissionCanCreate?: boolean;
  showInactiveToggle?: boolean;
  showInactive?: boolean;
  onToggleInactive?: (show: boolean) => void;
  className?: string;
}

export function UniversalSelector<T = unknown>({
  value,
  onChange,
  options,
  groups,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  label,
  required,
  disabled,
  isLoading,
  allowClear = true,
  emptyMessage = 'No options available.',
  noResultsMessage = 'No matching results found.',
  addNewLabel,
  onAddNew,
  permissionCanCreate = true,
  showInactiveToggle,
  showInactive,
  onToggleInactive,
  className,
}: UniversalSelectorProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Flatten options for easy index navigation
  const allOptions: SelectorOption<T>[] = React.useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((g) => g.items);
    }
    return options || [];
  }, [groups, options]);

  // Find currently selected option
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return allOptions.find((opt) => opt.id === value) || null;
  }, [allOptions, value]);

  // Filter options based on search query
  const filteredGroups: SelectorGroup<T>[] = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (groups && groups.length > 0) {
      return groups
        .map((g) => ({
          label: g.label,
          items: g.items.filter((item) => {
            if (!query) return true;
            const matchesTitle = item.title.toLowerCase().includes(query);
            const matchesSubtitle =
              typeof item.subtitle === 'string' && item.subtitle.toLowerCase().includes(query);
            const matchesId = item.id.toLowerCase().includes(query);
            return matchesTitle || matchesSubtitle || matchesId;
          }),
        }))
        .filter((g) => g.items.length > 0);
    }

    const flatFiltered = (options || []).filter((item) => {
      if (!query) return true;
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesSubtitle =
        typeof item.subtitle === 'string' && item.subtitle.toLowerCase().includes(query);
      const matchesId = item.id.toLowerCase().includes(query);
      return matchesTitle || matchesSubtitle || matchesId;
    });

    return flatFiltered.length > 0 ? [{ label: '', items: flatFiltered }] : [];
  }, [groups, options, searchQuery]);

  const flatFilteredOptions = React.useMemo(() => {
    return filteredGroups.flatMap((g) => g.items);
  }, [filteredGroups]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to close
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatFilteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : Math.max(0, flatFilteredOptions.length - 1)
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatFilteredOptions[highlightedIndex]) {
          const target = flatFilteredOptions[highlightedIndex];
          if (!target.disabled) {
            onChange(target.id, target);
            setIsOpen(false);
          }
        } else if (onAddNew && permissionCanCreate) {
          onAddNew();
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectOption = (item: SelectorOption<T>) => {
    if (item.disabled) return;
    onChange(item.id, item);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const toggleOpen = () => {
    if (disabled || isLoading) return;
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-foreground">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full min-h-8.5 px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 text-left transition-all cursor-pointer select-none',
          'bg-background hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring',
          isOpen ? 'ring-2 ring-ring border-ring' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed bg-muted/40 hover:bg-muted/40'
        )}
      >
        <div className="flex-1 truncate">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading records...
            </span>
          ) : selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground truncate">
                {selectedOption.title}
              </span>
              {selectedOption.subtitle && typeof selectedOption.subtitle === 'string' && (
                <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                  • {selectedOption.subtitle}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selectedOption && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180 text-foreground'
            )}
          />
        </div>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl shadow-black/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100',
            'max-h-80 flex flex-col min-w-[260px]'
          )}
        >
          {/* Search Bar Input */}
          <div className="p-2 border-b border-border/60 bg-muted/20 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Optional Inactive Toggle */}
          {showInactiveToggle && onToggleInactive && (
            <div className="px-3 py-1.5 border-b border-border/50 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Show inactive records</span>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => onToggleInactive(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-1 max-h-56 divide-y divide-border/20">
            {allOptions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <AlertCircle className="w-5 h-5 mx-auto text-muted-foreground/60 mb-1.5" />
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : flatFilteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{noResultsMessage}</p>
                <p className="text-[11px] text-muted-foreground/70">
                  No matching entries for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              filteredGroups.map((group, groupIdx) => (
                <div key={group.label || `grp-${groupIdx}`} className="py-1 first:pt-0 last:pb-0">
                  {group.label && (
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      {group.label}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isSelected = item.id === value;
                    const flatIdx = flatFilteredOptions.indexOf(item);
                    const isHighlighted = flatIdx === highlightedIndex;

                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(item)}
                        onMouseEnter={() => setHighlightedIndex(flatIdx)}
                        className={cn(
                          'px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors select-none',
                          item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground',
                          isHighlighted && !isSelected && 'bg-muted/70 text-foreground'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={cn('truncate', isSelected && 'font-bold')}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="shrink-0">{item.badge}</span>
                            )}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Contextual "+ Add New" Action Footer */}
          {addNewLabel && onAddNew && permissionCanCreate && (
            <div className="p-1.5 border-t border-border/80 bg-muted/40">
              <button
                type="button"
                onClick={() => {
                  onAddNew();
                  setIsOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
