'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { Formula } from '@/types/formula';
import { getFormulaList } from '@/lib/api/formulas';
import { columns } from './_config/columnConfig';
import Filter, { FilterState } from './_components/Filter';
import { FormulaSummaryModalContent } from './_components/SummaryModal';
import { FormulaCreateModalContent } from './_components/CreateModal';
import { GetFormulaParams } from '@/types/formula';
import { PlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import useFormulaStore from '@/lib/store/formula';
import useModalStore, { OpenModalInput } from '@/lib/store/modal';
import FunderGuard from '../_components/FunderGuard';

const ORDERING_KEY = 'formula_list_order';
const VISIBILITY_KEY = 'formula_list_visibility';
const COLUMN_WIDTHS_KEY = 'formula_list_column_widths';

// Column width ratio configuration (total should be around 100)
const COLUMN_WIDTH_RATIOS = {
  name: 20,           // 20% - Name column, moderate width
  calculate_type: 20, // 20% - Calculate Type column, narrow for tags
  base_item: 20,      // 20% - Base Item column, narrow for tags
  tier_type: 20,      // 20% - Tier Type column, narrow for tags
  shared: 20,         // 20% - Shared column, narrow for boolean indicator
  createdAt: 20,      // 20% - Created Date column
  updatedAt: 20,      // 20% - Updated Date column
};

export default function FormulaPage() {
  // ========================================
  // Store Integration (Zustand) - Selector mode for better performance
  // ========================================
  
  // Data selectors
  const formulas = useFormulaStore(state => state.formulas);
  const pagination = useFormulaStore(state => state.pagination);
  const storeParams = useFormulaStore(state => state.params);
  
  // Loading state selectors
  const loading = useFormulaStore(state => state.loading);
  const error = useFormulaStore(state => state.error);
  
  // Action selectors
  const setParams = useFormulaStore(state => state.setParams);
  const fetchFormulas = useFormulaStore(state => state.fetchFormulas);
  const clearError = useFormulaStore(state => state.clearError);

  // ========================================
  // Local State (UI-only)
  // ========================================
  
  const [columnWidthsReady, setColumnWidthsReady] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { accessToken, user: authUser, funder } = useAuthStore();
  
  // Global modal hook
  const openModal = useModalStore(state => state.openModal);

  const canCreateFormula = true;

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

  // ========================================
  // Effects
  // ========================================

  // Set initial params when funder changes
  useEffect(() => {
    if (funder) {
      setParams({
        sortBy: '',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
        include_inactive: false,
        include_private: false,
        search: undefined,
        funder: funder._id,
      });
    }
  }, [funder, setParams]);

  // Optional: Refresh data when entering the page (if data is stale or empty)
  useEffect(() => {
    if (funder) {
      fetchFormulas();
    }
  }, [fetchFormulas, funder]);

  // ========================================
  // Event Handlers
  // ========================================

  // Filter and pagination handlers
  const handleFilterChange = (nextFilter: Partial<GetFormulaParams>) => {
    setParams({
      ...storeParams,
      ...nextFilter,
      page: 1, // Reset to first page when filter changes
    });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ ...storeParams, page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setParams({ ...storeParams, limit: newLimit });
  };

  // ========================================
  // Render Helpers
  // ========================================

  const renderLoadingOverlay = () => {
    // Show overlay loading when we have existing data and are loading more
    if (!loading || !formulas || formulas.length === 0 || !columnWidthsReady) return null;

    return (
      <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  };

  const renderInitialLoading = () => {
    // Don't show if not loading
    if (!loading) return null;
    
    // Don't show initial loading if we have data and table is ready (use overlay instead)
    if (formulas && formulas.length > 0 && columnWidthsReady) return null;

    return (
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
    );
  };

  const renderEmptyState = () => {
    if (loading || formulas === null || formulas.length > 0) return null;

    return (
      <div className="text-center py-8 text-gray-500">
        {funder
          ? `No formulas found for ${funder.name}. Create your first formula to get started.`
          : "Please assign a funder to view formulas."
        }
        {canCreateFormula && funder && (
          <div className="mt-4">
            <button
              onClick={() => {
                openModal({
                  key: `formula-create`,
                  title: 'Create New Formula',
                  component: FormulaCreateModalContent,
                  data: null,
                } as OpenModalInput);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Formula
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCreateButton = () => (
    canCreateFormula ? (
      <button
        onClick={() => {
          openModal({
            key: `formula-create`,
            title: 'Create New Formula',
            component: FormulaCreateModalContent,
            data: null,
          } as OpenModalInput);
        }}
        className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
        disabled={loading}
      >
        <PlusIcon className="h-5 w-5" />
        Add Formula
      </button>
    ) : null
  );

  if (!accessToken) {
    return <div className="p-4 text-gray-900 dark:text-gray-100">Please log in to view formulas.</div>;
  }

  // ========================================
  // Main Render
  // ========================================
  
  // Prepare currentQuery for GenericList
  const currentQuery = {
    filter: {
      include_inactive: storeParams.include_inactive,
      include_private: storeParams.include_private,
      sortBy: storeParams.sortBy,
      sortOrder: storeParams.sortOrder,
      search: storeParams.search,
    },
    page: storeParams.page || 1,
    limit: storeParams.limit || 10,
  };

  return (
    <FunderGuard>
      <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Formula</h1>
            {funder && (
              <p className="text-sm text-gray-600 mt-1">
                Managing formulas for: <span className="font-medium">{funder.name}</span>
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
              onClick={() => clearError()}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="relative" ref={tableContainerRef}>
          {/* Loading Overlay */}
          {renderLoadingOverlay()}

          {/* Only render GenericList when column widths are ready */}
          {columnWidthsReady && (
            <GenericList
              title="Formulas"
              data={formulas || []}
              columns={columns as any}
              storage={{
                orderingKey: ORDERING_KEY,
                visibilityKey: VISIBILITY_KEY,
                columnWidthsKey: COLUMN_WIDTHS_KEY,
              }}
              currentQuery={currentQuery}
              rowClassName={(row: any) =>
                row?.inactive
                  ? 'bg-gray-50 opacity-50'
                  : ''
              }
              filter={{
                enabled: true,
                render: ({ visibleColumns, flatColumns }: any) => (
                  <Filter
                    value={{
                      include_inactive: storeParams.include_inactive || false,
                      include_private: storeParams.include_private || false,
                      sortBy: storeParams.sortBy || '',
                      sortOrder: storeParams.sortOrder || '',
                      search: storeParams.search || '',
                    }}
                    onChange={(nextFilter: FilterState) => {
                      const convertedFilter: Partial<GetFormulaParams> = {
                        ...nextFilter,
                        sortOrder: nextFilter.sortOrder === '' ? undefined : nextFilter.sortOrder as 'asc' | 'desc',
                        search: nextFilter.search === '' ? undefined : nextFilter.search,
                      };
                      handleFilterChange(convertedFilter);
                    }}
                    visibleColumns={visibleColumns}
                    flatColumns={flatColumns}
                  />
                ),
                onFilterChange: handleFilterChange,
              }}
              // Row Click Handler - Using Global Modal System
              onRowClick={(row: Formula) => {
                // Create modal input and open modal
                const formulaName = row.name || row._id || 'Unknown';
                const formulaId = row._id || '';
                
                openModal({
                  key: `formula-summary-${formulaId}`,
                  title: `Formula Summary - ${formulaName}`,
                  component: FormulaSummaryModalContent,
                  data: row,
                } as OpenModalInput);
              }}
              expandable={{ enabled: true }}
              fetchAllData={async () => getFormulaList(funder?._id || '')}
              renderRightButtons={renderCreateButton}
            />
          )}

          {/* Loading States */}
          {renderInitialLoading()}
          {renderEmptyState()}

          {/* Pagination - only show when we have data and column widths are ready */}
          {columnWidthsReady && formulas && formulas.length > 0 && (
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              totalResults={pagination?.totalResults || 0}
              limit={storeParams.limit || 10}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>


      </div>
    </FunderGuard>
  );
} 