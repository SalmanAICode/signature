'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

// Components
import { GenericList } from "@/components/GenericList/GenericList";
import PaginationComponent from "@/components/Pagination";
import useModalStore, { OpenModalInput } from '@/lib/store/modal';
import { SyndicationSummaryModalContent } from './_components/SummaryModal';
import { SyndicationCreateModalContent } from './_components/CreateModal';
import Filter from './_components/Filter';
import { Syndication } from '@/types/syndication';
import DashboardShell from '@/components/DashboardShell';

// Types and Configuration
import { GetSyndicationParams } from '@/types/syndication';
import { columns } from './_config/columnConfig';

// Store and API
import useSyndicationStore from '@/lib/store/syndication';
import { getSyndicationList } from '@/lib/api/syndications';

import { toast } from 'react-hot-toast';

// ========================================
// Types and Constants
// ========================================

// Local storage keys for GenericList configuration
const STORAGE_KEYS = {
  ORDERING: 'syndication_order',
  VISIBILITY: 'syndication_visibility',
  COLUMN_WIDTHS: 'syndication_column_widths',
} as const;

// Column width ratio configuration (total should be around 100)
const COLUMN_WIDTHS_KEY = 'syndication_column_widths';
const COLUMN_WIDTH_RATIOS = {
  funder: 9,
  lender: 9,
  syndicator: 10,
  participate_amount: 5,
  participate_percent: 8,
  payback_amount: 10,
  payout_amount: 10,
  factor_rate: 8,
  buy_rate: 8,
  start_date: 15,
  status: 10,
};

// ========================================
// Main Component
// ========================================

export default function SyndicationPage() {
  // ========================================
  // Store Integration (Zustand) - Selector mode for better performance
  // ========================================
  
  // Data selectors
  const syndications = useSyndicationStore(state => state.syndications);
  const pagination = useSyndicationStore(state => state.pagination);
  const storeParams = useSyndicationStore(state => state.params);
  
  // Loading state selectors
  const loading = useSyndicationStore(state => state.loading);
  const error = useSyndicationStore(state => state.error);
  
  // Action selectors
  const setParams = useSyndicationStore(state => state.setParams);
  const fetchSyndications = useSyndicationStore(state => state.fetchSyndications);

  // ========================================
  // Local State (UI-only)
  // ========================================
  
  // Global modal hook
  const openModal = useModalStore(state => state.openModal);

  // ========================================
  // Effects
  // ========================================

  // Optional: Refresh data when entering the page (if data is stale or empty)
  useEffect(() => {
      fetchSyndications();
  }, [fetchSyndications]);

  // Error handling with toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000
      });
    }
  }, [error]);

  // ========================================
  // Event Handlers
  // ========================================

  // Create Modal handlers
  const handleCreateSyndication = () => {
    openModal({
        key: 'create-Syndication',
        title: 'Create Syndication',
        component: SyndicationCreateModalContent
      } as OpenModalInput);
  };

  // Filter and pagination handlers
  const handleFilterChange = (nextFilter: Partial<GetSyndicationParams>) => {
    setParams({
      ...storeParams,
      ...nextFilter,
      page: 1, // Reset to first page when filter changes
    });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ ...storeParams, page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setParams({ ...storeParams, limit: newLimit });
  };

  // ========================================
  // Render Helpers
  // ========================================

  const renderLoadingOverlay = () => {
    if (!loading || syndications === null || syndications.length === 0) return null;

    return (
      <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center z-10 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  };

  const renderInitialLoading = () => {
    if (!loading || syndications !== null) return null;

    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (loading || syndications === null || syndications.length > 0) return null;

    return (
      <div className="text-center py-8 text-gray-500">
        No Syndications available.
      </div>
    );
  };

  const renderCreateButton = () => (
    <div className="flex gap-2">
      <button
        onClick={handleCreateSyndication}
        className="px-3 py-1.5 rounded-md flex items-center gap-2 text-white bg-[#2196F3] hover:bg-[#1769AA] text-sm font-semibold shadow-sm transition"
      >
        <PlusIcon className="h-5 w-5" />
        Create
      </button>
    </div>
  );

  // ========================================
  // Main Render
  // ========================================
  
  // Prepare currentQuery for GenericList
  const currentQuery = {
    filter: {
      sortBy: storeParams.sortBy,
      sortOrder: storeParams.sortOrder,
      include_inactive: storeParams.include_inactive,
      // search: storeParams.search, // Commented out as API doesn't support search
    },
    page: storeParams.page || 1,
    limit: storeParams.limit || 10,
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [columnWidthsReady, setColumnWidthsReady] = useState(false);

  useLayoutEffect(() => {
    const setProportionalColumnWidths = () => {
      if (!tableContainerRef.current) return;
      const containerWidth = tableContainerRef.current.offsetWidth - 40;
      if (containerWidth <= 0) return;
      const calculatedWidths: Record<string, number> = {};
      Object.entries(COLUMN_WIDTH_RATIOS).forEach(([columnKey, ratio]) => {
        calculatedWidths[columnKey] = Math.floor((containerWidth * ratio) / 100);
      });
      const minWidth = 80;
      Object.keys(calculatedWidths).forEach(key => {
        if (calculatedWidths[key] < minWidth) {
          calculatedWidths[key] = minWidth;
        }
      });
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(calculatedWidths));
      setColumnWidthsReady(true);
    };
    const timer = setTimeout(setProportionalColumnWidths, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Syndications</h1>
      </div>

      {/* Main Content */}
      <div className="relative" ref={tableContainerRef}>
        {/* Loading Overlay */}
        {renderLoadingOverlay()}

        {/* Data Table */}
        {columnWidthsReady && (
          <GenericList
            title="Syndications"
            data={syndications || []}
            columns={columns}
            storage={{
              orderingKey: STORAGE_KEYS.ORDERING,
              visibilityKey: STORAGE_KEYS.VISIBILITY,
              columnWidthsKey: COLUMN_WIDTHS_KEY,
            }}
            currentQuery={currentQuery}
            rowClassName={(row) =>
              row?.inactive ? 'bg-gray-50 opacity-50' : ''
            }
            
            // Filter Configuration
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
            
            // Row Click Handler - Using Global Modal System
            onRowClick={(row: Syndication) => {
              // Create modal input and open modal
              const syndicationName = row._id || 'Unknown';
              const syndicationId = row._id || '';
              
              openModal({
                key: `Syndication-detail-${syndicationId}`,
                title: `Syndication Summary - ${syndicationName}`,
                component: SyndicationSummaryModalContent,
                data: row,
              } as OpenModalInput);
            }}
            
            // Other configurations
            expandable={{ enabled: true }}
            fetchAllData={async () => getSyndicationList({})}
            renderRightButtons={renderCreateButton}
          />
        )}

        {/* Loading States */}
        {renderInitialLoading()}
        {renderEmptyState()}

        {/* Pagination */}
        {syndications !== null && syndications.length > 0 && (
          <PaginationComponent
            currentPage={storeParams.page || 1}
            totalPages={pagination?.totalPages || 0}
            totalResults={pagination?.totalResults || 0}
            limit={storeParams.limit || 10}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
} 