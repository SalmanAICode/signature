'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserLenders, removeUserLender, addUserLender } from '@/lib/api/userLenders';
import { SimpleList } from '@/components/SimpleList';
import LenderDetailModal from './UserLenderTab/LenderDetailModal';
import AddLenderModal from './UserLenderTab/AddLenderModal';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'react-hot-toast';
import { columns } from './UserLenderTab/columnConfig';
import { Lender } from '@/types/lender';

interface UserLenderTabProps {
  userId: string;
}

export default function UserLenderTab({ userId }: UserLenderTabProps) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('asc');

  const fetchLenders = useCallback(async (page: number = 1, search: string = '', sortBy: string = 'name', sortOrder: 'asc' | 'desc' | null = 'asc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserLenders(userId, page, limit, search, sortBy, sortOrder);
      setLenders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
      setCurrentPage(response.pagination?.page || 1);
      setLimit(response.pagination?.limit || 10);
    } catch (err) {
      console.error('Error fetching user lenders:', err);
      setError('Failed to load lenders');
      setLenders([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchLenders(currentPage, searchQuery, sortField, sortOrder);
  }, [fetchLenders, currentPage, searchQuery, sortField, sortOrder]);

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
    setSelectedLender(null);
  };

  const handleRemove = async () => {
    if (!selectedLender) return;
    
    setIsRemoving(selectedLender._id);
    try {
      await removeUserLender(userId, selectedLender._id);
      
      // Remove the lender from the local state
      setLenders(prev => prev.filter(lender => lender._id !== selectedLender._id));
      
      // Update pagination
      setTotalResults(prev => prev - 1);
      setTotalPages(Math.ceil((totalResults - 1) / limit));
      
      toast.success('Lender removed successfully');
      setShowDeleteModal(false);
      setSelectedLender(null);
    } catch {
      toast.error('Failed to remove lender');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleCreateLender = async (lenderId: string) => {
    try {
      const returnedLender = await addUserLender(userId, lenderId);
      setLenders(prev => [returnedLender, ...prev]);
      setTotalResults(prev => prev + 1);
      setTotalPages(Math.ceil((totalResults + 1) / limit));
      toast.success('Lender added successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add lender';
      toast.error(errorMessage);
    }
  };

  const renderActions = (lender: Lender) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedLender(lender);
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

      <button
        onClick={() => {
          setSelectedLender(lender);
          setShowDeleteModal(true);
        }}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Remove
      </button>
    </div>
  );

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setShowAddModal(true);
        }}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lender
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <SimpleList
        data={lenders}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No lenders found for this user"
        title="User Lenders"
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={searchQuery}
        initialSortBy="name"
        initialSortOrder="asc"
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

      {/* Lender Detail Modal */}
      {showDetailModal && selectedLender && (
        <LenderDetailModal
          lender={selectedLender}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Remove Lender"
        message={`Are you sure you want to remove "${selectedLender?.name}" from this user? This action cannot be undone.`}
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
        onConfirm={handleRemove}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedLender(null);
        }}
        isLoading={isRemoving === selectedLender?._id}
      />

      {/* Add Lender Modal */}
      <AddLenderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateLender}
        currentLenders={lenders}
      />
    </div>
  );
} 