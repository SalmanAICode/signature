'use client';

import { useState, useEffect, useCallback } from 'react';

import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import DashboardShell from '@/components/DashboardShell';

// custom components
import { SummaryModal } from './_components/SummaryModal';
import Filter from './_components/Filter';
import { CreateModal } from './_components/CreateModal';
import { PlusIcon } from '@heroicons/react/24/outline';

import { Representative } from "@/types/representative";

import { getRepresentatives, getRepresentativeList, deleteRepresentative } from '@/lib/api/representatives';

import { columns } from './_config/columnConfig';
import { Pagination as PaginationType } from '@/types/pagination';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'representative_order';
const VISIBILITY_KEY = 'representative_visibility';
const COLUMN_WIDTHS_KEY = 'representative_column_widths';

export default function Page() {

  const [data, setData] = useState<Representative[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: '',
      sortOrder: 'asc',
      search: "",
    },
    page: 1,
    limit: 10,
  });

  const fetchRepresentatives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRepresentatives({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
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
          : 'Failed to fetch Representatives'
      );
      setSuccessMessage(null); // Clear success message on error
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Clear messages when query changes
  useEffect(() => {
    setSuccessMessage(null);
    setError(null);
    fetchRepresentatives();
  }, [fetchRepresentatives]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDeleteRepresentative = async (representativeId: string) => {
    setIsDeleting(true);
    setSuccessMessage(null);
    try {
      await deleteRepresentative(representativeId);
      setSuccessMessage('Representative deleted successfully');
      fetchRepresentatives();
    } catch (err) {
      // Handle network errors and API errors
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete representative. Please check your connection and try again.';
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Representatives</h1>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-green-400 hover:text-green-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

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
          title="Representatives"
          data={data || []}
          columns={columns}
          storage={{
            orderingKey: ORDERING_KEY,
            visibilityKey: VISIBILITY_KEY,
            columnWidthsKey: COLUMN_WIDTHS_KEY,
          }}
          currentQuery={query}
          rowClassName={(row) =>
            row?.inactive
              ? 'bg-gray-50 opacity-50'
              : ''
          }
          filter={{
            enabled: true,
            render: ({ visibleColumns, flatColumns }) => <Filter value={query.filter} onChange={(nextFilter) => setQuery(prev => ({
              ...prev,
              filter: nextFilter,
              page: 1, // Optional: reset page on filter change
            }
            ))}
              visibleColumns={visibleColumns}
              flatColumns={flatColumns}
            />,
            onFilterChange: (nextFilter) => {
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
              <SummaryModal
                title="Representative Summary"
                data={row}
                onClose={onClose}
                onSuccess={(message: string) => {
                  setSuccessMessage(message);
                  fetchRepresentatives();
                }}
                onDelete={handleDeleteRepresentative}
                isDeleting={isDeleting}
                error={error}
              />
            )
          }}
          expandable={{ enabled: true }}
          fetchAllData={async () => getRepresentativeList({ include_inactive: true })}
          renderRightButtons={() => (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
              >
                <PlusIcon className="h-5 w-5" />
                Create
              </button>
            </div>
          )}
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
            No Representatives available.
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMessage('Representative created successfully');
            fetchRepresentatives();
            setShowCreateModal(false);
          }}
        />

        {/* Pagination - only show when we have data */}
        {data && data.length > 0 && (
          <Pagination
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