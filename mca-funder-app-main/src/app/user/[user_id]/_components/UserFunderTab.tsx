'use client';

import { useState, useEffect } from 'react';
import { getUserFunders, removeUserFunder, addUserFunder } from '@/lib/api/userFunders';
import { formatPhone, formatDate } from '@/lib/utils/format';
import { formatCurrency } from '@/components/GenericList/utils';
import { Funder } from '@/types/funder';
import { SimpleList, Column } from '@/components/SimpleList';
import FunderDetailModal from './UserFunderTab/FunderDetailModal';
import AddFunderModal from './UserFunderTab/AddFunderModal';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'react-hot-toast';
import { columns, UserFunderItem } from './UserFunderTab/columnConfig';

interface UserFunderTabProps {
  userId: string;
}

export default function UserFunderTab({ userId }: UserFunderTabProps) {
  const [funders, setFunders] = useState<UserFunderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFunder, setSelectedFunder] = useState<UserFunderItem | null>(null);
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

  const fetchFunders = async (page: number = 1, search: string = '', sortBy: string = 'name', sortOrder: 'asc' | 'desc' | null = 'asc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserFunders(userId, page, limit, search, sortBy, sortOrder);
      setFunders(response.data as UserFunderItem[] || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
      setCurrentPage(response.pagination?.page || 1);
      setLimit(response.pagination?.limit || 10);
    } catch (err) {
      console.error('Error fetching user funders:', err);
      setError('Failed to load funders');
      setFunders([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunders(currentPage, searchQuery, sortField, sortOrder);
  }, [userId, currentPage, searchQuery, sortField, sortOrder, limit]);

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
    setSelectedFunder(null);
  };

  const handleRemove = async () => {
    if (!selectedFunder) return;
    
    setIsRemoving(selectedFunder._id);
    try {
      await removeUserFunder(userId, selectedFunder._id);
      
      // Remove the funder from the local state
      setFunders(prev => prev.filter(funder => funder._id !== selectedFunder._id));
      
      // Update pagination
      setTotalResults(prev => prev - 1);
      setTotalPages(Math.ceil((totalResults - 1) / limit));
      
      toast.success('Funder removed successfully');
      setShowDeleteModal(false);
      setSelectedFunder(null);
    } catch (error) {
      toast.error('Failed to remove funder');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleCreateFunder = async (funderId: string) => {
    try {
      const returnedFunder = await addUserFunder(userId, funderId);
      const userFunderItem: UserFunderItem = {
        ...returnedFunder,
        role_list: [] // Default empty role list for newly added funders
      };
      setFunders(prev => [userFunderItem, ...prev]);
      setTotalResults(prev => prev + 1);
      setTotalPages(Math.ceil((totalResults + 1) / limit));
      toast.success('Funder added successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add funder');
    }
  };

  const renderActions = (funder: UserFunderItem) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedFunder(funder);
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
          setSelectedFunder(funder);
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
          Add Funder
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <SimpleList
        data={funders}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No funders found for this user"
        title="User Funders"
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

      {/* Funder Detail Modal */}
      {showDetailModal && selectedFunder && (
        <FunderDetailModal
          funder={selectedFunder}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Remove Funder"
        message={`Are you sure you want to remove "${selectedFunder?.name}" from this user? This action cannot be undone.`}
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
        onConfirm={handleRemove}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedFunder(null);
        }}
        isLoading={isRemoving === selectedFunder?._id}
      />

      {/* Add Funder Modal */}
      <AddFunderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateFunder}
        currentFunders={funders}
      />
    </div>
  );
}
