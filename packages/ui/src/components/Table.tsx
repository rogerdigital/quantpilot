import type { ReactNode } from 'react';
import {
  cell,
  emptyState,
  headerCell,
  headerRow,
  loadingSkeleton,
  row,
  rowSelected,
  table,
} from './Table.css.js';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string;
  selectedKey?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  selectedKey,
  onRowClick,
  loading = false,
  emptyMessage = 'No data',
}: TableProps<T>) {
  if (loading) {
    return (
      <table className={table}>
        <thead>
          <tr className={headerRow}>
            {columns.map((col) => (
              <th key={col.key} className={headerCell} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`skeleton-${i}`} className={row}>
              {columns.map((col) => (
                <td key={col.key} className={cell}>
                  <div className={loadingSkeleton} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (data.length === 0) {
    return (
      <table className={table}>
        <thead>
          <tr className={headerRow}>
            {columns.map((col) => (
              <th key={col.key} className={headerCell} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={emptyState} colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className={table}>
      <thead>
        <tr className={headerRow}>
          {columns.map((col) => (
            <th key={col.key} className={headerCell} style={{ width: col.width }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={rowKey(item)}
            className={`${row} ${rowKey(item) === selectedKey ? rowSelected : ''}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <td key={col.key} className={cell}>
                {col.render
                  ? col.render(item)
                  : String((item as Record<string, unknown>)[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
