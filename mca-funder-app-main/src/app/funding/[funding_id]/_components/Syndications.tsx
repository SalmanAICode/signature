import React, { useState, useEffect } from 'react';
import { GenericList } from '@/components/GenericList/GenericList';
import Pagination from '@/components/Pagination';
import { SyndicationSummaryModalContent } from '@/app/syndication/_components/SummaryModal';
import Filter from '@/app/syndication/_components/Filter';
import { columns } from '@/app/syndication/_config/columnConfig';
import { Syndication, GetSyndicationParams } from '@/types/syndication';
import { SyndicationCreateModalContent } from '@/app/syndication/_components/CreateModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import useModalStore, { OpenModalInput } from '@/lib/store/modal';
import useSyndicationStore from '@/lib/store/syndication';

type SyndicationsProps = {
  fundingId?: string;
};

export default function Syndications({ fundingId }: SyndicationsProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openModal = useModalStore(state => state.openModal);
  const syndications = useSyndicationStore(state => state.syndications);
  const pagination = useSyndicationStore(state => state.pagination);
  const loading = useSyndicationStore(state => state.loading);
  const creating = useSyndicationStore(state => state.creating);
  const error = useSyndicationStore(state => state.error);
  const storeParams = useSyndicationStore(state => state.params);
  const setParams = useSyndicationStore(state => state.setParams);
  const resetStore = useSyndicationStore(state => state.resetStore);
  const clearError = useSyndicationStore(state => state.clearError);
  // Monitor creating state to detect successful creation
  const [wasCreating, setWasCreating] = useState(false);

  // Helper function to ensure funding is always set to fundingId
  const setParamsWithFunding = (newParams: Partial<GetSyndicationParams>) => {
    setParams({
      ...newParams,
      funding: fundingId, // Always ensure funding is set to current fundingId
    });
  };

  // Create query structure for GenericList (simplified like page.tsx)
  const currentQuery = {
    filter: {
      sortBy: storeParams.sortBy,
      sortOrder: storeParams.sortOrder,
      include_inactive: storeParams.include_inactive,
      funding: storeParams.funding,
    },
    page: storeParams.page || 1,
    limit: storeParams.limit || 10,
  };

  // Reset store and set initial params when entering this component
  useEffect(() => {
    if (fundingId) {
      // First reset the store
      resetStore();
      
      // Then set initial params with fundingId
      setParamsWithFunding({
        sortBy: 'start_date',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
        include_inactive: true,
      });
    }

    // Cleanup function - reset store params when leaving
    return () => {
      resetStore();
    };
  }, [fundingId, setParams, resetStore]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Monitor creating state to detect successful creation
  useEffect(() => {
    if (wasCreating && !creating && !error) {
      // Creation was successful
      setSuccessMessage('Syndication created successfully');
    }
    setWasCreating(creating);
  }, [creating, error, wasCreating]);

  const handleFilterChange = (nextFilter: Partial<GetSyndicationParams>) => {
    setParamsWithFunding({
      ...storeParams,
      ...nextFilter,
      page: 1, // Reset to first page when filter changes
    });
  };

  const handlePageChange = (newPage: number) => {
    setParamsWithFunding({ 
      ...storeParams, 
      page: newPage 
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setParamsWithFunding({ 
      ...storeParams, 
      limit: newLimit, 
      page: 1 
    });
  };

  const renderCreateButton = () => (
    <div className="flex gap-2">
      <button
        onClick={() => {
          openModal({
            key: 'create-syndication',
            title: 'Create Syndication',
            component: SyndicationCreateModalContent,
            data: { initialFundingId: fundingId },
          } as OpenModalInput);
        }}
        className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
      >
        <PlusIcon className="h-5 w-5" />
        Create
      </button>
    </div>
  );

  const handleRowClick = (row: Syndication) => {
    const syndicationName = row._id || 'Unknown';
    const syndicationId = row._id || '';
    
    openModal({
      key: `syndication-detail-${syndicationId}`,
      title: `Syndication Summary`,
      component: SyndicationSummaryModalContent,
      data: row,
    } as OpenModalInput);
  };

  if (!fundingId) {
    return <div className="w-full p-8 text-center text-gray-400">No funding ID provided</div>;
  }

  return (
    <div className='w-full border-gray-100 rounded-xl p-4 bg-gray-50'>
      {/* Success message banner */}
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
      {/* Error message banner */}
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
      <div className="relative">
        {/* Loading overlay mask */}
        {loading && syndications && syndications.length > 0 && (
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
        {/* Empty state */}
        {!loading && syndications && syndications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No syndications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No syndications have been created for this funding yet.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  openModal({
                    key: 'create-syndication',
                    title: 'Create Syndication',
                    component: SyndicationCreateModalContent,
                    data: { initialFundingId: fundingId },
                  } as OpenModalInput);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2196F3] hover:bg-[#1769AA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create Syndication
              </button>
            </div>
          </div>
        )}

        {/* GenericList - only show when there is data */}
        {(!loading && syndications && syndications.length > 0) && (
          <GenericList
            title="Syndications"
            data={syndications || []}
            columns={columns}
            storage={{
              orderingKey: 'syndication_order',
              visibilityKey: 'syndication_visibility',
              columnWidthsKey: 'syndication_column_widths',
            }}
            currentQuery={currentQuery}
            filter={{
              enabled: true,
              render: ({ visibleColumns, flatColumns }) => (
                <Filter
                  value={storeParams}
                  onChange={handleFilterChange}
                  visibleColumns={visibleColumns}
                  flatColumns={flatColumns}
                />
              ),
              onFilterChange: handleFilterChange,
            }}
            onRowClick={handleRowClick}
            expandable={{ enabled: true }}
            fetchAllData={async () => []}
            renderRightButtons={renderCreateButton}
          />
        )}

        {/* Loading state */}
        {loading && !syndications && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading syndications...</span>
            </div>
          </div>
        )}
        {/* Create Modal - handled by global modal system */}
        {/* Pagination */}
        {pagination && pagination.totalResults > 0 && (
          <Pagination
            currentPage={currentQuery.page || 1}
            totalPages={pagination.totalPages}
            totalResults={pagination.totalResults}
            limit={currentQuery.limit || 10}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>
    </div>
  );
} 