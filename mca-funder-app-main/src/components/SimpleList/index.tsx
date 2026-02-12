import React, { useState, useEffect, useCallback, memo } from "react";
import Pagination from "@/components/Pagination";
import { useDebounce } from "@/hooks/useDebounce";

export type SortOrder = "asc" | "desc" | null;

export interface Column<T> {
  key: string;
  label: string;
  render?:
    | ((value: any) => React.ReactNode)
    | ((onUpdate: (item: T) => void, item: T) => React.ReactNode);
  sortable?: boolean;
}

export interface SimpleListProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderActions?: (item: T) => React.ReactNode;
  renderHeaderButtons?: () => React.ReactNode;
  title?: string;
  onSearch?: (value: string) => void;
  onSort?: (field: string, order: "asc" | "desc" | null) => void;
  searchQuery?: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc" | null;
  allowNullSort?: boolean;
  searchDebounceMs?: number;
  onRefresh?: () => void;
  onUpdate?: (updatedItem: T) => void;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  renderExpandedContent?: (item: T) => React.ReactNode;
}

// Helper function to safely access nested object properties
function getNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string,
): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
      <span className="text-sm text-gray-600">Loading...</span>
    </div>
  </div>
);

const ErrorMessage = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="text-red-700 text-sm">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

interface TableHeaderProps<T extends { _id: string }> {
  columns: Column<T>[];
  currentSort: { key: string; order: SortOrder };
  onSort: (key: string) => void;
  renderActions?: (item: T) => React.ReactNode;
  hasExpandableContent: boolean;
}

function TableHeaderComponent<T extends { _id: string }>({
  columns,
  currentSort,
  onSort,
  renderActions,
  hasExpandableContent,
}: TableHeaderProps<T>) {
  const renderSortIcon = (key: string) => {
    if (currentSort.key !== key) return null;
    if (currentSort.order === "asc") {
      return (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      );
    }
    if (currentSort.order === "desc") {
      return (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {hasExpandableContent && (
          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
            <div className="flex justify-center">
              <span className="text-gray-400">•••</span>
            </div>
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
            }`}
            onClick={() => column.sortable && onSort(column.key)}
            role={column.sortable ? "button" : undefined}
            tabIndex={column.sortable ? 0 : undefined}
            onKeyDown={(e) => {
              if (column.sortable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSort(column.key);
              }
            }}
            aria-sort={
              column.sortable
                ? currentSort.key === column.key
                  ? currentSort.order === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined
            }
          >
            <div className="flex items-center">
              {column.label}
              {column.sortable && renderSortIcon(column.key)}
            </div>
          </th>
        ))}
        {renderActions && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );
}

const TableHeader = memo(TableHeaderComponent) as typeof TableHeaderComponent;

export function SimpleList<T extends { _id: string }>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = "No items found.",
  renderActions,
  renderHeaderButtons,
  title = "Items",
  onSearch,
  onSort,
  searchQuery = "",
  initialSortBy = "",
  initialSortOrder = null,
  allowNullSort = true,
  searchDebounceMs = 300,
  pagination,
  renderExpandedContent,
  onRefresh,
  onUpdate,
  onRowClick,
}: SimpleListProps<T>) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState<{
    key: string;
    order: SortOrder;
  }>({
    key: initialSortBy,
    order: initialSortOrder || "asc",
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const debouncedSearch = useDebounce((value: string) => {
    onSearch?.(value);
    setIsLoading(false);
  }, searchDebounceMs);

  // Update local search term when prop changes
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsLoading(true);
    debouncedSearch(value);
  };

  const handleSort = (key: string) => {
    let newOrder: SortOrder;
    if (currentSort.key === key) {
      // Cycle through: asc -> desc -> (null if allowed)
      if (currentSort.order === "asc") newOrder = "desc";
      else if (currentSort.order === "desc")
        newOrder = allowNullSort ? null : "asc";
      else newOrder = "asc";
    } else {
      newOrder = "asc";
    }
    setCurrentSort({ key, order: newOrder });
    setIsLoading(true);
    onSort?.(key, newOrder);
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 300);
  };

  const renderValue = (item: T, column: Column<T>): React.ReactNode => {
    const value = getNestedValue(item, column.key);
    if (column.render) {
      // If render is a function that takes 1 parameter, it's a simple render function
      if (column.render.length === 1) {
        return (column.render as (value: any) => React.ReactNode)(value);
      }
      // Otherwise, it's a complex function that needs both parameters
      return (
        column.render as (
          onUpdate: (item: T) => void,
          item: T,
        ) => React.ReactNode
      )(onUpdate!, item);
    }
    return value?.toString() || "";
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Search Bar and Header Buttons */}
        <div className="mb-4 flex items-center gap-4">
          {onSearch && (
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 border-[0.5px] border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          )}
          <div className="ml-auto">{renderHeaderButtons?.()}</div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="relative">
          {(loading || isLoading) && <LoadingOverlay />}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader
                columns={columns}
                currentSort={currentSort}
                onSort={handleSort}
                renderActions={renderActions}
                hasExpandableContent={!!renderExpandedContent}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? (
                  data.map((item) => (
                    <React.Fragment key={item._id}>
                      <tr 
                        className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick?.(item)}
                      >
                        {renderExpandedContent && (
                          <td className="px-2 py-4 whitespace-nowrap w-10">
                            <div className="flex justify-center">
                              <button
                                onClick={() => toggleRow(item._id)}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label={
                                  expandedRows.has(item._id)
                                    ? "Collapse row"
                                    : "Expand row"
                                }
                              >
                                <svg
                                  className={`w-5 h-5 transform transition-transform ${
                                    expandedRows.has(item._id)
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={`${item._id}-${column.key}`}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left"
                          >
                            {renderValue(item, column)}
                          </td>
                        ))}
                        {renderActions && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderActions(item)}
                          </td>
                        )}
                      </tr>
                      {renderExpandedContent && expandedRows.has(item._id) && (
                        <tr>
                          <td
                            colSpan={columns.length + (renderActions ? 2 : 1)}
                            className="px-6 py-4 bg-gray-50"
                          >
                            {renderExpandedContent(item)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length + (renderActions ? 1 : 0)}
                      className="px-6 py-4"
                    >
                      <div className="text-center text-gray-500">
                        {pagination && pagination.totalResults > 0 ? (
                          <p>Try refreshing the page.</p>
                        ) : (
                          <p>
                            {searchTerm
                              ? `No items found matching '${searchTerm}'`
                              : emptyMessage}
                          </p>
                        )}
                        <p className="text-sm mt-2">
                          {searchTerm
                            ? "Try adjusting your search terms."
                            : "Items will appear here once they are added."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination && (data.length > 0 || pagination.totalResults > 0) && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalResults={pagination.totalResults}
              limit={pagination.limit}
              onPageChange={pagination.onPageChange}
              onLimitChange={pagination.onLimitChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
