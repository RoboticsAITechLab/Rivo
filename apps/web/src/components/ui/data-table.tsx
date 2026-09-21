import * as React from 'react';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

export interface ColumnDef<TData> {
  key: string;
  header: string;
  render?: (row: TData) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  keyField?: keyof TData;
  isLoading?: boolean;
  loadingRowCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  className?: string;
}

export function DataTable<TData extends object>({
  columns,
  data,
  keyField = 'id' as keyof TData,
  isLoading = false,
  loadingRowCount = 5,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items to display in this table.',
  onRowClick,
  enableSelection,
  selectedIds: controlledSelectedIds,
  onSelectRow: controlledOnSelectRow,
  onSelectAll: controlledOnSelectAll,
  className,
}: DataTableProps<TData>) {
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<string[]>([]);
  const isControlled = controlledSelectedIds !== undefined;
  const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds;

  const handleSelectRow = React.useCallback(
    (id: string) => {
      if (controlledOnSelectRow) {
        controlledOnSelectRow(id);
      } else {
        setInternalSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
      }
    },
    [controlledOnSelectRow],
  );

  const handleSelectAll = React.useCallback(() => {
    if (controlledOnSelectAll) {
      controlledOnSelectAll();
    } else {
      const allIds = data.map((r) => String((r as Record<string, unknown>)[keyField as string]));
      setInternalSelectedIds((prev) =>
        prev.length === data.length ? [] : allIds,
      );
    }
  }, [controlledOnSelectAll, data, keyField]);

  const isSelectable = Boolean(enableSelection || (selectedIds && handleSelectRow));
  const onSelectRow = handleSelectRow;
  const onSelectAll = handleSelectAll;

  const isAllSelected =
    data.length > 0 && selectedIds && selectedIds.length === data.length;
  const isPartiallySelected =
    selectedIds &&
    selectedIds.length > 0 &&
    selectedIds.length < data.length;

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/70 bg-surface-subtle/80 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
              {isSelectable && (
                <th scope="col" className="w-10 px-3.5 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(isPartiallySelected);
                    }}
                    onChange={onSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn('px-4 py-3 font-semibold', alignClass)}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: loadingRowCount }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="h-14">
                  {isSelectable && (
                    <td className="px-3.5 py-3 text-center">
                      <Skeleton className="h-4 w-4 mx-auto rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={`skel-col-${col.key}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isSelectable ? 1 : 0)}
                  className="p-8 text-center"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="border-0 bg-transparent min-h-[180px] p-0"
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = String((row as Record<string, unknown>)[keyField as string] ?? index);
                const isSelected = selectedIds?.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors hover:bg-muted/40',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    {isSelectable && (
                      <td
                        className="px-3.5 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow?.(rowId)}
                          aria-label={`Select row ${rowId}`}
                          className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td
                          key={`${rowId}-${col.key}`}
                          className={cn(
                            'px-4 py-3 text-foreground font-normal align-middle',
                            alignClass,
                          )}
                        >
                          {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
