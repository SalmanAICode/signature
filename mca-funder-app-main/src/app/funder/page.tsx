'use client';

import { useState, useEffect } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { Funder } from '@/types/funder';
import { getFunders, deleteFunder } from '@/lib/api/funders';
import { columns } from './_config/columnConfig';
import Filter from './_components/Filter';
import FunderDetailModal from './_components/FunderDetailModal';
import { Pagination as PaginationType } from '@/types/pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import { usePermissions } from '@/hooks/usePermissions';
import DeleteModal from '@/components/DeleteModal';
import DashboardShell from '@/components/DashboardShell';
import FunderForm from './_components/FunderForm';

export type FilterState = {
  include_inactive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
};

const ORDERING_KEY = 'funder_list_order';
const VISIBILITY_KEY = 'funder_list_visibility';
const COLUMN_WIDTHS_KEY = 'funder_list_column_widths';

export default function Page() {
  const [data, setData] = useState<Funder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFunder, setEditingFunder] = useState<Funder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; funderId: string | null}>({ show: false, funderId: null });
  const [loadingState, setLoadingState] = useState<string | null>(null);

  const { accessToken, user: authUser } = useAuthStore();
  const { canCreate: canCreateFunder, canUpdate: canUpdateFunder, canDelete: canDeleteFunder } = usePermissions({ 
    currentUser: authUser,
    resource: 'USER_FUNDER' 
  });

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: '',
      sortOrder: 'asc',
      search: '',
    },
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchFunders();
  }, [query]);

  const fetchFunders = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFunders(
        query.page,
        query.limit,
        {
          includeInactive: query.filter.include_inactive,
          search: query.filter.search || '',
          sortBy: query.filter.sortBy,
          sortOrder: query.filter.sortOrder,
        }
      );

      setData(result.data.docs);
      setPaginatedData(result.data.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch Funders'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    setShowForm(false);
    setEditingFunder(null);
    await fetchFunders();
  };

  const handleDeleteSuccess = async () => {
    let page = paginatedData?.page || 1;
    const newTotal = (paginatedData?.totalResults || 0) - 1;
    const lastPage = Math.max(1, Math.ceil(newTotal / query.limit));
    if (page > lastPage) page = lastPage;
    await fetchFunders();
  };

  const handleDeleteFunder = async (funderId: string) => {
    if (!accessToken) return;
    try {
      setLoadingState(funderId);
      const response = await deleteFunder(funderId);
      if (response.success) {
        handleDeleteSuccess();
        setDeleteConfirm({ show: false, funderId: null });
      } else {
        const errorMessage = response.statusCode === 403 
          ? "You don't have permission to delete this funder. Please contact your administrator."
          : (response.message || 'Failed to delete funder');
        setError(errorMessage);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to delete funder';
      if (err.message?.includes('permission') || err.message?.includes('403')) {
        errorMessage = "You don't have permission to delete this funder. Please contact your administrator.";
      } else {
        errorMessage = err.message || 'Failed to delete funder. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoadingState(null);
    }
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Funders</h1>
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

        <GenericList
          title="Funders"
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
              page: 1,
            }))}
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
            render: (row, onClose) => <FunderDetailModal
              funder={row}
              onClose={onClose}
            />
          }}
          expandable={{ enabled: true }}
          fetchAllData={async () => {
            const response = await getFunders(
              1,
              1000,
              {
                includeInactive: false,
                sortBy: '',
                sortOrder: 'asc',
                search: '',
              }
            );
            return response.data.docs;
          }}
          renderRightButtons={() => (
            <div className="flex gap-2">
              {(canCreateFunder || authUser?.type === 'funder_manager') && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
                  disabled={loading}
                >
                  <PlusIcon className="h-5 w-5" />
                  Create
                </button>
              )}
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
            No Funders available.
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

        <DeleteModal
          isOpen={deleteConfirm.show}
          title="Delete Funder"
          message="Are you sure you want to delete this funder? This action cannot be undone."
          onConfirm={() => deleteConfirm.funderId && handleDeleteFunder(deleteConfirm.funderId)}
          onCancel={() => setDeleteConfirm({ show: false, funderId: null })}
          isLoading={loadingState === deleteConfirm.funderId}
        />

        {showForm && (
          <FunderForm
            initialData={editingFunder}
            onSuccess={handleSuccess}
            onUpdateSuccess={() => fetchFunders()}
            onCancel={() => {
              setShowForm(false);
              setEditingFunder(null);
            }}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
}