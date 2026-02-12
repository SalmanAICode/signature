import React from 'react';
import { ColumnConfigDropdown } from './ColumnConfigDropdown';
import { ColumnConfig } from '../types';

interface ColumnControlsProps<T = any> {
  showUnselectedColumns: boolean;
  onToggleUnselectedColumns: (checked: boolean) => void;
  // New props for column configuration
  flatColumns: ColumnConfig<T>[];
  columnOrder: string[];
  visibleColumns: Set<string>;
  onColumnOrderChange: (newOrder: string[]) => void;
  onColumnToggle: (key: string, visible: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  className?: string;
}

export const ColumnControls = React.memo<ColumnControlsProps>(({
  showUnselectedColumns,
  onToggleUnselectedColumns,
  flatColumns,
  columnOrder,
  visibleColumns,
  onColumnOrderChange,
  onColumnToggle,
  onShowAllColumns,
  onHideAllColumns,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Show Unselected Columns checkbox */}
      <div className="flex items-center gap-2 border border-gray-300 px-2 py-1.5 rounded-md bg-white">
        <label 
          htmlFor="showUnselectedColumns" 
          className="text-sm text-gray-700 cursor-pointer select-none"
        >
          Show Unselected Columns
        </label>
        <input
          id="showUnselectedColumns"
          type="checkbox"
          checked={showUnselectedColumns}
          onChange={(e) => onToggleUnselectedColumns(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
          aria-describedby="showUnselectedColumns-description"
        />
        <span id="showUnselectedColumns-description" className="sr-only">
          Toggle visibility of unselected columns in the table
        </span>
      </div>

      {/* Column Configuration Dropdown */}
      <ColumnConfigDropdown
        flatColumns={flatColumns}
        columnOrder={columnOrder}
        visibleColumns={visibleColumns}
        onColumnOrderChange={onColumnOrderChange}
        onColumnToggle={onColumnToggle}
        onShowAllColumns={onShowAllColumns}
        onHideAllColumns={onHideAllColumns}
      />
    </div>
  );
});

ColumnControls.displayName = 'ColumnControls'; 