import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  sticky?: boolean;
  minWidth?: string;
  maxWidth?: string;
}

interface TableProps<T> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  responsive?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  responsive = true,
  className,
  ...props
}: TableProps<T>) {
  const hasSticky = columns.some(c => c.sticky);
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className={cn('rounded-2xl border border-surface-200', responsive ? 'overflow-x-auto' : 'overflow-hidden', className)} {...props}>
      <table className={cn('w-full text-sm', hasSticky && 'border-collapse')}>
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-surface-600 uppercase tracking-wider',
                  'bg-surface-50 border-b border-surface-200',
                  col.sticky && 'sticky left-0 z-10',
                  col.className
                )}
                style={{
                  minWidth: col.minWidth || (col.sticky ? '120px' : undefined),
                  maxWidth: col.maxWidth,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-surface-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-surface-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'transition-colors',
                  striped && index % 2 === 1 && 'bg-surface-50',
                  hoverable && 'hover:bg-surface-50/50'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-surface-900', col.className)}>
                    {col.render ? col.render(item, index) : String((item as unknown as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
