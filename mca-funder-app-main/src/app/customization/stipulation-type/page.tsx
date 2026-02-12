'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { StipulationType } from '@/types/stipulationType';
import { getStipulationTypeList, getStipulationTypes } from '@/lib/api/stipulationTypes';
import { columns } from './_config/columnConfig';
import { ColumnConfig } from '@/components/GenericList/types';
import Filter, { FilterState } from './_components/Filter';
import CreateModal from './_components/CreateModal';
import UpdateModal from './_components/UpdateModal';
import SummaryModal from './_components/SummaryModal';
import { Pagination as PaginationType } from '@/types/pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import FunderGuard from '../_components/FunderGuard';

const ORDERING_KEY = 'stipulation_type_list_order';
const VISIBILITY_KEY = 'stipulation_type_list_visibility';
const COLUMN_WIDTHS_KEY = 'stipulation_type_list_column_widths';

// Column width ratio configuration (total should be around 100)
const COLUMN_WIDTH_RATIOS = {
  name: 50,         // 50% - Name column, widest as it's the main content
  required: 20,     // 20% - Required column, moderate width for boolean indicator
  createdAt: 25,    // 25% - Created Date column
  updatedAt: 25,    // 25% - Updated Date column
};

export default function StipulationTypePage() {
  const [data, setData] = useState<StipulationType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingStipulationType, setEditingStipulationType] = useState<StipulationType | null>(null);
  const [columnWidthsReady, setColumnWidthsReady] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { accessToken, funder } = useAuthStore();
  
  const canCreateStipulationType = true;

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
      
      console.log('Stipulation Type - Container width:', containerWidth, 'Column widths:', calculatedWidths);
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

  const fetchStipulationTypes = useCallback(async () => {
    if (!funder) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getStipulationTypes({
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
          ? String((error as Error).message)
          : 'Failed to fetch Stipulation Types'
      );
    } finally {
      setLoading(false);
    }
  }, [query, funder]);

  useEffect(() => {
    if (funder) {
      fetchStipulationTypes();
    }
  }, [fetchStipulationTypes, funder]);

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await fetchStipulationTypes();
  };

  const handleUpdateSuccess = async (updatedStipulationType: StipulationType) => {
    setShowUpdateForm(false);
    setEditingStipulationType(null);
    
    // Update the specific item in the array instead of refetching all data
    if (data) {
      const updatedData = data.map(item => 
        item._id === updatedStipulationType._id ? updatedStipulationType : item
      );
      setData(updatedData);
    }
  };

  const handleEditStipulationType = (stipulationType: StipulationType) => {
    setEditingStipulationType(stipulationType);
    setShowUpdateForm(true);
  };

  if (!accessToken) {
    return <div className="p-4 text-gray-900 dark:text-gray-100">Please log in to view stipulation types.</div>;
  }

  return (
    <FunderGuard>
      <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stipulation Type</h1>
            {funder && (
              <p className="text-sm text-gray-600 mt-1">
                Managing stipulation types for: <span className="font-medium">{funder.name}</span>
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
              title="Stipulation Types"
              data={data || []}
              columns={columns}
              storage={{
                orderingKey: ORDERING_KEY,
                visibilityKey: VISIBILITY_KEY,
                columnWidthsKey: COLUMN_WIDTHS_KEY,
              }}
              currentQuery={query}
              rowClassName={(row: StipulationType) =>
                row?.inactive
                  ? 'bg-gray-50 opacity-50'
                  : ''
              }
              filter={{
                enabled: true,
                render: ({ visibleColumns, flatColumns }: { 
                  visibleColumns: string[]; 
                  flatColumns: ColumnConfig<StipulationType>[] 
                }) => (
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
                onFilterChange: (nextQuery: Partial<{
                  filter: FilterState;
                  page: number;
                  limit: number;
                }>) => {
                  setQuery((prev) => ({
                    ...prev,
                    page: 1,
                    ...nextQuery,
                  }));
                },
              }}
              rowModal={{
                enabled: true,
                render: (row, onClose) => (
                  <SummaryModal
                    stipulationType={row}
                    onClose={onClose}
                    onEdit={handleEditStipulationType}
                    onSuccess={handleCreateSuccess}
                  />
                ),
              }}
              expandable={{ enabled: true }}
              fetchAllData={async () => getStipulationTypeList(funder?._id || '')}
              renderRightButtons={() => (
                canCreateStipulationType ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
                    disabled={loading}
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Stipulation Type
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
                ? `No stipulation types found for ${funder.name}. Create your first stipulation type to get started.`
                : "Please assign a funder to view stipulation types."
              }
              {canCreateStipulationType && funder && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Stipulation Type
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

        {showCreateForm && (
          <CreateModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showUpdateForm && editingStipulationType && (
          <UpdateModal
            stipulationType={editingStipulationType}
            onClose={() => {
              setShowUpdateForm(false);
              setEditingStipulationType(null);
            }}
            onSuccess={handleUpdateSuccess}
          />
        )}
      </div>
    </FunderGuard>
  );
} 