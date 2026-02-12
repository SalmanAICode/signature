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

import { Funder } from "@/types/funder";
import { ISO } from '@/types/iso';


// import { getFunderById } from '@/lib/api/funder'; 
import { columns } from './_config/columnConfig';
import { Pagination as PaginationType } from '@/types/pagination';
import { getISOList, getISOs, deleteISO, createISO, updateISO } from '@/lib/api/isos';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/lib/store/auth';


export type FilterState = {
  include_inactive: boolean;
  funder: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
  funder_id: string;
};

const ORDERING_KEY = 'funder_iso_order';
const VISIBILITY_KEY = 'funder_iso_visibility';
const COLUMN_WIDTHS_KEY = 'funder_iso_column_widths';


export default function Page() {

  const [data, setData] = useState<ISO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

  const [funderOptions, setFunderOptions] = useState<Funder[]>([]);

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
      funder: [],
      sortBy: '',
      sortOrder: 'asc',
      funder_id: "",
      search: '',
    },
    page: 1,
    limit: 10,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // fetch the data from the server when the pagination or filter changes
  const fetchISOs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getISOs({ 
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search || '',
      });

      setData(response.data);
      setPaginatedData(response.pagination);
    } catch (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : 'Failed to fetch ISOs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query, currentFunderId]);

  // Clear messages when query changes
  useEffect(() => {
    fetchISOs();
  }, [fetchISOs]);

  const handleCreateISO = async (isoData: any) => {
    try {
      // Clean the data by removing empty fields, including nested objects
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) return undefined;
        
        if (Array.isArray(obj)) {
          const cleanedArray = obj.map(cleanObject).filter(item => item !== undefined);
          return cleanedArray.length > 0 ? cleanedArray : undefined;
        }
        
        if (typeof obj === 'object') {
          const cleaned: any = {};
          let hasNonEmptyFields = false;
          
          Object.entries(obj).forEach(([key, value]) => {
            const cleanedValue = cleanObject(value);
            if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
              cleaned[key] = cleanedValue;
              hasNonEmptyFields = true;
            }
          });
          
          return hasNonEmptyFields ? cleaned : undefined;
        }
        
        return obj !== '' ? obj : undefined;
      };
      
      const cleanedData = cleanObject(isoData);

      console.log("cleanedData", cleanedData);
      
      const newISO = await createISO(cleanedData);
      toast.success('ISO created successfully');
      
      // Update local state
      setData(prevData => {
        if (!prevData) return [newISO];
        return [newISO, ...prevData];
      });
      
      // Update pagination info
      setPaginatedData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalResults: prev.totalResults + 1,
          totalPages: Math.ceil((prev.totalResults + 1) / query.limit)
        };
      });
      
      setShowCreateModal(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create ISO. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const handleUpdateISO = async (isoId: string, updateData: any) => {
    try {
      // Clean the data by removing empty fields
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      // Create a proper ISO object with the required id field
      const isoUpdateData = {
        ...cleanedData,
        id: isoId
      } as ISO;
      
      const updatedISO = await updateISO(isoUpdateData);
      toast.success('ISO updated successfully');
      
      // Update local state
      setData(prevData => {
        if (!prevData) return [updatedISO];
        return prevData.map(item => item._id === updatedISO._id ? updatedISO : item);
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update ISO. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const handleDeleteISO = async (isoId: string) => {
    try {
      await deleteISO(isoId);
      toast.success('ISO deleted successfully');
      
      // Update local state first
      setData(prevData => {
        if (!prevData) return [];
        const newData = prevData.filter(item => item._id !== isoId);
        
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
        : 'Failed to delete ISO, please try again.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateData = (id: string, newData: ISO) => {
    setData(prevData => {
      if (!prevData) return [newData];
      return prevData.map(item => item._id === id ? newData : item);
    });
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ISOs</h1>
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
          title="ISOs"
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
            render: (row, onClose) => <SummaryModal
              title="ISO Summary"
              data={row}
              onClose={onClose}
              iso_id={query.filter.funder_id || ''}
              funder_name={funder?.name || ''}
              funder_id={query.filter.funder_id || ''}
              onSuccess={() => {
                fetchISOs();
              }}
              onUpdate={handleUpdateISO}
              onDelete={handleDeleteISO}
              isDeleting={false}
            />
          }}
          expandable={{ enabled: true, }}
          fetchAllData={async () => {
            const response = await getISOList();
            return response;
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
            No Funder ISOs available.
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateISO}
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