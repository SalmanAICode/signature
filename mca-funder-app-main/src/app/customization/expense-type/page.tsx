'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { ExpenseType } from '@/types/expenseType';
import { getExpenseTypeList, getExpenseTypes } from '@/lib/api/expenseTypes';
import { columns } from './_config/columnConfig';
import Filter, { FilterState } from './_components/Filter';
import CreateModal from './_components/CreateModal';
import { UpdateModal } from './_components/UpdateModal';
import ExpenseTypeDetailModal from './_components/SummaryModal';
import { Pagination as PaginationType } from '@/types/pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import FunderGuard from '../_components/FunderGuard';

const ORDERING_KEY = 'expense_type_list_order';
const VISIBILITY_KEY = 'expense_type_list_visibility';
const COLUMN_WIDTHS_KEY = 'expense_type_list_column_widths';

// Column width ratio configuration (total should be around 100)
const COLUMN_WIDTH_RATIOS = {
  name: 20,         // 20% - Name column, widest for text content
  formula: 20,      // 20% - Formula column, moderate width for formula names
  commission: 20,   // 20% - Commission column, narrower for boolean indicator
  syndication: 20,  // 20% - Syndication column, narrower for boolean indicator
  default: 20,      // 20% - Default column, narrower for boolean indicator
  createdAt: 20,    // 20% - Created Date column
  updatedAt: 20,    // 20% - Updated Date column
};

export default function ExpenseTypePage() {
  const [data, setData] = useState<ExpenseType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);
  const [columnWidthsReady, setColumnWidthsReady] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { accessToken, user: authUser, funder } = useAuthStore();

  const canCreateExpenseType = true;

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: '',
      sortOrder: '',
      search: '',
    },
    page: 1,
    limit: 10,
  });

  // Initialize column widths on component mount
  useEffect(() => {
    // Clear existing column widths to force recalculation
    localStorage.removeItem(COLUMN_WIDTHS_KEY);
    setColumnWidthsReady(false);
  }, []);

  // Set column widths proportionally
  useLayoutEffect(() => {
    const setProportionalColumnWidths = () => {
      if (!tableContainerRef.current) return;

      // Get container width, subtract padding and scrollbar space
      const containerWidth = tableContainerRef.current.offsetWidth - 40; // subtract padding

      if (containerWidth <= 0) return;

      // Calculate pixel width for each column based on ratio
      const calculatedWidths: Record<string, number> = {};
      Object.entries(COLUMN_WIDTH_RATIOS).forEach(([columnKey, ratio]) => {
        calculatedWidths[columnKey] = Math.floor((containerWidth * ratio) / 100);
      });

      // Ensure minimum width
      const minWidth = 80;
      Object.keys(calculatedWidths).forEach(key => {
        if (calculatedWidths[key] < minWidth) {
          calculatedWidths[key] = minWidth;
        }
      });

      // Save to localStorage
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(calculatedWidths));
      setColumnWidthsReady(true);
    };

    // Delayed execution to ensure DOM is rendered
    const timer = setTimeout(setProportionalColumnWidths, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [funder]); // Only recalculate when funder changes

  // Handle window resize
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tableContainerRef.current || !columnWidthsReady) return;

      const containerWidth = tableContainerRef.current.offsetWidth - 40;
      if (containerWidth <= 0) return;

      const calculatedWidths: Record<string, number> = {};
      Object.entries(COLUMN_WIDTH_RATIOS).forEach(([columnKey, ratio]) => {
        calculatedWidths[columnKey] = Math.floor((containerWidth * ratio) / 100);
      });

      const minWidth = 80;
      Object.keys(calculatedWidths).forEach(key => {
        if (calculatedWidths[key] < minWidth) {
          calculatedWidths[key] = minWidth;
        }
      });

      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(calculatedWidths));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [columnWidthsReady]);

  useEffect(() => {
    if (funder) {
      fetchExpenseTypes();
    }
  }, [query, funder]);

  const fetchExpenseTypes = async () => {
    if (!funder) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getExpenseTypes({
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search || undefined,
        sortBy: query.filter.sortBy || undefined,
        sortOrder: (query.filter.sortBy && query.filter.sortOrder) ? query.filter.sortOrder : undefined,
        funder: funder._id,
      });

      setData(result.data);
      setPaginatedData(result.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch Expense Types'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = async (updatedExpenseType?: ExpenseType) => {
    setShowCreateForm(false);
    if (updatedExpenseType) {
      // If we get an updated expense type (from edit mode), update the specific item
      setData(prev => prev?.map(expenseType => 
        expenseType._id === updatedExpenseType._id ? updatedExpenseType : expenseType
      ) || []);
    } else {
      // If no updated expense type (from create mode), refresh the entire list
      await fetchExpenseTypes();
    }
  };

  const handleUpdateSuccess = (updatedExpenseType: ExpenseType) => {
    setShowUpdateForm(false);
    setEditingExpenseType(null);
    // Update the specific expense type in the data array
    setData(prev => prev?.map(expenseType => 
      expenseType._id === updatedExpenseType._id ? updatedExpenseType : expenseType
    ) || []);
  };

  const handleDetailModalSuccess = async () => {
    await fetchExpenseTypes();
  };

  const handleEditExpenseType = (expenseType: ExpenseType) => {
    setEditingExpenseType(expenseType);
    setShowUpdateForm(true);
  };

  if (!accessToken) {
    return <div className="p-4 text-gray-900 dark:text-gray-100">Please log in to view expense types.</div>;
  }

  return (
    <FunderGuard>
      <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Type</h1>
            {funder && (
              <p className="text-sm text-gray-600 mt-1">
                Managing expense types for: <span className="font-medium">{funder.name}</span>
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Error: {error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="relative" ref={tableContainerRef}>
          {/* Loading Overlay for when we have data */}
          {loading && data && data.length > 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-gray-600">Loading...</span>
              </div>
            </div>
          )}

          {/* Only render GenericList when column widths are ready */}
          {columnWidthsReady && (
            <GenericList
              title="Expense Types"
              data={data || []}
              columns={columns as any}
              storage={{
                orderingKey: ORDERING_KEY,
                visibilityKey: VISIBILITY_KEY,
                columnWidthsKey: COLUMN_WIDTHS_KEY,
              }}
              currentQuery={query}
              rowClassName={(row: any) =>
                row?.inactive
                  ? 'bg-gray-50 opacity-50'
                  : ''
              }
              filter={{
                enabled: true,
                render: ({ visibleColumns, flatColumns }: any) => (
                  <Filter
                    value={query.filter}
                    onChange={(nextFilter: FilterState) => setQuery(prev => ({
                      ...prev,
                      filter: nextFilter,
                      page: 1,
                    }))}
                    visibleColumns={visibleColumns}
                    flatColumns={flatColumns}
                  />
                ),
                onFilterChange: (nextFilter: any) => {
                  setQuery((prev) => ({
                    ...prev,
                    page: 1,
                    filter: {
                      ...prev.filter,
                      ...nextFilter,
                    },
                  }));
                },
              }}
              rowModal={{
                enabled: true,
                render: (row, onClose) => (
                  <ExpenseTypeDetailModal
                    expenseType={row}
                    onClose={onClose}
                    onEdit={handleEditExpenseType}
                    onSuccess={handleDetailModalSuccess}
                  />
                ),
              }}
              expandable={{ enabled: true }}
              fetchAllData={async () => getExpenseTypeList({ funder: funder?._id || '' })}
              renderRightButtons={() => (
                canCreateExpenseType ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
                    disabled={loading}
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create
                  </button>
                ) : null
              )}
            />
          )}

          {/* Show loading state for initial load or when column widths are not ready */}
          {(loading && (!data || data.length === 0)) || !columnWidthsReady ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-gray-600">
                  {!columnWidthsReady ? 'Preparing table...' : 'Loading...'}
                </span>
              </div>
            </div>
          ) : null}

          {/* Show empty state when not loading and no data */}
          {!loading && columnWidthsReady && data && data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {funder
                ? `No expense types found for ${funder.name}. Create your first expense type to get started.`
                : "Please assign a funder to view expense types."
              }
              {canCreateExpenseType && funder && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Expense Type
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pagination - only show when we have data and column widths are ready */}
          {columnWidthsReady && data && data.length > 0 && (
            <Pagination
              currentPage={paginatedData?.page || 1}
              totalPages={paginatedData?.totalPages || 1}
              totalResults={paginatedData?.totalResults || 0}
              limit={query.limit}
              onPageChange={(page) => setQuery(prev => ({ ...prev, page }))}
              onLimitChange={(limit) => setQuery(prev => ({ ...prev, limit, page: 1 }))}
            />
          )}
        </div>

        {/* Create Modal */}
        {showCreateForm && (
          <CreateModal
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Update Modal */}
        {showUpdateForm && editingExpenseType && (
          <UpdateModal
            isOpen={showUpdateForm}
            expenseType={editingExpenseType}
            onSuccess={handleUpdateSuccess}
            onClose={() => {
              setShowUpdateForm(false);
              setEditingExpenseType(null);
            }}
          />
        )}
      </div>
    </FunderGuard>
  );
} 