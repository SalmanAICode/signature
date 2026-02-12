'use client';

import { useState, useEffect, useCallback } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { DetailModal } from './_components/DetailModal';
import Filter, { FilterState } from './_components/Filter';
import { CreateModal } from './_components/CreateModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SyndicationOffer } from "@/types/syndicationOffer";
import { getSyndicationOffers, getSyndicationOfferList, deleteSyndicationOffer } from '@/lib/api/sydicationOffers';
import { columns, defaultSort } from './_config/columnConfig';
import { Pagination as PaginationType } from '@/types/pagination';
import DashboardShell from '@/components/DashboardShell';

const ORDERING_KEY = 'syndication_offer_order';
const VISIBILITY_KEY = 'syndication_offer_visibility';
const COLUMN_WIDTHS_KEY = 'syndication_offer_column_widths';

export default function Page() {
  const [data, setData] = useState<SyndicationOffer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);

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
      funding: null,
      status: null,
    },
    page: 1,
    limit: 10,
  });

  const fetchSyndicationOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSyndicationOffers({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        syndicator: query.filter.syndicator || undefined,
        funder: query.filter.funder || undefined,
        funding: query.filter.funding || undefined,
        status: query.filter.status || undefined,
      });

      setData(response.data);
      setPaginatedData(response.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Error).message)
          : 'Failed to fetch Syndication Offers'
      );
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setSuccessMessage(null);
    setError(null);
    fetchSyndicationOffers();
  }, [fetchSyndicationOffers]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDeleteSyndicationOffer = async (id: string) => {
    setIsDeleting(true);
    setSuccessMessage(null);
    try {
      await deleteSyndicationOffer(id);
      setSuccessMessage('Syndication offer deleted successfully');
      fetchSyndicationOffers();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete syndication offer. Please check your connection and try again.';
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Syndication Offers</h1>
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
        {/* Loading Overlay */}
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

        {/* Generic List */}
        <GenericList
          title="Syndication Offers"
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
            render: ({ visibleColumns, flatColumns }) => (
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
              <DetailModal
                title="Syndication Offer Summary"
                data={row}
                onClose={onClose}
                onSuccess={(message: string) => {
                  setSuccessMessage(message);
                  fetchSyndicationOffers();
                }}
                onDelete={handleDeleteSyndicationOffer}
                isDeleting={isDeleting}
                error={error}
              />
            )
          }}
          expandable={{ enabled: true }}
          fetchAllData={async () => getSyndicationOfferList({})}
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

        {/* Loading State */}
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

        {/* Empty State */}
        {!loading && data && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Syndication Offers available.
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMessage('Syndication offer created successfully');
            fetchSyndicationOffers();
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