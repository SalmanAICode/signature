'use client';

import { useState, useEffect } from 'react';
import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import { Merchant } from '@/types/merchant';
import { getMerchants } from '@/lib/api/merchants';
import { Pagination as PaginationType } from '@/types/pagination';
import { columns } from './_config/columnConfig';
import { SummaryModal } from './_components/SummaryModal';
import Filter, { FilterState } from './_components/Filter';
import { ColumnConfig } from '@/components/GenericList/types';
import DashboardShell from '@/components/DashboardShell';

const ORDERING_KEY = 'merchant_order';
const VISIBILITY_KEY = 'merchant_visibility';
const COLUMN_WIDTHS_KEY = 'merchant_column_widths';

export default function Page() {
  const [data, setData] = useState<Merchant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    fetchMerchants();
  }, [query]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMerchants({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_inactive: query.filter.include_inactive,
        search: query.filter.search || '',
      });

      setData(result.data);
      setPaginatedData(result.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Failed to fetch Merchants'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantClick = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedMerchant(null);
  };

  const handleLimitChange = (newLimit: number) => {
    setQuery(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Merchants</h1>
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
          title="Merchants"
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
                onChange={(nextFilter) => setQuery(prev => ({
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
          fetchAllData={async () => {
            const result = await getMerchants({
              sortBy: query.filter.sortBy,
              sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
              page: 1,
              limit: 1000,
              include_inactive: query.filter.include_inactive,
              search: query.filter.search || '',
            });
            return result.data;
          }}
          rowModal={{
            enabled: true,
            render: (merchant, onClose) => (
              <SummaryModal
                merchant={merchant}
                isOpen={true}
                onClose={onClose}
              />
            ),
          }}
          expandable={{ enabled: true }}
        />

        {paginatedData && (
          <div className="mt-4">
            <Pagination
              currentPage={query.page}
              totalPages={paginatedData.totalPages}
              totalResults={paginatedData.totalResults}
              limit={query.limit}
              onPageChange={(page) => setQuery(prev => ({ ...prev, page }))}
              onLimitChange={handleLimitChange}
            />
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  );
} 