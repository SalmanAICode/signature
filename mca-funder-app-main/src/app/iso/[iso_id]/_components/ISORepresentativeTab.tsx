'use client';

import { useState, useEffect, useCallback } from 'react';
import { Representative } from '@/types/representative';
import { getISORepresentatives } from '@/lib/api/isoRepresentatives';
import { SimpleList } from '@/components/SimpleList';
import RepresentativeDetailModal from './ISORepresentativeTab/RepresentativeDetailModal';
import { toast } from 'react-hot-toast';
import { columnConfig } from './ISORepresentativeTab/columnConfig';

interface ISORepresentativeTabProps {
  isoId: string;
}

export default function ISORepresentativeTab({ isoId }: ISORepresentativeTabProps) {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc');

  const fetchRepresentatives = useCallback(async (page: number = 1, search: string = '', sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' | null = 'desc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await getISORepresentatives({ 
        iso_id: isoId, 
        page, 
        limit, 
        search, 
        sortBy, 
        sortOrder 
      });
      setRepresentatives(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
      setCurrentPage(response.pagination?.page || 1);
      setLimit(response.pagination?.limit || 10);
    } catch (err) {
      console.error('Error fetching representatives:', err);
      setError('Failed to load representatives');
      setRepresentatives([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [isoId, limit]);

  useEffect(() => {
    fetchRepresentatives(currentPage, searchQuery, sortField, sortOrder);
  }, [fetchRepresentatives, currentPage, searchQuery, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (field: string, order: 'asc' | 'desc' | null) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRepresentative(null);
  };

  const renderActions = (representative: Representative) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedRepresentative(representative);
          setShowDetailModal(true);
        }}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Details
      </button>
    </div>
  );

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      {/* Add Representative button could be added here */}
    </div>
  );

  return (
    <div className="w-full">
      <SimpleList
        data={representatives}
        columns={columnConfig}
        loading={loading}
        error={error}
        emptyMessage="No representatives found for this ISO"
        title="ISO Representatives"
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={searchQuery}
        initialSortBy="createdAt"
        initialSortOrder="desc"
        renderActions={renderActions}
        renderHeaderButtons={renderHeaderButtons}
        pagination={{
          currentPage,
          totalPages,
          totalResults,
          limit,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange
        }}
      />

      {/* Representative Detail Modal */}
      {showDetailModal && selectedRepresentative && (
        <RepresentativeDetailModal
          representative={selectedRepresentative}
          isOpen={showDetailModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 