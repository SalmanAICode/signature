'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { Lender } from '@/types/lender';
import { getLenders, deleteLender, updateLender } from '@/lib/api/lenders';
import { columns } from './_config/columnConfig';
import { SummaryModal } from './_components/SummaryModal';
import { CreateModal } from './_components/CreateModal';
import Filter from './_components/Filter';
import { Pagination as PaginationType } from '@/types/pagination';
import DashboardShell from '@/components/DashboardShell';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/lib/store/auth';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'lender_list_order';
const VISIBILITY_KEY = 'lender_list_visibility';
const COLUMN_WIDTHS_KEY = 'lender_list_column_widths';

export default function Page() {
  const [data, setData] = useState<Lender[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLender, setEditingLender] = useState<Lender | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; lenderId: string | null}>({ show: false, lenderId: null });
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const router = useRouter();
  const prevFunderIdRef = useRef<string | undefined>(undefined);

  // For summary modal
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get current user's funder from auth store
  const { funder } = useAuthStore();
  const currentFunderId = funder?._id;

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

  // Watch for funder changes and refresh the list
  useEffect(() => {
    const prevFunderId = prevFunderIdRef.current;
    
    // If funder changed, refresh the list
    if (prevFunderId !== currentFunderId) {
      console.log('Funder changed, refreshing lender list');
      fetchLenders();
    }
    
    // Update the ref for next comparison
    prevFunderIdRef.current = currentFunderId;
  }, [currentFunderId]);

  useEffect(() => {
    fetchLenders();
  }, [query]);

  const fetchLenders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLenders({
        page: query.page,
        limit: query.limit,
        search: query.filter.search || '',
        sortBy: query.filter.sortBy || undefined,
        sortOrder: query.filter.sortOrder || undefined,
        include_inactive: query.filter.include_inactive,
      });
      setData(result.data);
      setPaginatedData(result.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch Lenders'
      );
    } finally {
      setLoading(false);
    }
  }, [query, currentFunderId]);

  // Handler for updating a lender
  const handleUpdateLender = async (values: Partial<Lender>) => {
    try {
      const newData = await updateLender(values._id!, values);
      toast.success('Lender updated successfully');
      setData(prevData => {
        if (!prevData) return [newData];
        return prevData.map(item => item._id === newData._id ? newData : item);
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update lender. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Handler for deleting a lender
  const handleDeleteLender = async (lenderId: string, onClose?: () => void) => {
    try {
      await deleteLender(lenderId);
      toast.success('Lender deleted successfully');
      
      // Update local state first
      setData(prevData => {
        if (!prevData) return [];
        const newData = prevData.filter(item => item._id !== lenderId);
        
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

      // Close the modal after successful deletion
      if (onClose) {
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete lender, please try again.';
      toast.error(errorMessage);
    }
  };

  // Handler for creating a lender
  const handleCreateLender = (lender: Lender) => {
    setData(prevData => prevData ? [lender, ...prevData] : [lender]);
    setPaginatedData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        totalResults: prev.totalResults + 1,
        totalPages: Math.ceil((prev.totalResults + 1) / query.limit)
      };
    });
    setShowCreateModal(false);
  };

  return (
    <DashboardShell>
      <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Lenders</h1>
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

          <GenericList
            title="Lenders"
            data={data || []}
            columns={columns}
            storage={{
              orderingKey: ORDERING_KEY,
              visibilityKey: VISIBILITY_KEY,
              columnWidthsKey: COLUMN_WIDTHS_KEY,
            }}
            currentQuery={query}
            filter={{
              enabled: true,
              render: ({ visibleColumns, flatColumns }) => (
                <Filter 
                  value={query.filter} 
                  onChange={(nextFilter) => setQuery(prev => ({
                    ...prev,
                    filter: nextFilter,
                    page: 1, // Reset page on filter change
                  }))}
                  visibleColumns={visibleColumns}
                  flatColumns={flatColumns}
                />
              ),
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
                  title="Lender Summary"
                  data={row}
                  onClose={onClose}
                  onUpdate={handleUpdateLender}
                  onDelete={(lenderId) => handleDeleteLender(lenderId, onClose)}
                  error={error}
                />
              )
            }}
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
              No Lenders available.
            </div>
          )}

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

        {/* Create Lender Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateLender}
        />
      </div>
    </DashboardShell>
  );
}