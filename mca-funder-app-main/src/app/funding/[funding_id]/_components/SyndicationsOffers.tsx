import React, { useState, useEffect, useCallback } from 'react';
import { GenericList } from '@/components/GenericList/GenericList';
import Pagination from '@/components/Pagination';
import { DetailModal } from '@/app/syndication-offer/_components/DetailModal';
import Filter, { FilterState } from '@/app/syndication-offer/_components/Filter';
import { columns, defaultSort } from '@/app/syndication-offer/_config/columnConfig';
import { getSyndicationOffers, deleteSyndicationOffer } from '@/lib/api/sydicationOffers';
import { SyndicationOffer } from '@/types/syndicationOffer';
import { Pagination as PaginationType } from '@/types/pagination';
import { CreateModal as SyndicationCreateModalContent } from '@/app/syndication-offer/_components/CreateModal';
import { PlusIcon } from '@heroicons/react/24/outline';

interface SyndicationsOffersProps {
  fundingId: string;
}

export default function SyndicationsOffers({ fundingId }: SyndicationsOffersProps) {
  const [data, setData] = useState<SyndicationOffer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [showDetail, setShowDetail] = useState<{ open: boolean; row: SyndicationOffer | null }>({ open: false, row: null });
  const [showCreateModal, setShowCreateModal] = useState(false);


  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_inactive: false,
      sortBy: defaultSort.sortBy,
      sortOrder: defaultSort.sortOrder,
      syndicator: null,
      funder: null,
      funding: fundingId, // Always filter by fundingId
      status: null,
    },
    page: 1,
    limit: 10,
  });

  // Sync fundingId to filter when it changes
  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      filter: { ...prev.filter, funding: fundingId },
      page: 1,
    }));
  }, [fundingId]);

  // Fetch syndication offers based on current query
  const fetchSyndicationOffers = useCallback(() => {
    setLoading(true);
    setError(null);
    
    getSyndicationOffers({
      sortBy: query.filter.sortBy,
      sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
      page: query.page,
      limit: query.limit,
      include_inactive: query.filter.include_inactive,
      syndicator: query.filter.syndicator || undefined,
      funder: query.filter.funder || undefined,
      funding: fundingId, // Always filter by fundingId
      status: query.filter.status || undefined,
    })
    .then((response) => {
      setData(response.data);
      setPaginatedData(response.pagination);
    })
    .catch((error) => {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Error).message)
          : 'Failed to fetch Syndication Offers'
      );
      setSuccessMessage(null);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [query, fundingId]);

  // Fetch data on mount and when query changes
  useEffect(() => {
    setSuccessMessage(null);
    setError(null);
    fetchSyndicationOffers();
  }, [fetchSyndicationOffers]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle delete action
  const handleDeleteSyndicationOffer = (id: string): Promise<void> => {
    setIsDeleting(true);
    setSuccessMessage(null);
    
    return deleteSyndicationOffer(id)
    .then(() => {
      setSuccessMessage('Syndication offer deleted successfully');
      fetchSyndicationOffers();
    })
    .catch((err) => {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete syndication offer. Please check your connection and try again.';
      throw new Error(errorMessage);
    })
    .finally(() => {
      setIsDeleting(false);
    });
  };

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
        {/* Loading overlay mask */}
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
        {/* Empty state */}
        {!loading && data && data.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No syndication offers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No syndication offers have been created for this funding yet.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2196F3] hover:bg-[#1769AA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create Syndication Offer
              </button>
            </div>
          </div>
        )}

        {/* GenericList - only show when there is data */}
        {(!loading && data && data.length > 0) && (
          <GenericList
            title="Syndication Offers"
            data={data || []}
            columns={columns}
            storage={{
              orderingKey: 'syndication_offer_order',
              visibilityKey: 'syndication_offer_visibility',
              columnWidthsKey: 'syndication_offer_column_widths',
            }}
            currentQuery={query}
            rowClassName={(row) =>
              row?.inactive ? 'bg-gray-50 opacity-50' : ''
            }
            filter={{
              enabled: true,
              render: ({ visibleColumns, flatColumns }) => (
                <Filter
                  value={query.filter}
                  onChange={(nextFilter: FilterState) => setQuery(prev => ({
                    ...prev,
                    filter: { ...prev.filter, ...nextFilter, funding: fundingId },
                    page: 1,
                  }))}
                  visibleColumns={visibleColumns}
                  flatColumns={flatColumns}
                />
              ),
              onFilterChange: (nextFilter) => {
                setQuery((prev) => ({
                  ...prev,
                  filter: { ...prev.filter, ...nextFilter, funding: fundingId },
                  page: 1,
                }));
              },
            }}
            onRowClick={(row) => setShowDetail({ open: true, row })}
            expandable={{ enabled: true }}
            fetchAllData={async () => []}
            renderRightButtons={renderCreateButton}
          />
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading syndication offers...</span>
            </div>
          </div>
        )}
        <SyndicationCreateModalContent
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMessage('Syndication offer created successfully');
            fetchSyndicationOffers();
            setShowCreateModal(false);
          }}
          initialFundingId={fundingId}
        />
        {paginatedData && paginatedData.totalResults > 0 && (
          <Pagination
            currentPage={query.page}
            totalPages={paginatedData.totalPages}
            totalResults={paginatedData.totalResults}
            limit={query.limit}
            onPageChange={(newPage) => setQuery((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setQuery((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
        {/* Detail modal */}
        {showDetail.open && showDetail.row && (
          <DetailModal
            title="Syndication Offer Summary"
            data={showDetail.row}
            onClose={() => setShowDetail({ open: false, row: null })}
            onSuccess={() => fetchSyndicationOffers()}
            onDelete={handleDeleteSyndicationOffer}
            isDeleting={isDeleting}
            error={error}
            informationPath={`/syndication-offer`}
          />
        )}
      </div>
    </div>
  );
} 