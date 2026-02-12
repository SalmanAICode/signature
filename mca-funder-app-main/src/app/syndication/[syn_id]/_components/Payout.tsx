'use client';

import { useState, useEffect } from 'react';
import { GenericList } from '@/components/GenericList/GenericList';
import Pagination from '@/components/Pagination';
import { columns } from '../_config/columnConfig';
import type { Payout, GetPayoutListParams } from '@/types/payout';
import { getPayoutList } from '@/lib/api/payouts';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PayoutProps {
  syndicationId?: string;
  data?: Payout;
}

export default function Payout({ syndicationId, data }: PayoutProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    limit: 100,
  });
  const [params, setParams] = useState<GetPayoutListParams>({
    sortBy: 'created_date',
    sortOrder: 'desc',
    include_inactive: true,
  });

  // For single payout display
  useEffect(() => {
    if (data) {
      setPayouts([data]);
      setLoading(false);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        limit: 10,
      });
      return;
    }
  }, [data]);

  // Fetch payouts list
  useEffect(() => {
    if (data || !syndicationId) return;

    setLoading(true);
    setError(null);

    getPayoutList({
      ...params,
      syndication: syndicationId,
    })
      .then((response) => {
        setPayouts(response);
        // Since API doesn't return pagination info, calculate it
        const totalResults = response.length;
        const totalPages = Math.ceil(totalResults / pagination.limit);
        setPagination(prev => ({
          ...prev,
          totalResults,
          totalPages,
        }));
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch payouts');
        setPayouts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [syndicationId, data, params, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (nextFilter: Partial<GetPayoutListParams>) => {
    setParams(prev => ({
      ...prev,
      ...nextFilter,
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      currentPage: 1,
    }));
  };

  // Create query structure for GenericList
  const currentQuery = {
    filter: {
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      include_inactive: params.include_inactive,
      syndication: params.syndication,
    },
    page: pagination.currentPage,
    limit: pagination.limit,
  };

  // Calculate paginated data for display
  const startIndex = (pagination.currentPage - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const displayPayouts = payouts.slice(startIndex, endIndex);

  if (!syndicationId && !data) {
    return (
      <div className="w-full p-8 text-center text-gray-400">
        No syndication ID or data provided
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='w-full border-gray-100 rounded-xl p-4 bg-gray-50'>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
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
      </div>
    );
  }

  // Empty state when no payouts
  if (!loading && payouts.length === 0) {
    return (
      <div className='w-full border-gray-100 rounded-xl p-4 bg-gray-50'>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts found</h3>
          <p className="text-gray-500">
            {syndicationId ? 'This syndication has no payout records.' : 'No payout data available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full border-gray-100 rounded-xl p-4 bg-gray-50'>
      <div className="relative">
        {/* Loading overlay mask - only for data refresh when payouts exist */}
        {loading && payouts && payouts.length > 0 && (
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

        {/* Loading state - initial load */}
        {loading && !payouts.length && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading payouts...</span>
            </div>
          </div>
        )}
        
        {/* GenericList - only show when there is data */}
        {(!loading || (loading && payouts.length > 0)) && payouts.length > 0 && (
          <GenericList
            title="Payouts"
            data={displayPayouts || []}
            columns={columns}
            storage={{
              orderingKey: 'payout_order',
              visibilityKey: 'payout_visibility', 
              columnWidthsKey: 'payout_column_widths',
            }}
            currentQuery={currentQuery}
            filter={{
              enabled: false,
              render: () => null,
              onFilterChange: () => {},
            }}
            expandable={{ enabled: true }}
            fetchAllData={async () => payouts || []}
          />
        )}

        {/* Pagination - only show if there are multiple pages */}
        {(!loading || (loading && payouts.length > 0)) && pagination && pagination.totalResults > pagination.limit && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalResults={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>
    </div>
  );
}
