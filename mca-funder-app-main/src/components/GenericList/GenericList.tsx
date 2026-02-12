// GenericList Component Features:
// 	Nested column config with flattening logic.
// 	Drag-and-drop reordering of columns (@dnd-kit/sortable).
// 	Visibility toggles for columns in control mode.
// 	Expandable rows with optional custom rendering.
// 	Column persistence via columnOrder and visibleColumns.

import React, { useRef, useLayoutEffect, useMemo, useCallback } from "react";
import { TableBody } from "./TableBody";
import {
  ColumnConfig,
  TABLE_COLUMN_WIDTH,
  TABLE_COLUMN_MIN_WIDTH,
} from "./types";
import { SortableHeader } from "./SortableHeader";
import { ExportModal } from "../ExportModal";
import { Toolbar } from "./_components/Toolbar";
import { TableContainer } from "./_components/TableContainer";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { KeyboardNavigationProvider } from "./_components/KeyboardNavigationProvider";

// Import our custom hooks
import { useGenericListColumnManagement } from "@/hooks/useGenericListColumnManagement";
import { useGenericListSearch } from "@/hooks/useGenericListSearch";
import { useGenericListUIState } from "@/hooks/useGenericListUIState";
import { useGenericListDragAndDrop } from "@/hooks/useGenericListDragAndDrop";
import { Pagination } from "@/types/pagination";

export type GenericListProps<
  T extends Record<string, any>,
  TFilter extends Record<string, any>,
> = {
  title?: string;
  data: T[];
  columns: ColumnConfig<T>[];
  expandable?: {
    enabled: boolean;
    render?: (row: T) => React.ReactNode;
  };
  rowModal?: {
    enabled: boolean;
    render: (row: T, onClose: () => void) => React.ReactNode;
  };
  currentQuery: TFilter;
  filter: {
    enabled: boolean;
    render: (context: {
      visibleColumns: string[];
      flatColumns: ColumnConfig<T>[];
    }) => React.ReactNode;
    onFilterChange: (filter: TFilter) => void;
  };
  storage?: {
    orderingKey: string;
    visibilityKey: string;
    columnWidthsKey: string;
  };
  fetchAllData?: () => Promise<T[]>;
  fetchAllDatasPaginated?: (params: { page: number, limit: number }) => Promise<{ data: T[], pagination: Pagination }>;
  renderRightButtons?: () => React.ReactNode;
  rowClassName?: (row: T) => string;
  // New performance and accessibility props
  enableKeyboardNavigation?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  // New row click handler
  onRowClick?: (row: T) => void;
};

// Hardcoded list of non-sortable columns for business logic and UX clarity.
const NON_SORTABLE_KEYS = [
  "funder.name",
  "merchant.name",
  "iso.name",
  "type",
  "commission_amount",
  "upfront_fee_amount",
  "succeed_rate",
  "created_by_user.name",
  "address",
  "address.full",
  "online",
  "online.status",
  "inactive",
  "inactive.status",
  "address.address.full",
  "online.online.status",
  "inactive.inactive.status"
];

function GenericListInner<
  T extends Record<string, any>,
  TFilter extends Record<string, any>,
>({
  title,
  data,
  columns,
  expandable = { enabled: false, render: () => null },
  rowModal = { enabled: false, render: () => null },
  currentQuery,
  filter,
  storage = {
    orderingKey: "list_order",
    visibilityKey: "list_visibility",
    columnWidthsKey: "list_column_widths",
  },
  fetchAllData,
  fetchAllDatasPaginated,
  renderRightButtons,
  rowClassName,
  onRowClick,
}: Omit<GenericListProps<T, TFilter>, "onError" | "enableKeyboardNavigation">) {
  // Use our custom hooks
  const columnManagement = useGenericListColumnManagement({ columns, storage });
  const search = useGenericListSearch({
    currentQuery,
    onFilterChange: filter.onFilterChange,
  });
  const uiState = useGenericListUIState();
  const dragAndDrop = useGenericListDragAndDrop({
    columnOrder: columnManagement.columnOrder,
    setColumnOrder: columnManagement.setColumnOrder,
  });

  // Get ordered columns using the hook
  const orderedColumns = useMemo(
    () =>
      columnManagement.getOrderedColumns(
        uiState.showControls,
        uiState.showUnselectedColumns
      ),
    [columnManagement, uiState.showControls, uiState.showUnselectedColumns]
  );

  // Table ref for width calculations
  const tableRef = useRef<HTMLDivElement>(null);

  // Column resizing logic (kept in component as it's UI-specific)
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Auto-adjust last column width to fill container
  useLayoutEffect(() => {
    if (!tableRef.current || orderedColumns.length === 0) return;

    const containerWidth = tableRef.current.offsetWidth;
    const totalColumnWidth = orderedColumns.reduce((acc, col) => {
      return (
        acc + (columnManagement.columnWidths[col.key] ?? TABLE_COLUMN_WIDTH)
      );
    }, 0);

    if (totalColumnWidth < containerWidth) {
      const lastColKey = orderedColumns[orderedColumns.length - 1]?.key;
      if (!lastColKey) return;

      columnManagement.setColumnWidths((prev) => ({
        ...prev,
        [lastColKey]:
          (prev[lastColKey] ?? TABLE_COLUMN_WIDTH) +
          (containerWidth - totalColumnWidth),
      }));
    }
  }, [
    orderedColumns,
    columnManagement.columnWidths,
    columnManagement.setColumnWidths,
  ]);

  // Column resizing handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, key: string) => {
      e.preventDefault();

      const th = e.currentTarget.parentElement as HTMLElement;
      const realWidth = th?.getBoundingClientRect().width ?? TABLE_COLUMN_WIDTH;

      resizingRef.current = {
        key,
        startX: e.clientX,
        startWidth: realWidth,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const resize = resizingRef.current;
        if (!resize) return;

        const deltaX = e.clientX - resize.startX;
        const newWidth = Math.max(
          TABLE_COLUMN_MIN_WIDTH,
          resize.startWidth + deltaX
        );
        columnManagement.setColumnWidths((prev) => ({
          ...prev,
          [resize.key]: newWidth,
        }));
      };

      const handleMouseUp = () => {
        resizingRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [columnManagement.setColumnWidths]
  );

  // Calculate total table width
  const totalTableWidth = useMemo(() => {
    return orderedColumns.reduce((sum, col) => {
      return (
        sum + (columnManagement.columnWidths[col.key] ?? TABLE_COLUMN_WIDTH)
      );
    }, 0);
  }, [orderedColumns, columnManagement.columnWidths]);

  // Sorting handler
  const handleSort = useCallback(
    (key: string) => {
      const isCurrent = currentQuery.filter.sortBy === key;
      const currentOrder = currentQuery.filter.sortOrder;

      let nextFilter: TFilter;

      if (!isCurrent) {
        nextFilter = {
          ...currentQuery.filter,
          sortBy: key,
          sortOrder: "asc",
        };
      } else if (currentOrder === "asc") {
        nextFilter = {
          ...currentQuery.filter,
          sortBy: key,
          sortOrder: "desc",
        };
      } else {
        nextFilter = {
          ...currentQuery.filter,
          sortBy: "",
          sortOrder: "",
        };
      }

      filter.onFilterChange(nextFilter);
    },
    [currentQuery.filter, filter.onFilterChange]
  );

  // Row click handler
  const handleRowClick = useCallback(
    (rowIdx: number) => {
      if (uiState.showControls) return; // Don't handle clicks in customization mode

      if (rowModal.enabled) {
        uiState.setSelectedRow(rowIdx);
      }
      if (onRowClick) {
        onRowClick(data[rowIdx]);
      }
    },
    [data, onRowClick, rowModal.enabled, uiState]
  );

  // Header rendering
  const renderHeaders = useCallback(
    () => (
      <>
        {expandable.enabled && !uiState.showControls && (
          <th className="px-2 py-2 bg-gray-300 whitespace-nowrap border-r-4 border-transparent">
            ...
          </th>
        )}
        {orderedColumns.map((col, colIdx) => {
          return uiState.showControls ? (
            (uiState.showUnselectedColumns ||
              (!uiState.showUnselectedColumns &&
                columnManagement.visibleColumns.has(col.key))) && (
              <SortableHeader
                key={colIdx}
                id={col.key}
                label={col.label}
                showToggle={true}
                isVisible={columnManagement.visibleColumns.has(col.key)}
                onToggle={columnManagement.toggleColumn}
                activeId={dragAndDrop.activeId || undefined}
              />
            )
          ) : (
            <th
              key={colIdx}
              scope="col"
              className="px-2 py-2 whitespace-nowrap bg-gray-300 text-sm"
              style={{
                width: `${columnManagement.columnWidths[col.key] ?? TABLE_COLUMN_WIDTH}px`,
                minWidth: `${TABLE_COLUMN_MIN_WIDTH}px`,
                maxWidth: "300px",
                position: "relative",
              }}
            >
              {!NON_SORTABLE_KEYS.includes(col.key) && col.key !== 'actions' && !(col as any).columns && (
                <span
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none mr-1 text-gray-500 hover:text-gray-800"
                  title="Sort"
                >
                  {currentQuery.filter.sortBy === col.key
                    ? currentQuery.filter.sortOrder === "asc"
                      ? "▲"
                      : "▼"
                    : "⇅"}
                </span>
              )}
              {col.label}

              <div
                onMouseDown={(e) => handleResizeStart(e, col.key)}
                className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-10 bg-white"
              />
            </th>
          );
        })}
      </>
    ),
    [
      expandable.enabled,
      orderedColumns,
      uiState.showControls,
      uiState.showUnselectedColumns,
      columnManagement.visibleColumns,
      columnManagement.toggleColumn,
      columnManagement.columnWidths,
      dragAndDrop.activeId,
      currentQuery.filter.sortBy,
      currentQuery.filter.sortOrder,
      handleSort,
      handleResizeStart,
    ]
  );

  // Table body component
  const CustomTableBody = useCallback(
    () => (
      <table
        className="table-auto text-left border-collapse rounded-xs overflow-hidden text-xs sm:text-sm md:text-base"
        style={{ minWidth: `${totalTableWidth}px` }}
      >
        <thead className="text-gray-700 text-sm uppercase tracking-wide sticky top-0 z-5">
          <tr>{renderHeaders()}</tr>
        </thead>
        <TableBody
          data={data}
          columns={orderedColumns}
          columnWidths={columnManagement.columnWidths}
          expandable={{
            enabled: expandable.enabled,
            render: expandable.render,
            handleExpand: uiState.toggleExpandedRow,
          }}
          expandedRow={uiState.expandedRow}
          showControls={uiState.showControls}
          visibleColumns={columnManagement.visibleColumns}
          onRowClick={handleRowClick}
          preSelectedRow={uiState.preSelectedRow}
          rowClassName={rowClassName}
        />
      </table>
    ),
    [
      totalTableWidth,
      renderHeaders,
      data,
      orderedColumns,
      columnManagement.columnWidths,
      columnManagement.visibleColumns,
      expandable.enabled,
      expandable.render,
      uiState.toggleExpandedRow,
      uiState.expandedRow,
      uiState.showControls,
      uiState.preSelectedRow,
      handleRowClick,
      rowClassName,
    ]
  );

  return (
    <>
      {uiState.selectedRow !== null &&
        rowModal.enabled &&
        rowModal.render(data[uiState.selectedRow], uiState.closeModal)}

      {uiState.showExportModal && (
        <ExportModal
          isOpen={uiState.showExportModal}
          onClose={uiState.closeExportModal}
          data={data}
          visibleColumns={orderedColumns}
          allColumns={columnManagement.flatColumns}
          fileName={title ? title.replace(/\s+/g, "_").toLowerCase() : "export"}
          fetchAllData={fetchAllData}
          fetchAllDatasPaginated={fetchAllDatasPaginated}
        />
      )}

      <div className="border-0 w-full rounded-xl py-4 force-light-mode">
        <Toolbar
          searchEnabled={currentQuery.filter.search != null}
          searchValue={search.localSearchFilter}
          searchLoading={search.searchLoading}
          onSearchChange={search.handleSearchChange}
          onSearchClear={search.handleClearSearch}
          searchPlaceholder="Search by name, email, or phone..."
          filterEnabled={filter.enabled}
          showFilters={uiState.showFilters}
          onToggleFilters={uiState.toggleFilters}
          filterContent={filter.render({
            visibleColumns: Array.from(columnManagement.visibleColumns),
            flatColumns: columnManagement.flatColumns,
          })}
          showControls={uiState.showControls}
          onToggleControls={uiState.toggleControls}
          showUnselectedColumns={uiState.showUnselectedColumns}
          onToggleUnselectedColumns={uiState.setShowUnselectedColumns}
          flatColumns={columnManagement.flatColumns}
          columnOrder={columnManagement.columnOrder}
          visibleColumns={columnManagement.visibleColumns}
          onColumnOrderChange={columnManagement.setColumnOrder}
          onColumnToggle={columnManagement.toggleColumn}
          onShowAllColumns={columnManagement.showAllColumns}
          onHideAllColumns={columnManagement.hideAllColumns}
          onExport={() => uiState.setShowExportModal(true)}
          renderRightButtons={renderRightButtons}
        />

        <TableContainer
          showControls={uiState.showControls}
          orderedColumns={orderedColumns}
          visibleColumns={columnManagement.visibleColumns}
          activeId={dragAndDrop.activeId}
          sensors={dragAndDrop.sensors}
          onDragStart={dragAndDrop.handleDragStart}
          onDragEnd={dragAndDrop.handleDragEnd}
          className={`w-full overflow-x-auto border-y transition-all duration-300 ${
            uiState.showControls
              ? "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.3)]"
              : "border-gray-100"
          }`}
        >
          <div className="w-full overflow-x-auto">
            <div className="min-w-full" ref={tableRef}>
              <CustomTableBody />
            </div>
          </div>
        </TableContainer>
      </div>
    </>
  );
}

export function GenericList<
  T extends Record<string, any>,
  TFilter extends Record<string, any>,
>({
  title,
  data,
  columns,
  expandable = { enabled: false, render: () => null },
  rowModal = { enabled: false, render: () => null },
  currentQuery,
  filter,
  storage = {
    orderingKey: "list_order",
    visibilityKey: "list_visibility",
    columnWidthsKey: "list_column_widths",
  },
  fetchAllData,
  fetchAllDatasPaginated,
  renderRightButtons,
  rowClassName,
  onError,
  onRowClick,
}: GenericListProps<T, TFilter>) {
  return (
    <ErrorBoundary onError={onError}>
      <KeyboardNavigationProvider>
        <GenericListInner
          title={title}
          data={data}
          columns={columns}
          expandable={expandable}
          rowModal={rowModal}
          currentQuery={currentQuery}
          filter={filter}
          storage={storage}
          fetchAllData={fetchAllData}
          fetchAllDatasPaginated={fetchAllDatasPaginated}
          renderRightButtons={renderRightButtons}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
        />
      </KeyboardNavigationProvider>
    </ErrorBoundary>
  );
}
