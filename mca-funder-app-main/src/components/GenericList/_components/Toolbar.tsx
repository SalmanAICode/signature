import React from 'react';
import { SearchInput } from './SearchInput';
import { FilterButton } from './FilterButton';
import { ControlsButton } from './ControlsButton';
import { ColumnControls } from './ColumnControls';
import { ExportButton } from './ExportButton';
import { ColumnConfig } from '../types';

interface ToolbarProps<T = any> {
  // Search props
  searchEnabled: boolean;
  searchValue: string;
  searchLoading: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  searchPlaceholder?: string;

  // Filter props
  filterEnabled: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterContent?: React.ReactNode;

  // Controls props
  showControls: boolean;
  onToggleControls: () => void;
  showUnselectedColumns: boolean;
  onToggleUnselectedColumns: (checked: boolean) => void;

  // Column configuration props
  flatColumns: ColumnConfig<T>[];
  columnOrder: string[];
  visibleColumns: Set<string>;
  onColumnOrderChange: (newOrder: string[]) => void;
  onColumnToggle: (key: string, visible: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;

  // Export props
  onExport: () => void;

  // Right buttons
  renderRightButtons?: () => React.ReactNode;

  className?: string;
}

export function Toolbar<T = any>({
  searchEnabled,
  searchValue,
  searchLoading,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search by name, email, or phone...",
  filterEnabled,
  showFilters,
  onToggleFilters,
  filterContent,
  showControls,
  onToggleControls,
  showUnselectedColumns,
  onToggleUnselectedColumns,
  flatColumns,
  columnOrder,
  visibleColumns,
  onColumnOrderChange,
  onColumnToggle,
  onShowAllColumns,
  onHideAllColumns,
  onExport,
  renderRightButtons,
  className = "",
}: ToolbarProps<T>) {
  return (
    <div className={`mb-3 flex justify-between items-center ${className}`}>
      <div className="flex gap-2 items-center">
        {searchEnabled && (
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={onSearchClear}
            isLoading={searchLoading}
            placeholder={searchPlaceholder}
          />
        )}

        {filterEnabled && (
          <div className="relative">
            <FilterButton
              isActive={showFilters}
              onClick={onToggleFilters}
            />
            {showFilters && filterContent}
          </div>
        )}

        <ControlsButton
          isActive={showControls}
          onClick={onToggleControls}
        />

        {showControls && (
          <ColumnControls
            showUnselectedColumns={showUnselectedColumns}
            onToggleUnselectedColumns={onToggleUnselectedColumns}
            flatColumns={flatColumns}
            columnOrder={columnOrder}
            visibleColumns={visibleColumns}
            onColumnOrderChange={onColumnOrderChange}
            onColumnToggle={onColumnToggle}
            onShowAllColumns={onShowAllColumns}
            onHideAllColumns={onHideAllColumns}
          />
        )}
      </div>

      <div className="flex gap-2 items-center">
        {renderRightButtons?.()}
        <ExportButton onClick={onExport} />
      </div>
    </div>
  );
} 