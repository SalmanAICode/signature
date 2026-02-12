import React from 'react';
import { getNestedValue } from './utils';
import { TABLE_COLUMN_WIDTH, TABLE_COLUMN_MIN_WIDTH } from './types';
import { StatusBadge } from '@/components/StatusBadge';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row?: T) => React.ReactNode;
}

interface TableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  columnWidths: Record<string, number>;
  expandable: { enabled: boolean, render?: (row: T) => React.ReactNode, handleExpand: (rowIdx: number) => void };
  expandedRow: number | null;
  showControls: boolean;
  visibleColumns: Set<string>;
  onRowClick: (rowIdx: number) => void;
  preSelectedRow: number | null;
  rowClassName?: (row: T) => string;
}

function TableBodyComponent<T>({
  data,
  columns,
  columnWidths,
  expandable,
  expandedRow,
  showControls,
  visibleColumns,
  onRowClick,
  preSelectedRow,
  rowClassName,
}: TableBodyProps<T>) {
  return (
    <tbody className="text-gray-900 text-sm">
      {data.map((row, rowIdx) => {
        const isExpanded = expandedRow === rowIdx;
        return (
          <React.Fragment key={rowIdx}>
            <tr
              onClick={() => !showControls && onRowClick(rowIdx)}
              className={`${preSelectedRow === rowIdx ? 'bg-indigo-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                ${!showControls ? 'hover:bg-indigo-50 cursor-pointer' : 'cursor-default'} 
                transition 
                ${rowClassName ? rowClassName(row) : ''}`}
            >
              {expandable.enabled && !showControls && (
                <td 
                  onClick={(event) => {
                    event.stopPropagation();
                    expandable.handleExpand(rowIdx);
                  }}
                  className="px-2 py-2 "
                >
                  <span className={`inline-block transform transition-transform duration-200 ease-in-out text-gray-400 hover:text-gray-800 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </td>
              )}
{columns.map((col, colIdx) => {
                const value = getNestedValue(row, col.key);
                return (
                  <td
                    key={`${rowIdx}-${col.key}-${colIdx}`}
                    title={value != null ? String(value) : ''}
                    className={`truncate px-2 py-2 border-b border-gray-100 whitespace-nowrap ${showControls && !visibleColumns.has(col.key) ? 'opacity-30' : ''}`}
                    style={{
                      width: `${columnWidths[col.key] ?? TABLE_COLUMN_WIDTH}px`,
                      maxWidth: `${columnWidths[col.key] ?? TABLE_COLUMN_WIDTH}px`,
                      minWidth: `${TABLE_COLUMN_MIN_WIDTH}px`,
                    }}
                  >
                    {col.render ? col.render(value, row) : value}
                  </td>
                );
              })}
            </tr>
            {isExpanded && !showControls && (
              <tr>
                <td colSpan={columns.length + (expandable.enabled ? 1 : 0)} className="bg-indigo-50 border-b border-gray-200 p-4">
                  {expandable.enabled && expandable.render ? expandable.render(row) : 'Customize your expanded row here'}
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  );
}

// Use memo to avoid unnecessary re-renders
export const TableBody = React.memo(TableBodyComponent) as typeof TableBodyComponent; 