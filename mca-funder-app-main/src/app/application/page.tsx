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

import { Application } from "@/types/application";
import { ApplicationUpdateFormValues } from './_components/ApplicationUpdateForm';

import { getApplications, getApplicationList, deleteApplication, updateApplication } from '@/lib/api/applications';
import { getApplicationStatusList } from '@/lib/api/applicationStatuses';
import useAuthStore from '@/lib/store/auth';

// import { getFunderById } from '@/lib/api/funder'; 
import { columns } from './_config/columnConfig';
import { Pagination as PaginationType } from '@/types/pagination';
import ApplicationOffersExpandedRow from './_components/ApplicationOffersExpandedRow';
import { toast } from 'react-hot-toast';


export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'application_order';
const VISIBILITY_KEY = 'application_visibility';
const COLUMN_WIDTHS_KEY = 'application_column_widths';


export default function Page() {

  const [data, setData] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [statusOptionsLoading, setStatusOptionsLoading] = useState(false);

  // Get current user's funder from auth store
  const { funder } = useAuthStore();
  const currentFunderId = funder?._id;

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: 'requested_data',
      sortOrder: 'desc',
      search: "",
    },
    page: 1,
    limit: 10,
  });

  // Load status options once for the current user's funder
  useEffect(() => {
    const loadStatusOptions = async () => {
      if (!currentFunderId) return;
      
      setStatusOptionsLoading(true);
      try {
        const statuses = await getApplicationStatusList(currentFunderId);
        setStatusOptions(statuses);
      } catch (error) {
        console.error('Failed to load status options:', error);
        setStatusOptions([]);
      } finally {
        setStatusOptionsLoading(false);
      }
    };

    loadStatusOptions();
  }, [currentFunderId]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getApplications({
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
          : 'Failed to fetch Applications'
      );
    } finally {
      setLoading(false);
    }
  }, [query, currentFunderId]);

  // Clear messages when query changes
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      await deleteApplication(applicationId);
      toast.success('Application deleted successfully');
      
      // Update local state first
      setData(prevData => {
        if (!prevData) return [];
        const newData = prevData.filter(item => item._id !== applicationId);
        
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
        : 'Failed to delete application, please try again.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateApplication = async (values: ApplicationUpdateFormValues) => {
    try {
      const updateParams = {
        name: values.name,
        type: values.type,
        assigned_user: values.assigned_user,
        assigned_manager: values.assigned_manager,
        priority: values.priority,
        internal: values.internal,
      };

      const newData = await updateApplication(values._id, updateParams);
      toast.success('Application updated successfully');
      setData(prevData => {
        if (!prevData) return [newData];
        return prevData.map(item => item._id === newData._id ? newData : item);
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update application. Please try again.';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };


  // needs refactoring
  const handleCreateOffer = async (message: string) => {
    try {
      toast.success(message);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create offer. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateData = (id: string, newData: Application) => {
    setData(prevData => {
      if (!prevData) return [newData];
      return prevData.map(item => item._id === id ? newData : item);
    });
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
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

        {/* Always show GenericList structure */}
        <GenericList
          title="Applications"
          data={data || []}
          columns={columns(handleUpdateData, statusOptions)}
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
                title="Application Summary"
                data={row}
                onClose={onClose}
                onUpdate={handleUpdateApplication}
                onDelete={handleDeleteApplication}
                onOfferCreate={handleCreateOffer}
                error={error}
              />
            )
          }}
          expandable={{ enabled: true, render: (row) => <ApplicationOffersExpandedRow application={row} /> }}
          fetchAllDatasPaginated={async (params) => getApplications({ 
            include_inactive: true, 
            page: params.page, 
            limit: params.limit 
          })}
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
            No Applications available.
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newApplication: Application) => {
            setData(prevData => {
              if (!prevData) return [newApplication];
              return [newApplication, ...prevData];
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