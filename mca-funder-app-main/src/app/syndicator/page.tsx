'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

// Components
import { GenericList } from "@/components/GenericList/GenericList";
import PaginationComponent from "@/components/Pagination";
import { SyndicatorSummaryModal } from './_components/SummaryModal';
import { CreateModal } from './_components/CreateModal';
import Filter from './_components/Filter';
import { Syndicator } from '@/types/syndicator';
import DashboardShell from '@/components/DashboardShell';
import { toast } from 'react-hot-toast';

// Types and Configuration
import { GetSyndicatorParams } from '@/types/syndicator';
import { columns } from './_config/columnConfig';

// API
import { getSyndicators, getSyndicatorList, deleteSyndicator, updateSyndicator } from '@/lib/api/syndicators';
import { Pagination as PaginationType } from '@/types/pagination';

// ========================================
// Types and Constants
// ========================================

// Local storage keys for GenericList configuration
const STORAGE_KEYS = {
  ORDERING: 'syndicator_order',
  VISIBILITY: 'syndicator_visibility',
  COLUMN_WIDTHS: 'syndicator_column_widths',
} as const;

// ========================================
// Main Component
// ========================================

export default function SyndicatorPage() {
  // ========================================
  // Local State
  // ========================================
  
  const [data, setData] = useState<Syndicator[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

  const [query, setQuery] = useState<{
    filter: GetSyndicatorParams;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: "",
    },
    page: 1,
    limit: 10,
  });

  // ========================================
  // Data Fetching
  // ========================================

  const fetchSyndicators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSyndicators({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search,
      });

      setData(response.data);
      setPaginatedData(response.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Error).message)
          : 'Failed to fetch Syndicators'
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Clear messages when query changes
  useEffect(() => {
    fetchSyndicators();
  }, [fetchSyndicators]);

  // ========================================
  // Event Handlers
  // ========================================

  const handleDeleteSyndicator = async (syndicatorId: string) => {
    try {
      await deleteSyndicator(syndicatorId);
      toast.success('Syndicator deleted successfully');
      
      // Update local state first
      setData(prevData => {
        if (!prevData) return [];
        const newData = prevData.filter(item => item._id !== syndicatorId);
        
        // If page becomes empty and not on first page, go to previous page
        if (newData.length === 0 && query.page > 1) {
          setQuery(prev => ({ ...prev, page: prev.page - 1 }));
          return null; // Will trigger refetch
        }
        
        return newData;
      });

      // Update pagination info
      setPaginatedData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalResults: prev.totalResults - 1,
          totalPages: Math.ceil((prev.totalResults - 1) / query.limit)
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete syndicator, please try again.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateSyndicator = async (values: any) => {
    try {
      // Extract the ID and remove it from the request body
      const { _id, ...updateData } = values;
      
      if (!_id) {
        throw new Error('Syndicator ID is required for update');
      }
      
      const newData = await updateSyndicator(_id, updateData);

      setData(prevData => {
        if (!prevData) return [newData];
        return prevData.map(item => item._id === newData._id ? newData : item);
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update syndicator. Please try again.';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const handleUpdateData = (id: string, newData: Syndicator) => {
    setData(prevData => {
      if (!prevData) return [newData];
      return prevData.map(item => item._id === id ? newData : item);
    });
  };

  // ========================================
  // Render Helpers
  // ========================================

  const renderCreateButton = () => (
    <div className="flex gap-2">
      <button
        onClick={() => setShowCreateModal(true)}
        className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
      >
        <PlusIcon className="h-5 w-5" />
        Create
      </button>
    </div>
  );

  // ========================================
  // Main Render
  // ========================================
  
  // Prepare currentQuery for GenericList
  const currentQuery = {
    filter: {
      sortBy: query.filter.sortBy,
      sortOrder: query.filter.sortOrder,
      include_inactive: query.filter.include_inactive,
      search: query.filter.search,
    },
    page: query.page || 1,
    limit: query.limit || 10,
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Syndicators</h1>
      </div>

      {/* Error Message Banner */}
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

      {/* Main Content */}
      <div className="relative">
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

        {/* Always show GenericList structure */}
        <GenericList
          title="Syndicators"
          data={data || []}
          columns={columns}
          storage={{
            orderingKey: STORAGE_KEYS.ORDERING,
            visibilityKey: STORAGE_KEYS.VISIBILITY,
            columnWidthsKey: STORAGE_KEYS.COLUMN_WIDTHS,
          }}
          currentQuery={currentQuery}
          rowClassName={(row) =>
            row?.inactive
              ? 'bg-gray-50 opacity-50'
              : ''
          }
          filter={{
            enabled: true,
            render: ({ visibleColumns, flatColumns }) => (
              <Filter 
                value={query.filter} 
                onChange={(nextFilter: Partial<GetSyndicatorParams>) => setQuery(prev => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    ...nextFilter,
                  },
                  page: 1, // Reset page on filter change
                }))}
                visibleColumns={visibleColumns}
                flatColumns={flatColumns}
              />
            ),
            onFilterChange: (nextFilter: Partial<GetSyndicatorParams>) => {
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
              <SyndicatorSummaryModal
                title="Syndicator Summary"
                data={row}
                onClose={onClose}
                onUpdate={handleUpdateSyndicator}
                onDelete={handleDeleteSyndicator}
                onSuccess={(message: string) => toast.success(message)}
                onError={(message: string) => toast.error(message)}
                error={error}
              />
            )
          }}
          expandable={{ enabled: true }}
          fetchAllDatasPaginated={async (params) => getSyndicators({ 
            include_inactive: true, 
            page: params.page, 
            limit: params.limit 
          })}
          renderRightButtons={renderCreateButton}
        />

        {/* Show loading state for initial load */}
        {loading && (!data || data.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Show empty state when not loading and no data */}
        {!loading && data && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Syndicators available.
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newSyndicator: Syndicator) => {
            toast.success('Syndicator created successfully!');
            setData(prevData => {
              if (!prevData) return [newSyndicator];
              return [newSyndicator, ...prevData];
            });
            setPaginatedData(prev => {
              if (!prev) return null;
              return {
                ...prev,
                totalResults: prev.totalResults + 1,
                totalPages: Math.ceil((prev.totalResults + 1) / query.limit)
              };
            });
            setShowCreateModal(false);
          }}
          onError={(error: string) => {
            toast.error(error);
          }}
        />

        {/* Pagination - only show when we have data */}
        {data && data.length > 0 && (
          <PaginationComponent
            currentPage={query.page}
            totalPages={paginatedData?.totalPages || 0}
            totalResults={paginatedData?.totalResults || 0}
            limit={query.limit}
            onPageChange={(newPage) => setQuery((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setQuery((prev) => ({ ...prev, limit: newLimit }))}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
}