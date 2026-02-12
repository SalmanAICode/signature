'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLenderUsers, removeLenderUser, addLenderUser } from '@/lib/api/lenderUsers';
import { SimpleList } from '@/components/SimpleList';
import UserDetailModal from './LenderUserTab/UserDetailModal';
import AddUserModal from './LenderUserTab/AddUserModal';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'react-hot-toast';
import { columns, LenderUserItem } from './LenderUserTab/columnConfig';

interface LenderUserTabProps {
  lenderId: string;
}

export default function LenderUserTab({ lenderId }: LenderUserTabProps) {
  const [users, setUsers] = useState<LenderUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LenderUserItem | null>(null);
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
  const [sortField, setSortField] = useState('first_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('asc');

  const fetchUsers = useCallback(async (page: number = 1, search: string = '', sortBy: string = 'first_name', sortOrder: 'asc' | 'desc' | null = 'asc') => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLenderUsers(lenderId, page, limit, search, sortBy, sortOrder);
      setUsers(response.data as LenderUserItem[] || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
      setCurrentPage(response.pagination?.page || 1);
      setLimit(response.pagination?.limit || 10);
    } catch (err) {
      console.error('Error fetching lender users:', err);
      setError('Failed to load users');
      setUsers([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [lenderId, limit]);

  useEffect(() => {
    fetchUsers(currentPage, searchQuery, sortField, sortOrder);
  }, [fetchUsers, currentPage, searchQuery, sortField, sortOrder]);

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
    setSelectedUser(null);
  };

  const handleRemove = async () => {
    if (!selectedUser) return;
    
    setIsRemoving(selectedUser._id);
    try {
      await removeLenderUser(lenderId, selectedUser._id);
      
      // Remove the user from the local state
      setUsers(prev => prev.filter(user => user._id !== selectedUser._id));
      
      // Update pagination
      setTotalResults(prev => prev - 1);
      setTotalPages(Math.ceil((totalResults - 1) / limit));
      
      toast.success('User removed successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch {
      toast.error('Failed to remove user');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleCreateUser = async (userId: string) => {
    try {
      const returnedUser = await addLenderUser(lenderId, userId);
      const lenderUserItem: LenderUserItem = {
        ...returnedUser,
        role_list: [] // Default empty role list for newly added users
      };
      setUsers(prev => [lenderUserItem, ...prev]);
      setTotalResults(prev => prev + 1);
      setTotalPages(Math.ceil((totalResults + 1) / limit));
      toast.success('User added successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add user';
      toast.error(errorMessage);
    }
  };

  const renderActions = (user: LenderUserItem) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setSelectedUser(user);
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
          setSelectedUser(user);
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
          Add User
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <SimpleList
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No users found for this lender"
        title="Lender Users"
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={searchQuery}
        initialSortBy="first_name"
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

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Remove User"
        message={`Are you sure you want to remove "${selectedUser?.first_name} ${selectedUser?.last_name}" from this lender? This action cannot be undone.`}
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
        onConfirm={handleRemove}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        isLoading={isRemoving === selectedUser?._id}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateUser}
        currentUsers={users}
      />
    </div>
  );
} 