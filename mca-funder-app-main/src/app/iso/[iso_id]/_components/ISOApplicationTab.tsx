'use client';

import { useState, useEffect, useCallback } from 'react';
import { Application } from '@/types/application';
import { getApplications } from '@/lib/api/applications';
import { SimpleList } from '@/components/SimpleList';
import ApplicationDetailModal from './ISOApplicationTab/ApplicationDetailModal';
import { toast } from 'react-hot-toast';
import { columnConfig } from './ISOApplicationTab/columnConfig';

interface ISOApplicationTabProps {
  isoId: string;
}

export default function ISOApplicationTab({ isoId }: ISOApplicationTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc');

  const fetchApplications = useCallback(async (page: number = 1, search: string = '', sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' | null = 'desc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApplications({ 
        iso: isoId, 
        page, 
        limit, 
        search, 
        sortBy, 
        sortOrder 
      });
      setApplications(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
      setCurrentPage(response.pagination?.page || 1);
      setLimit(response.pagination?.limit || 10);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
      setApplications([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [isoId, limit]);

  useEffect(() => {
    fetchApplications(currentPage, searchQuery, sortField, sortOrder);
  }, [fetchApplications, currentPage, searchQuery, sortField, sortOrder]);

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
    setSelectedApplication(null);
  };

  const handleCreateApplication = async () => {
    try {
      // The AddApplicationModal will handle the creation
      toast.success('Application created successfully');
      fetchApplications(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create application';
      toast.error(errorMessage);
    }
  };

  const renderActions = (application: Application) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedApplication(application);
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
      {/* Add Application button removed */}
    </div>
  );

  return (
    <div className="w-full">
      <SimpleList
        data={applications}
        columns={columnConfig}
        loading={loading}
        error={error}
        emptyMessage="No applications found for this ISO"
        title="ISO Applications"
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

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={showDetailModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 